import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/CurrentUser.decorator.js';
import { SincronizarTrilhaDto } from './dto/sincronizar-trilha.dto.js';
import { TrilhaService } from './trilha.service.js';

// Sem @Public(): cada pessoa só lê e grava o próprio progresso.
@Controller('trilha')
export class TrilhaController {
  constructor(private readonly trilhaService: TrilhaService) {}

  @Get()
  listar(@CurrentUser('sub') userId: string) {
    return this.trilhaService.listar(userId);
  }

  // Junta o progresso do aparelho com o da conta (nada regride) e devolve o resultado.
  @HttpCode(HttpStatus.OK)
  @Post('sincronizar')
  sincronizar(
    @CurrentUser('sub') userId: string,
    @Body() dto: SincronizarTrilhaDto,
  ) {
    return this.trilhaService.sincronizar(userId, dto.atividades);
  }
}
