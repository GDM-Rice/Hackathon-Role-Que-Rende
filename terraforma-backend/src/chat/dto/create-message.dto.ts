import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @IsString({ message: 'A mensagem deve ser uma string.' })
  @IsNotEmpty({ message: 'A mensagem não pode estar vazia.' })
  @MaxLength(4000, { message: 'A mensagem deve ter no máximo 4000 caracteres.' })
  conteudo!: string;
}
