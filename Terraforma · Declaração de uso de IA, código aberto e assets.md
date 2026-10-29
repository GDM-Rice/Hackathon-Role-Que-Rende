# Terraforma · Declaração de uso de IA, código aberto e assets

Oct 29, 2026 · @Igor

O Terraforma usou IA como apoio, bibliotecas de código aberto e assets de terceiros com licença compatível, e só dados públicos ou fictícios. Esta declaração atende aos itens 8.5 e 9.1 do Edital.

| Campo | Informação |
| --- | --- |
| Solução | Terraforma: app de bem-estar para quem quer parar de apostar |
| Evento | Game Jam Rolê que Rende – BBDW 2026, desafio Além da Aposta |
| Itens do Edital | 8.5 (IA, código aberto, assets e dados) e 9.1 (declaração exigida na etapa eliminatória) |
| Equipe | (nomes dos integrantes) |

## Uso de inteligência artificial

Usamos três ferramentas de IA como apoio. A ideia, as mecânicas, as decisões de produto e a revisão de todo o conteúdo são da equipe.

| Ferramenta | Empresa | Para quê |
| --- | --- | --- |
| Claude | Anthropic | Código do protótipo e do front em Next.js; textos da interface; arte e ilustrações; revisão das 90 perguntas do quiz; pesquisa e conferência de fontes |
| Gemini | Google | Modelagem e apoio ao 3D |
| ChatGPT | OpenAI | Primeira versão da trilha de aulas (mergulho no planeta e paisagem) |

Todo número mostrado no app tem fonte pública citada na própria tela, conferida pela equipe.

## Código aberto

Todas as bibliotecas têm licença aberta compatível e são usadas sem modificação.

| Biblioteca | Versão | Licença | Uso |
| --- | --- | --- | --- |
| three.js | 0.169.0 | MIT | Planeta 3D, oceano e satélites |
| Next.js | 16.4.3 | MIT | Estrutura do app web |
| React e React DOM | 19.3 | MIT | Interface |
| Fontsource (Fraunces, Atkinson Hyperlegible) | 5.3.0 | MIT (pacote); fontes na SIL Open Font License | Tipografia |
| Ruído simplex (webgl-noise) | — | MIT, Ashima Arts | Nuvens e água nos shaders |
| Playwright | — | Apache 2.0 | Só nos testes automáticos, fora do app |

## Assets de terceiros

Os vídeos da trilha são exibidos pelo player oficial do YouTube (incorporação), com crédito ao canal, sem download nem edição. As 90 perguntas, a ordem das aulas e a mecânica da trilha são autorais da equipe; os vídeos são curadoria.

### Vídeos da trilha

| Vídeo | Canal | Aulas | Uso |
| --- | --- | --- | --- |
| [Dívida de bets: quando a família paga a conta do vício (A Conta do Jogo)](https://www.youtube.com/watch?v=sLnR40D1g4Y) | Cabergs Saúde | 8 trechos | Player oficial do YouTube |
| [Como as bets prendem o apostador? Os perigos do jogo no celular (A Conta do Jogo)](https://www.youtube.com/watch?v=EmN2UWGXXb0) | Cabergs Saúde | 2 trechos | Player oficial do YouTube |
| [O cérebro no vício em jogo: por que é tão difícil parar? (A Conta do Jogo)](https://www.youtube.com/watch?v=IBMrjEnt_QI) | Cabergs Saúde | 3 trechos | Player oficial do YouTube |
| [Bets x Famílias: o impacto do vício pode levar a processo? (A Conta do Jogo)](https://www.youtube.com/watch?v=zNp_Dl_smYM) | Cabergs Saúde | 1 trecho | Player oficial do YouTube |
| [Eu vou levar – Série "Eu e meu dinheiro"](https://www.youtube.com/watch?v=FdTip4SdWMw) | Banco Central do Brasil | 1 trecho | Player oficial do YouTube |

### Imagens, mapas, som e fontes

| Asset | Origem | Licença |
| --- | --- | --- |
| Textura da Terra | NASA Blue Marble, via pacote three-globe | Domínio público (NASA); pacote MIT |
| Regiões, fronteiras e rios do Brasil | Natural Earth | Domínio público |
| Fontes Fraunces e Atkinson Hyperlegible | Google Fonts / Fontsource | SIL Open Font License 1.1 |
| Ícones, ilustrações e paisagem da trilha | Feitos pela equipe com apoio do Claude | Autorais |
| Modelo e cena 3D | Feitos pela equipe com apoio do Gemini | Autorais |
| Som do mar (música de fundo da respiração) | Trecho de [4K Relaxing Sound Of The Ocean Waves](https://www.youtube.com/watch?v=bBsKDEEWvY8), canal Sparkling Horizons (YouTube) | Uso livre declarado pelo autor ("No Copyright \| Free Download"), com crédito ao canal |

## Dados

O app usa só dados públicos e dados fictícios. Não acessa nenhum dado de cliente do Banco do Brasil, sistema interno, credencial institucional, conta bancária, CPF ou casa de aposta.

- **Pessoas, dívidas, posts e conversas da demonstração:** fictícios, criados pela equipe e marcados como tal na tela.
- **Números sobre apostas:** fontes públicas citadas na tela: OMS (2024), The Lancet Public Health (2024), Comsefaz via Agência Brasil, Ministério da Fazenda (SIGAP), DataSenado (2024), Radar Febraban/Ipespe (2024), CNC (2025).
- **Informação financeira e jurídica:** Lei 14.181/2021, Decreto 11.150/2022, STF (ADPFs 1.005, 1.006 e 1.097), Resolução CMN 4.881/2020, Banco Central (Pix noturno, Registrato), MP 1.394/2026.
- **Caminhos de ajuda:** Ministério da Saúde (Meu SUS Digital, RAPS, Disque Saúde 136), CVV 188 e SAMU 192.
- **O que a pessoa digita no app** (nome, motivo, valores, pessoas de confiança) fica no próprio celular na demonstração.

## Responsabilidade da equipe

A equipe revisou todo o conteúdo gerado com apoio de IA e responde por sua originalidade, autoria e veracidade, como pede o item 8.5. A solução foi desenvolvida entre 27/10/2026 e 29/10/2026, dentro do período do Edital.

O app não usa marcas do Banco do Brasil, da BBDW, de casas de aposta, clubes ou atletas, e não tem nenhuma mecânica de aposta, sorte ou dinheiro real (item 8.4).
