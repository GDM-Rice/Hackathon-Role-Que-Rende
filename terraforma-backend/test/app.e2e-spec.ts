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
  const membros: { chatId: string; userId: string }[] = [];
  const pessoa = (userId: string | null) => {
    const u = users.find((x) => x.id === userId);
    return u ? { id: u.id, username: u.username } : null;
  };
  const comMembros = (c: any) => ({
    ...c,
    membros: membros.filter((m) => m.chatId === c.id).map((m) => ({ user: pessoa(m.userId) })),
  });
  const souMembro = (where: any, c: any) =>
    membros.some((m) => m.chatId === c.id && m.userId === where.membros.some.userId);
  const acharMembro = ({ chatId_userId: k }: any) =>
    membros.find((m) => m.chatId === k.chatId && m.userId === k.userId) ?? null;

  const db: any = {
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
        const u = users.find((x) =>
          where.id ? x.id === where.id : where.email ? x.email === where.email : x.username === where.username,
        );
        return u ? pick(u, select) : null;
      },
      findMany: async ({ where, select }: any) =>
        users.filter((u) => where.username.in.includes(u.username)).map((u) => pick(u, select)),
      // apagar a conta: participações saem junto (onDelete: Cascade); mensagens ficam sem autor
      delete: async ({ where, select }: any) => {
        const u = users.find((x) => x.id === where.id);
        users.splice(users.indexOf(u), 1);
        for (let i = membros.length - 1; i >= 0; i--) if (membros[i].userId === u.id) membros.splice(i, 1);
        msgs.forEach((m) => { if (m.autorId === u.id) m.autorId = null; });
        return pick(u, select);
      },
    },
    chat: {
      create: async ({ data }: any) => {
        const c = { id: id(), titulo: data.titulo, createdAt: new Date(), updatedAt: new Date() };
        chats.push(c);
        for (const m of data.membros.create) membros.push({ chatId: c.id, userId: m.userId });
        return comMembros(c);
      },
      findMany: async ({ where }: any) => chats.filter((c) => souMembro(where, c)).map(comMembros),
      findFirst: async ({ where, include }: any) => {
        const c = chats.find((x) => x.id === where.id && souMembro(where, x));
        if (!c) return null;
        const mensagens = msgs
          .filter((m) => m.chatId === c.id)
          .reverse()
          .map((m) => ({ ...m, autor: pessoa(m.autorId) }));
        return include?.mensagens ? { ...comMembros(c), mensagens } : comMembros(c);
      },
      findUniqueOrThrow: async ({ where }: any) => comMembros(chats.find((c) => c.id === where.id)),
      update: async ({ where }: any) => chats.find((c) => c.id === where.id),
      delete: async ({ where }: any) => {
        chats.splice(chats.findIndex((c) => c.id === where.id), 1);
      },
      // suporta { id } ou { id: { in } } + membros: { none: {} }
      deleteMany: async ({ where }: any) => {
        const ids: string[] = where.id?.in ?? [where.id];
        const alvo = chats.filter(
          (c) => ids.includes(c.id) && !(where.membros?.none && membros.some((m) => m.chatId === c.id)),
        );
        alvo.forEach((c) => chats.splice(chats.indexOf(c), 1));
        return { count: alvo.length };
      },
    },
    chatMembro: {
      findUnique: async ({ where }: any) => acharMembro(where),
      count: async ({ where }: any) => membros.filter((m) => m.chatId === where.chatId).length,
      create: async ({ data }: any) => {
        membros.push(data);
        return data;
      },
      delete: async ({ where }: any) => {
        membros.splice(membros.indexOf(acharMembro(where)!), 1);
      },
      deleteMany: async ({ where }: any) => {
        const alvo = membros.filter((m) => m.chatId === where.chatId && m.userId === where.userId);
        alvo.forEach((m) => membros.splice(membros.indexOf(m), 1));
        return { count: alvo.length };
      },
      findMany: async ({ where }: any) => membros.filter((m) => m.userId === where.userId),
    },
    message: {
      create: async ({ data }: any) => {
        const m = { id: id(), createdAt: new Date(), ...data };
        msgs.push(m);
        return { ...m, autor: pessoa(m.autorId) };
      },
    },
    // SELECT ... FOR UPDATE: no banco falso não há concorrência, basta existir
    $queryRaw: async () => [],
    $transaction: async (arg: any) => (typeof arg === 'function' ? arg(db) : Promise.all(arg)),
  };
  return db;
}
const pick = (o: any, s?: any) =>
  s ? Object.fromEntries(Object.keys(s).filter((k) => s[k]).map((k) => [k, o[k]])) : o;

