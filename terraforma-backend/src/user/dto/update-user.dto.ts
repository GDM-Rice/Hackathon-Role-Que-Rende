import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { CreateUserDto } from './create-user.dto.js';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  // Obrigatória só quando o corpo troca e-mail ou senha (a regra fica no UserService).
  @IsOptional()
  @IsString({ message: 'A senha atual deve ser uma string.' })
  @MaxLength(72, { message: 'A senha atual deve ter no máximo 72 caracteres.' })
  senhaAtual?: string;
}
