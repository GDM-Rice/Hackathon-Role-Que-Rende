import { Injectable, NotFoundException } from '@nestjs/common';
import { MessageRole } from '../generated/prisma/index.js';
import type { PaginacaoDto } from '../common/paginacao.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, titulo?: string) {
    return this.prisma.chat.create({
      data: { userId, titulo: titulo?.trim() || 'Nova conversa' },
    });
  }

  // Pede 1 a mais que o limite só para saber se existe próxima página.
  async findAll(userId: string, { limit = 20, cursor }: PaginacaoDto = {}) {
    const chats = await this.prisma.chat.findMany({
      where: { userId },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });
    const itens = chats.slice(0, limit);
    return {
      itens,
      proximoCursor: chats.length > limit ? itens[itens.length - 1].id : null,
    };
  }

  // Sempre filtra por userId: chat de outra pessoa responde 404 (não revela que existe).
  // Devolve as mensagens MAIS RECENTES primeiro na busca e inverte para ordem cronológica;
  // o cursor leva para as mais antigas.
  async findOne(
    userId: string,
    chatId: string,
    { limit = 50, cursor }: PaginacaoDto = {},
  ) {
    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, userId },
      include: {
        mensagens: {
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: limit + 1,
          ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        },
      },
    });
    if (!chat) throw new NotFoundException('Chat não encontrado');

    const { mensagens, ...resto } = chat;
    const pagina = mensagens.slice(0, limit);
    return {
      ...resto,
      mensagens: pagina.reverse(),
      proximoCursor:
        mensagens.length > limit ? mensagens[limit - 1].id : null,
    };
  }

  async addMessage(
    userId: string,
    chatId: string,
    role: MessageRole,
    conteudo: string,
  ) {
    await this.assertOwner(userId, chatId);

    // Cria a mensagem e atualiza updatedAt do chat (para ordenar a lista) de forma atômica.
    const [mensagem] = await this.prisma.$transaction([
      this.prisma.message.create({ data: { chatId, role, conteudo } }),
      this.prisma.chat.update({ where: { id: chatId }, data: {} }),
    ]);
    return mensagem;
  }

  async remove(userId: string, chatId: string) {
    await this.assertOwner(userId, chatId);
    await this.prisma.chat.delete({ where: { id: chatId } }); // mensagens saem junto (onDelete: Cascade)
  }

  private async assertOwner(userId: string, chatId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, userId },
      select: { id: true },
    });
    if (!chat) throw new NotFoundException('Chat não encontrado');
  }
}
