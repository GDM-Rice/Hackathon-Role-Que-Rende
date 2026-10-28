import { Injectable, NotFoundException } from '@nestjs/common';
import { MessageRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, titulo?: string) {
    return this.prisma.chat.create({
      data: { userId, titulo: titulo?.trim() || 'Nova conversa' },
    });
  }

  findAll(userId: string) {
    return this.prisma.chat.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // Sempre filtra por userId: chat de outra pessoa responde 404 (não revela que existe).
  async findOne(userId: string, chatId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, userId },
      include: { mensagens: { orderBy: { createdAt: 'asc' } } },
    });
    if (!chat) throw new NotFoundException('Chat não encontrado');
    return chat;
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
