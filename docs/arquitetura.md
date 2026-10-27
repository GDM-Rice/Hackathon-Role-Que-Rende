# Arquitetura

Como o Terraformar funciona por dentro. Para regras de produto e design, veja o [`CLAUDE.md`](../CLAUDE.md).

## Visão geral

- **PWA com backend.** O app roda no navegador e os dados pessoais ficam no `localStorage` do aparelho. O backend (`backend/`) atende só a **Luneta**, a comunidade anônima. Detalhes em [`backend.md`](backend.md).
- **Sem roteador.** A tela atual é `estado.tela`; `App.jsx` escolhe o componente em `telas/index.js`.
- **O planeta nunca é salvo.** Ele é calculado a partir do estado por funções puras (`regras/regras.js`). Assim nada regride por erro.

```
                ┌──────────────┐
 localStorage ◄─┤  estado.js   │  carregar / salvar / migrar / apagar
                └──────┬───────┘
                       │
                ┌──────▼──────────────┐
                │  EstadoContext.jsx  │  useEstado() → { estado, atualizar, irPara, apagarTudo }
                └──────┬──────────────┘
                       │
        ┌──────────────▼───────────────┐
        │  App.jsx → TELAS[estado.tela]│
        └──────────────┬───────────────┘
                       │ lê o estado
          ┌────────────┼─────────────┐
          ▼            ▼             ▼
   regras.js     conteudo.js    componentes/
 (calcula o      (todos os     (Topo, Icone,
  planeta e       textos)       BarraProgresso...)
  as metas)
          │
          ▼
   Planeta.jsx → planeta.js (troca atributos do SVG pelos ids)
```

## Fluxo de uma ação

1. A tela chama `atualizar((e) => { e.mares.push(...) })`.
2. `atualizar` entrega uma **cópia** do estado (`structuredClone`) para a função mudar.
3. O React redesenha; um `useEffect` salva no `localStorage` e aplica os ajustes de acessibilidade no `<html>`.
4. Quem precisa do planeta chama `propsDoPlaneta(estado)` e passa o resultado para `<Planeta />`.

Navegar é só mudar a tela: `irPara('ajuda')`. Para cair num item da tela Fontes: `irPara('fontes', 'cvv')` (fica em `estado.ancora`).

## Estado

Definido em [`src/estado/estado.js`](../src/estado/estado.js). Chave no `localStorage`: `terraformar:v1`.

| Chave | O que guarda |
|---|---|
| `versao` | versão do formato (para migrar) |
| `tela` | tela atual |
| `perfil` | apelido, motivo, gasto semanal (ou `null`), data de início |
| `recomeco.tempestades` | datas ISO dos "Apostei hoje" |
| `mares` | Marés feitas: data, vontade antes/depois, gatilhos |
| `mapa` | essenciais, dívidas (com `passo` 0–5) e barreiras |
| `tripulacao` | até 3 pessoas de confiança |
| `acessibilidade` | texto P/M/G, alto contraste, daltonismo, animações, som, legendas |
| `hoje` | data de hoje (sempre recalculada ao abrir, nunca confiada do que foi salvo) |
| `metasVistas` | metas já celebradas |

`migrar()` completa campos que faltam sem apagar nada, então dá para acrescentar chaves sem quebrar quem já usa o app. Mudança no formato passa pelo módulo 02.

## Regras do jogo

Em [`src/regras/regras.js`](../src/regras/regras.js). Nenhuma função lê o relógio: todas aceitam `hoje` por parâmetro (por padrão `estado.hoje.data`).

| Função | Resultado |
|---|---|
| `diasDeRecomeco` | dias completos desde o início, menos tempestades passadas |
| `regioes` | cada região: `seco`, `brotando` ou `verde` |
| `metaAtual` | `{ regiao, feitos, alvo }` ou `null` com o Brasil inteiro verde |
| `estadoDoMar` | `poluido` (0–2 Marés), `limpando` (3–9), `limpo` (10+) |
| `riosAtivos` | Amazonas (1º passo numa dívida), São Francisco (1ª barreira), Paraná (1ª renegociação) |
| `aves` | uma por pessoa da tripulação, máximo 3 |
| `estadoDoCeu` | `tempestade` só no dia marcado |
| `deixouDeIrParaApostas` | valor em reais (só texto) ou `null` |
| `metasNovas` | metas cumpridas e ainda não celebradas |
| `propsDoPlaneta` | junta tudo o que o `<Planeta />` precisa |