describe('Fluxo de login e chats (e2e, sem banco real)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;

  beforeAll(async () => {
    const { Prisma } = await import('../src/generated/prisma/index.js');
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

  it('GET /health é público', async () => {
    const res = await http.get('/health').expect(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('rota protegida sem token => 401', () => http.get('/chats').expect(401));
  it('GET /user/me sem token => 401', () => http.get('/user/me').expect(401));

  it('cadastro valida o corpo (senha curta => 400)', () =>
    http.post('/user').send({ ...novo, senha: '123' }).expect(400));

  it('cadastro rejeita username curto ou com caracteres inválidos => 400', async () => {
    await http.post('/user').send({ ...novo, username: 'ab' }).expect(400);
    await http.post('/user').send({ ...novo, username: 'ana silva!' }).expect(400);
  });

  it('cadastro rejeita username com nome de casa de aposta ou link => 400', async () => {
    await http.post('/user').send({ ...novo, username: 'bet365' }).expect(400);
    await http.post('/user').send({ ...novo, username: 'Estrela_Bet' }).expect(400);
    await http.post('/user').send({ ...novo, username: 'meu.site.com' }).expect(400);
  });

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

  it('trocar o e-mail sem a senha atual => 400; com senha atual errada => 403', async () => {
    const auth = { Authorization: `Bearer ${token}` };
    await http.patch('/user/me').set(auth).send({ email: 'outra@email.com' }).expect(400);
    await http
      .patch('/user/me')
      .set(auth)
      .send({ email: 'outra@email.com', senhaAtual: 'senha-errada-1' })
      .expect(403);
  });

  it('lista chats paginados: { itens, proximoCursor }', async () => {
    const auth = { Authorization: `Bearer ${token}` };
    const res = await http.get('/chats?limit=5').set(auth).expect(200);
    expect(Array.isArray(res.body.itens)).toBe(true);
    expect(res.body).toHaveProperty('proximoCursor');
    await http.get('/chats?limit=0').set(auth).expect(400);
    await http.get('/chats?limit=101').set(auth).expect(400);
  });

  // Segunda e terceira pessoas para testar o chat entre membros.
  const bia = { username: 'bia', email: 'bia@email.com', senha: 'senha-forte-2' };
  const caio = { username: 'caio', email: 'caio@email.com', senha: 'senha-forte-3' };
  let tokenBia = '';
  let tokenCaio = '';
  let chatId = '';

  it('cadastra e loga outras pessoas', async () => {
    for (const p of [bia, caio]) await http.post('/user').send(p).expect(201);
    tokenBia = (await http.post('/auth/login').send({ email: bia.email, senha: bia.senha })).body.access_token;
    tokenCaio = (await http.post('/auth/login').send({ email: caio.email, senha: caio.senha })).body.access_token;
    expect(tokenBia && tokenCaio).toBeTruthy();
  });

  it('criar chat exige pelo menos um membro existente e diferente de si', async () => {
    const auth = { Authorization: `Bearer ${token}` };
    await http.post('/chats').set(auth).send({}).expect(400);
    await http.post('/chats').set(auth).send({ membros: [] }).expect(400);
    await http.post('/chats').set(auth).send({ membros: ['ninguem'] }).expect(404);
    await http.post('/chats').set(auth).send({ membros: ['ana'] }).expect(400);
  });

  it('ana cria chat com bia; as duas veem, caio não', async () => {
    const res = await http
      .post('/chats')
      .set({ Authorization: `Bearer ${token}` })
      .send({ membros: ['Bia'] })
      .expect(201);
    chatId = res.body.id;
    expect(res.body.membros.map((m: any) => m.username)).toEqual(['ana', 'bia']);
    expect(res.body.membros[0].email).toBeUndefined();

    const listaBia = await http.get('/chats').set({ Authorization: `Bearer ${tokenBia}` }).expect(200);
    expect(listaBia.body.itens.map((c: any) => c.id)).toContain(chatId);
    await http.get(`/chats/${chatId}`).set({ Authorization: `Bearer ${tokenCaio}` }).expect(404);
    await http
      .post(`/chats/${chatId}/messages`)
      .set({ Authorization: `Bearer ${tokenCaio}` })
      .send({ conteudo: 'oi' })
      .expect(404);
  });

  it('mensagem leva o autor e a outra pessoa lê', async () => {
    await http
      .post(`/chats/${chatId}/messages`)
      .set({ Authorization: `Bearer ${token}` })
      .send({ conteudo: 'oi, bia' })
      .expect(201);
    const lido = await http.get(`/chats/${chatId}`).set({ Authorization: `Bearer ${tokenBia}` }).expect(200);
    expect(lido.body.mensagens).toHaveLength(1);
    expect(lido.body.mensagens[0].autor).toEqual({ id: expect.any(String), username: 'ana' });
    expect(lido.body.proximoCursor).toBeNull();
  });

  it('moderação remove links, valores e casas de aposta', async () => {
    const auth = { Authorization: `Bearer ${tokenBia}` };
    const res = await http
      .post(`/chats/${chatId}/messages`)
      .set(auth)
      .send({ conteudo: 'perdi R$ 300 na bet365, vê www.exemplo.com' })
      .expect(201);
    expect(res.body.moderada).toBe(true);
    expect(res.body.conteudo).not.toMatch(/300|bet365|exemplo/i);
    await http.post(`/chats/${chatId}/messages`).set(auth).send({ conteudo: 'b3t365' }).expect(400);
  });

  it('mensagem vazia => 400', () =>
    http
      .post(`/chats/${chatId}/messages`)
      .set({ Authorization: `Bearer ${token}` })
      .send({ conteudo: '' })
      .expect(400));

  it('mensagem só com espaços e quebras de linha => 400', () =>
    http
      .post(`/chats/${chatId}/messages`)
      .set({ Authorization: `Bearer ${token}` })
      .send({ conteudo: '   \n\t  ' })
      .expect(400));

  it('membro adiciona outra pessoa', async () => {
    const res = await http
      .post(`/chats/${chatId}/membros`)
      .set({ Authorization: `Bearer ${tokenBia}` })
      .send({ username: 'caio' })
      .expect(201);
    expect(res.body.membros.map((m: any) => m.username)).toEqual(['ana', 'bia', 'caio']);
    await http.get(`/chats/${chatId}`).set({ Authorization: `Bearer ${tokenCaio}` }).expect(200);
  });

  it('sair do chat: some para quem saiu e continua para os outros', async () => {
    await http.delete(`/chats/${chatId}`).set({ Authorization: `Bearer ${token}` }).expect(204);
    await http.get(`/chats/${chatId}`).set({ Authorization: `Bearer ${token}` }).expect(404);
    await http.get(`/chats/${chatId}`).set({ Authorization: `Bearer ${tokenBia}` }).expect(200);
  });

  it('quando o último membro sai (ou apaga a conta), o chat não fica órfão', async () => {
    await http.delete(`/chats/${chatId}`).set({ Authorization: `Bearer ${tokenBia}` }).expect(204);
    await http.get(`/chats/${chatId}`).set({ Authorization: `Bearer ${tokenCaio}` }).expect(200);
    // caio era o último: apagar a conta leva o chat junto
    await http.delete('/user/me').set({ Authorization: `Bearer ${tokenCaio}` }).expect(200);
    const res = await http.get('/chats').set({ Authorization: `Bearer ${tokenBia}` }).expect(200);
    expect(res.body.itens.some((c: any) => c.id === chatId)).toBe(false);
  });

  it('login é limitado a 5 tentativas por minuto => 429', async () => {
    let ultimo = 200;
    for (let i = 0; i < 8; i++) {
      ultimo = (await http.post('/auth/login').send({ email: novo.email, senha: 'errada-errada' })).status;
    }
    expect(ultimo).toBe(429);
  });
});
