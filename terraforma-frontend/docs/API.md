# Contrato do backend

O front já chama este contrato. Hoje quem responde são as rotas de exemplo em `app/api/*`, que guardam tudo em memória e perdem os dados ao reiniciar. Para ligar o backend real, defina `NEXT_PUBLIC_API_URL` no `.env.local`; o front passa a chamar `${NEXT_PUBLIC_API_URL}/eventos` e `${NEXT_PUBLIC_API_URL}/estado`.

- Tipos em TypeScript: `lib/tipos.ts`
- Cliente com fila offline: `lib/api.ts`
- Regras de referência: `app/api/_memoria.ts` (`aplicarEvento`)
- Onde cada evento nasce no front: procure `__evento(` em `prototipo/app.js`

## Princípios

1. **O planeta nunca é salvo, é calculado.** O backend guarda só os dados (dias, Marés, rios, finanças...). O visual vem de `estadoDoPlaneta()` em `prototipo/globo.js`. Assim nada regride por erro.
2. **Nada regride.** Nenhum evento diminui dias, Marés ou rios. "Apostei hoje" (`tempestade`) só marca o dia.
3. **Dias contam sozinhos.** `diasDeRecomeco` = dias completos desde `inicio`. Calcular no servidor (meia-noite no fuso da pessoa), sem confiar no relógio do cliente. As regiões voltam com Sul 7, Sudeste 14, Centro-Oeste 30, Nordeste 60 e Norte 90 dias.
4. **Rios voltam pelas Barreiras.** Pix menor à noite → Amazonas; bloqueador de sites → São Francisco; combinar com alguém da Órbita → Paraná. Passos de dívida e valores **não** mexem em rio.
5. **Valores são opcionais e nunca entram em regra do planeta.** "Quanto você apostava?" só alimenta o texto "R$ longe das apostas" (dias × valor ÷ período).
6. **Dados sensíveis (LGPD, dado de saúde).** Mínimo necessário, criptografia em repouso, consentimento explícito para pesquisa (`pesquisa`), exclusão a pedido (Ajustes → "Apagar meus dados"). Na demo do edital, só dados fictícios (item 8.5). Nada de dado de cliente BB.
7. **Sem integração** com bancos, casas de aposta ou plataformas de pagamento (edital, Anexo 2).

## `POST /eventos`

Registra uma ação. O front envia na hora; sem rede, guarda numa fila local e reenvia depois. Todo evento traz `dados.em` (ISO). Idempotência sugerida: chave `(usuario, tipo, dados.em)`.

```json
{ "tipo": "sessao_respiracao", "dados": { "em": "2026-10-28T14:00:00Z", "tecnica": "Respiração lenta", "segundos": 180, "antes": 7, "depois": 4 } }
```

Resposta: `201 { "ok": true }`. Tipo desconhecido ou corpo inválido: `400 { "erro": "..." }`.

### Entrada e perfil

| tipo | dados | regra no servidor |
| --- | --- | --- |
| `entrada` | `comConta: false` | pessoa escolheu "Continuar sem conta": dados ficam só no aparelho |
| `login` | — | só contagem: a autenticação acontece no back NestJS (`POST /auth/login`) |
| `conta_criada` | — | idem (`POST /user`) |
| `perfil_criado` | `nome`, `motivo`, `valor` (número ou null), `periodo` (`dia`/`semana`/`mes`) | salva o perfil; zera o progresso: `inicio` = `em`, 1 dia, 0 Marés, rios secos |
| `pesquisa` | `participa` (bool) | consentimento de pesquisa; só números anônimos |
| `dados_apagados` | — | "Apagar meus dados" em Ajustes: apagar **tudo** desta pessoa no servidor (LGPD). O front já limpou o aparelho |
| `senha_esquecida` | — | o front já validou o e-mail digitado; o backend envia o link de nova senha (sem revelar se a conta existe) |

### Planeta

