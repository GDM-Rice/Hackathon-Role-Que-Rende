import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';


// Banco falso em memória: só o que o fluxo de teste usa.
function fakePrisma() {
  const users: any[] = [];
  const chats: any[] = [];
  const msgs: any[] = [];
  let n = 0;
  const id = () => `id${++n}`;
  const dup = (field: string) => {
    const e: any = new Error('dup');
    Object.setPrototypeOf(e, (globalThis as any).__PrismaKnown.prototype);
    e.code = 'P2002';
    e.meta = { target: [field] };
    return e;
  };
  return {
    onModuleInit: async () => {},
    onModuleDestroy: async () => {},
    user: {
      create: async ({ data, select }: any) => {
        if (users.some((u) => u.email === data.email)) throw dup('email');
        if (users.some((u) => u.username === data.username)) throw dup('username');
        const u = { id: id(), senhaVersao: 0, createdAt: new Date(), updatedAt: new Date(), ...data };
        users.push(u);
        return pick(u, select);
      },
      findUnique: async ({ where, select }: any) => {
        const u = users.find((x) => (where.id ? x.id === where.id : x.email === where.email));
        return u ? pick(u, select) : null;
      },
    },
    chat: {
      create: async ({ data }: any) => {
        const c = { id: id(), createdAt: new Date(), updatedAt: new Date(), ...data };
        chats.push(c);
        return c;
      },
      findMany: async ({ where }: any) => chats.filter((c) => c.userId === where.userId),
      findFirst: async ({ where, include }: any) => {
        const c = chats.find((x) => x.id === where.id && x.userId === where.userId);
        if (!c) return null;
        return include ? { ...c, mensagens: msgs.filter((m) => m.chatId === c.id) } : c;
      },
      update: async ({ where }: any) => chats.find((c) => c.id === where.id),
      delete: async ({ where }: any) => {
        chats.splice(chats.findIndex((c) => c.id === where.id), 1);
      },
    },
    message: {
      create: async ({ data }: any) => {
        const m = { id: id(), createdAt: new Date(), ...data };
        msgs.push(m);
        return m;
      },
    },
    $transaction: async (ops: Promise<unknown>[]) => Promise.all(ops),
  };
}
const pick = (o: any, s?: any) =>
  s ? Object.fromEntries(Object.keys(s).filter((k) => s[k]).map((k) => [k, o[k]])) : o;

describe('Fluxo de login e chats (e2e, sem banco real)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;

  beforeAll(async () => {
    const { Prisma } = await import('@prisma/client');
    (globalThis as any).__PrismaKnown = Prisma.PrismaClientKnownRequestError;

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(fakePrisma())
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    http = request(app.getHttpServer()) as any;
  });
  afterAll(async () => app.close());

  const novo = { username: 'ana', email: 'Ana@Email.com', senha: 'senha-forte-1' };
  let token = '';

  it('GET / é público', () => http.get('/').expect(200));

  it('rota protegida sem token => 401', () => http.get('/chats').expect(401));
  it('GET /user/me sem token => 401', () => http.get('/user/me').expect(401));

  it('cadastro valida o corpo (senha curta => 400)', () =>
    http.post('/user').send({ ...novo, senha: '123' }).expect(400));

  it('cadastro funciona e NÃO devolve a senha', async () => {
    const res = await http.post('/user').send(novo).expect(201);
    expect(res.body.senha).toBeUndefined();
    expect(res.body.email).toBe('ana@email.com'); // normalizado
  });

  it('cadastro duplicado => 409', () => http.post('/user').send(novo).expect(409));

  it('login com senha errada => 401', () =>
    http.post('/auth/login').send({ email: novo.email, senha: 'errada-errada' }).expect(401));

  it('login com e-mail em maiúsculas funciona', async () => {
    const res = await http.post('/auth/login').send({ email: novo.email, senha: novo.senha }).expect(200);
    token = res.body.access_token;
    expect(token).toBeTruthy();
  });

  it('GET /auth/me devolve o usuário sem senha', async () => {
    const res = await http.get('/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.body.email).toBe('ana@email.com');
    expect(res.body.senha).toBeUndefined();
  });

  it('cria chat, envia mensagem e lê o histórico', async () => {
    const auth = { Authorization: `Bearer ${token}` };
    const chat = await http.post('/chats').set(auth).send({}).expect(201);
    await http.post(`/chats/${chat.body.id}/messages`).set(auth).send({ conteudo: 'oi' }).expect(201);
    const lido = await http.get(`/chats/${chat.body.id}`).set(auth).expect(200);
    expect(lido.body.mensagens).toHaveLength(1);
  });

  it('mensagem vazia => 400', async () => {
    const auth = { Authorization: `Bearer ${token}` };
    const chat = await http.post('/chats').set(auth).send({}).expect(201);
    await http.post(`/chats/${chat.body.id}/messages`).set(auth).send({ conteudo: '' }).expect(400);
  });

  it('login é limitado a 5 tentativas por minuto => 429', async () => {
    let ultimo = 200;
    for (let i = 0; i < 8; i++) {
      ultimo = (await http.post('/auth/login').send({ email: novo.email, senha: 'errada-errada' })).status;
    }
    expect(ultimo).toBe(429);
  });
});
