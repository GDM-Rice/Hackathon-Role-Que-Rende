import { IsEmail, IsNotEmpty } from 'class-validator';
import { NormalizeEmail } from '../../common/normalize-email.js';

export class ForgotPasswordDto {
  @NormalizeEmail()
  @IsNotEmpty({ message: 'O campo email não pode estar vazio' })
  @IsEmail({}, { message: 'Forneça um endereço de email válido' })
  email!: string;
}
