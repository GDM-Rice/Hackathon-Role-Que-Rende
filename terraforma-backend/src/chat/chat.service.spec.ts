import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { ChatService } from './chat.service.js';

describe('ChatService (paginação)', () => {
  let service: ChatService;
  const prisma = { chat: { findMany: vi.fn(), findFirst: vi.fn() } };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<ChatService>(ChatService);
  });

  it('findAll: devolve proximoCursor quando há mais que o limite', async () => {
    prisma.chat.findMany.mockResolvedValue([{ id: 'c3' }, { id: 'c2' }, { id: 'c1' }]);
    const res = await service.findAll('u1', { limit: 2 });
    expect(res.itens.map((c) => c.id)).toEqual(['c3', 'c2']);
    expect(res.proximoCursor).toBe('c2');
    expect(prisma.chat.findMany.mock.calls[0][0].take).toBe(3); // limite + 1
  });

  it('findAll: proximoCursor nulo na última página', async () => {
    prisma.chat.findMany.mockResolvedValue([{ id: 'c1' }]);
    const res = await service.findAll('u1', { limit: 2 });
    expect(res.proximoCursor).toBeNull();
  });

  it('findOne: mensagens voltam em ordem cronológica e com cursor para as antigas', async () => {
    // a consulta traz da mais nova para a mais antiga
    prisma.chat.findFirst.mockResolvedValue({
      id: 'c1',
      mensagens: [{ id: 'm3' }, { id: 'm2' }, { id: 'm1' }],
    });
    const res = await service.findOne('u1', 'c1', { limit: 2 });
    expect(res.mensagens.map((m) => m.id)).toEqual(['m2', 'm3']);
    expect(res.proximoCursor).toBe('m2');
  });
});
