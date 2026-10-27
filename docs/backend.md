# Backend (API opcional)

Pequena API em Node.js para o que **não dá para fazer só no celular**: a comunidade anônima (Luneta) e o conteúdo público com fonte conferida. O app continua funcionando **offline e sem ela**.

> **[decidir com o 02]** O `CLAUDE.md` diz "sem back-end" e "dados só no celular". Este backend respeita a regra: ele **nunca recebe** perfil, finanças, Marés nem tripulação. Só guarda o que a pessoa escolhe **publicar**, de forma anônima. Se a equipe preferir manter o app 100% sem servidor, basta não rodar o backend: nada no front depende dele.

## Como rodar

```bash
npm run backend          # http://localhost:3001  (GET /api/saude)
npm run backend:dev      # reinicia ao salvar
npm run test:backend     # testes (node:test, nada para instalar)
npm run dev              # o Vite encaminha /api para a porta 3001
```

Precisa de Node 22 (o mesmo do projeto). **Zero dependências novas**: usa só `node:http`, `node:crypto` e `node:test`.

Variáveis de ambiente (todas opcionais): `PORT`, `CORS_ORIGEM`, `SEMEAR=0` (começa sem posts fictícios), `MODERACAO_TERMOS_EXTRAS` (termos a barrar, separados por vírgula; é onde entram nomes de casas de apostas, que ficam fora do código por causa do edital 8.4).

## Rotas

Respostas em JSON. Erros: `{ "erro": { "codigo", "mensagem", ... } }`.

| Método e rota | O que faz |
|---|---|
| `GET /api/saude` | Confere se o servidor está de pé |
| `GET /api/metas` | Metas fixas (Sul 7 · Sudeste 14 · Centro-Oeste 30 · Nordeste 60 · Norte 90), Marés e tripulação máxima |
| `GET /api/ajuda` | Tela Ajuda, na ordem fixa. Link não conferido vem com `ativo: false` |
| `GET /api/fontes` | Tela Fontes, com `verificada` |
| `GET /api/demo/rafael?hoje=AAAA-MM-DD` | Estado sintético do Rafael no dia 21 |
| `GET /api/luneta/constelacoes` | Tópicos da Luneta |
| `GET /api/luneta/posts?constelacao=` | Posts, do mais novo para o mais antigo |
| `POST /api/luneta/posts` | Publica `{ constelacao, texto, dias? }` |
| `POST /api/luneta/posts/:id/respostas` | Responde `{ texto }` |
| `POST /api/luneta/posts/:id/identifico` | "Me identifico" |
| `POST /api/luneta/posts/:id/denuncias` | Denuncia `{ motivo? }` |

**Identidade anônima.** O aparelho gera um texto aleatório (16 a 64 caracteres `A-Za-z0-9_-`), guarda no `localStorage` e manda no cabeçalho `X-Planeta-Token`. É obrigatório para escrever e opcional para ler. O servidor guarda só o **hash** dele; o nome do planeta ("Turquesa-27") sai desse hash.

## Regras do produto que o backend garante

- **Sem ranking e sem curtida pública.** Ordem cronológica. O total de "Me identifico" só aparece para quem escreveu o post.
- **Moderação antes de publicar.** Barra links, valores, telefones, e-mails, @usuários e ofertas de aposta (422, com `motivos` e texto sem bronca).
- **Risco à vida.** O texto **não é publicado nem guardado**. A resposta é `200` com `publicado: false`, `risco: true` e `ajuda` (SAMU 192 e CVV 188). **[decidir com o 06]** o `CLAUDE.md` diz que `detectarRisco` "não bloqueia"; na Luneta pública, optamos por não publicar sem revisão humana.
- **Denúncia.** 3 pessoas diferentes escondem o post até revisão (não apaga).
- **Sem notificação.** O servidor nunca avisa ninguém.
- **Limites.** 20 escritas por minuto por aparelho (100 por IP), corpo de até 10 KB, 500 posts na memória.
- **Privacidade.** Nada de IP, token ou corpo em log. `Cache-Control: no-store`.

## O que fica de fora (de propósito)

- **Banco de dados.** Tudo fica na memória e some ao reiniciar. Um piloto real precisa de banco e de **moderação humana** (já existe `pendentesDeRevisao()` para alimentar uma fila, sem rota pública porque exigiria login de moderador).
- **Pesquisa/medição de impacto.** "Participar da pesquisa" segue como visão futura: precisa de aprovação ética e consentimento, então não há rota que receba métricas.
- **Cálculo do planeta no servidor.** O planeta é calculado no celular; enviar o estado ao servidor quebraria "dados só no celular".

## Onde está cada coisa

```
backend/src/
  servidor.js        abre a porta (npm run backend)
  app.js             servidor HTTP, rotas, CORS, limite, erros
  config.js          configurações e variáveis de ambiente
  luneta.js          comunidade anônima (posts, respostas, denúncias), em memória
  moderacao.js       moderação automática (funções puras)
  limitador.js       limite de ações por minuto
  conteudoPublico.js monta Ajuda, Fontes e Metas a partir de conteudo.js e regras.js
  mensagens.js       textos de erro e moderação  [06 revisar o tom]
  erro.js            ErroApi (status + código + mensagem)
backend/tests/       *.test.js (58 testes)
```
