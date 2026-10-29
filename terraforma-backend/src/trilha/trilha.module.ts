import { Module } from '@nestjs/common';
import { TrilhaController } from './trilha.controller.js';
import { TrilhaService } from './trilha.service.js';

@Module({
  controllers: [TrilhaController],
  providers: [TrilhaService],
})
export class TrilhaModule {}
