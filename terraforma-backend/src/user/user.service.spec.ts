import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UserService } from './user.service.js';

describe('UserService', () => {
  let service: UserService;
  const tx = {
    chatMembro: { findMany: vi.fn() },
    user: { delete: vi.fn() },
    chat: { deleteMany: vi.fn() },
  };
  const prisma = {
    user: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    tokenRecuperacaoSenha: { deleteMany: vi.fn() },
    $transaction: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    prisma.$transaction.mockImplementation((arg: unknown) =>
      typeof arg === 'function'
        ? arg(tx)
        : Promise.all(arg as Promise<unknown>[]),
    );
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update', () => {
    it('trocar e-mail sem senhaAtual => 400 e nada é gravado', async () => {
      await expect(
        service.update('u1', { email: 'novo@email.com' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('senhaAtual errada => 403 e nada é gravado', async () => {
      prisma.user.findUnique.mockResolvedValue({
        senha: await bcrypt.hash('senha-certa-1', 4),
      });
      await expect(
        service.update('u1', {
          senha: 'nova-senha-1',
          senhaAtual: 'errada-errada',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('senhaAtual certa grava, invalida tokens e não grava a senhaAtual', async () => {
      prisma.user.findUnique.mockResolvedValue({
        senha: await bcrypt.hash('senha-certa-1', 4),
      });
      prisma.user.update.mockResolvedValue({ id: 'u1' });

      await service.update('u1', {
        senha: 'nova-senha-1',
        senhaAtual: 'senha-certa-1',
      });

      const { data } = prisma.user.update.mock.calls[0][0];
      expect(data.senhaVersao).toEqual({ increment: 1 });
      expect(data).not.toHaveProperty('senhaAtual');
      // links de recuperação pedidos antes deixam de valer
      expect(prisma.tokenRecuperacaoSenha.deleteMany).toHaveBeenCalledWith({
        where: { usuarioId: 'u1' },
      });
    });

    it('trocar só o username não pede a senha atual', async () => {
      prisma.user.update.mockResolvedValue({ id: 'u1' });
      await service.update('u1', { username: 'novo.nome' });
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalled();
    });
  });

  describe('concluirBoasVindas', () => {
    it('marca só a primeira vez e devolve o usuário com a data', async () => {
      const em = new Date('2026-10-29T12:00:00Z');
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        username: 'ana',
        boasVindasEm: em,
      });
      await expect(service.concluirBoasVindas('u1')).resolves.toMatchObject({
        boasVindasEm: em,
      });
      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { id: 'u1', boasVindasEm: null },
        data: { boasVindasEm: expect.any(Date) },
      });
    });
  });

  describe('remove', () => {
    it('apaga a conta e os chats em que ela era o último membro', async () => {
      tx.chatMembro.findMany.mockResolvedValue([
        { chatId: 'c1' },
        { chatId: 'c2' },
      ]);
      tx.user.delete.mockResolvedValue({ id: 'u1' });
      await service.remove('u1');
      expect(tx.chat.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['c1', 'c2'] }, membros: { none: {} } },
      });
    });
  });

  describe('username', () => {
    const erros = async (username: string) =>
      validate(
        plainToInstance(CreateUserDto, {
          username,
          email: 'a@b.com',
          senha: '12345678',
        }),
      );

    it.each(['bet365', 'Bet_365', 'blaze', 'estrela-bet', 'meusite.com'])(
      '%s é recusado',
      async (u) => {
        expect((await erros(u)).some((e) => e.property === 'username')).toBe(
          true,
        );
      },
    );

    it.each(['ana', 'joao.silva', 'beterraba', 'alphabet'])(
      '%s é aceito',
      async (u) => {
        expect(await erros(u)).toHaveLength(0);
      },
    );
  });
});
