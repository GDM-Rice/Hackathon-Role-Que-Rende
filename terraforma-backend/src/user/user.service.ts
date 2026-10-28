import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

  // Uso interno do login: precisa devolver o hash da senha, por isso NÃO é exposto em controller.
  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: string, dto: UpdateUserDto) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          username: dto.username,
          email: dto.email,
          ...(dto.senha !== undefined && {
            senha: await bcrypt.hash(dto.senha, 10),
            senhaVersao: { increment: 1 }, // invalida os tokens antigos
          }),
        },
        select: publicSelect,
      });
    } catch (error) {
      throw this.traduzirErro(error);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.user.delete({
        where: { id },
        select: publicSelect,
      });
    } catch (error) {
      throw this.traduzirErro(error);
    }
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
