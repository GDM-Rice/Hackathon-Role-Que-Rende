import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Faz os decorators dos DTOs (@IsEmail, @MinLength...) valerem em TODA rota.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // descarta campos que não estão no DTO
      forbidNonWhitelisted: true, // e responde 400 se vierem campos extras
      transform: true, // aplica @Transform (ex.: e-mail em minúsculas)
    }),
  );

  // Sem isso o navegador bloqueia as chamadas do Next.js (outra origem/porta).
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  });

  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
