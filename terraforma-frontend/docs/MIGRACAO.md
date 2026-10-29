# Como o app virou Next.js (e como seguir)

## Fase 1 (feita): o app roda inteiro dentro do Next

O app nasceu como um HTML único com módulos ES. Para não reescrever tudo e não perder nenhum comportamento, ele foi portado assim:

| Antes (HTML único) | Agora (Next.js) |
| --- | --- |
| `<style>` | `app/globals.css` (sem mudança de visual) |
| marcação do `<body>` | `prototipo/marcacao.js` (string HTML) |
| `<script type="module">` | `prototipo/app.js`, função `iniciar({ assets, aoEvento })` |
| `globo.js`, `oceano.js`, `trilha-paisagem.js` | `prototipo/*` (three.js via npm) |
| `assets/` | `public/terra/` |
| Google Fonts | `@fontsource` (servidas pelo próprio app) |
| — | `components/Prototipo.tsx` monta a marcação e chama `iniciar()` no navegador |
| — | eventos para o backend: `lib/api.ts` + `docs/API.md` |

O que saiu na passagem para produto: a moldura de celular, o painel de testes (avançar dias, Marés, rios) e os dados de exemplo (dívidas, pessoas da Órbita, trocas). O app começa vazio e ocupa a tela inteira; no computador, fica numa coluna central de até 480 px.

## Fase 2 (sugerida): trocar tela por tela por componentes React

1. **Estado num store** (Zustand ou Context) com o formato de `EstadoUsuario` (`lib/tipos.ts`), carregado de `GET /estado`. Hoje o estado vive em variáveis dentro de `prototipo/app.js` (`s`, `perfil`, `fin`, `troca`, `ORBITA`, `trilha`, `lun`) e em `localStorage` (ver `docs/API.md`).
2. **Planeta como componente persistente** no layout: o `criarGlobo()` de `prototipo/globo.js` recebe o estado e o "lugar" da tela. Ele não pode desmontar entre telas.
3. **Telas sem 3D primeiro:** Finanças, Ajuda, Perfil, Ajustes, Hábitos saudáveis, Órbita (lista), Luneta. Cada `<section class="tela" id="tela-X">` de `marcacao.js` vira um componente, reaproveitando as classes de `globals.css`.
4. **Telas com câmera** por último: Respire com a Terra (usa `oceano.js` e a queda do `globo.js`), Mapa-Mundi e Trilha (mergulho no planeta).
5. **Rotas:** as transições do planeta entre telas pedem um layout cliente compartilhado; manter a navegação no cliente.

As regras que não podem se perder estão em `docs/CONTEXTO.md`.
