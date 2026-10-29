# Terraforma · front

App de bem-estar para quem quer parar de apostar. Cada dia sem apostar devolve vida a um planeta: o Brasil começa seco e volta a verdejar por região; respirar quando a vontade vem limpa o mar; ativar Barreiras nas finanças traz os rios de volta.

Game Jam Rolê que Rende – BBDW 2026, desafio Além da Aposta.

## Rodar

```bash
npm install
cp .env.example .env.local   # opcional
npm run dev                  # http://localhost:3000
```

Produção: `npm run build && npm start`. Node 20 ou mais novo. Testado com Next 16.4.3, React 19.3 e three.js 0.169.0.

O app abre no login. Cada tela também abre direto por hash: `/#inicio`, `/#trilha`, `/#luneta`, `/#ajuda`, `/#financas`, `/#perfil`...

## Para quem vai editar o front (pessoa ou IA)

Leia `AGENTS.md` (mapa do código, regras, armadilhas) e pegue tarefas em `docs/BACKLOG.md`. Depois de mexer: `npm run lint`, `npm run build` e `node testes/fumaca.mjs`.

## Para o backend: comece aqui

1. `docs/API.md`: contrato (eventos, estado, regras de negócio, o que ainda fica no aparelho).
2. `lib/tipos.ts`: tipos do estado e dos eventos.
3. `app/api/_memoria.ts`: implementação de referência das regras (em memória).
4. `docs/CONTEXTO.md`: regras do produto e do edital que não podem ser quebradas, e pendências.

Para apontar para o backend real: `NEXT_PUBLIC_API_URL=https://...` (eventos e estado) e `NEXT_PUBLIC_BACKEND_URL=https://...` (back NestJS: conta, senha e conversas) no `.env.local`. Detalhes em `docs/API.md`.

## Estrutura

```
app/
  layout.tsx              fontes, preload das texturas, cor do tema
  page.tsx                monta o app
  globals.css             todo o visual (tokens de cor claro/escuro no topo)
  api/eventos             rota de exemplo: recebe os eventos (memória)
  api/estado              rota de exemplo: estado do usuário (memória)
components/Prototipo.tsx  liga a marcação ao motor e os eventos à API
prototipo/
  app.js                  motor: telas, navegação, Finanças, Trilha, Luneta, Respire, Órbita, Ajustes
  marcacao.js             HTML de todas as telas
  globo.js                planeta 3D (three.js)
  oceano.js               oceano 3D e som do mar
  trilha-paisagem.js      paisagem viva da trilha (canvas)
lib/
  tipos.ts                contrato de dados
  api.ts                  cliente da API, com fila offline
dados/trilha-aulas.json   conteúdo da trilha: 15 aulas, 90 perguntas revisadas
testes/fumaca.mjs         teste de fumaça (todas as telas, eventos, sem erro de JS)
AGENTS.md / CLAUDE.md     guia para IA que for editar o código
public/terra/             texturas do planeta, máscaras do Brasil e som do mar
docs/
  API.md                  contrato para o backend
  BACKLOG.md              tarefas do front com critério de aceite
  CONTEXTO.md             regras, telas, fontes dos números, pendências
  MIGRACAO.md             como o app foi portado e como migrar tela a tela para React
  ferramentas/            scripts que geram as máscaras de regiões e rios
```

`prototipo/app.js` e `prototipo/marcacao.js` foram gerados a partir do protótipo de HTML único. Daqui em diante, edite direto neles (ou siga a fase 2 de `docs/MIGRACAO.md`).

## Créditos e licenças

- Textura da Terra: NASA Blue Marble (domínio público), via pacote three-globe (MIT).
- Regiões, fronteiras e rios do Brasil: Natural Earth (domínio público).
- Ruído simplex nos shaders: Ashima Arts (MIT). three.js (MIT).
- Fontes: Fraunces e Atkinson Hyperlegible (SIL Open Font License), via Fontsource.
- Vídeos da trilha: 5 vídeos do YouTube, tocados pelo player oficial (embed), sem cópia. **Canal e licença de cada um a declarar** (edital, item 8.5).
- Som do mar (`public/terra/mar.mp3`): trecho de vídeo do YouTube enviado pela equipe. **Licença a conferir antes de publicar.**
- Código e textos feitos com apoio de IA (Claude, da Anthropic). Declarar no formulário do edital (item 8.5).
