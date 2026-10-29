import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export const MAX_MEMBROS = 20;

const normalizarUsernames = ({ value }: { value: unknown }) =>
  Array.isArray(value)
    ? value.map((v) => (typeof v === 'string' ? v.trim().toLowerCase() : v))
    : value;

export class CreateChatDto {
  @IsOptional()
  @IsString({ message: 'O título deve ser uma string.' })
  @MaxLength(100, { message: 'O título deve ter no máximo 100 caracteres.' })
  titulo?: string;

  // Usernames das outras pessoas da conversa (quem cria entra automaticamente).
  @Transform(normalizarUsernames)
  @IsArray({ message: 'membros deve ser uma lista de usernames.' })
  @ArrayMinSize(1, { message: 'Adicione pelo menos um membro à conversa.' })
  @ArrayMaxSize(MAX_MEMBROS - 1, {
    message: `Uma conversa pode ter no máximo ${MAX_MEMBROS} membros.`,
  })
  @IsString({ each: true, message: 'Cada membro deve ser um username.' })
  @MaxLength(30, { each: true, message: 'Username inválido.' })
  membros!: string[];
}
