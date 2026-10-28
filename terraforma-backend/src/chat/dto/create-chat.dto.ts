import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateChatDto {
  @IsOptional()
  @IsString({ message: 'O título deve ser uma string.' })
  @MaxLength(100, { message: 'O título deve ter no máximo 100 caracteres.' })
  titulo?: string;
}
