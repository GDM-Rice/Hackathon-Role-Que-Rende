import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { NormalizeEmail } from '../../common/normalize-email.js';
import { UsernamePermitido } from '../../common/username-permitido.js';

export class CreateUserDto {
  // Minúsculas e sem espaços nas pontas: "Ana" e "ana" não podem ser duas contas
  // diferentes (evita alguém se passar por outra pessoa).
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString({ message: 'O username deve ser uma string.' })
  @IsNotEmpty({ message: 'O campo username não pode estar vazio.' })
  @MinLength(3, { message: 'O username deve ter no mínimo 3 caracteres.' })
  @MaxLength(30, { message: 'O username deve ter no máximo 30 caracteres.' })
  @Matches(/^[a-z0-9._-]+$/, {
    message:
      'O username só pode ter letras minúsculas, números, ponto, hífen e sublinhado.',
  })
  @UsernamePermitido()
  username!: string;

  @NormalizeEmail()
  @IsEmail({}, { message: 'O email fornecido é inválido.' })
  @IsNotEmpty({ message: 'O campo email não pode estar vazio.' })
  email!: string;

  @IsString({ message: 'A senha deve ser uma string.' })
  @IsNotEmpty({ message: 'O campo senha não pode estar vazio.' })
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
  @MaxLength(72, { message: 'A senha deve ter no máximo 72 caracteres.' }) // bcrypt ignora o que passa de 72 bytes
  senha!: string;
}
