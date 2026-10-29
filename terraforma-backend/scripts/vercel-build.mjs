// Build no Vercel (o Vercel roda "vercel-build" no lugar de "build" quando ele existe).
// 1. gera o Prisma Client (src/generated/prisma não vai para o git);
// 2. aplica as migrações, só no deploy de produção (ou com MIGRAR=1), para um preview
//    nunca mexer no banco de produção. Usa DIRECT_URL quando existir: migração não
//    funciona pela conexão com pool (pgbouncer) que o app usa em DATABASE_URL
//    (o Neon do Vercel cria DATABASE_URL_UNPOOLED, que também serve);
// 3. compila com o Nest.
import { execSync } from 'node:child_process';

const rodar = (cmd, env = {}) => execSync(cmd, { stdio: 'inherit', env: { ...process.env, ...env } });

rodar('prisma generate');

if (process.env.VERCEL_ENV === 'production' || process.env.MIGRAR === '1') {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL (ou DIRECT_URL) não definida: não dá para aplicar as migrações.');
  rodar('prisma migrate deploy', { DATABASE_URL: url });
} else {
  console.log(`Migrações puladas (VERCEL_ENV=${process.env.VERCEL_ENV ?? 'local'}). Use MIGRAR=1 para forçar.`);
}

rodar('nest build');
