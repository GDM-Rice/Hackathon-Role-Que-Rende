# Como o protótipo virou Next.js (e como seguir)

## Fase 1 — feita: o protótipo roda inteiro dentro do Next

O protótipo era um HTML único com módulos ES. Para não reescrever tudo às vésperas da eliminatória e não perder nenhum comportamento, ele foi portado assim:

| Antes (HTML único) | Agora (Next.js) |
| --- | --- |
| `<style>` do index.html | `app/globals.css` (sem mudança de visual) |
| marcação do `<body>` | `prototipo/marcacao.js` (string HTML) |
| `<script type="module">` | `prototipo/app.js`, função `iniciar({ assets, aoEvento })` |
| `globo.js`, `oceano.js` | `prototipo/globo.js`, `prototipo/oceano.js` (three.js via npm) |
| `assets/` | `public/terra/` |
| Google Fonts | `@fontsource` (servidas pelo próprio app) |
| — | `components/Prototipo.tsx` monta a marcação e chama `iniciar()` no navegador |
| — | eventos para o backend: `lib/api.ts` + `docs/API.md` |
| — | rotas de exemplo `app/api/eventos` e `app/api/estado` |

O app abre na Boas-vindas. Cada tela também abre direto por hash: `/#inicio`, `/#financas`, `/#mare`, `/#troca`, `/#orbita`...
O painel da demonstração aparece ao lado do celular; para esconder, `NEXT_PUBLIC_DEMO=0`.

## Fase 2 — sugerida: trocar tela por tela por componentes React

Ordem que dá menos trabalho e mais ganho:

1. **Estado num store** (Zustand ou Context) com o formato de `EstadoUsuario` (`lib/tipos.ts`), carregado de `GET /estado`. Hoje o estado vive em variáveis dentro de `prototipo/app.js` (`s`, `perfil`, `fin`, `troca`, `ORBITA`).
2. **Planeta como componente persistente** no layout: `components/GloboTerra.jsx` (já existe no pacote do planeta, em `docs/planeta-3d/`) recebe `estado` e o "lugar" da tela. Ele não pode desmontar entre telas.
3. **Telas sem 3D primeiro:** Finanças, Hábitos saudáveis, Ajuda, Perfil, Órbita (lista). Cada `<section class="tela" id="tela-X">` de `marcacao.js` vira um componente, reaproveitando as classes de `globals.css`.
4. **Telas com câmera** por último: Respire com a Terra (usa `oceano.js` e a queda do `globo.js`) e Mapa-Mundi.
5. **Rotas:** dá para usar `app/(app)/financas/page.tsx` etc., mas as transições do planeta entre telas pedem um layout cliente compartilhado; manter navegação no cliente.

Regras que não podem se perder na migração estão em `docs/CONTEXTO-E-BACKLOG.md` (seção "Regras") e nas notas de cada tela do guia de design.
