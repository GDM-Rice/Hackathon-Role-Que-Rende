import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AtividadeTrilhaDto } from './dto/sincronizar-trilha.dto.js';

// O que a API devolve de cada atividade (mesmo formato que o front guarda em trilha.feitas).
export type Atividade = {
  capitulo: number;
  indice: number;
  em: string;
  acertos: number | null;
  total: number | null;
  escolha: number | null;
};

type Registro = {
  capitulo: number;
  indice: number;
  concluidaEm: Date;
  acertos: number | null;
  total: number | null;
  escolha: number | null;
};

const chave = (a: { capitulo: number; indice: number }) =>
  `${a.capitulo}-${a.indice}`;
const maior = (a: number | null, b: number | null) =>
  a == null ? b : b == null ? a : Math.max(a, b);

/**
 * Junta o que já estava salvo com o que chegou. Nada regride (regra 1 do produto):
 * - a data de conclusão fica a mais antiga (e nunca no futuro);
 * - os acertos ficam o melhor resultado;
 * - total e escolha ficam o valor mais novo que vier.
 */
export function mesclar(
  antes: Registro | undefined,
  nova: AtividadeTrilhaDto,
  agora = new Date(),
): Registro {
  let em = nova.em ? new Date(nova.em) : agora;
  if (em > agora) em = agora;
  if (antes && antes.concluidaEm < em) em = antes.concluidaEm;
  return {
    capitulo: nova.capitulo,
    indice: nova.indice,
    concluidaEm: em,
    acertos: maior(antes?.acertos ?? null, nova.acertos ?? null),
    total: nova.total ?? antes?.total ?? null,
    escolha: nova.escolha ?? antes?.escolha ?? null,
  };
}

const paraApi = (r: Registro): Atividade => ({
  capitulo: r.capitulo,
  indice: r.indice,
  em: r.concluidaEm.toISOString(),
  acertos: r.acertos,
  total: r.total,
  escolha: r.escolha,
});

const campos = {
  capitulo: true,
  indice: true,
  concluidaEm: true,
  acertos: true,
  total: true,
  escolha: true,
} as const;

@Injectable()
export class TrilhaService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(userId: string) {
    const linhas = await this.prisma.trilhaProgresso.findMany({
      where: { userId },
      select: campos,
      orderBy: [{ capitulo: 'asc' }, { indice: 'asc' }],
    });
    return { atividades: linhas.map(paraApi) };
  }

  /**
   * Grava as atividades concluídas no aparelho e devolve o progresso inteiro da conta.
   * Pode ser chamada quantas vezes quiser com os mesmos dados (o resultado não muda).
   */
  async sincronizar(userId: string, atividades: AtividadeTrilhaDto[]) {
    for (const a of atividades) {
      if (a.acertos != null && a.total != null && a.acertos > a.total) {
        throw new BadRequestException('acertos não pode ser maior que total.');
      }
    }
    if (atividades.length === 0) return this.listar(userId);

    await this.prisma.$transaction(async (tx) => {
      const salvas = await tx.trilhaProgresso.findMany({
        where: { userId },
        select: campos,
      });
      const porChave = new Map<string, Registro>(
        salvas.map((r) => [chave(r), r]),
      );
      const mudou = new Map<string, Registro>();
      const agora = new Date();
      for (const a of atividades) {
        const k = chave(a);
        const r = mesclar(mudou.get(k) ?? porChave.get(k), a, agora);
        mudou.set(k, r);
      }
      for (const r of mudou.values()) {
        const { capitulo, indice, ...dados } = r;
        await tx.trilhaProgresso.upsert({
          where: { userId_capitulo_indice: { userId, capitulo, indice } },
          create: { userId, capitulo, indice, ...dados },
          update: dados,
        });
      }
    });
    return this.listar(userId);
  }
}
