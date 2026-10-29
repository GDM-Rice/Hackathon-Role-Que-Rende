# Planeta 3D do Terraforma

Protótipo de referência: o artefato "Terraforma Protótipo 3D" (mesmo código de `src/planeta/globo.js`).

## Instalar

```bash
npm i three@0.169.0
```

Copie as pastas para o repositório:

- `src/planeta/globo.js` – o planeta: three.js puro, sem outra dependência.
- `src/componentes/GloboTerra.jsx` – a casca React.
- `../../public/terra/` – as texturas e as máscaras, cerca de 1,5 MB no total.
- `ferramentas/gerar_mascaras.py` – recria as máscaras a partir do Natural Earth, se precisar.
- `ferramentas/gerar_rios.py` – recria `brasil-rios.png`: um campo suave por bacia (Amazonas, São Francisco, Paraná, com afluentes) e a distância de cada ponto até a foz, que faz a água descer das nascentes. Uso: `python3 gerar_rios.py <pasta-natural-earth> public/terra` (precisa de numpy, scipy e Pillow).

## Usar

```jsx
<GloboTerra
  dias={estado.dias} mares={estado.mares} rios={estado.rios} tempestade={estado.tela === 'tempestade'}
  daltonismo={ajustes.daltonismo} movimentoReduzido={ajustes.movimentoReduzido} tema={ajustes.tema}
  style={{ height: 286 }}
  aoTocarRegiao={(k) => despachar({ tipo: 'abrirMapa', regiao: k })}
/>
```

No Mapa-Mundi, passe `zoomBrasil` e `regiao`. Na Maré, passe `respirar`.

## Regras do jogo

`estadoDoPlaneta()` em `globo.js` aplica as mesmas regras do canvas:

- as regiões ficam verdes em 7, 14, 30, 60 e 90 dias;
- o mar começa a limpar com 3 Marés e fica limpo com 10;
- cada rio volta com o seu marco;
- nada regride.

## O que o protótipo faz e o app ainda não faz

- **Um planeta só, que voa entre as telas.** O protótipo mantém um único canvas por baixo de todas as telas e anima centro e raio até o espaço de cada tela (`irPara`). No React, o mesmo efeito sai de um `<GloboTerra>` no layout raiz, mudando a posição pela tela atual. Se não der tempo, use um componente por tela: funciona, só não tem a transição.
- **Transições de tela.** A saída leva 180 ms e a entrada 320 ms, com escalonamento de 40 ms entre os itens. A curva é a mesma em tudo. Com movimento reduzido, nada anima.

## Desempenho

- **Uma esfera, um canvas.** Nuvens e mar são ruído calculado no shader, sem textura extra.
- **Em celular fraco:** se cair abaixo de 30 fps, troque `SphereGeometry(1, 160, 80)` por `(1, 96, 48)` e use `setPixelRatio(1)`.
- **Peso:** o three.js tem cerca de 160 KB comprimido. Carregue `GloboTerra` com `React.lazy` para não pesar a primeira tela.

## Declaração (edital 8.5)

- Textura da Terra: NASA Blue Marble, domínio público. Arquivo obtido pelo pacote npm `three-globe` (MIT).
- Máscara da água: mesma origem.
- Fronteiras estaduais e rios: Natural Earth, domínio público.
- Ruído simplex: Ashima Arts / Stefan Gustavson (MIT).
- three.js: MIT.
- Código escrito durante o evento com assistência de IA (Claude).
- Regras consultadas como referência, sem cópia de código:
  - `three-agent-skills` (MIT): desempenho;
  - `ui-ux-pro-max-skill` (MIT): movimento e acessibilidade.

## Respire com a Terra (oceano 3D)

`src/planeta/oceano.js` desenha um oceano sem nenhuma textura:
- ondas Gerstner calculadas no shader;
- céu de dia, de entardecer ou de noite (`ceuDaHora()` escolhe pela hora);
- camadas de nuvem que a câmera atravessa na descida.