| tipo | dados | regra |
| --- | --- | --- |
| `sessao_respiracao` | `tecnica`, `segundos`, `antes`, `depois` (vontade 0 a 10) | `segundos >= 60` soma 1 Maré (máx. 10). Guardar antes/depois: é a medida de resultado |
| `tempestade` | — | marca o dia ("Apostei hoje"); não tira nada |
| `troca_registrada` | `troca`, `vontade` (0 a 10) | vontade ≤ 3 coloca a troca em "Minhas trocas" |

### Órbita (pessoas de confiança)

Nome e telefone ficam só no aparelho; os eventos não levam nenhum dos dois.

| tipo | dados | regra |
| --- | --- | --- |
| `orbita_pessoa_adicionada` | `comTelefone` (bool) | contagem (máx. 3 pessoas) |
| `orbita_pessoa_removida` | — | contagem |
| `preciso_de_voce` | — | a pessoa tocou em Mensagem ou Ligar no "Preciso de você": contagem anônima, é uma medida de resultado |

### Finanças

| tipo | dados | regra |
| --- | --- | --- |
| `divida_adicionada` | `tipo` (letra inicial ou `pessoa`), `comValor` (bool) | o evento é anônimo de propósito; a dívida completa vai por `PATCH /estado` |
| `passo_divida` | `divida`, `passo` (1 a 5) | passo só sobe; limpa o plano anterior |
| `plano_divida` | `divida`, `quando`, `onde` | salva o combinado ("hoje, Procon") |
| `barreira_ativada` | `barreira` (`pix`, `bloqueador`, `combinado`) | marca a barreira e liga o rio dela (ver princípio 4) |

### Trilha

Mesmo formato para os três: `capitulo` (0 a 4: Sul, Sudeste, Centro-Oeste, Nordeste, Norte), `indice` (círculo no capítulo: 0 aula 1, 1 quiz 1, 2 aula 2, 3 quiz 2, 4 aula 3, 5 quiz 3, 6 Na prática), `modulo`, `aula` (id ou null), `tipo`.

| tipo | dados extras | regra |
| --- | --- | --- |
| `trilha_aula` | — | marca o círculo como feito |
| `trilha_quiz` | `acertos` (de primeira), `total` | marca feito; errar nunca tira nada |
| `trilha_pratica` | `escolha` | marca feito |

O conteúdo das aulas e do quiz está em `dados/trilha-aulas.json` (e embutido em `prototipo/app.js`, `const AULAS`).

### Luneta (rede de apoio)

| tipo | dados | regra |
| --- | --- | --- |
| `luneta_post` | `id`, `constelacao`, `texto`, `revisao` | `revisao: true` = texto com sinal de crise: **não publicar**, mandar para a fila de moderação |
| `luneta_resposta` | `post`, `texto` | resposta num fio |
| `luneta_mensagem` | `conversa`, `texto` | mensagem na roda regional ou com o companheiro |
| `luneta_identifico` | `post` | reação "Me identifico" |
| `luneta_forca` | `para` | "Mandar força" para um marco de alguém |
| `luneta_mutirao` | `atividade` | entrou no mutirão da semana |
| `luneta_denuncia` | `post` | vai para a moderação |
| `luneta_bloqueio` | — | a lista de bloqueados vai por `PATCH /estado` |
| `luneta_planeta_editado` | — | nome, cor, região e "Mostrar meus dias" vão por `PATCH /estado` |
| `luneta_conversa_criada` | `pessoas` (total, com quem criou) | só contagem; a conversa e as mensagens ficam no back NestJS (`/chats`) |
| `luneta_alerta_crise` | `onde` (`mural`/`conversa`) | **sem texto, de propósito.** O front já mostrou CVV 188 e SAMU 192. Usar só para contagem e para priorizar moderação |

O front já bloqueia, antes de enviar, texto com link, valor em dinheiro, telefone e termos de aposta (casas, cassino, odds, palpite). As regras estão em `prototipo/app.js`, procure `const MODERACAO`; sinais de crise em `const CRISE`. O servidor precisa repetir essa validação: o front não é barreira de segurança.

