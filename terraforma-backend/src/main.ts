import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import * as helmetModule from 'helmet';
import { AppModule } from './app.module.js';

// O build do Vercel compila este arquivo como CommonJS, e aí o `import helmet from 'helmet'`
// não acha a função. Este jeito funciona nos dois formatos (ESM local e CommonJS no Vercel).
const helmet = ((helmetModule as { default?: unknown }).default ??
  helmetModule) as unknown as typeof import('helmet').default;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Atrás de proxy (Vercel, Render...), o IP de quem chama vem em X-Forwarded-For. Sem isto,
  // o limite de tentativas (ThrottlerGuard) contaria todo mundo como o mesmo IP do proxy:
  // 5 logins por minuto para o app inteiro. TRUST_PROXY=1 liga fora do Vercel.
  if (process.env.VERCEL || process.env.TRUST_PROXY === '1')
    app.set('trust proxy', 1);

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
  // se não existir (ou estiver VAZIA, como no .env.example), cai no FRONTEND_URL, que continua
  // sendo UMA só (usada no link do e-mail). Usa || e não ??: "" não é nulo, e com ?? a lista
  // ficava vazia e o navegador bloqueava TODAS as chamadas do front.
  const origens = (
    process.env.CORS_ORIGINS ||
    process.env.FRONTEND_URL ||
    'http://localhost:3000'
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origens });

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
