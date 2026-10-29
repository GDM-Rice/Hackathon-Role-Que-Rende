import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { mesclar, TrilhaService } from './trilha.service.js';

describe('mesclar (nada regride)', () => {
  const agora = new Date('2026-10-29T12:00:00Z');
  const antes = {
    capitulo: 0,
    indice: 1,
    concluidaEm: new Date('2026-10-20T10:00:00Z'),
    acertos: 5,
    total: 6,
    escolha: null,
  };

  it('mantém a data mais antiga e o melhor resultado', () => {
    const r = mesclar(
      antes,
      {
        capitulo: 0,
        indice: 1,
        em: '2026-10-28T10:00:00Z',
        acertos: 3,
        total: 6,
      },
      agora,
    );
    expect(r.concluidaEm.toISOString()).toBe('2026-10-20T10:00:00.000Z');
    expect(r.acertos).toBe(5);
  });

  it('sobe os acertos quando o resultado novo é melhor', () => {
    expect(
      mesclar(antes, { capitulo: 0, indice: 1, acertos: 6, total: 6 }, agora)
        .acertos,
    ).toBe(6);
  });

  it('não aceita data no futuro', () => {
    const r = mesclar(
      undefined,
      { capitulo: 0, indice: 0, em: '2030-01-01T00:00:00Z' },
      agora,
    );
    expect(r.concluidaEm).toEqual(agora);
  });

  it('guarda a escolha mais nova do "Na prática"', () => {
    const pratica = {
      ...antes,
      indice: 6,
      acertos: null,
      total: null,
      escolha: 1,
    };
    expect(
      mesclar(pratica, { capitulo: 0, indice: 6, escolha: 2 }, agora).escolha,
    ).toBe(2);
    expect(mesclar(pratica, { capitulo: 0, indice: 6 }, agora).escolha).toBe(1);
  });
});

describe('TrilhaService', () => {
  let service: TrilhaService;
  const tx = { trilhaProgresso: { findMany: vi.fn(), upsert: vi.fn() } };
  const prisma = {
    trilhaProgresso: { findMany: vi.fn() },
    $transaction: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    prisma.$transaction.mockImplementation((fn: (t: typeof tx) => unknown) =>
      fn(tx),
    );
    tx.trilhaProgresso.findMany.mockResolvedValue([]);
    prisma.trilhaProgresso.findMany.mockResolvedValue([]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrilhaService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(TrilhaService);
  });

  it('listar: devolve as atividades no formato da API', async () => {
    prisma.trilhaProgresso.findMany.mockResolvedValue([
      {
        capitulo: 0,
        indice: 0,
        concluidaEm: new Date('2026-10-20T10:00:00Z'),
        acertos: null,
        total: null,
        escolha: null,
      },
    ]);
    await expect(service.listar('u1')).resolves.toEqual({
      atividades: [
        {
          capitulo: 0,
          indice: 0,
          em: '2026-10-20T10:00:00.000Z',
          acertos: null,
          total: null,
          escolha: null,
        },
      ],
    });
    expect(prisma.trilhaProgresso.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' } }),
    );
  });

  it('sincronizar: grava só no usuário logado e junta repetidas', async () => {
    await service.sincronizar('u1', [
      { capitulo: 0, indice: 1, acertos: 2, total: 6 },
      { capitulo: 0, indice: 1, acertos: 4, total: 6 },
      { capitulo: 0, indice: 0 },
    ]);
    expect(tx.trilhaProgresso.upsert).toHaveBeenCalledTimes(2);
    const quiz = tx.trilhaProgresso.upsert.mock.calls.find(
      (c) => c[0].where.userId_capitulo_indice.indice === 1,
    )![0];
    expect(quiz.where.userId_capitulo_indice).toEqual({
      userId: 'u1',
      capitulo: 0,
      indice: 1,
    });
    expect(quiz.update.acertos).toBe(4);
  });

  it('sincronizar: recusa acertos maior que total', async () => {
    await expect(
      service.sincronizar('u1', [
        { capitulo: 0, indice: 1, acertos: 7, total: 6 },
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('sincronizar: lista vazia só devolve o que já existe', async () => {
    await service.sincronizar('u1', []);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.trilhaProgresso.findMany).toHaveBeenCalled();
  });
});
