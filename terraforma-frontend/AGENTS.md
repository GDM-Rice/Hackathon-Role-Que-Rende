# Guia para IA (e pessoas) que vão mexer neste front

Leia este arquivo inteiro antes de editar. O backlog com tarefas e critérios de aceite está em `docs/BACKLOG.md`.

## O que é

Terraforma: app de bem-estar para quem quer parar de apostar. Next.js 16 + React 19, mas **quase todo o app ainda é JavaScript puro** rodando dentro de um componente React (fase 1 da migração, ver `docs/MIGRACAO.md`). Idioma do produto e do código: português do Brasil.

## Comandos

```bash
npm install
npm run dev                 # http://localhost:3000
npm run lint                # tsc --noEmit
npm run build               # tem que passar antes de qualquer entrega
node testes/fumaca.mjs      # teste de fumaça (precisa do servidor rodando; ver o arquivo)
node testes/conta.mjs       # conta, senha e conversas reais (precisa também do back NestJS na 3001)
node testes/trilha-conta.mjs  # progresso da trilha salvo na conta (front + back NestJS)
```

Abrir uma tela direto: `http://localhost:3000/#financas` (lista em `const telas`, em `prototipo/app.js`).

## Mapa do código

| Arquivo | O que tem |
| --- | --- |
| `components/Prototipo.tsx` | injeta `MARCACAO` no DOM e chama `iniciar({ assets, aoEvento })`. Quase nunca precisa mudar |
| `prototipo/marcacao.js` | HTML de todas as telas, num template string. Cada tela: `<section class="tela" id="tela-X" data-tela="X" hidden>` |
| `prototipo/app.js` | o motor inteiro, dentro de `iniciar()`. Seções marcadas com `// ---------- Nome ----------` |
| `prototipo/globo.js` | planeta 3D (three.js): `criarGlobo()`, `estadoDoPlaneta()`, `REGIOES`, `LIMIARES` |
| `prototipo/oceano.js` | oceano 3D da respiração e som do mar |
| `prototipo/trilha-paisagem.js` | paisagem em canvas da trilha (biomas, fauna, flora) |
| `app/globals.css` | todo o visual. Tokens de cor no topo; layout do produto no fim |
| `lib/tipos.ts` | contrato de dados e lista `TIPOS_EVENTO` |
| `lib/api.ts` | cliente da API de eventos/estado com fila offline |
| `lib/backend.ts` | cliente do back NestJS (`terraforma-backend`): login, cadastro, senha, apagar conta, conversas, progresso da trilha (`sincronizarTrilha`). Chega no motor como `opcoes.backend` (`B` em `app.js`) |
| `app/api/*` | backend de exemplo em memória (`_memoria.ts` tem as regras de referência) |
| `dados/trilha-aulas.json` | conteúdo da trilha (cópia legível de `const AULAS` em `app.js`) |

### Seções de `prototipo/app.js` (procure pelo comentário)

| Seção | Funções principais |
| --- | --- |
| `estado` | `PADRAO`, `s` (dias, Marés, rios, ajustes) |
| `menu` | `ICONES`, `navDe()` (qual aba acende em cada tela), `DESTINO_NAV` |
| `derivados` | `estado()` (o que o globo recebe), textos do Início calculados a partir de `s` e `perfil` |
| `navegação com continuidade` | `irPara(tela)`: o roteador. Guarda de rotas, fecha folhas, chama `desenharX()` |
| `Respire com a Terra` | `TECNICAS`, `comecarSessao()`, `terminarSessao()` |
| `informação` | painel Info, `aviso(txt)` (toast) |
| `Órbita` | `ORBITA`, `desenharOrbita()`, `abrirPreciso()`, recados |
| `Finanças` | `FIN_PADRAO`, `fin`, `desenharFin()`, `desenharDivida()`, `verificarRios()` |
| `Boas-vindas` | login, entrada em 3 passos, `comecarMissao()` |
| `Ajustes e acessibilidade` | `aplicarAjustes()`, `desenharPerfil()`, apagar dados |
| `Trocar a aposta` | Hábitos saudáveis: `TROCAS`, `troca`, `desenharTroca()` |
| `Trilha` | `AULAS`, `TRILHA_NOS`, `desenharTrilha()`, lição/quiz no modelo do Duolingo |
| `Luneta` | `PLANETAS`, `POSTS_DEMO`, `CONVERSAS`, `MODERACAO`, `CRISE`, `desenharLuneta()`; conversas reais: `conversasApi`, `abrirConversaApi()`, `enviarMensagemApi()` (ids `api:<id>`) |
| `arrastar para rolar` | rolagem com mouse |
| `aplicar o estado` / `início` | `aplicar()`, rota inicial, `criarGlobo()` |

