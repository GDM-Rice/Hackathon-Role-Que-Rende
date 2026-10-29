# Relatório de verificação do sistema Terraforma

- **Data:** 29/10/2026
- **Branch verificada:** `feat/debloat` (commit `b961aea`), a mesma versão publicada em produção (https://terraforma-five.vercel.app)
- **Escopo:** front (Next.js) e back (NestJS + Prisma/Postgres), mais o que está publicado no Vercel

## Resumo

Não há falha crítica. O back-end é bem protegido, e o front não tem erro de JavaScript, de console nem requisição falha em nenhuma tela. Os problemas encontrados são, na maioria, de **acessibilidade**, de **cabeçalhos de segurança do site** e de **funcionalidade que depende de configuração** (e-mail de recuperação de senha).

| Gravidade | Qtde | Itens |
|---|---|---|
| Alta | 1 | A1 |
| Média | 6 | M1 a M6 |
| Baixa / informativa | 12 | B1 a B12 |

**O que fazer primeiro:** A1 (recuperação de senha), M3 (alvos de toque, exigência do edital), M1 (cabeçalhos de segurança) e M2 (rotas `/api` abertas).

## Correções feitas (M2, M3, M5, M6)

Corrigidas na `feat/debloat`, no working tree, **sem commit e sem deploy** até a equipe revisar. Cada correção foi testada.

### M2: rotas `/api` abertas
- **O que mudou:**
  - `app/api/eventos` e `app/api/estado` respondem **404 em produção no Vercel** (`VERCEL_ENV=production`). `API_EXEMPLO=1` liga de propósito.
  - O app **não envia eventos** nesse caso. A decisão é tomada no build (`next.config.mjs` define `NEXT_PUBLIC_EVENTOS_API`). Se houver API de eventos de verdade (`NEXT_PUBLIC_API_URL`), continua enviando.
  - Onde ficam ligadas (local, dev, preview): corpo de no máximo 10 KB (413), JSON quebrado dá 400 em vez de 500, lista de eventos com teto de 1.000, `PATCH /api/estado` só aceita seções que o estado já tem (ignora chave desconhecida e `__proto__`), `luneta.meus` com teto de 200.
  - **Achado extra:** a fila local de eventos (`terraforma:eventos-pendentes`) crescia sem limite quando a API falhava, e a cada novo evento o app reenviava a fila inteira. Agora tem teto de 100, e a fila antiga é limpa quando o envio está desligado.
- **Testes:** `testes/api-exemplo.mjs` (novo). Com as rotas ligadas, 15 verificações passam (validações, 413, 400, teto de 1.000 após 1.100 envios, fila local com teto de 100 com a API fora do ar). Simulando produção (`VERCEL_ENV=production` no build e no servidor), as 4 chamadas dão 404, o app faz 0 requisições de eventos, a fila antiga é limpa e não há erro de console. Com `API_EXEMPLO=1`, as rotas voltam a responder (201 e 200). O teste de fumaça segue passando.

### M3: alvos de toque
- **O que mudou:** bloco único em `app/globals.css` (antes da seção `responsivo`) com `min-height: 44px` nos botões, abas, chips e campos listados no item. Linhas de botões que quebram em várias linhas ficaram com espaçamento menor entre linhas, para o bloco não crescer demais. O link "Quanto você apostava? Definir" não cresceu: ganhou área de toque ampliada em 11 px para cima e para baixo. O texto de cada publicação do mural (`.abrir`) também passou a ter 44 px de altura mínima.
- **Medição (13 telas):** a 390 px, de **71** elementos abaixo de 44 px para **12** (o link ampliado e os 11 botões da escala 0 a 10). Depois das correções: 320 px e tema escuro a 390 px dão os mesmos 12; 768 e 1440 px dão só **1** (o link ampliado), porque a escala 0 a 10 cabe com 44 px de largura nessas telas. O estado anterior só foi medido a 390 px.
- **O que sobra:**
  - O link ampliado: confirmado por teste de toque (a 10 px acima ou abaixo vale como toque no link, a 14 px já é outro elemento) e nenhum botão vizinho perde toque, em 390, 320 e 1440 px.
  - **A escala 0 a 10 da tela de Trocas continua com 28 px de largura em telas de celular** (altura passou de 40 para 44). Onze botões numa linha de ~350 px não comportam 44 px de largura. Não é uma correção completa: a alternativa é quebrar a escala em duas linhas (6 e 5), o que muda o desenho e a legenda "0 · passou / 10 · muito forte". Decisão da equipe.
- **Verificação visual:** login (320 e 390 px), Trocas, Luneta, Perfil, Finanças e Ajustes. Nenhum estouro horizontal novo. O login a 320x568 rola por dentro e o botão de enviar fica alcançável.

### M5: contraste do rótulo do mutirão
- **O que mudou:** a cor da região deixou de ser aplicada direto no texto. Agora o texto é a cor da região misturada (55%) com a cor do texto do tema (`color-mix`), em `.mutirao .rot`.
- **Achado extra:** o problema não era só o Centro-Oeste. No tema escuro **as 5 regiões falhavam** (de 1,77:1 no Norte a 4,48:1 no Centro-Oeste), e o Nordeste também falhava no claro (3,87:1).
- **Medição direta no navegador (5 regiões x 2 temas):** mínimo de **7,21:1 no claro** e **5,12:1 no escuro** (meta: 4,5:1). O axe não aponta mais violação de contraste em nenhuma tela ou resolução.

### M6: ARIA inválido
- **O que mudou:** removido o `aria-selected` dos botões `role="radio"`. O estilo do selecionado passou a usar `aria-checked` (`app/globals.css`). O mesmo erro existia também no seletor de período das boas-vindas, que o axe não via porque só aparece num passo do tutorial. Foram corrigidos os dois.
- **Testes:** nenhum botão de rádio tem `aria-selected`, a seleção anda ao clicar e o fundo do selecionado continua diferente dos outros, no Perfil e nas boas-vindas. O axe não aponta mais `aria-allowed-attr`.

**Estado do axe depois das correções:** sobraram só `heading-order` (B8) e `empty-heading` (B9), que não faziam parte desta rodada.

## Como foi verificado

**Automático**
- Front: `npm run lint` (tsc), `npm run build`, teste de fumaça (`node testes/fumaca.mjs`), `npm audit`.
- Back: `tsc --noEmit`, `oxlint`, 108 testes unitários (`vitest`), `npm audit`.
- Navegador (Chromium) no **site oficial publicado**: 12 telas em 5 resoluções para erros de console, requisições que falham e erros de JavaScript (celular claro e escuro a 390 px, 320 px, tablet 768 px e computador 1440 px); estouro horizontal em 5 resoluções (inclui celular deitado 844x390); acessibilidade (axe-core 4.10.2) e tamanho dos alvos de toque a 390 px. Login e boas-vindas só entraram nas verificações de acessibilidade, de alvos de toque e de estouro horizontal, não na de console.
- Segurança: cabeçalhos HTTP, busca de segredos na árvore e no histórico do git, CORS do back.

**Leitura de código:** `main.ts`, módulo, autenticação (serviço, controlador, guard, JWT), usuário, chat, moderação, trilha, DTOs, limite de tentativas, schema do banco, cliente do back no front e a renderização de dados vindos da API. O `app.js` do front (2.040 linhas) foi lido só nos trechos de risco.

## O que passou

| Verificação | Resultado |
|---|---|
| Front: lint (tsc), build, teste de fumaça | sem erro |
| Front: `npm audit` (produção) | 0 vulnerabilidades |
| Back: tsc, oxlint, testes unitários | sem erro, 108/108 passam |
| Site oficial: console, requisições, erros JS (12 telas x 5 cenários) | 0 ocorrências |
| Estouro horizontal em qualquer resolução | nenhum |
| Segredos versionados | nenhum (ver nota abaixo) |
| Renderização de mensagens e nomes vindos da API | escapada (`esc`): sem XSS visível |
| Autorização do back | por usuário do token e por membro do chat (404 para quem não é membro) |
| Autenticação | token de recuperação com hash e uso único, resposta que não revela e-mails, versão da senha no token, senha atual exigida para trocar e-mail ou senha |
| Validação de entrada | `whitelist` e `forbidNonWhitelisted` globais, limites de tamanho nos DTOs, paginação com máximo de 100 |
| API: cabeçalhos | helmet ativo (CSP, X-Frame-Options, nosniff, HSTS) |
| CORS | libera só o site oficial (e o preview combinado) |
| Banco | índices nas consultas principais, exclusões em cascata corretas |
| Vocabulário proibido do `AGENTS.md`, marca do BB | sem ocorrências (ver B10) |

**Nota sobre segredos:** a busca por `npg_` (prefixo de senha do Neon) casou dentro do `terra-dia.jpg`, que são bytes aleatórios da imagem. Não é credencial.

---

## Achados

### Alta

#### A1. A recuperação de senha não funciona em produção
- **Onde:** `terraforma-backend/src/mail/mail.service.ts`, `src/auth/auth.service.ts`
- **Evidência:**
  - O projeto `terraforma-api` não tem nenhuma variável `SMTP_*` (conferido com `vercel env ls`), e o `DEPLOY.md` já diz "falta só SMTP".
  - Sem SMTP em produção, `enviarRecuperacaoSenha` lança `SMTP não configurado em produção.` O erro é capturado pelo `.catch` e só vai para o log.
  - A resposta continua sendo "Se o email estiver cadastrado, você receberá as instruções...". A pessoa acha que o e-mail foi enviado e nunca recebe.
  - Mesmo com SMTP configurado, o envio roda sem esperar (`void ...catch`). Em função serverless, o processo pode ser congelado depois da resposta, e o e-mail se perde.
- **Impacto:** quem esquecer a senha fica sem acesso à conta, sem aviso.
- **Sugestão:** configurar um SMTP (ou provedor de e-mail transacional). Usar `waitUntil` do `@vercel/functions` (ou esperar o envio com tempo de resposta constante) para o envio não se perder.

### Média

#### M1. O site não envia cabeçalhos de segurança
- **Onde:** projeto `terraforma` (front). `vercel.json` só declara o framework; não há `headers()` no Next.
- **Evidência:** `curl -I https://terraforma-five.vercel.app/` devolve só `strict-transport-security`. Faltam `content-security-policy`, `x-frame-options` (ou `frame-ancestors`), `x-content-type-options`, `referrer-policy` e `permissions-policy`. A API, em contraste, tem tudo isso.
- **Impacto:** o site pode ser embutido em outra página (clickjacking). O link de redefinição de senha (`/redefinir-senha?token=...`) pode vazar o token pelo cabeçalho `Referer`. Sem CSP, um eventual XSS teria mais alcance, e o token da sessão fica em `localStorage`.
- **Sugestão:** adicionar os cabeçalhos em `next.config.ts` ou `vercel.json`. Começar por `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin` e `Permissions-Policy`. A CSP exige teste, porque o app usa scripts inline, three.js e o player do YouTube.

#### M2. Rotas `/api/eventos` e `/api/estado` do Next estão abertas em produção — **corrigido** (ver "Correções feitas")
- **Onde:** `terraforma-frontend/app/api/eventos/route.ts`, `app/api/estado/route.ts`, `app/api/_memoria.ts`
- **Evidência (código):**
  - `POST /api/eventos` não tem autenticação, limite de tamanho nem limite de taxa. Cada evento é guardado numa lista em memória sem teto.
  - `GET /api/eventos` devolve os últimos 100 eventos de todo mundo que caiu na mesma instância.
  - `PATCH /api/estado` faz `Object.assign(estado, req.json())` com qualquer corpo. Corpo inválido gera erro 500, porque `req.json()` não tem tratamento.
  - O app publicado envia todos os eventos para esse endereço (`lib/api.ts`, `components/Prototipo.tsx`).
- **Evidência (produção):** um `GET /api/eventos` voltou vazio. Cada instância serverless tem memória própria, e essa chamada caiu numa instância nova. Não gravei nada em produção para testar.
- **Impacto:** crescimento de memória por abuso, estado de exemplo adulterável por qualquer pessoa e leitura, entre usuários, de sinais de comportamento. Os eventos não têm identidade (sem nome nem telefone), mas incluem `alerta_crise`, `senha_esquecida`, `divida_adicionada`, `pesquisa`. Por isso é risco médio, não crítico.
- **Sugestão:** desligar essas rotas em produção (`404` quando `VERCEL_ENV === 'production'`) e fazer o front não enviar eventos quando não houver back de eventos. Se forem ficar, exigir autenticação e limitar tamanho e taxa.

#### M3. Alvos de toque menores que 44 px (regra 9 do `AGENTS.md` e edital 8.2) — **corrigido, com uma exceção** (ver "Correções feitas")
- **Onde:** `app/globals.css` e telas em `prototipo/`. Medido no site oficial, a 390 px.
- **Evidência:**

| Tela | Elementos (largura x altura) |
|---|---|
| Login | "Entrar" e "Criar conta" 168x40; "Esqueci a senha" 115x32 |
| Boas-vindas | "Pular" 39x44 (largura) |
| Início | link "Quanto você apostava? Definir" 192x23 |
| Trilha | chip da região "Sul" 67x36 |
| Luneta | 15 itens: filtros ("Tudo", "Vontade agora"...) e botões do mutirão com 34 de altura; "Responder" e "Mandar força" com 40 |
| Finanças | abas "Básico", "Dívidas", "Barreiras" 115x38 |
| Perfil | 18 itens com 36 a 38 de altura (período, tempo de apostas, tipos de aposta) |
| Ajustes | 14 itens com 40 a 43 de altura |
| Trocas | duração 38, botões 40, notas de 0 a 10 com 28 de **largura** |
| Órbita | checkbox "recados-on" 22x22 |

- **Dúvida a verificar:** os interruptores (48x28) e a caixa "recados-on" estão dentro de um `label` maior, então a área de toque real pode ser suficiente. Conferir no aparelho.
- **Impacto:** dificulta o toque, principalmente para quem tem dificuldade motora, e o edital conta isso como acessibilidade.
- **Sugestão:** `min-height` e `min-width` de 44 px nesses controles. Dá para manter o visual aumentando só a área clicável (padding ou pseudo-elemento).

#### M4. Chats reais não têm bloqueio nem denúncia no servidor, e o convite não pede consentimento
- **Onde:** `src/chat/chat.service.ts` (`create`, `addMembro`) e `prototipo/app.js` (`lun.bloq`)
- **Evidência:** as rotas do servidor são só `auth`, `user`, `chats` e `trilha`, sem bloqueio nem denúncia. Qualquer pessoa autenticada cria uma conversa ou adiciona qualquer `username` sem aceite. O "bloqueio" do front fica só no aparelho (`localStorage`) e só filtra o mural de exemplo.
- **Impacto:** em um app para pessoas vulneráveis, uma pessoa pode ser incluída em conversas que não quer e não tem como se proteger.
- **Sugestão:** decisão de produto: convite com aceite, bloqueio e denúncia no servidor.

#### M5. Contraste insuficiente no rótulo do mutirão (regra 9: AA nos dois temas) — **corrigido**
- **Onde:** Luneta, `.mutirao > .rot` (cor vem de `rmm.cor`)
- **Evidência (axe, "serious"):** `#BA7517` sobre `#FFFFFF` dá **3,72:1**, e o mínimo para texto pequeno é 4,5:1. Aparece em todas as resoluções.
- **Sugestão:** escurecer essa cor (ou usar a mesma variável dos outros rótulos). Conferir também as cores das outras regiões, porque a cor é calculada por região.

#### M6. ARIA inválido em botões de rádio do Perfil — **corrigido**
- **Onde:** Perfil, botões `data-periodo-p` ("por dia", "por semana", "por mês")
- **Evidência (axe, "critical"):** `role="radio"` com `aria-selected`. O atributo não é permitido nesse papel, e o estado já está em `aria-checked`.
- **Impacto:** leitores de tela podem anunciar estados errados.
- **Sugestão:** remover o `aria-selected` desses botões.

### Baixa / informativa

| # | Achado | Detalhe |
|---|---|---|
| B1 | Dependências do back com vulnerabilidades "altas" | `nodemailer` 7.0.13 (várias, incluindo injeção de comandos SMTP) e `prisma`/`@prisma/config`/`deepmerge-ts`. A exposição prática é baixa: o app só envia um e-mail de texto fixo para um endereço validado, e o Prisma é ferramenta de build. Mesmo assim, planejar atualização (`nodemailer` 10.x e `prisma` 7.x são mudanças grandes). |
| B2 | Cadastro revela e-mails já cadastrados | `POST /user` responde `User com esse email já existe` (409). O fluxo de "esqueci a senha" evita isso de propósito, então fica inconsistente. Criar conversa também revela se um `username` existe (404). |
| B3 | Detecção de crise só no navegador | O `CRISE.test()` roda no front e o texto de crise não é enviado. Quem chamar a API direto consegue publicar. A regra 7 do `AGENTS.md` pede que esse texto não seja publicado. Espelhar a regra na moderação do servidor (`moderacao.ts`). |
| B4 | Token da sessão em `localStorage` | Exposto a XSS. Hoje a renderização está escapada, então o risco é baixo. Cookie `httpOnly` seria mais seguro numa próxima etapa. |
| B5 | Cache de 1 ano em `/terra/*` | Os arquivos têm `immutable`. Se uma textura for trocada mantendo o nome, quem já visitou continua com a antiga. Usar nomes com versão ou hash. |
| B6 | Sem `manifest.webmanifest`, `apple-touch-icon`, `robots.txt` | Todos respondem 404 (a tarefa de PWA do `BACKLOG.md` ainda está aberta). |
| B7 | Navegação por hash durante a saída do mar | Por cerca de 1,9 s, uma segunda navegação é descartada e a URL fica diferente da tela. Caso de uso: voltar duas vezes do navegador rapidamente. Achado em teste automatizado, impacto pequeno. |
| B8 | Hierarquia de títulos na Luneta | `h4` ("40 atividades..." e cartões da comunidade) sem `h3` antes (axe, "moderate"). |
| B9 | `h2#perfil-nome` vazio | Quando a pessoa não tem nome, o título fica vazio para leitor de tela (axe, "minor"). |
| B10 | Palavra "vício" na tela de boas-vindas | `app.js:909`: "É assim que o vício deixa a vida por dentro". O `AGENTS.md` só proíbe "viciado" explicitamente. Confirmar com a equipe se "vício" é aceito. |
| B11 | Peso morto e duplicação | `public/terra/terra-dia.jpg` (1,2 MB) não é mais usado; `Pitch/` tem 25 MB de vídeos versionados; `docs/planeta-3d` e `docs/prototipo-original` repetem código; `globals.css` tem blocos repetidos (88 linhas longas idênticas, como `.capitulo` e `@keyframes pop`, `halo`, `flutua`). Já está previsto como F-12 no `BACKLOG.md`. |
| B12 | Itens operacionais | Tokens de recuperação expirados só são apagados quando a pessoa pede outro; limite de tentativas é em memória, por instância (documentado); `bcrypt` com custo 10 (12 é o mais recomendado hoje). |

### A observar (ligado às otimizações recentes)

- **Memória dos canvases da trilha em celulares fracos.** Cada capítulo agora tem dois canvases (chão e plantas). Estimo uns 54 MB no total em tela 2x (10 canvases de ~5 MB). É uma estimativa, não foi medida. Antes eram 5 canvases mais 5 cópias fora da tela, então deve ser parecido, mas vale observar em aparelhos de entrada.
- **Resolução reduzida durante a "queda" do planeta.** A imagem renderiza em 1,25x só durante o zoom e volta ao normal no fim. Não foi validado em celular real.

### Situação do repositório e do deploy

- A **produção está à frente da `main`**: o deploy saiu da `feat/debloat`, sem merge. Quem fizer deploy a partir da `main` desfaz essas mudanças.
- O `CORS_ORIGINS` de produção ainda lista a URL de um preview antigo (`terraforma-4xwbruzw2`), além do site. Inofensivo, mas vale limpar.
- O `next dev` reescreve um bloco no `terraforma-frontend/AGENTS.md`. Fica como mudança pendente local toda vez que o servidor de desenvolvimento roda.

## O que **não** foi verificado

- Testes que precisam de banco e do back rodando localmente: `test:e2e` do back e `conta.mjs`, `trilha-conta.mjs`, `boas-vindas.mjs` do front. Rodá-los contra produção criaria contas reais no banco.
- Login, cadastro e progresso da trilha de ponta a ponta no site oficial, pelo mesmo motivo.
- Telas que dependem de estado: lição (`atividade`), `fio`, `conversa`, `divida`, `recado`. Nenhuma verificação passou por elas.
- Erros de console nas telas de login e boas-vindas (a varredura de console não as abriu).
- Celulares reais (desempenho, memória, toque), leitor de tela (VoiceOver e TalkBack) e Lighthouse.
- Logs de produção do back e do front, envio real de e-mail, divergência entre migrações e o banco de produção, teste de carga.
- Contraste do tema escuro nas telas além das testadas (o axe rodou com o esquema escuro do navegador, e só a Luneta acusou contraste).

## Ordem sugerida de correção

1. **A1** configurar SMTP e corrigir o envio sem esperar em serverless.
2. **M3, M5, M6** (e B8, B9): acessibilidade, que é critério do edital. Mudanças de CSS e de marcação, sem lógica.
3. **M1** cabeçalhos de segurança do site.
4. **M2** desligar ou proteger `/api/eventos` e `/api/estado` em produção.
5. **M4** definir com a equipe a política de convite, bloqueio e denúncia nos chats.
6. **B1** planejar a atualização de `nodemailer` e `prisma`.
7. Demais itens de baixa gravidade conforme a prioridade do time.
