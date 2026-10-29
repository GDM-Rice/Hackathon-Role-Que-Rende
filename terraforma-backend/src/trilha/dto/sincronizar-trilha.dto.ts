import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

// Limites folgados: hoje a trilha tem 5 capítulos de 7 círculos (35 atividades).
export const MAX_CAPITULO = 19;
export const MAX_INDICE = 49;
export const MAX_ATIVIDADES = 500;

export class AtividadeTrilhaDto {
  @IsInt({ message: 'capitulo deve ser um número inteiro.' })
  @Min(0, { message: 'capitulo inválido.' })
  @Max(MAX_CAPITULO, { message: 'capitulo inválido.' })
  capitulo!: number;

  @IsInt({ message: 'indice deve ser um número inteiro.' })
  @Min(0, { message: 'indice inválido.' })
  @Max(MAX_INDICE, { message: 'indice inválido.' })
  indice!: number;

  // Quando foi concluída no aparelho (ISO 8601). Sem ela, vale o horário do servidor.
  @IsOptional()
  @IsDateString({}, { message: 'em deve ser uma data ISO 8601.' })
  em?: string;

  @IsOptional()
  @IsInt({ message: 'acertos deve ser um número inteiro.' })
  @Min(0, { message: 'acertos inválido.' })
  @Max(100, { message: 'acertos inválido.' })
  acertos?: number;

  @IsOptional()
  @IsInt({ message: 'total deve ser um número inteiro.' })
  @Min(1, { message: 'total inválido.' })
  @Max(100, { message: 'total inválido.' })
  total?: number;

  @IsOptional()
  @IsInt({ message: 'escolha deve ser um número inteiro.' })
  @Min(0, { message: 'escolha inválida.' })
  @Max(19, { message: 'escolha inválida.' })
  escolha?: number;
}

export class SincronizarTrilhaDto {
  @IsArray({ message: 'atividades deve ser uma lista.' })
  @ArrayMaxSize(MAX_ATIVIDADES, {
    message: `Envie no máximo ${MAX_ATIVIDADES} atividades.`,
  })
  @ValidateNested({ each: true })
  @Type(() => AtividadeTrilhaDto)
  atividades!: AtividadeTrilhaDto[];
}