## Como as coisas funcionam

- **Helpers:** `$('#id')` e `$$('.classe')`. Sem jQuery.
- **Navegação:** só por `irPara('tela')` ou por hash. Botão que navega: `data-ir="tela"`. Tela nova = section na marcação + nome em `const telas` + (se tiver aba) entrada em `navDe()` + desenho chamado dentro de `irPara`.
- **Toast:** `aviso('texto')`. Botão que só avisa: `data-aviso="texto"` (não use para fingir funcionalidade).
- **Folhas (bottom sheets):** `<div class="folha-lun" hidden>` com `.folha-corpo`. Fechar ao sair da tela dentro de `irPara`.
- **Eventos para o backend:** `emitir?.('tipo', dados)` (ou `emitirTrilha`/`emitirLuneta`). Todo tipo novo entra em `TIPOS_EVENTO` (`lib/tipos.ts`), em `docs/API.md` e, se mudar estado, em `_memoria.ts`. Nunca mande nome ou telefone da Órbita, nem texto de crise.
- **Planeta:** nunca salve o visual. Mude `s.dias`, `s.mares`, `s.rios` e chame `aplicar()`; o globo recalcula com `estadoDoPlaneta()`.
- **Persistência hoje:** variáveis em memória + `localStorage` com prefixo `terraforma:` (lista em `docs/API.md`). Sempre dentro de `try {}`.
- **Tema:** `app.dataset.tema` = `claro`/`escuro`. Cor nova = token nos dois temas, nunca hexadecimal solto em componente novo.
- **Movimento reduzido:** `s.mov` e classe `.app.reduzido`. Toda animação nova respeita isso.

## Regras que não podem ser quebradas

1. **Nada regride.** "Apostei hoje" não tira dias, regiões, mar nem rios. Errar no quiz não tira nada.
2. **Rios só pelas Barreiras** (pix → Amazonas, bloqueador → São Francisco, combinado → Paraná). Valor de dívida nunca mexe no planeta.
3. **Nunca mostrar "quanto perdeu".** Valores são opcionais.
4. **Edital BBDW 2026:** nada que promova aposta; sem nome de casa de aposta, clube ou atleta; **sem marca do Banco do Brasil** nem dizer que o BB financia algo; sem integração com banco ou casa de aposta; dados de exemplo só fictícios.
5. **Fatos só com fonte verificada**, mostrada na tela (`<p class="fonte">`). Não invente número. Fontes atuais em `docs/CONTEXTO.md`.
6. **Linguagem:** acolhedora, frases curtas, sem julgamento. Nunca "viciado"; "substituição de lazer", nunca "dopamina"; "inspirado em", nunca "baseado em". Não citar programas de renegociação com marca.
7. **Crise:** texto com sinal de crise (`CRISE`) não é publicado e mostra CVV 188 / SAMU 192. Não remova esse caminho.
8. **Privacidade:** nome e telefone da Órbita ficam no aparelho. "Apagar meus dados" tem que apagar tudo.
9. **Acessibilidade (edital 8.2):** alvo de toque ≥ 44 px, foco visível, `aria-label` em botão só com ícone, contraste AA nos dois temas, nada que dependa só de cor.
10. **Sem notificações** para puxar a pessoa de volta. Metas fixas, nada sorteado.

## Armadilhas conhecidas

- `prototipo/app.js` tem linhas muito longas e muitos template strings. **Não rode Prettier no arquivo inteiro** (diff gigante); edite cirurgicamente.
- Variáveis declaradas com `const`/`let` mais abaixo no arquivo não existem durante a execução inicial do módulo. Funções chamadas só depois de `iniciar()` terminar podem usá-las.
- `marcacao.js` é um template string: crase e `${` dentro do HTML precisam de escape (`` \` `` e `\${`).
- O React em modo estrito monta duas vezes no desenvolvimento; `iniciar()` já se protege com `iniciado`.
- WebGL: em teste sem GPU, use Chromium com `--use-angle=swiftshader` (ver `testes/fumaca.mjs`).
- Vídeos da trilha: embutidos pelo player do YouTube; dentro do claude.ai viram link (`VIDEO_EMBUTIDO`).

## Antes de entregar

1. `npm run lint` e `npm run build` sem erro.
2. `node testes/fumaca.mjs` sem erro (todas as telas abrem, eventos chegam).
3. Olhar a tela mexida nos temas claro e escuro, em 390 px de largura e no computador.
4. Se criou evento, campo de estado ou número com fonte: atualizar `lib/tipos.ts`, `docs/API.md` e `docs/CONTEXTO.md`.
5. Marcar a tarefa em `docs/BACKLOG.md`.