API:
- `criarOceano(caixa, { ceu, movimentoReduzido, aoNevoa })` cria o oceano;
- `descer()` e `subir()` fazem a câmera atravessar as nuvens;
- `setFolego(0..1)` faz a maré subir e descer com a respiração;
- `criarSomDoMar('/terra/mar.mp3')` cria o som do mar. Chame `abrir()` dentro do toque que abre a tela (o navegador exige) e `volume(v, segundos)` para entrar e sair com fade.

Fluxo no protótipo:
1. O planeta dá zoom até o Atlântico.
2. A tela fica branca de névoa.
3. A câmera desce pelas nuvens até o mar.
4. Na volta, faz o caminho ao contrário.
5. Com movimento reduzido, o voo some e a troca de tela é direta.

Técnicas, com fontes conferidas:
- **Respiração lenta, 4 s para puxar e 6 s para soltar:** respirar abaixo de 10 vezes por minuto aumentou a variabilidade cardíaca e esteve ligado a menos ansiedade (Zaccaro et al., 2018, Frontiers in Human Neuroscience; Laborde et al., 2022, Neuroscience & Biobehavioral Reviews, meta-análise com 223 estudos).
- **Suspiro cíclico, com duas puxadas pelo nariz e uma soltada longa pela boca:** 5 minutos por dia, durante 28 dias, melhoraram o humor mais do que a meditação, num estudo exploratório com 108 pessoas (Balban et al., 2023, Cell Reports Medicine).
- **Surfar a vontade:** fumantes que observaram a vontade sem agir fumaram menos na semana seguinte (Bowen e Marlatt, 2009, Psychology of Addictive Behaviors). Em jogo, terapia com atenção plena reduziu a fissura (Melero Ventola et al., 2020).
- **Nota da vontade antes e depois, de 0 a 10:** serve como medida de resultado para o pitch (edital 9.2).

O projeto Godot "Infinite Ocean" não foi usado. Ele roda na engine Godot, não no navegador, e os céus que vêm nele são do pacote AllSky Free, com licença de outra loja. Para não ter problema com o edital (8.5), o oceano foi escrito do zero durante o evento.

### Som do mar (`public/terra/mar.mp3`)

- **De onde veio:** trecho de 5 minutos, em loop sem emenda, tirado do vídeo "30 min relaxing", baixado do YouTube pela equipe.
- **Atenção:** a licença desse áudio não foi conferida. Antes de apresentar, confirme a licença do canal e declare o áudio no edital (item 8.5).
- **Se não der para confirmar:** troque por um som de domínio público ou CC0 (o Freesound, por exemplo, permite filtrar por CC0), com o mesmo nome de arquivo.
- **Transição como queda contínua:**
  - o planeta aproxima cada vez mais rápido (`irPara(..., 'queda')`, zoom em escala logarítmica);
  - no fim do zoom, a vista do alto do oceano se mistura com o planeta durante 900 ms;
  - a câmera cai olhando para baixo, atravessa as nuvens como véus (no máximo 30% de névoa) e levanta o olhar só no fim;
  - na volta, `subir()` e depois `irPara(..., 'subida')`.
- **Som:** `abrir()` dentro do toque, em silêncio. `volume(0.28, 3.5)` só quando a câmera chega perto do mar. Um filtro passa-baixa deixa o som mais macio.

### Placas soltas (desligado)

O Brasil partido em placas que se juntam continua no código, mas desligado. Por padrão, o planeta só reverdece.
Para ligar de novo: `criarGlobo(caixa, { fragmentado: true })`.

### Bolha da respiração

- **Cores:** verde-água ao inspirar, verde-água claro no "mais um pouco" e azul-lavanda ao soltar.
- **Tamanho:** no fim de cada inspiração, a bolha encosta no anel.
- **Painéis sobre o mar:**
  - sem `backdrop-filter`, porque o desfoque em cima do WebGL animado piscava;
  - entram subindo em 560 ms e saem em 260 ms.
