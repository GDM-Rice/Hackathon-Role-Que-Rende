# Terraforma

> Cada dia sem apostar devolve vida ao planeta.

App de apoio para quem quer parar de apostar. O usuário acompanha os **dias sem apostar** e vê um planeta se regenerar (de "Terra árida" a "Planeta vivo"), e tem um espaço de **conversas** para desabafar.

Este repositório tem dois projetos independentes:

| Pasta | O que é | Tecnologia | Porta |
|---|---|---|---|
| `terraforma-backend/` | API REST | NestJS 12, Prisma 6, PostgreSQL, JWT | **3001** |
| `terraforma-frontend/` | Site | Next.js 16, React 19, Tailwind 4 | **3000** |

Deploy no Vercel: veja [`DEPLOY.md`](DEPLOY.md).

## Requisitos

- Node.js 22 ou mais novo e npm
- PostgreSQL 15 ou mais novo: via Docker (recomendado, já configurado no projeto) ou instalado na máquina
- Duas janelas de terminal (uma para cada projeto)

## Como rodar

### 1. Back-end (primeiro)

```bash
cd terraforma-backend
npm install
cp .env.example .env
```

Abra o `.env` e **troque o `JWT_SECRET`** por um valor com **16 caracteres ou mais**. Com o valor de exemplo (`Sua-Senha`) o back se recusa a subir. Para gerar um:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Suba o PostgreSQL. Com Docker (usa o `docker-compose.yml` do back, porta **5433**, e já bate com o `DATABASE_URL` do `.env.example`):

```bash
npm run db:up               # docker compose up -d
```

> **Sem Docker?** Use um PostgreSQL instalado: crie um usuário e um banco (por exemplo `terraforma`) e ajuste o `DATABASE_URL` do `.env` para a sua porta (padrão `5432`), usuário e senha.

Crie as tabelas e suba a API:

```bash
npx prisma migrate deploy   # aplica as migrations existentes
npm run prisma:generate     # gera o cliente em src/generated/prisma (obrigatório antes de rodar/testar)
npm run start:dev           # http://localhost:3001
```

Teste: abra <http://localhost:3001/health>.

### 2. Front-end

```bash
cd terraforma-frontend
npm install
npm run dev                 # http://localhost:3000
```

Por padrão o front chama o back em `http://localhost:3001`. Para mudar, crie `terraforma-frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Abra <http://localhost:3000>, crie uma conta e comece sua contagem.

> **Abra sempre por `http://localhost:3000`**, não por `127.0.0.1` nem pelo IP da rede. O CORS do back compara o endereço exatamente.

## Variáveis de ambiente do back (`terraforma-backend/.env`)

| Variável | Para que serve |
|---|---|
| `PORT` | Porta da API (padrão 3001; o front usa a 3000) |
| `FRONTEND_URL` | Endereço do front. Vale para o CORS e para o link do e-mail de recuperação de senha |
| `CORS_ORIGINS` | Opcional. Várias origens separadas por vírgula. Vazio = usa `FRONTEND_URL` |
| `DATABASE_URL` | URL do PostgreSQL: `postgresql://USUARIO:SENHA@HOST:PORTA/BANCO?schema=public` |
| `JWT_SECRET` | Chave dos tokens. Obrigatória, mínimo 16 caracteres |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | E-mail. Opcional em desenvolvimento: sem `SMTP_HOST`, o link de recuperação de senha aparece **no console do back** |

## Telas do front

| Rota | Tela | Acesso |
|---|---|---|
| `/login`, `/cadastro` | Entrar e criar conta | público |
| `/esqueci-senha`, `/redefinir-senha?token=...` | Recuperação de senha | público |
| `/` | Planeta e contador de dias | logado |
| `/chat`, `/chat/[id]` | Conversas | logado |
| `/perfil` | Dados da conta, sair, apagar conta | logado |

## API do back

Tudo exige `Authorization: Bearer <token>`, exceto as rotas marcadas como públicas.

