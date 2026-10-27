# Como contribuir

Guia rápido para a equipe trabalhar no Terraformar sem pisar no módulo dos outros.

## Preparar o ambiente

```bash
npm install
cp .env.example .env.local   # e preencha as chaves do Supabase (ver docs/contas.md)
npm run dev       # abre em http://localhost:5173
npm run dev -- --host   # para abrir no celular pela rede local
```

| Comando | Para quê |
|---|---|
| `npm run dev` | desenvolvimento com recarga automática |
| `npm test` | roda todos os testes uma vez |
| `npm run test:watch` | testes em modo observação |
| `npm run lint` | ESLint |
| `npm run build` | gera `dist/` com o service worker |
| `npm run preview` | serve o `dist/` (use para testar offline) |
| `npm run backend` | sobe o backend em `localhost:3001` |
| `npm run backend:dev` | backend que reinicia ao salvar |
| `npm run test:backend` | testes do backend |

Para usar a Luneta em desenvolvimento, rode **dois terminais**: `npm run backend` e `npm run dev`. O Vite encaminha `/api` para o backend.

## Git

- Trabalhe numa branch a partir de `dev`, de preferência uma por módulo: `git checkout -b 03-tela-mare`.
- Commits pequenos, em português, no formato `tipo: descrição` (`feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`).
- O integrador (módulo 02) faz o merge em `dev` e depois em `main`.
- Antes de pedir merge: `npm test && npm run lint && npm run build`.

## Quem mexe em quê

| Módulo | Pastas e arquivos |
|---|---|
| 01 Arte | `src/planeta/`, `src/assets/`, `public/icone-app.svg`, `public/icones.svg` |
| 02 Integrador | `src/estado/`, `src/api/`, `src/conta/`, `supabase/`, `backend/`, `src/App.jsx`, `src/main.jsx`, `src/componentes/`, `src/estilos/base.css`, configs |
| 03 Telas | `src/telas/BoasVindas.jsx`, `Inicio.jsx`, `Mare.jsx`, `Tempestade.jsx` |
| 04 Telas | `src/telas/Dividas.jsx`, `Tripulacao.jsx`, `VisaoFamiliar.jsx`, `Ajuda.jsx`, `Fontes.jsx` |
| 05 Game Design | `src/regras/`, `src/telas/Missao.jsx`, `Ajustes.jsx`, `src/estilos/tokens.css` |
| 06 Conteúdo | `src/conteudo/`, `src/demo/` |
| 07 Produto | `CREDITOS.md`, pitch |

Precisa mudar arquivo de outro módulo? Avise antes. Mudança no formato do estado passa pelo 02.

## Receitas

### Construir uma tela

As telas que ainda não existem usam `TelaEmConstrucao`. Substitua pelo conteúdo real seguindo este molde:

```jsx
import { useEstado } from '../estado/EstadoContext.jsx'
import { TEXTOS } from '../conteudo/conteudo.js'
import Topo from '../componentes/Topo.jsx'

export default function Missao() {
  const { estado, atualizar, irPara } = useEstado()
  const t = TEXTOS.missao
  return (
    <section className="tela" aria-labelledby="titulo-tela">
      <Topo />
      <h1 id="titulo-tela" tabIndex={-1} className="titulo-tela">{t.titulo}</h1>
      {/* ... */}
    </section>
  )
}
```

- Sempre `<Topo />` no começo: ele mostra "‹ Início", Maré e Ajuda.
- O `<h1 id="titulo-tela" tabIndex={-1}>` recebe o foco ao trocar de tela (leitor de tela).
- Tela nova precisa entrar em `src/telas/index.js` e em `TELAS` de `src/estado/estado.js`.

### Mudar o estado

```js
atualizar((e) => {
  e.mares.push({ data: e.hoje.data, antes: 8, depois: 4, gatilhos: ['jogo na TV'] })
})
```

`e` já é uma cópia, pode mudar à vontade. Nunca salve nada do planeta: ele é calculado.

### Mostrar o planeta

```jsx
import Planeta from '../planeta/Planeta.jsx'
import { propsDoPlaneta } from '../regras/regras.js'

<Planeta {...propsDoPlaneta(estado)} tamanho={220} />
```

### Chamar o backend

Nunca use `fetch` numa tela. Crie uma função em `src/api/` (siga `luneta.js`) e trate os dois erros:

```js
import { ErroDaApi } from '../api/cliente.js'
import { listarPosts } from '../api/luneta.js'

try {
  const posts = await listarPosts('familia')
} catch (e) {
  if (e instanceof ErroDaApi) mostrar(e.message, e.detalhes) // regra do backend (ex.: moderação)
  else mostrar(TEXTOS.luneta.semConexao)                     // SemConexao: aviso calmo, nunca erro técnico
}
```

Nos testes, simule o backend com `vi.stubGlobal('fetch', ...)` (veja `src/api/api.test.js` e `src/telas/Luneta.test.jsx`). Rota nova no backend precisa de teste em `backend/tests/`.

### Adicionar um texto

Todo texto mora em [`src/conteudo/conteudo.js`](../src/conteudo/conteudo.js), dentro de `TEXTOS.<tela>`. Afirmação de saúde, finanças ou lei precisa de uma entrada em `FONTES` e de `<LinhaFonte texto="..." idFonte="..." />` na tela.

Links externos começam com `status: A_CONFERIR`. Depois que alguém da equipe abrir e confirmar, troque para `CONFERIDO`. Link `A_CONFERIR` aparece como botão desligado.

### Adicionar um ícone

1. Desenhe em 24×24, traço 1,5 px, `stroke="currentColor"`.
2. Coloque como `<symbol id="i-nome">` em `public/icones.svg`.
3. Use: `<Icone nome="nome" />`. Botão só com ícone precisa de `aria-label`.

### Usar cores

Só tokens: classes do Tailwind (`bg-marinho`, `text-verde-texto`, `border-borda`) ou `var(--token)` no CSS. A paleta padrão do Tailwind está desligada de propósito. **Nada de vermelho.**

## Testes

- Ficam ao lado do arquivo: `regras.js` → `regras.test.js`.
- Toda regra nova do jogo precisa de teste, inclusive o de "nada regride" (veja `describe('monotonicidade')` em `regras.test.js`).
- Funções que dependem da data recebem `hoje` por parâmetro; nos testes use uma data fixa.
- Teste de tela: veja `src/App.test.jsx` (monta o app com `estadoDoRafael` e clica nos botões).

## Antes de dar por pronto

Checklist da seção 12 do [`CLAUDE.md`](../CLAUDE.md), resumido:

- [ ] Nada regride, sem moeda, sem vermelho, sem marcas.
- [ ] Só tokens; Fraunces só em títulos.
- [ ] Funciona de 320 a 480 px e com texto G.
- [ ] Teclado e leitor de tela funcionam; alvos ≥ 44 px; foco visível.
- [ ] Respeita animações reduzidas.
- [ ] Textos em `conteudo.js`, com fonte quando preciso.
- [ ] Funciona offline (a Luneta mostra o aviso de "precisa de internet").
- [ ] Nenhum dado pessoal vai para o backend.
- [ ] A jornada da demo continua passando.
- [ ] Tem teste.
