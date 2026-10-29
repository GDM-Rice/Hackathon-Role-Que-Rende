import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/index.js';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

// Campos que podem sair da API. A senha (hash) nunca está aqui.
const publicSelect = {
  id: true,
  username: true,
  email: true,
  createdAt: true,
  updatedAt: true,
  boasVindasEm: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const senha = await bcrypt.hash(dto.senha, 10);

    try {
      return await this.prisma.user.create({
        data: { username: dto.username, email: dto.email, senha },
        select: publicSelect,
      });
    } catch (error) {
      throw this.traduzirErro(error);
    }
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: publicSelect,
    });
    if (!user) throw new NotFoundException('User com Id não encontrado');
    return user;
  }

  // Marca que a pessoa concluiu as boas-vindas. Guarda só a primeira vez (repetir não muda nada).
  async concluirBoasVindas(id: string) {
    await this.prisma.user.updateMany({
      where: { id, boasVindasEm: null },
      data: { boasVindasEm: new Date() },
    });
    return this.findOne(id);
  }

  // Uso interno do login: precisa devolver o hash da senha, por isso NÃO é exposto em controller.
  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: string, dto: UpdateUserDto) {
    // Trocar e-mail ou senha com um token roubado dá a conta inteira ao invasor
    // (o e-mail é o caminho da recuperação de senha). Por isso pede a senha atual.
    if (dto.email !== undefined || dto.senha !== undefined) {
      await this.exigirSenhaAtual(id, dto.senhaAtual);
    }

    const trocaCredencial = dto.email !== undefined || dto.senha !== undefined;
    const data: Prisma.UserUpdateInput = {
      username: dto.username,
      email: dto.email,
      ...(dto.senha !== undefined && {
        senha: await bcrypt.hash(dto.senha, 10),
        senhaVersao: { increment: 1 }, // invalida os tokens antigos
      }),
    };

    try {
      if (!trocaCredencial) {
        return await this.prisma.user.update({
          where: { id },
          data,
          select: publicSelect,
        });
      }
      // Trocou e-mail ou senha: links de "esqueci minha senha" pedidos antes deixam de valer.
      // Sem isso, um link enviado ao e-mail antigo (talvez comprometido) ainda redefinia a senha nova.
      const [atualizado] = await this.prisma.$transaction([
        this.prisma.user.update({ where: { id }, data, select: publicSelect }),
        this.prisma.tokenRecuperacaoSenha.deleteMany({
          where: { usuarioId: id },
        }),
      ]);
      return atualizado;
    } catch (error) {
      throw this.traduzirErro(error);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Guarda os chats antes: o cascade remove a participação, mas o chat em que a pessoa
        // era o último membro ficaria órfão (0 membros) para sempre.
        const participacoes = await tx.chatMembro.findMany({
          where: { userId: id },
          select: { chatId: true },
        });
        const removido = await tx.user.delete({
          where: { id },
          select: publicSelect,
        });
        if (participacoes.length) {
          await tx.chat.deleteMany({
            where: {
              id: { in: participacoes.map((p) => p.chatId) },
              membros: { none: {} },
            },
          });
        }
        return removido;
      });
    } catch (error) {
      throw this.traduzirErro(error);
    }
  }

  private async exigirSenhaAtual(id: string, senhaAtual?: string) {
    if (!senhaAtual) {
      throw new BadRequestException(
        'Informe a senha atual para alterar o e-mail ou a senha.',
      );
    }
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { senha: true },
    });
    if (!user) throw new NotFoundException('User com Id não encontrado');

    const ok = await bcrypt.compare(senhaAtual, user.senha);
    if (!ok) throw new ForbiddenException('Senha atual incorreta.');
  }

  // Converte erros do Prisma em respostas HTTP corretas (em vez de 500).
  private traduzirErro(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const campo = String((error.meta?.target as string[] | string) ?? '');
        return new ConflictException(
          campo.includes('username')
            ? 'User com esse username já existe'
            : 'User com esse email já existe',
        );
      }
      if (error.code === 'P2025') {
        return new NotFoundException('User com Id não encontrado');
      }
    }
    return error;
  }
}
