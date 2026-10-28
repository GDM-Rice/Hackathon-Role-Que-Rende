import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UserService } from '../user/user.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;
  const userService = { findByEmail: vi.fn() };
  const jwtService = { sign: vi.fn().mockReturnValue('token-falso') };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: { get: vi.fn() } },
        { provide: PrismaService, useValue: {} },
        { provide: MailService, useValue: {} },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('faz login com credenciais corretas', async () => {
    const senha = await bcrypt.hash('12345678', 4);
    userService.findByEmail.mockResolvedValue({
      id: 'u1',
      email: 'a@a.com',
      senha,
      senhaVersao: 0,
    });

    await expect(
      service.login({ email: 'a@a.com', senha: '12345678' }),
    ).resolves.toEqual({ access_token: 'token-falso' });
  });

  it('rejeita senha errada e e-mail inexistente com a mesma mensagem', async () => {
    userService.findByEmail.mockResolvedValue(null);
    await expect(
      service.login({ email: 'x@x.com', senha: '12345678' }),
    ).rejects.toThrow('Credenciais inválidas');
  });
});
