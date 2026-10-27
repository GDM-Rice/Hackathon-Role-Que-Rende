# Terraformar

App de celular (PWA, offline, sem back-end) para quem quer recomeçar depois das apostas online.
Cada dia sem apostar devolve vida a uma parte do planeta. **Você voltou. Isso conta.**

Game Jam Rolê que Rende · BBDW 2026 · desafio "Além da Aposta: caminhos para recomeçar".
## Documentação

| Documento | Conteúdo |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | produto, regras que nunca quebram, telas, design system |
| [`docs/arquitetura.md`](docs/arquitetura.md) | como o app funciona por dentro: estado, regras, planeta, PWA |
| [`docs/contribuindo.md`](docs/contribuindo.md) | ambiente, Git, quem mexe em quê, receitas e testes |
| [`docs/acessibilidade.md`](docs/acessibilidade.md) | o que já está pronto e como testar |
| [`CREDITOS.md`](CREDITOS.md) | declaração de IA, código aberto e assets (edital 8.5) |

## Rodar

```bash
npm install
npm run dev        # desenvolvimento
npm test           # testes (vitest)
npm run lint
npm run build      # gera dist/ com service worker (offline)
npm run preview    # serve o build: use para testar offline
```

Modo demo (Rafael no dia 21): abra com `?demo=1`.

## Estrutura

```
index.html                 shell, <main id="app">
vite.config.js             React + Tailwind + PWA (manifest e cache offline)
public/
  icone-app.svg            ícone do PWA (fonte dos PNGs em public/icons/)
  icones.svg               sprite de ícones de linha (<use href="/icones.svg#i-...">)
src/
  main.jsx                 inicia o app (e o modo demo)
  App.jsx                  desenha a tela de estado.tela (sem roteador)
  index.css                fontes, Tailwind e ligação dos tokens ao Tailwind
  estilos/tokens.css       tokens do design system + alto contraste, daltonismo, P/M/G  (05)
  estilos/base.css         componentes base: tela, cartão, botões, input, barra       (02)
  estado/estado.js         forma do estado, carregar/salvar/apagar, migrar            (02)
  estado/EstadoContext.jsx useEstado() → { estado, atualizar, irPara, apagarTudo }    (02)
  regras/regras.js         funções puras do planeta e das metas                      (05)
  planeta/planeta.js       aplica o estado ao SVG pelos ids                           (01)
  planeta/Planeta.jsx      componente React com o SVG inline                          (01)
  conteudo/conteudo.js     todos os textos, Ajuda, Fontes, detectarRisco              (06)
  demo/demo.js             dados sintéticos do Rafael                                 (06/02)
  componentes/             Topo, Icone, BarraProgresso, LinhaFonte, CartaoRisco...    (02)
  telas/                   uma tela por arquivo; index.js mapeia estado.tela          (03/04/05)
  assets/planeta.svg       molde do planeta (importado como texto, inline)            (01)
  assets/mare-ondas.svg    água da tela Maré                                          (01)
```

Testes ficam ao lado do arquivo testado (`*.test.js`).

## Convenções

- Tudo em português do Brasil: interface, nomes de domínio e comentários.
- Cores só pelos tokens (`bg-marinho`, `text-texto-apoio`, `border-borda`... ou `var(--token)`).
- Ações mudam o estado com `atualizar((e) => { ... })`; o planeta nunca é salvo, é calculado.
- Textos novos entram em `conteudo.js`.
