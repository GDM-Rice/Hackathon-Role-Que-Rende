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
import { CurrentUser } from '../auth/decorators/CurrentUser.decorator.js';
import { PaginacaoDto } from '../common/paginacao.dto.js';
import { ChatService } from './chat.service.js';
import { AddMembroDto } from './dto/add-membro.dto.js';
import { CreateChatDto } from './dto/create-chat.dto.js';
import { CreateMessageDto } from './dto/create-message.dto.js';

// Sem @Public(): o AuthGuard global exige token em todas as rotas daqui.
// Só membros de um chat conseguem vê-lo; para os demais ele responde 404.
@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateChatDto) {
    return this.chatService.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser('sub') userId: string, @Query() paginacao: PaginacaoDto) {
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

  // O autor é sempre quem está logado; o texto passa pela moderação antes de ser gravado.
  @Post(':id/messages')
  addMessage(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.chatService.addMessage(userId, id, dto.conteudo);
  }

  @Post(':id/membros')
  addMembro(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: AddMembroDto,
  ) {
    return this.chatService.addMembro(userId, id, dto.username);
  }

  // Sai da conversa. Ela só é apagada de vez quando o último membro sai.
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async sair(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    await this.chatService.sair(userId, id);
  }
}
