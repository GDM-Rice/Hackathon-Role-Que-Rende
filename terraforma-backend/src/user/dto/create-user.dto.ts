import { IsEmail, IsOptional, IsString, MinLength, IsNotEmpty, isEmail } from 'class-validator';
import { PartialType } from "@nestjs/mapped-types";
import { UserEntity } from '../entities/user.entity.js';

export class CreateUserDto extends PartialType(UserEntity) {
    @IsString({ message: 'O username deve ser uma string.' })
    @IsNotEmpty({ message: 'O campo username não pode estar vazio. ' })
    username!: string;

    @IsEmail({}, { message: 'O email fornecido é inválido.' })
    @IsNotEmpty({ message: 'O campo email não pode estar vazio. ' })
    email!: string;

     @IsString({ message: 'A senha deve ser uma string.' })
    @IsNotEmpty({ message: 'O campo senha não pode estar vazio.' })
    @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
    senha!: string;
}