## `GET /estado`

Devolve `EstadoUsuario` (ver `lib/tipos.ts`): `conta`, `perfil`, `progresso`, `ajustes`, `financas`, `orbita`, `trocas`, `trilha`, `luneta`.

## `PATCH /estado`

Atualização parcial do `EstadoUsuario`: ajustes, dívidas, pessoas da Órbita e recados, "Sobre você", planeta da Luneta, bloqueados. Validar que nada do `progresso` diminui.

## O que o front ainda guarda só no aparelho

Hoje o protótipo usa `localStorage`. Ao ligar o backend, estes dados passam a vir de `GET /estado`:

| chave | conteúdo |
| --- | --- |
| `terraforma:trilha-aulas` | progresso da trilha (`trilha.feitas`) |
| `terraforma:luneta` | planeta, região, mostrar dias, bloqueados, mutirão, força, posts, respostas, mensagens, reações, denúncias |
| `terraforma:orbita` | pessoas da Órbita (nome, relação, telefone) e recados. **Telefone e nome não vão para o servidor sem consentimento explícito** |
| `terraforma:som` | som ligado/desligado |
| `terraforma:eventos-pendentes` | fila offline de `lib/api.ts` |

O restante (perfil, dias, Marés, rios, finanças, ajustes) vive em variáveis dentro de `prototipo/app.js` (`s`, `perfil`, `fin`, `troca`, `ORBITA`) e some ao recarregar. Ligar isso a `GET /estado` é o primeiro passo da fase 2 (`docs/MIGRACAO.md`).

## Back NestJS (`terraforma-backend`)

Conta, senha e conversas entre pessoas já são reais. O front fala com ele por `lib/backend.ts` (URL em `NEXT_PUBLIC_BACKEND_URL`, padrão `http://localhost:3001`; o back precisa ter o endereço do front em `FRONTEND_URL`/`CORS_ORIGINS`). Token JWT em `localStorage` (`terraforma:token`), enviado como `Bearer`.

| tela do protótipo | rota |
| --- | --- |
| Login: Entrar | `POST /auth/login`, depois `GET /auth/me` |
| Login: Criar conta (nome de usuário, e-mail, senha ≥ 8) | `POST /user`, depois login |
| Login: Esqueci a senha | `POST /auth/forgot-password` |
| Link do e-mail (`/redefinir-senha?token=`) | `POST /auth/reset-password` |
| Abrir o app com sessão salva | `GET /auth/me` (401 = volta ao modo sem conta) |
| Ajustes: Apagar meus dados (com conta) | `DELETE /user/me` antes de limpar o aparelho |
| Luneta → Conversas: Suas conversas | `GET /chats`, `POST /chats` (`membros`: usernames) |
| Conversa real | `GET /chats/:id` (a cada 5 s com a tela aberta), `POST /chats/:id/messages` |

Texto com sinal de crise **não é enviado** para `/chats`: o front mostra CVV 188 e SAMU 192, como nas conversas da demo. O back também modera (links, valores, casas de aposta).

Os eventos (`/eventos`) e o estado (`/estado`) ainda **não** existem no NestJS; continuam nas rotas de exemplo do Next.

## Próximos endpoints sugeridos

- `GET /luneta/mural?regiao=&constelacao=`, `GET /luneta/conversas/:id`, `POST /luneta/moderacao/:id` (posts e conversas reais, hoje são fictícios no front).
- `POST /orbita/pessoas`, `POST /orbita/pessoas/:id/recados`: o recado é escrito pela própria pessoa, nunca gerado pelo app.
- `GET /metricas/resultado`: agregado anônimo (vontade antes/depois por técnica e por troca), só de quem aceitou a pesquisa.
- `DELETE /user/me` já apaga a conta e as conversas; quando `/estado` for para o NestJS, ele precisa apagar esse estado também.
