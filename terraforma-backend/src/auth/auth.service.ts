import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { MailService } from '../mail/mail.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UserService } from '../user/user.service.js';
import { LoginRequestBody } from './dto/loginRequestBody.dto.js';
import type { UserPayload } from './types/UserPayload.js';
import type { UserToken } from './types/UserToken.js';

// Hash "de mentira" usado quando o e-mail não existe, para o tempo de resposta
// ser parecido com o de um e-mail existente (evita descobrir quem tem conta).
const DUMMY_HASH = bcrypt.hashSync('senha-invalida-para-igualar-o-tempo', 10);

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly TOKEN_TTL_MINUTOS = 30;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async login(body: LoginRequestBody): Promise<UserToken> {
    const user = await this.validateUser(body.email, body.senha);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload: UserPayload = {
      email: user.email,
      sub: user.id,
      v: user.senhaVersao,
    };

    // secret e expiração já vêm do JwtModule.registerAsync
    return { access_token: this.jwtService.sign(payload) };
  }

  async validateUser(email: string, senha: string) {
    const user = await this.userService.findByEmail(email);
    const ok = await bcrypt.compare(senha, user?.senha ?? DUMMY_HASH);
    if (!user || !ok) return null;

    const { senha: _senha, ...semSenha } = user;
    return semSenha;
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userService.findByEmail(email);
    if (!user) return; // não revela se o e-mail existe

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + this.TOKEN_TTL_MINUTOS * 60_000);

    // Só um token ativo por usuário: apaga os anteriores e cria o novo
    await this.prisma.$transaction([
      this.prisma.tokenRecuperacaoSenha.deleteMany({
        where: { usuarioId: user.id },
      }),
      this.prisma.tokenRecuperacaoSenha.create({
        data: {
          usuarioId: user.id,
          tokenHash: this.hashToken(token),
          expiresAt,
        },
      }),
    ]);

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const link = `${frontendUrl}/redefinir-senha?token=${token}`;

    try {
      await this.mailService.enviarRecuperacaoSenha(user.email, link);
    } catch (error) {
      // Não propaga: um erro 500 só para e-mails existentes revelaria quem está cadastrado
      this.logger.error(
        `Falha ao enviar e-mail de recuperação para ${user.email}`,
        error,
      );
    }
  }

  async resetPassword(token: string, novaSenha: string): Promise<void> {
    const tokenHash = this.hashToken(token);

    const registro = await this.prisma.tokenRecuperacaoSenha.findUnique({
      where: { tokenHash },
    });
    if (!registro || registro.expiresAt < new Date()) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    const senha = await bcrypt.hash(novaSenha, 10);

    await this.prisma.$transaction(async (tx) => {
      // Consome o token de forma atômica: se duas requisições tentarem usar
      // o mesmo token ao mesmo tempo, só uma terá count === 1
      const consumido = await tx.tokenRecuperacaoSenha.deleteMany({
        where: { tokenHash, expiresAt: { gt: new Date() } },
      });
      if (consumido.count === 0) {
        throw new BadRequestException('Token inválido ou expirado');
      }

      await tx.user.update({
        where: { id: registro.usuarioId },
        data: { senha, senhaVersao: { increment: 1 } },
      });
      await tx.tokenRecuperacaoSenha.deleteMany({
        where: { usuarioId: registro.usuarioId },
      });
    });
  }
}
