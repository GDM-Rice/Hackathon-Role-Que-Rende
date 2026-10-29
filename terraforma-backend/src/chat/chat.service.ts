import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/index.js';
import type { PaginacaoDto } from '../common/paginacao.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MAX_MEMBROS, type CreateChatDto } from './dto/create-chat.dto.js';
import { moderar } from './moderacao.js';

// O que sai da API sobre outra pessoa: só id e username (nunca e-mail).
const pessoaSelect = { id: true, username: true } satisfies Prisma.UserSelect;

const membrosInclude = {
  membros: {
    select: { user: { select: pessoaSelect } },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.ChatInclude;

const mensagemInclude = { autor: { select: pessoaSelect } } satisfies Prisma.MessageInclude;

type ChatComMembros = Prisma.ChatGetPayload<{ include: typeof membrosInclude }>;

// Chat filtrado pelo usuário: quem não é membro não encontra (404, não revela que existe).
const ondeSouMembro = (userId: string, chatId?: string): Prisma.ChatWhereInput => ({
  ...(chatId && { id: chatId }),
  membros: { some: { userId } },
});

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateChatDto) {
    const usernames = [...new Set(dto.membros)];
    const encontrados = await this.prisma.user.findMany({
      where: { username: { in: usernames } },
      select: pessoaSelect,
    });
    const faltando = usernames.filter((u) => !encontrados.some((e) => e.username === u));
    if (faltando.length) {
      throw new NotFoundException(`Usuário não encontrado: ${faltando.join(', ')}`);
    }

    const outros = encontrados.filter((e) => e.id !== userId);
    if (outros.length === 0) {
      throw new BadRequestException('Adicione pelo menos uma outra pessoa à conversa.');
    }

    // O título padrão (usernames dos outros) também passa pela moderação: contas criadas
    // antes da regra de username podem ter nomes proibidos.
    const titulo =
      this.tituloModerado(dto.titulo) ??
      this.tituloModerado(outros.map((o) => o.username).join(', '), false) ??
      'Conversa';

    const chat = await this.prisma.chat.create({
      data: {
        titulo,
        membros: { create: [userId, ...outros.map((o) => o.id)].map((id) => ({ userId: id })) },
      },
      include: membrosInclude,
    });
    return this.formatar(chat);
  }

  // Pede 1 a mais que o limite só para saber se existe próxima página.
  async findAll(userId: string, { limit = 20, cursor }: PaginacaoDto = {}) {
    const chats = await this.prisma.chat.findMany({
      where: ondeSouMembro(userId),
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      include: membrosInclude,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });
    const itens = chats.slice(0, limit);
    return {
      itens: itens.map((c) => this.formatar(c)),
      proximoCursor: chats.length > limit ? itens[itens.length - 1].id : null,
    };
  }

  // Busca as mensagens MAIS RECENTES primeiro e inverte para ordem cronológica;
  // o cursor leva para as mais antigas.
  async findOne(userId: string, chatId: string, { limit = 50, cursor }: PaginacaoDto = {}) {
    const chat = await this.prisma.chat.findFirst({
      where: ondeSouMembro(userId, chatId),
      include: {
        ...membrosInclude,
        mensagens: {
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: limit + 1,
          include: mensagemInclude,
          ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        },
      },
    });
    if (!chat) throw new NotFoundException('Chat não encontrado');

    const { mensagens, ...resto } = chat;
    const pagina = mensagens.slice(0, limit);
    return {
      ...this.formatar(resto),
      mensagens: pagina.reverse(),
      proximoCursor: mensagens.length > limit ? mensagens[limit - 1].id : null,
    };
  }

  async addMessage(userId: string, chatId: string, conteudo: string) {
    await this.assertMembro(userId, chatId);

    const r = moderar(conteudo.trim());
    // Só espaços/quebras de linha: nada para gravar (o DTO já barra, isto protege chamadas internas).
    if (!r.texto.trim()) {
      throw new BadRequestException('A mensagem não pode estar vazia.');
    }
    if (r.vazia) {
      throw new BadRequestException(
        'Mensagem não enviada: links, valores e nomes de casas de aposta não são permitidos.',
      );
    }

    // Cria a mensagem e atualiza updatedAt do chat (para ordenar a lista) de forma atômica.
    const [mensagem] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: { chatId, autorId: userId, conteudo: r.texto, moderada: r.moderada },
        include: mensagemInclude,
      }),
      this.prisma.chat.update({ where: { id: chatId }, data: {} }),
    ]);
    return mensagem;
  }

  // Qualquer membro pode convidar outra pessoa.
  async addMembro(userId: string, chatId: string, username: string) {
    await this.assertMembro(userId, chatId);

    const novo = await this.prisma.user.findUnique({ where: { username }, select: pessoaSelect });
    if (!novo) throw new NotFoundException(`Usuário não encontrado: ${username}`);

    // Contar e inserir dentro da mesma transação, com a linha do chat travada: dois convites ao
    // mesmo tempo não conseguem passar do limite de membros nem colidir na chave (chatId, userId).
    await this.prisma.$transaction(async (tx) => {
      await this.travarChat(tx, chatId);
      const jaEstava = await tx.chatMembro.findUnique({
        where: { chatId_userId: { chatId, userId: novo.id } },
        select: { chatId: true },
      });
      if (jaEstava) return;
      const total = await tx.chatMembro.count({ where: { chatId } });
      if (total >= MAX_MEMBROS) {
        throw new BadRequestException(`Uma conversa pode ter no máximo ${MAX_MEMBROS} membros.`);
      }
      await tx.chatMembro.create({ data: { chatId, userId: novo.id } });
    });

    const chat = await this.prisma.chat.findUniqueOrThrow({
      where: { id: chatId },
      include: membrosInclude,
    });
    return this.formatar(chat);
  }

  // Sai da conversa; quando o último membro sai, o chat e as mensagens são apagados.
  async sair(userId: string, chatId: string) {
    await this.assertMembro(userId, chatId);
    await this.prisma.$transaction(async (tx) => {
      // Sem a trava, dois últimos membros saindo ao mesmo tempo viam "ainda tem 1" cada um
      // e o chat ficava órfão (0 membros) para sempre.
      await this.travarChat(tx, chatId);
      await tx.chatMembro.deleteMany({ where: { chatId, userId } });
      await tx.chat.deleteMany({ where: { id: chatId, membros: { none: {} } } });
    });
  }

  /** Bloqueia a linha do chat até o fim da transação (SELECT ... FOR UPDATE). */
  private async travarChat(tx: Prisma.TransactionClient, chatId: string) {
    await tx.$queryRaw`SELECT "id" FROM "chats" WHERE "id" = ${chatId} FOR UPDATE`;
  }

  // lancarSeVazio=false: para o título automático, só devolve undefined (e usa o padrão).
  private tituloModerado(titulo?: string, lancarSeVazio = true): string | undefined {
    const limpo = titulo?.trim();
    if (!limpo) return undefined;
    const r = moderar(limpo);
    if (r.vazia) {
      if (!lancarSeVazio) return undefined;
      throw new BadRequestException('Título não permitido pela moderação.');
    }
    return r.texto.slice(0, 100);
  }

  private formatar({ membros, ...chat }: Omit<ChatComMembros, 'mensagens'>) {
    return { ...chat, membros: membros.map((m) => m.user) };
  }

  private async assertMembro(userId: string, chatId: string) {
    const membro = await this.prisma.chatMembro.findUnique({
      where: { chatId_userId: { chatId, userId } },
      select: { chatId: true },
    });
    if (!membro) throw new NotFoundException('Chat não encontrado');
  }
}