| Método e rota | Descrição | Acesso |
|---|---|---|
| `GET /health` | Verificação de saúde | público |
| `POST /user` | Cadastro (`username`, `email`, `senha`) | público |
| `POST /auth/login` | Login, devolve `{ access_token }` (5/min) | público |
| `POST /auth/forgot-password` | Pede o link de recuperação (3/min) | público |
| `POST /auth/reset-password` | Define nova senha com o `token` do link | público |
| `GET /auth/me`, `GET /user/me` | Dados do usuário logado | logado |
| `PATCH /user/me` | Altera `username`, `email` ou `senha` (e-mail e senha exigem `senhaAtual`) | logado |
| `DELETE /user/me` | Apaga a conta e os chats | logado |
| `GET /chats` | Lista os chats (`?limit=&cursor=`) | logado |
| `POST /chats` | Cria um chat (`titulo` opcional) | logado |
| `GET /chats/:id` | Abre o chat com as mensagens (`?limit=&cursor=`) | logado |
| `POST /chats/:id/messages` | Envia mensagem (`conteudo`, até 4000 caracteres) | logado |
| `DELETE /chats/:id` | Apaga o chat | logado |

Trocar a senha invalida os tokens antigos: é preciso fazer login de novo.

## Testes

```bash
cd terraforma-backend
npm test            # testes unitários (Vitest)
npm run test:e2e    # testes e2e
```

Para testar a API na mão, importe no Insomnia o arquivo `terraforma-backend-insomnia.json` (Import → From File). Rode primeiro o cadastro e depois o login: as demais requisições usam o token dele automaticamente.

## Problemas comuns

- **"Não foi possível falar com o servidor" no front.** O back está desligado, ou o navegador bloqueou por CORS. Confira se o Nest está rodando na 3001, se você abriu o front por `localhost:3000` e se o `FRONTEND_URL`/`CORS_ORIGINS` do `.env` do back batem com o endereço do front. Reinicie o Nest depois de mudar o `.env`.
- **O back não sobe e fala de `JWT_SECRET`.** Use um valor com 16 caracteres ou mais.
- **Porta em uso.** O Next sobe na 3001 se a 3000 estiver ocupada, e aí colide com o back. Libere a 3000 ou ajuste `PORT`, `FRONTEND_URL` e `NEXT_PUBLIC_API_URL`.
- **429 (muitas tentativas).** Login, esqueci-senha e troca de dados têm limite por minuto. Espere um minuto.
- **Não chegou o e-mail de recuperação.** Sem `SMTP_HOST`, o link só aparece no console do back (e só fora de produção).
- **Quero zerar o banco.** Em `terraforma-backend`, rode `npm run prisma:reset` (apaga todos os dados e reaplica as migrations). Com Docker, também dá para usar `docker compose down -v` e depois `npm run db:up` e `npx prisma migrate deploy`.
- **`P1001: Can't reach database server`.** O PostgreSQL não está rodando ou o `DATABASE_URL` está com host/porta errados. Com Docker, confira `docker compose ps` (porta 5433); com Postgres local, a porta costuma ser 5432.
- **`P1000: Authentication failed`.** Usuário ou senha do `DATABASE_URL` não batem com os do banco. Se mudou as credenciais do `docker-compose.yml` depois de criar o volume, rode `docker compose down -v` para recriá-lo.
- **Porta 5433 (ou 5432) em uso.** Mude a porta à esquerda em `ports:` no `docker-compose.yml` e use a mesma no `DATABASE_URL`.

## Limitações conhecidas

- A **contagem de dias** fica no `localStorage` do navegador (por usuário). O back ainda não tem tabela nem rota para isso, então ela não acompanha o usuário em outro aparelho. As funções estão isoladas em `terraforma-frontend/lib/streak.ts`, prontas para trocar por chamadas à API.
- O back **não gera respostas do assistente** ainda. O front já mostra mensagens `ASSISTANT` (atualiza a cada 5 s) quando o servidor passar a criá-las.

## Estrutura do front

```
terraforma-frontend/
  app/(auth)/    telas públicas (login, cadastro, recuperação de senha)
  app/(app)/     telas privadas (planeta, chat, perfil) + proteção de sessão
  components/    Planet.tsx (planeta em SVG) e ui.tsx (botão, campo, aviso, card)
  lib/api.ts     cliente HTTP único: token, erros em português, logout no 401
  lib/auth.tsx   estado de login (login, cadastro, logout)
  lib/streak.ts  dias sem apostar e estágios do planeta
```