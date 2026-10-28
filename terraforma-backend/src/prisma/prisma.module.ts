import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

// @Global: qualquer módulo pode injetar PrismaService sem importar PrismaModule.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
