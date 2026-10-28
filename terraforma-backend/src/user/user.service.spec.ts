import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { UserService } from './user.service.js';

describe('UserService', () => {
  let service: UserService;
  const prisma = { user: { findUnique: vi.fn(), update: vi.fn() } };

  beforeEach(async () => {
    vi.clearAllMocks();
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
        service.update('u1', { senha: 'nova-senha-1', senhaAtual: 'errada-errada' }),
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
    });

    it('trocar só o username não pede a senha atual', async () => {
      prisma.user.update.mockResolvedValue({ id: 'u1' });
      await service.update('u1', { username: 'novo.nome' });
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalled();
    });
  });
});