Metas fixas: Sul 7 · Sudeste 14 · Centro-Oeste 30 · Nordeste 60 · Norte (Brasil inteiro) 90.

## Planeta

- O molde é [`src/assets/planeta.svg`](../src/assets/planeta.svg), importado como texto (`?raw`) e inserido **inline** para o leitor de tela e as animações.
- [`planeta.js`](../src/planeta/planeta.js) só troca atributos pelos ids (tabela na seção 6 do CLAUDE.md). Não cria nem remove elementos.
- Cores vão em `style` com `var(--token)`, porque `var()` não funciona em atributo de apresentação SVG. Isso faz o modo daltonismo mudar o planeta sem código extra.
- O `<title>` é reescrito a cada mudança ("Planeta: 2 de 5 regiões do Brasil recuperadas, mar limpando, 1 de 3 rios correndo").
- Pode haver mais de um planeta na tela: o componente troca o id do `<title>` por um `useId()`.

## Estilos

- [`estilos/tokens.css`](../src/estilos/tokens.css): tokens da seção 8 e as variações por atributo no `<html>`:
  `data-texto="P|M|G"`, `data-contraste="alto"`, `data-daltonismo="sim"`, `data-animacoes="seguir|reduzidas|normais"`.
- [`index.css`](../src/index.css): liga os tokens ao Tailwind com `@theme inline`. A paleta padrão do Tailwind está **desligada** (`--color-*: initial`), então `bg-red-500` não existe; use `bg-marinho`, `text-texto-apoio`, `border-borda`...
- [`estilos/base.css`](../src/estilos/base.css): classes dos componentes base (`.tela`, `.cartao`, `.botao--primario`, `.campo`, `.barra`, `.chip`...).

## Backend e a camada `src/api/`

```
 Tela Luneta ──► src/api/luneta.js ──► src/api/cliente.js ──fetch──► /api/... ──► backend/ (porta 3001)
                                             │
                                             └─ src/api/token.js (identificador anônimo no localStorage)
```

- **Só `src/api/cliente.js` chama `fetch`.** Ele monta o endereço, manda o token anônimo no cabeçalho `X-Planeta-Token`, corta a chamada em 8 s e transforma qualquer problema em um de dois erros:
  - `ErroDaApi`: o backend respondeu com uma regra (ex.: moderação `422`, com `detalhes` do que tirar);
  - `SemConexao`: sem internet, backend desligado ou resposta que não é JSON.
- **Endereço:** em desenvolvimento é `/api`, e o Vite encaminha para `localhost:3001` (`server.proxy` em `vite.config.js`). No build, defina `VITE_API_URL` (ver `.env.example`).
- **Service worker:** `/api` nunca é respondido pelo cache (`navigateFallbackDenylist`), e a API manda `Cache-Control: no-store`.
- **Identificador anônimo:** 32 caracteres aleatórios gerados no aparelho. O backend guarda só o hash. "Apagar meus dados" apaga o token, e o aparelho vira um planeta novo.
- **O que nunca vai para o backend:** perfil, motivo, finanças, Marés, tripulação e o estado do planeta. Os "dias de recomeço" só vão num post se a pessoa marcar.

## PWA e offline

Configurado em [`vite.config.js`](../vite.config.js) com `vite-plugin-pwa`:
- manifest (nome, cores `#042C53` / `#F4F8FC`, ícones em `public/icons/`);
- service worker Workbox com precache de JS, CSS, HTML, SVG, PNG e fontes.

O service worker só existe no build. Para testar offline: `npm run build && npm run preview`, abrir uma vez, desligar a rede e recarregar. Tudo funciona, menos a Luneta, que mostra o aviso de "precisa de internet".

## Modo demo

`?demo=1` na URL carrega o Rafael no dia 21 ([`demo/demo.js`](../src/demo/demo.js)). As datas são relativas a hoje, então a demo funciona em qualquer dia. O gatilho do painel Demo ainda está **[decidir]**.
