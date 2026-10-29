import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateMessageDto {
  // Tira espaços e quebras de linha das pontas ANTES de validar: "   " vira "" e cai no
  // @IsNotEmpty (antes passava e gravava uma mensagem vazia no chat).
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'A mensagem deve ser uma string.' })
  @IsNotEmpty({ message: 'A mensagem não pode estar vazia.' })
  @MaxLength(4000, { message: 'A mensagem deve ter no máximo 4000 caracteres.' })
  conteudo!: string;
}
