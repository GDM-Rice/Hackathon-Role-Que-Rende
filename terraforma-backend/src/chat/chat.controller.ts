import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { MessageRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/CurrentUser.decorator.js';
import { PaginacaoDto } from '../common/paginacao.dto.js';
import { ChatService } from './chat.service.js';
import { CreateChatDto } from './dto/create-chat.dto.js';
import { CreateMessageDto } from './dto/create-message.dto.js';

// Sem @Public(): o AuthGuard global exige token em todas as rotas daqui.
@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateChatDto) {
    return this.chatService.create(userId, dto.titulo);
  }

  @Get()
  findAll(
    @CurrentUser('sub') userId: string,
    @Query() paginacao: PaginacaoDto,
  ) {
    return this.chatService.findAll(userId, paginacao);
  }

  @Get(':id')
  findOne(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Query() paginacao: PaginacaoDto,
  ) {
    return this.chatService.findOne(userId, id, paginacao);
  }

  // O cliente só envia mensagens de USER; as de ASSISTANT são criadas pelo servidor.
  @Post(':id/messages')
  addMessage(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.chatService.addMessage(userId, id, MessageRole.USER, dto.conteudo);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    await this.chatService.remove(userId, id);
  }
}
