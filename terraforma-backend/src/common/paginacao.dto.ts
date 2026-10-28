import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

// Paginação por cursor: ?limit=20&cursor=<id devolvido em proximoCursor>
export class PaginacaoDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit deve ser um número inteiro.' })
  @Min(1, { message: 'limit deve ser no mínimo 1.' })
  @Max(100, { message: 'limit deve ser no máximo 100.' })
  limit?: number;

  @IsOptional()
  @IsString({ message: 'cursor deve ser uma string.' })
  @MaxLength(64, { message: 'cursor inválido.' })
  cursor?: string;
}
