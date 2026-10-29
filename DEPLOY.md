# Deploy no Vercel

O repositório vira **dois projetos no Vercel**, um para cada pasta, e um banco PostgreSQL (Neon, pelo Marketplace do Vercel).

| Projeto no Vercel | Root Directory | Framework | O que sobe |
|---|---|---|---|
| `terraforma-api` | `terraforma-backend` | NestJS (fixado em `vercel.json`) | a API inteira como uma Vercel Function |
| `terraforma` | `terraforma-frontend` | Next.js (detectado sozinho) | o site |

Faça nesta ordem: banco e back primeiro, depois o front, depois volte ao back para liberar o endereço do front.

## 1. Back-end (`terraforma-api`)

1. No Vercel: **Add New → Project**, importe este repositório e em **Root Directory** escolha `terraforma-backend`. O framework aparece como NestJS (vem do `vercel.json`); não mude o Build Command.
2. Antes do primeiro deploy, em **Storage → Create Database → Neon (Postgres)**, crie o banco e conecte ao projeto. O Vercel cria `DATABASE_URL` (com pool) e `DATABASE_URL_UNPOOLED` (direta).
3. Em **Settings → Environment Variables** (Production e Preview):

   | Variável | Valor |
   |---|---|
   | `JWT_SECRET` | 16+ caracteres aleatórios: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
   | `FRONTEND_URL` | por enquanto `http://localhost:3000`; no passo 3 vira a URL do front |
   | `CORS_ORIGINS` | opcional, várias origens separadas por vírgula (ex.: produção + domínio próprio) |
   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | para o e-mail de "Esqueci a senha". Sem `SMTP_HOST`, o link só aparece nos logs |
   | `DIRECT_URL` | só se o banco não for o Neon do Vercel: a conexão direta, sem pool |

4. Deploy. O build (`scripts/vercel-build.mjs`) gera o Prisma Client, **aplica as migrações só no deploy de produção** (preview nunca mexe no banco) e compila.
5. Teste: `curl https://<url-do-back>/health` responde 200, e `GET /trilha` sem token responde 401.

## 2. Front-end (`terraforma`)

1. **Add New → Project**, mesmo repositório, **Root Directory** `terraforma-frontend`.
2. Variável de ambiente: `NEXT_PUBLIC_BACKEND_URL` = URL de produção do back (ex.: `https://terraforma-api.vercel.app`, sem `/` no fim). Ela entra no código durante o build: se mudar, faça um novo deploy do front.
3. Deploy.

## 3. Ligar um ao outro

No projeto do back, troque `FRONTEND_URL` pela URL de produção do front (ela vai no link do e-mail de senha e libera o CORS) e faça **Redeploy**. Se usar domínio próprio, ponha os dois endereços em `CORS_ORIGINS`.

Depois disso: abrir o site, criar conta, concluir uma aula da trilha e entrar com a mesma conta em outra janela anônima. O progresso tem que aparecer.

## Bom saber

- **Previews:** o back só aceita chamadas das origens em `FRONTEND_URL`/`CORS_ORIGINS`. Um preview do front (URL que muda a cada deploy) não fala com o back de produção, a não ser que você inclua a URL dele em `CORS_ORIGINS`. Com a Deployment Protection ligada, os previews do back também pedem login do Vercel.
- **Limite de tentativas** (login, cadastro, senha): fica na memória de cada instância da função, então no Vercel é um limite aproximado. O IP de quem chama vem do proxy do Vercel (`trust proxy` liga sozinho quando `VERCEL` existe).
- **Eventos e estado de exemplo** (`/api/eventos`, `/api/estado` do Next): continuam em memória e somem quando a função reinicia. Conta, conversas e trilha ficam no banco.
- **Migração manual:** `DATABASE_URL="<url direta>" npx prisma migrate deploy` na pasta do back.
- **Conferir o build sem subir:** `npx vercel build` na pasta de cada projeto (precisa de `vercel link` antes).
