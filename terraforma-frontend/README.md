# Terraforma · front em Next.js

App de bem-estar para quem quer parar de apostar. Cada dia sem apostar devolve vida a um planeta: o Brasil começa seco e volta a verdejar; respirar quando a vontade vem limpa o mar; cuidar do dinheiro traz os rios de volta.
Game Jam Rolê que Rende – BBDW 2026, desafio Além da Aposta.

## Rodar

```bash
npm install
cp .env.example .env.local   # opcional
npm run dev                  # http://localhost:3000
```

Produção: `npm run build && npm start`. Node 20 ou mais novo. Testado com Next 16.4.3, React 19.3 e three.js 0.169.0.

## O que tem aqui

```
app/
  layout.tsx            fontes, preload das texturas
  page.tsx              monta o protótipo
  globals.css           todo o visual do protótipo
  api/eventos           rota de exemplo: recebe os eventos do app (memória)
  api/estado            rota de exemplo: estado do usuário (memória)
components/Prototipo.tsx   liga a marcação ao motor e os eventos à API
prototipo/
  app.js                motor do protótipo (telas, Finanças, Hábitos, Respire, Órbita...)
  marcacao.js           HTML das telas
  globo.js              planeta 3D (three.js)
  oceano.js             oceano 3D e som do mar
lib/
  tipos.ts              contrato de dados (EstadoUsuario, eventos)
  api.ts                cliente da API, com fila offline
public/terra/           texturas do planeta, máscaras do Brasil e som do mar
docs/
  API.md                contrato para o backend  ← comece por aqui
  MIGRACAO.md           como foi portado e como migrar tela a tela para React
  CONTEXTO-E-BACKLOG.md regras do edital, o que está pronto, backlog
  guia-de-design/       telas e quadros do guia (cópia), com notas por tela
  planeta-3d/           pacote do planeta: componente React, geradores das máscaras, leia-me
  prototipo-original/   o HTML único de referência (abre com qualquer servidor estático)
```

## Para o backend

O front já emite os eventos que importam (perfil criado, sessão de respiração com vontade antes/depois, tempestade, passo de dívida, plano, barreira, troca de hábito). Veja `docs/API.md`. Para apontar para o backend real: `NEXT_PUBLIC_API_URL=https://...` no `.env.local`.

## Créditos e licenças

- Textura da Terra: NASA Blue Marble (domínio público), via pacote three-globe (MIT).
- Regiões, fronteiras e rios do Brasil: Natural Earth (domínio público).
- Ruído simplex nos shaders: Ashima Arts (MIT). three.js (MIT).
- Fontes: Fraunces e Atkinson Hyperlegible (SIL Open Font License), via Fontsource.
- Som do mar (`public/terra/mar.mp3`): trecho de vídeo do YouTube enviado pela equipe. **Licença a conferir antes de publicar** (se CC BY, creditar o canal).
- Código e textos feitos com apoio de IA (Claude, da Anthropic). Declarar no formulário do edital (item 8.5).
