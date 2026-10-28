import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { NormalizeEmail } from '../../common/normalize-email.js';

export class LoginRequestBody {
  @NormalizeEmail()
  @IsNotEmpty({ message: 'O campo email não pode estar vazio' })
  @IsEmail({}, { message: 'Forneça um endereço de email válido' })
  email!: string;

  @IsNotEmpty({ message: 'O campo senha não pode estar vazio' })
  @IsString({ message: 'O campo senha tem de ser uma string' })
  senha!: string;
}
