import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AddMembroDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsString({ message: 'O username deve ser uma string.' })
  @IsNotEmpty({ message: 'Informe o username.' })
  @MaxLength(30, { message: 'Username inválido.' })
  username!: string;
}
