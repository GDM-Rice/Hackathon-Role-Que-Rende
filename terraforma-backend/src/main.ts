import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
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

  // Cabeçalhos de segurança padrão (X-Content-Type-Options, HSTS, etc.).
  app.use(helmet());

  // Sem isso o navegador bloqueia as chamadas do Next.js (outra origem/porta).
  // CORS_ORIGINS aceita várias origens separadas por vírgula (ex.: site + PWA);
  // se não existir, cai no FRONTEND_URL, que continua sendo UMA só (usada no link do e-mail).
  const origens = (
    process.env.CORS_ORIGINS ??
    process.env.FRONTEND_URL ??
    'http://localhost:3000'
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origens });

  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
