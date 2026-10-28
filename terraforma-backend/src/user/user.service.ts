import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {

  constructor(private readonly prisma: PrismaService) {

  }

  // Create

  async create(createUserDto: CreateUserDto) {
    const existingUserUsername = await this.prisma.User.findUnique({
      where: { username: createUserDto.username }
    })

    if (existingUserUsername) {
      throw new ConflictException('User com esse username já existe');
    }


    const existingUserEmail = await this.prisma.User.findUnique({
      where: { email: createUserDto.email }
    });

    if (existingUserEmail) {
      throw new ConflictException('User com esse email já existe');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.senha, 10);

    return this.prisma.User.create({
      data: {
        username: createUserDto.username,
        nome: createUserDto.username,
        email: createUserDto.email,
        senha: hashedPassword
      },
    });
  }

  //Finds

  async findAll() {
    return await this.prisma.usuario.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        senha: false,
        createdAt: true,
        updatedAt: true,

      }
    });
  }

  async findOne(id: number) {
    const isValidId = await this.prisma.User.findUnique({ where: { id } })

    if (!isValidId) {
      throw new NotFoundException('User com Id não encontrado');
    }
    return await this.prisma.User.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        senha: false,
        createdAt: true,
        updatedAt: true,

      }
    });
  }

  async findByEmail(email: string) {

    const user = await this.prisma.User.findUnique({ where: { email } });
    if (!user) {
      return null;
    }
    return user;
  }

  //Update

  async update(id: number, updateUserDto: UpdateUserDto) {
    const isValidId = await this.prisma.User.findUnique({ where: { id } })

    if (!isValidId) {
      throw new NotFoundException('User com Id não encontrado');
    }

    return await this.prisma.User.update({
      where: { id },
      data: {
        username: updateUserDto.username,
        email: updateUserDto.email,
        ...(updateUserDto.senha !== undefined && {
          senhaHash: await bcrypt.hash(updateUserDto.senha, 10),
          senhaVersao: { increment: 1 },
        }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        senha: false,
        createdAt: true,
        updatedAt: true,
      }
    });
  }

  //Remove

  async remove(id: number) {

    const isValidId = await this.prisma.User.findUnique({ where: { id } })

    if (!isValidId) {
      throw new NotFoundException('User com Id não encontrado');
    }

    return await this.prisma.User.delete({
      where: { id }, select: {
        id: true,
        username: true,
        email: true,
        senha: false,
        createdAt: true,
        updatedAt: true,

      }
    });
  }
}