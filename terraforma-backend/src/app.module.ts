import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { AuthGuard } from './auth/guards/auth-guard.js';
import { ChatModule } from './chat/chat.module.js';
import { LimiteGuard } from './common/limite.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { TrilhaModule } from './trilha/trilha.module.js';
import { UserModule } from './user/user.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env: Record<string, unknown>) => {
        const secret = env.JWT_SECRET;
        if (typeof secret !== 'string' || secret.length < 16) {
          throw new Error(
            'JWT_SECRET ausente ou curto demais (mínimo 16 caracteres). Veja o .env.example.',
          );
        }
        return env;
      },
    }),
    PrismaModule,
    UserModule,
    AuthModule,
    ChatModule,
    TrilhaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // A ordem importa: primeiro limita a taxa, depois exige o token.
    // Limite padrão (60/min por IP e rota); login e senha têm limites próprios com @Throttle.
    { provide: APP_GUARD, useClass: LimiteGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
