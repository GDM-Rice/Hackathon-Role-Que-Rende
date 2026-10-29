import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { ChatService } from './chat.service.js';
import { REMOVIDO } from './moderacao.js';

describe('ChatService', () => {
  let service: ChatService;
  const tx = {
    $queryRaw: vi.fn(),
    chatMembro: { deleteMany: vi.fn(), count: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    chat: { deleteMany: vi.fn() },
  };
  const prisma = {
    user: { findMany: vi.fn(), findUnique: vi.fn() },
    chat: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), findUniqueOrThrow: vi.fn() },
    chatMembro: { findUnique: vi.fn(), count: vi.fn(), create: vi.fn() },
    message: { create: vi.fn() },
    $transaction: vi.fn(),
  };
  const membro = (id: string, username: string) => ({ user: { id, username } });

  beforeEach(async () => {
    vi.clearAllMocks();
    prisma.$transaction.mockImplementation((arg: unknown) =>
      typeof arg === 'function' ? arg(tx) : Promise.all(arg as Promise<unknown>[]),
    );
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<ChatService>(ChatService);
  });

  describe('paginação', () => {
    it('findAll: devolve proximoCursor quando há mais que o limite', async () => {
      prisma.chat.findMany.mockResolvedValue([
        { id: 'c3', membros: [] },
        { id: 'c2', membros: [] },
        { id: 'c1', membros: [] },
      ]);
      const res = await service.findAll('u1', { limit: 2 });
      expect(res.itens.map((c) => c.id)).toEqual(['c3', 'c2']);
      expect(res.proximoCursor).toBe('c2');
      const args = prisma.chat.findMany.mock.calls[0][0];
      expect(args.take).toBe(3); // limite + 1
      expect(args.where).toEqual({ membros: { some: { userId: 'u1' } } });
    });

    it('findAll: proximoCursor nulo na última página', async () => {
      prisma.chat.findMany.mockResolvedValue([{ id: 'c1', membros: [] }]);
      const res = await service.findAll('u1', { limit: 2 });
      expect(res.proximoCursor).toBeNull();
    });

    it('findOne: mensagens em ordem cronológica, cursor para as antigas e membros achatados', async () => {
      prisma.chat.findFirst.mockResolvedValue({
        id: 'c1',
        membros: [membro('u1', 'ana'), membro('u2', 'bia')],
        mensagens: [{ id: 'm3' }, { id: 'm2' }, { id: 'm1' }],
      });
      const res = await service.findOne('u1', 'c1', { limit: 2 });
      expect(res.mensagens.map((m) => m.id)).toEqual(['m2', 'm3']);
      expect(res.proximoCursor).toBe('m2');
      expect(res.membros).toEqual([
        { id: 'u1', username: 'ana' },
        { id: 'u2', username: 'bia' },
      ]);
    });

    it('findOne: quem não é membro recebe 404', async () => {
      prisma.chat.findFirst.mockResolvedValue(null);
      await expect(service.findOne('u9', 'c1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('create', () => {
    it('cria com quem chamou + os membros informados', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 'u2', username: 'bia' }]);
      prisma.chat.create.mockResolvedValue({ id: 'c1', titulo: 'bia', membros: [] });
      await service.create('u1', { membros: ['bia'] });
      const data = prisma.chat.create.mock.calls[0][0].data;
      expect(data.titulo).toBe('bia');
      expect(data.membros.create).toEqual([{ userId: 'u1' }, { userId: 'u2' }]);
    });

    it('username inexistente => 404', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      await expect(service.create('u1', { membros: ['ninguem'] })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('só a própria pessoa => 400', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 'u1', username: 'ana' }]);
      await expect(service.create('u1', { membros: ['ana'] })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('título automático (usernames) também passa pela moderação', async () => {
      // conta antiga, criada antes da regra de username
      prisma.user.findMany.mockResolvedValue([{ id: 'u2', username: 'bet365' }]);
      prisma.chat.create.mockResolvedValue({ id: 'c1', membros: [] });
      await service.create('u1', { membros: ['bet365'] });
      expect(prisma.chat.create.mock.calls[0][0].data.titulo).toBe('Conversa');
    });

    it('título passa pela moderação', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 'u2', username: 'bia' }]);
      prisma.chat.create.mockResolvedValue({ id: 'c1', membros: [] });
      await service.create('u1', { membros: ['bia'], titulo: 'grupo da bet365' });
      expect(prisma.chat.create.mock.calls[0][0].data.titulo).toBe(`grupo da ${REMOVIDO}`);
    });
  });

  describe('addMessage', () => {
    it('grava autor e texto moderado', async () => {
      prisma.chatMembro.findUnique.mockResolvedValue({ chatId: 'c1' });
      prisma.message.create.mockResolvedValue({ id: 'm1' });
      await service.addMessage('u1', 'c1', 'perdi R$ 200 na blaze');
      const data = prisma.message.create.mock.calls[0][0].data;
      expect(data).toMatchObject({ chatId: 'c1', autorId: 'u1', moderada: true });
      expect(data.conteudo).toBe(`perdi ${REMOVIDO} na ${REMOVIDO}`);
    });

    it('mensagem só com conteúdo proibido => 400 e nada é gravado', async () => {
      prisma.chatMembro.findUnique.mockResolvedValue({ chatId: 'c1' });
      await expect(service.addMessage('u1', 'c1', 'www.exemplo.com')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.message.create).not.toHaveBeenCalled();
    });

    it('quem não é membro => 404', async () => {
      prisma.chatMembro.findUnique.mockResolvedValue(null);
      await expect(service.addMessage('u9', 'c1', 'oi')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('mensagem só com espaços e quebras de linha => 400 e nada é gravado', async () => {
      prisma.chatMembro.findUnique.mockResolvedValue({ chatId: 'c1' });
      await expect(service.addMessage('u1', 'c1', ' \n\t ')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.message.create).not.toHaveBeenCalled();
    });
  });

  describe('sair', () => {
    it('trava o chat, remove a participação e apaga o chat só se ficou sem membros', async () => {
      prisma.chatMembro.findUnique.mockResolvedValue({ chatId: 'c1' });
      await service.sair('u1', 'c1');
      expect(tx.$queryRaw).toHaveBeenCalledTimes(1); // SELECT ... FOR UPDATE
      expect(tx.chatMembro.deleteMany).toHaveBeenCalledWith({ where: { chatId: 'c1', userId: 'u1' } });
      // a condição "sem membros" fica no próprio DELETE: nada de contar e decidir fora do banco
      expect(tx.chat.deleteMany).toHaveBeenCalledWith({
        where: { id: 'c1', membros: { none: {} } },
      });
      expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
        tx.chatMembro.deleteMany.mock.invocationCallOrder[0],
      );
    });

    it('quem não é membro => 404 e nada é apagado', async () => {
      prisma.chatMembro.findUnique.mockResolvedValue(null);
      await expect(service.sair('u9', 'c1')).rejects.toBeInstanceOf(NotFoundException);
      expect(tx.chat.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('addMembro', () => {
    const chatPronto = { id: 'c1', titulo: 't', membros: [] };
    beforeEach(() => {
      prisma.chatMembro.findUnique.mockResolvedValue({ chatId: 'c1' }); // quem convida é membro
      prisma.user.findUnique.mockResolvedValue({ id: 'u3', username: 'caio' });
      prisma.chat.findUniqueOrThrow.mockResolvedValue(chatPronto);
    });

    it('conta e insere dentro da transação, com o chat travado', async () => {
      tx.chatMembro.findUnique.mockResolvedValue(null);
      tx.chatMembro.count.mockResolvedValue(2);
      await service.addMembro('u1', 'c1', 'caio');
      expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
      expect(tx.chatMembro.create).toHaveBeenCalledWith({ data: { chatId: 'c1', userId: 'u3' } });
    });

    it('no limite de membros => 400 e ninguém entra', async () => {
      tx.chatMembro.findUnique.mockResolvedValue(null);
      tx.chatMembro.count.mockResolvedValue(20);
      await expect(service.addMembro('u1', 'c1', 'caio')).rejects.toBeInstanceOf(BadRequestException);
      expect(tx.chatMembro.create).not.toHaveBeenCalled();
    });

    it('quem já está no chat não é inserido de novo', async () => {
      tx.chatMembro.findUnique.mockResolvedValue({ chatId: 'c1' });
      await service.addMembro('u1', 'c1', 'caio');
      expect(tx.chatMembro.create).not.toHaveBeenCalled();
    });
  });
});
