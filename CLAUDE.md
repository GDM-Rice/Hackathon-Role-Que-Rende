# CLAUDE.md · Terraformar

Contexto do projeto para o Claude Code. Leia inteiro antes de mexer no código. Tudo aqui vem do canvas **"Terraformar · estrutura do app"** (visão geral, missões, estilo, componente Planeta e as telas) e do **Edital do Rolê que Rende · BBDW 2026**. O que estiver marcado **[decidir]** ainda não foi fechado pela equipe: pergunte antes de assumir.

---

## 1. O que é

**Terraformar** é um app de celular (PWA, site responsivo, com login obrigatório, backup do progresso no Supabase e backend próprio em Node.js para a Luneta) para quem quer **recomeçar depois das apostas online**. O planeta chega castigado pelas apostas: o Brasil seco e partido em 5 regiões, o mar poluído, os rios secos. **Cada dia sem apostar devolve vida a uma parte dele.**

- Frase-assinatura: **"Você voltou. Isso conta."**
- Narrativa: **quem secou o planeta foram as apostas; a pessoa é quem recupera.** Nunca "olha o que você fez".
- Hackathon: Game Jam **Rolê que Rende · BBDW 2026**, desafio **"Além da Aposta: caminhos para recomeçar"** (Anexo 2 do edital).
- Idioma de toda a interface, do código de domínio e dos comentários: **português do Brasil** (`lang="pt-BR"`).

### Prazos e entregas (edital)
| Quando | O quê |
|---|---|
| 27/10 a partir das 15h30 | início do desenvolvimento |
| **29/10, 11h** | **código congelado**: etapa eliminatória com a banca |
| 29/10, tarde (16h–17h na programação; o edital também cita 17h) | pitch no palco (3 min, sem ler), só finalistas |

Entregar na eliminatória: **protótipo demonstrável**, **pitch deck em PDF** e **declaração de uso de IA, código aberto e assets de terceiros** (ver seção 11).

Critérios: Impacto e alinhamento 30% · Viabilidade 30% · Inovação 20% · Qualidade 10% (inclui regras de conteúdo) · Pitch 10%. **Bônus de até 5% por acessibilidade demonstrada**: acessibilidade é prioridade de produto, não acabamento.

---

## 2. Regras que nunca quebram

Se um pedido conflitar com isto, pare e avise.

**Produto**
1. **Nada regride.** Nenhuma região volta a secar, nenhum dia zera, nenhuma árvore morre, o mar não suja de novo. É a nossa diferença para o Forest.
2. **Metas fixas e conhecidas desde o dia 1.** Iguais para todos. Nada sorteado, nada surpresa, nenhum prêmio aleatório.
3. **Sem dinheiro e sem moeda.** O progresso é o planeta. "R$ X longe das apostas" é só texto e **não muda o planeta**.
4. **Sem notificações** para trazer a pessoa de volta. Sem ranking, sem vidas, sem sequência que quebra.
5. **Maré e Ajuda nunca têm limite** e ficam a um toque de qualquer tela, **inclusive sem login** (telas de entrar, cadastro e recuperação de senha também mostram os dois botões).
6. **Dados pessoais só com a conta da pessoa.** O login é obrigatório e o progresso (perfil, Marés, finanças, tripulação) tem **backup no Supabase**, protegido por RLS: cada conta só lê e grava a própria linha. O **celular das pessoas da tripulação nunca sai do aparelho** (é removido do backup). O backend da Luneta continua anônimo e nunca recebe dados da conta. "Apagar minha conta" apaga tudo no servidor. Na demo (`?demo=1`), tudo sintético, sem conta e offline.
7. **O planeta nunca é salvo, é calculado** a partir dos dados (funções puras). Assim nada regride por erro.
8. O valor das dívidas nunca entra na conta do progresso: quem deve mais não fica para trás. Pedir ajuda nunca é "pontuado".

**Edital (sob pena de desclassificação)**
- Proibido promover apostas, mesmo de forma indireta. Proibido integrar com plataformas de apostas, usar dinheiro real, cripto ou itens com valor monetário.
- Proibido usar marcas, logos ou nomes de casas de apostas, clubes ou atletas. **Não usar a marca/logo do Banco do Brasil nem da BBDW.**
- Linguagem respeitosa, sem estigmatizar. Informação de saúde, finanças ou leis tem que estar correta e **com fonte**.
- Só dados públicos, sintéticos ou da organização. Nunca dados de clientes do BB, sistemas internos ou credenciais.
- Tudo produzido durante o Game Jam. Bibliotecas e assets de terceiros só com licença compatível e listados na entrega.
- O app é **apoio complementar**, nunca substitui profissional. Isso aparece no rodapé da Ajuda.

**Fora do escopo (kit antigo, não reintroduzir):** náufrago, ilha, casa, conchas, álbum, pesca, garrafas e o personagem Coquinho (a conversa com o Coquinho fica para depois).

---

## 3. Stack e estrutura

O que está decidido: **PWA**, funciona offline, **com backend** (API Node.js em `backend/`), **sem roteador** (a tela atual é `estado.tela`), sem biblioteca para o mapa (o SVG é escrito à mão), dados no `localStorage`.

**Stack escolhida:** **React 19 + Vite 8 + Tailwind CSS 4**, JavaScript (JSX, sem TypeScript). PWA com `vite-plugin-pwa` (manifest + service worker Workbox, precache de tudo). Fontes self-hosted via `@fontsource` (entram no bundle). Testes com **Vitest + jsdom** (`npm test`).
**Backend:** Node.js puro (`node:http`, sem dependências) em `backend/`, porta 3001. Serve a **Luneta** (comunidade anônima), o conteúdo público (Ajuda, Fontes, Metas) e a demo. Em desenvolvimento o Vite encaminha `/api` para ele; no build, o endereço vem de `VITE_API_URL`. Detalhes em `docs/backend.md`.
- O front fala com o backend **só** por `src/api/`. Nenhuma tela chama `fetch` direto.
- Tudo que não é Luneta continua funcionando **sem o backend** (offline). Se a API não responder, a tela mostra um aviso calmo, nunca um erro.
**Contas e backup:** **Supabase** (`@supabase/supabase-js`). Auth cuida de cadastro, login, logout e recuperação de senha por e-mail; a tabela `progresso` guarda o backup do estado. SQL em `supabase/migrations/`, chaves em `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`). Detalhes em `docs/contas.md`.
> `lucide-react` está no `package.json` mas **não é usado**: os ícones vêm do sprite. **[decidir]** remover.

Estrutura:
```
index.html              shell, <main id="app">, carrega src/main.jsx
vite.config.js          React + Tailwind + PWA (manifest #042C53 / #F4F8FC, cache offline) + config do Vitest
public/
  icone-app.svg         ícone do PWA (PNGs 192/512/180 gerados em public/icons/)
  icones.svg            sprite de ícones de linha (<use href="/icones.svg#i-...">)
backend/
  src/servidor.js       abre a porta (npm run backend)                      (02)
  src/app.js            rotas HTTP, CORS, limites, erros                    (02)
  src/luneta.js         comunidade anônima, em memória                      (02)
  src/moderacao.js      moderação automática antes de publicar              (02/06)
  tests/*.test.js       testes do backend (npm run test:backend)
src/
  main.jsx              inicia; ?demo=1 carrega o Rafael                    (02)
  api/cliente.js        chamada HTTP única (base, timeout, token, erros)    (02)
  api/token.js          identificador anônimo do aparelho                   (02)
  api/luneta.js         funções da Luneta usadas pelas telas                (02)
  App.jsx               desenha a tela de estado.tela                       (02)
  index.css             fontes + Tailwind + @theme ligando os tokens        (02)
  estilos/tokens.css    variáveis da seção 8 (incl. alto contraste, daltonismo, P/M/G)  (05)
  estilos/base.css      tipografia e componentes base                       (02)
  estado/estado.js      forma do estado, carregar/salvar/apagar, migrar     (02)
  estado/EstadoContext.jsx  useEstado() → { estado, atualizar, irPara, apagarTudo }  (02)
  regras/regras.js      funções puras do planeta e das metas                (05)
  planeta/planeta.js    aplica o estado ao SVG pelos ids                    (01)
  planeta/Planeta.jsx   componente com o SVG inline                         (01)
  conteudo/conteudo.js  todos os textos, Ajuda, Fontes, detectarRisco       (06)
  demo/demo.js          dados do Rafael                                     (06/02)
  componentes/*.jsx     Topo, Icone, BarraProgresso, LinhaFonte, CartaoRisco, TelaEmConstrucao  (02)
  telas/*.jsx           um componente por tela; telas/index.js mapeia estado.tela  (03/04/05)
  assets/planeta.svg    molde do planeta (import ?raw, inserido inline)     (01)
  assets/mare-ondas.svg água da tela Maré                                   (01)
  **/*.test.js(x)       testes ao lado do arquivo testado
```

Convenções:
- Nomes de domínio em português, camelCase: `diasDeRecomeco`, `metaAtual`, `estadoDoMar`.
- Cada tela é um componente React que lê `useEstado()`; ações chamam `atualizar((e) => { ... })`, que muda uma cópia do estado, salva e redesenha. Navegar: `irPara('tela', ancora?)`.
- Cores pelo Tailwind ligado aos tokens (`bg-marinho`, `text-texto-apoio`, `border-borda`) ou `var(--token)`. A paleta padrão do Tailwind está desligada.
- Só a Luneta usa a rede, sempre por `src/api/`. O resto do app precisa abrir offline no palco. Para testar offline: `npm run build && npm run preview`. Para rodar com backend: `npm run backend` + `npm run dev`.
- Git: commits pequenos, mensagem em português, um módulo por branch quando possível. O integrador (02) faz o merge.

---

## 4. Telas e navegação

Valores de `estado.tela`: `boasVindas · inicio · mare · tempestade · missao · dividas · tripulacao · visaoFamiliar · ajuda · ajustes · fontes · luneta`
> O contrato do canvas lista as telas sem `tempestade`. **[decidir]** se Dia de tempestade é tela própria (sugerido) ou camada sobre o Início.

```
Boas-vindas (1ª vez) ──> Início
Início ──> Maré · Missão · Dívidas e Barreiras · Tripulação (──> Visão do familiar) · Ajuda · Ajustes
Início ──"Apostei hoje"──> Dia de tempestade
Início ──> Luneta (comunidade anônima, precisa de internet)
Todo "saiba mais" / "Sobre as informações" ──> Fontes
Maré e Ajuda: no topo de TODAS as telas
Telas internas: link "‹ Início" no topo (alvo ≥ 44 px)
```

Tamanho de referência do design: **390 × 844** (celular). No desktop, centralizar uma coluna de no máximo ~480 px; nada quebra em telas menores (320 px).

### 4.1 Boas-vindas · módulo 03
- Planeta no **dia 1**: Brasil seco e partido em 5, mar poluído.
- Título (Fraunces 28): **"As apostas secaram a terra. Você pode recuperá-la."**
- Apoio: "Cada dia sem apostar devolve vida a uma parte do Brasil. Nada do que você recuperar vai ser perdido."
- **Formulário** (cada campo com `<label>` visível, input 44 px de altura, borda `#C9D6E4`, raio 12):
  | Rótulo | Campo | Regra |
  |---|---|---|
  | Como quer ser chamado? | texto (`perfil.apelido`) | obrigatório |
  | Seu motivo para recomeçar | texto (`perfil.motivo`) | obrigatório, passa por `detectarRisco` |
  | Quanto apostava por semana, mais ou menos? (opcional) | numérico, `inputmode="numeric"` (`perfil.gastoSemanal`) | opcional, com opção **"Prefiro não dizer"** |
- Aviso: "Tudo fica só neste celular."
- Botão primário embaixo: **"Começar a missão"** (marca `perfil.inicio = hoje`).
- Modo demo: campos já preenchidos com o Rafael.

### 4.2 Início · módulo 03
- Topo: marca "Terraformar" (azul `#185FA5`, 16 bold) + botões só-ícone **Ajuda** e **Ajustes** (44×44, `aria-label`).
- Saudação Fraunces 26: "Boa tarde, Rafael." (bom dia / boa tarde / boa noite pela hora) + o motivo abaixo em texto de apoio.
- Planeta no estado atual (220 px).
- Cartão da meta: "Meta atual: **Centro-Oeste**" · "21 de 30 dias" · barra verde · "21 dias de recomeço · R$ 360 longe das apostas" (o valor só aparece se a pessoa informou o gasto).
- **Cartão escuro da Maré** (o elemento mais forte da tela, o único escuro): "A vontade apareceu?" / **"Respirar com a Maré"** + círculo claro com ícone de ondas.
- Atalhos em grade de 4: **Missão · Dívidas · Tripulação · Ajuda** (ícone + rótulo, altura ≥ 64).
- Link discreto embaixo: **"Apostei hoje · conte sem medo"** → Dia de tempestade.

### 4.3 Maré · módulo 03 (crise)
Fundo marinho `#042C53`, texto claro. Indicador de 5 passos no topo (`aria-label="Passo N de 5"`).
1. Vontade agora: escala **0 a 10**.
2. Respirar: **inspira 4 s, expira 6 s**, 3 ciclos na demo. A água (`mare-ondas.svg`) sobe ao inspirar e desce ao expirar. Texto grande Fraunces 56 "Inspire"/"Expire" + "Respiração 2 de 3 · 00:14". Botão **"Parar"** (contorno claro).
3. Vontade de novo: 0 a 10.
4. O que trouxe a onda? (gatilhos, múltipla escolha; ex.: "jogo na TV") **[decidir lista com 06]**.
5. Fim: "A vontade foi de 8 para 4" + o mar do planeta fica um pouco mais limpo (soma 1 em `mares`).
- Texto de apoio: "A vontade costuma subir, atingir um pico e diminuir. Respire com o mar enquanto ela passa."
- Se a vontade continuar alta no passo 3: mostrar atalhos **Tripulação** e **Ajuda**.
- Sem limite de uso. Linha "Fonte:" com saiba mais.
- Com movimento reduzido: água parada, só o texto e o contador mudam.

### 4.4 Dia de tempestade · módulo 03 (acolher sem julgar)
- Abre por "Apostei hoje" → confirmação curta → registra o dia (uma vez por dia).
- Fundo `#EEF1F5`. Planeta com **nuvens e chuva**; nada é removido.
- "Dia de tempestade registrado" · Fraunces 30: **"Você voltou. Isso conta."** · "As nuvens passam. Nada do que você recuperou foi perdido."
- Dois cartões verdes suaves: "Dias de recomeço **21** continuam aqui" · "Regiões verdes **2 de 5** Sul e Sudeste".
- "E agora?": **Fazer uma Maré** (primário) · **Avisar a [nome da tripulação]** · **Falar com um profissional** · **Só quero ficar quieto um pouco**.
- No dia seguinte o céu abre.
- **Nunca:** vermelho, alerta, contador zerando, tom de bronca.

### 4.5 Missão · módulo 05
- Título "Sua missão" · "Metas fixas, iguais para todos. Nada se perde."
- Seção "TERRA · DIAS DE RECOMEÇO": Sul 7 · Sudeste 14 · Centro-Oeste 30 · Nordeste 60 · Norte · Brasil inteiro 90.
  - **Feita**: fundo `#EAF3DE`, círculo verde com ✓, texto `#27500A`.
  - **Atual**: cartão branco com borda 2 px `#639922`, "21 de 30 dias" e barra.
  - **Futura**: borda tracejada `#A9B8C9`, texto de apoio.
- Seção "MAR, RIOS E CÉU": 3 cartões (Mar "Limpando · 9 de 10 Marés", Rios "1 de 3 · Amazonas", Céu "1 ave · Ana").
- Rodapé: próximo passo ("Próximo rio: São Francisco, ao fazer a primeira Barreira.").
- Celebração de meta: ver 5.3.

### 4.6 Dívidas e Barreiras · módulo 04 (autonomia financeira)
- Título "Suas dívidas".
- Cartão **"Primeiro o essencial"**: aluguel · luz · água · comida (com valores).
- "PRIMEIRA DA FILA (MAIOR JURO)": dívidas ordenadas por juros, **uma de cada vez**. Cartão com nome, saldo e juro ao mês + linha do tempo de passos:
  **Listei a dívida → Ligar para negociar → Renegociei → Paguei a parcela → Quitei**
  (feito = círculo verde ✓; atual = anel azul `#378ADD` 3 px e texto bold; futuro = anel cinza). Botão **"Fiz este passo"**.
- "Depois: ..." lista as próximas dívidas.
- "BARREIRAS" (checkboxes reais com `<label>`, 44 px): **Autoexclusão · Limite do Pix · Bloqueador · Combinar com alguém**.
- Onde negociar: Procon, consumidor.gov.br, Defensoria Pública; Lei 14.181/2021 (superendividamento).
- Cada passo devolve água a um rio (ver 5.2). Rodapé "Fonte: Lei 14.181/2021 · saiba mais · Valores fictícios na demo".

### 4.7 Tripulação · módulo 04 (vínculos)
- **1 a 3 pessoas de confiança**: nome, relação, celular (o celular fica só no aparelho).
- Botão grande **"Preciso de você"**: abre WhatsApp (`https://wa.me/<numero>?text=<mensagem>`) ou SMS (`sms:<numero>?body=<mensagem>`) com mensagem pronta **[texto com 06]**.
- Cada pessoa adicionada traz **uma ave** de volta ao céu do planeta.
- "Como minha tripulação me vê" → **Visão do familiar**: planeta, dias de recomeço, guia "como ajudar sem julgar" e recados prontos.
- Demo: o número vem do painel Demo e **nunca aparece na tela**.

### 4.8 Ajuda · módulo 04 (acesso à ajuda)
Ordem fixa, um cartão por serviço (o que é + botão de ligar/abrir + linha "Fonte:"):
1. **SAMU 192** (emergência)
2. **CVV 188** (apoio emocional, 24 h)
3. **CAPS e CAPS AD** (informações pelo **Disque Saúde 136**)
4. **Teleatendimento do SUS** (Meu SUS Digital)
5. **Jogadores Anônimos**
6. **Autoexclusão** das plataformas de apostas
- Ligar = `<a href="tel:188">`. Links externos só depois de conferidos: no `conteudo.js`, link com status `A_CONFERIR` vira **botão desligado** até a equipe conferir.
- Rodapé fixo: "O Terraformar é um apoio e não substitui um profissional."
- "Sobre as informações" → Fontes.

### 4.9 Ajustes · módulo 05
- Tamanho do texto: **P · M · G**
- **Alto contraste** · **Modo para daltonismo** · **Animações**: seguir o celular / reduzidas / normais
- **Som** · **Legendas dos sons**
- **Prévia ao vivo** (um mini planeta + texto) para a banca ver a troca na hora
- Privacidade: "Seus dados ficam só neste celular."
- **Apagar meus dados** (com confirmação em tela própria, sem `confirm()` do navegador)
- Sobre as informações → Fontes

### 4.10 Fontes · módulo 06
Lista de todas as fontes citadas no app (o que diz, de onde vem, link conferido). Todo "saiba mais" cai aqui, rolando até o item certo.

### 4.11 Luneta · comunidade anônima **[decidir módulo dono]**
Única tela que usa o backend (`src/telas/Luneta.jsx`, API em `docs/backend.md`).
- Planetas anônimos ("Planeta Jade-42 · 12 dias") conversam em **constelações**: Primeiros dias · Dívidas · Família · Tempestades.
- Publicar, responder, **"Me identifico"** e denunciar. Ordem cronológica.
- **Sem ranking e sem curtida pública:** só quem escreveu vê quantas pessoas se identificaram.
- Mostrar os dias de recomeço é **opcional** (caixa desmarcada por padrão).
- Moderação do backend barra links, valores, contatos e ofertas de aposta. A tela mostra o que tirar, sem bronca.
- Texto com sinal de risco à vida **não sai do aparelho**: mostra o cartão com CVV 188 e SAMU 192.
- Sem internet ou sem backend: "A Luneta precisa de internet. O resto do Terraformar funciona sem ela." + "Tentar de novo".
- Sem notificações. "Apagar meus dados" também apaga o identificador anônimo.

---

## 5. Estado e regras do jogo

### 5.1 Estado (persistido em `localStorage`, chave sugerida `terraformar:v1`)
Chaves do contrato: `tela · perfil · recomeco · mares · mapa · tripulacao · acessibilidade · hoje · metasVistas`.
Formas sugeridas (**o módulo 02 é dono do contrato**; ajuste aqui se mudar):
```js
{
  tela: 'inicio',
  perfil: { apelido: 'Rafael', motivo: 'Para voltar a dormir em paz', gastoSemanal: 120 /* ou null */, inicio: '2026-10-06' },
  recomeco: { tempestades: ['2026-10-20'] },            // datas ISO de "Apostei hoje"
  mares: [{ data, antes: 8, depois: 4, gatilhos: ['jogo na TV'] }],
  mapa: {                                                // [decidir] nome do contrato p/ finanças
    essenciais: [{ nome: 'Aluguel', valor: 900 }],
    dividas: [{ id, nome: 'Cartão de crédito', saldo: 2800, jurosMes: 12, passo: 1 /* 0..5 */, renegociada: false }],
    barreiras: { autoexclusao: false, limitePix: false, bloqueador: false, combinarComAlguem: false }
  },
  tripulacao: [{ id, nome: 'Ana', relacao: 'irmã', celular: '...' }],   // máx. 3
  acessibilidade: { texto: 'M', altoContraste: false, daltonismo: false, animacoes: 'seguir', som: true, legendas: true },
  hoje: { data: '2026-10-27', tempestade: false },
  metasVistas: ['sul', 'sudeste']                        // metas já celebradas
}
```
Removidos do contrato antigo (não usar): `conchas · casa · album · garrafas · areaIlha · coquinho`.

### 5.2 Regras (funções puras em `js/regras.js`, módulo 05)
Nenhuma função lê o relógio direto: receba `hoje` por parâmetro para testar e para o modo demo.

| Função | Retorna | Regra |
|---|---|---|
| `diasDeRecomeco(estado)` | número | dias **completos** desde `perfil.inicio` até ontem, menos os dias de tempestade. Conta sozinho à meia-noite. Como só conta dia terminado, o número de hoje nunca diminui. |
| `regioes(estado)` | `{sul, sudeste, centroOeste, nordeste, norte}` → `'seco' \| 'brotando' \| 'verde'` | metas: **Sul 7 · Sudeste 14 · Centro-Oeste 30 · Nordeste 60 · Norte 90**. Cumpridas = verde; a meta atual = brotando; as demais = seco. |
| `metaAtual(estado)` | `{ regiao, feitos, alvo }` | ex.: `{ regiao: 'centroOeste', feitos: 21, alvo: 30 }` |
| `estadoDoMar(estado)` | `'poluido' \| 'limpando' \| 'limpo'` | Marés feitas: 0–2 poluído · **3** limpando · **10** limpo. |
| `riosAtivos(estado)` | `{ amazonas, saoFrancisco, parana }` (bool) | **Amazonas**: 1º passo numa dívida · **São Francisco**: 1ª Barreira marcada · **Paraná**: 1ª dívida renegociada. |
| `aves(estado)` | 0–3 | uma por pessoa na tripulação. |
| `estadoDoCeu(estado)` | `'aberto' \| 'tempestade'` | tempestade só no dia em que marcou "Apostei hoje". |
| `deixouDeIrParaApostas(estado)` | número ou `null` | `gastoSemanal ÷ 7 × diasDeRecomeco`. `null` se não informou. Só texto. |
| `metasNovas(estado)` | ids | metas cumpridas que não estão em `metasVistas`. |

Regras de monotonicidade (escreva testes): para qualquer ação, `regioes`, `estadoDoMar`, `riosAtivos` e `aves` nunca pioram. Remover alguém da tripulação **[decidir]**: sugerido manter a ave (nada regride).

### 5.3 Celebração de meta
- Ao abrir o app com `metasNovas` não vazio: a região "se encaixa" de volta no Brasil e fica verde (animação curta, ≤ 600 ms).
- Tela calma: "**Sul recuperado** · 7 dias de recomeço" e a próxima meta. Botão para seguir.
- Uma vez por meta (grava em `metasVistas`).
- **Sem** confete, som de moeda, fogos ou prêmio surpresa.

### 5.4 `detectarRisco(texto)` · módulo 06
Todo texto livre (motivo, recados) passa por aqui. Se encontrar sinais de risco à vida, mostra na hora um cartão calmo com **CVV 188** e **SAMU 192** e o atalho para Ajuda. Não bloqueia, não julga, não salva o alerta. A lista de termos fica em `conteudo.js` **[06 escreve]**.

---

## 6. Componente Planeta · módulo 01

Arquivo-molde: `assets/planeta.svg` (viewBox `0 0 230 230`, estado do dia 1). `js/planeta.js` insere o SVG **inline** e só troca atributos pelos ids. Mantenha o SVG inline (não `<img>`) para o leitor de tela e para animar.

API sugerida: `desenharPlaneta(el, { verdes, mar, rios, aves, nuvens, tamanho })`, onde os valores vêm das funções da seção 5.

Camadas e ids:
| Camada | id | Estados |
|---|---|---|
| Mar | `#mar` | fill `#7C8C88` poluído · `#3E79A6` limpando · `#185FA5` limpo |
| Manchas | `#manchas` | opacity 1 · 0.35 · 0 |
| Região (grupo) | `#regiao-{norte,nordeste,centro-oeste,sudeste,sul}` | `transform` de afastamento quando seca/brotando; `translate(0 0)` quando verde |
| Forma da região | `#regiao-<r>-forma` | fill `#C48A3A` seca · `#B5C27A` brotando · `#639922` verde; stroke `#7A4A12` ou `#3B6D11` |
| Rachaduras | `#racha-<r>` | 0.9 só quando seca |
| Árvores | `#arvores-<r>` | 0 seca · 0.55 brotando · 1 verde |
| Rios | `#rio-amazonas`, `#rio-sao-francisco`, `#rio-parana` | seco: stroke `#8C6A3A`, dash `3 3`, 1.2 · correndo: `#378ADD`, contínuo, 2.4 |
| Aves | `#ave-1..3` | opacity 0/1 |
| Nuvens | `#nuvens` | opacity 1 só no dia de tempestade |

Afastamento das regiões secas: norte `translate(-5 -4)` · nordeste `translate(6 -4)` · centro-oeste `translate(-2 3)` · sudeste `translate(6 5)` · sul `translate(1 8)`. Ordem de recuperação: sul → sudeste → centro-oeste → nordeste → norte.

Acessibilidade: atualizar o `<title>` a cada mudança:
`"Planeta: 2 de 5 regiões do Brasil recuperadas, mar limpando, 1 de 3 rios correndo[, dia de tempestade]"`.
Seco e verde diferem em **textura** (rachaduras × árvores) e em **posição** (afastada × encaixada), não só na cor.

Quatro momentos de referência: Dia 1 (0 verdes, poluído, 0 rios, 0 aves) · Dia 21 demo (2, limpando, 1, 1) · Dia 45 (3, limpo, 2, 2) · Dia 90 (5, limpo, 3, 3).

O contorno atual é rascunho. A versão final usa a malha de regiões do **IBGE** (dado público), simplificada e convertida para SVG uma vez, **mantendo os mesmos ids**.

---

## 7. Direção de arte

**Estilo: vetor 2.5D suave, escrito à mão em SVG.** Escolhido porque é leve, nítido em qualquer tela, funciona offline, anima por região e o leitor de tela lê a descrição. Descartados: 3D/Three.js (pesado, canvas ilegível ao leitor de tela), realista e semi-realista com IA de imagem (inconsistente, pesado, não anima por região).

Ao gerar qualquer imagem, ilustração ou ícone para o app, gere **SVG** seguindo:
- Formas simples e arredondadas; **no máximo 3 tons do mesmo matiz** por forma (base, sombra, luz); luz do alto à esquerda.
- Contorno no tom mais escuro da própria cor, 1,5 px, **nunca preto**.
- Sem raster, sem 3D, sem fotorrealismo, sem gradiente chamativo, sem neon.
- Só a paleta da seção 8.
- **Tom:** calmo, adulto, esperançoso. É um app de saúde, não um cassino.
- **Proibido em arte:** moedas, fichas, cartas, roleta, confete, fogos, fogo ou fumaça, vermelho de alerta, emoji, marcas, times, atletas, logo do Banco do Brasil, texto dentro da imagem.
- SVG com significado: `role="img"` + `<title>`/`aria-label` descrevendo o estado. Decorativo: `aria-hidden="true"`.
- Ícones de interface: linha, traço 1,5 px, `stroke="currentColor"`, 24×24, no sprite `assets/icones.svg`. Ícone novo entra no sprite com id `i-<nome>`.

---

## 8. Design system (padrão para TODO o projeto)

### 8.1 Tokens (`css/tokens.css`)
```css
:root {
  /* Interface (azuis) */
  --marinho: #042C53;        /* títulos, botão primário, cartão da Maré, fundo da Maré */
  --azul: #185FA5;           /* marca, links, mar limpo */
  --destaque: #378ADD;       /* borda de botão secundário, passo atual, rio */
  --azul-claro: #E6F1FB;     /* chips, texto sobre escuro */
  --fundo: #F4F8FC;          /* fundo das telas */
  --superficie: #FFFFFF;     /* cartões */

  /* Texto (ambos ≥ 4,5:1 sobre branco) */
  --texto: #0F2340;
  --texto-apoio: #4A5D75;
  --texto-sobre-escuro: #B5D4F4;

  /* Linhas */
  --borda: #D9E3EE;          /* borda de cartão 1 px */
  --borda-input: #C9D6E4;
  --trilho: #E6EDF5;         /* fundo de barra de progresso, divisórias */
  --tracejado: #A9B8C9;      /* metas futuras, passos futuros */

  /* Progresso / verde */
  --verde: #639922;
  --verde-borda: #3B6D11;
  --verde-texto: #27500A;
  --verde-suave: #EAF3DE;

  /* Chips por pilar */
  --chip-crise-bg: #E6F1FB;     --chip-crise-tx: #042C53;
  --chip-financas-bg: #FAEEDA;  --chip-financas-tx: #633806;
  --chip-vinculos-bg: #EEEDFE;  --chip-vinculos-tx: #3C3489;
  --ocre-texto: #854F0B;

  --fundo-tempestade: #EEF1F5;

  /* Planeta */
  --terra-seca: #C48A3A;  --terra-racha: #7A4A12;
  --terra-brotando: #B5C27A;
  --terra-verde: #639922; --arvore: #27500A;
  --mar-sujo: #7C8C88;    --mar-mancha: #4A5363;  --mar-limpando: #3E79A6;  --mar-limpo: #185FA5;
  --rio: #378ADD;         --rio-seco: #8C6A3A;
  --nuvem: #8A94A6;

  /* Forma */
  --raio-input: 12px;  --raio-botao: 14px;  --raio-cartao: 16px;  --raio-cartao-g: 20px;  --raio-pilula: 999px;
  --alvo-min: 44px;
  --espaco-tela: 20px;  /* padding lateral das telas */

  /* Tipografia */
  --fonte-titulo: 'Fraunces', Georgia, serif;
  --fonte-texto: 'Atkinson Hyperlegible', system-ui, sans-serif;

  /* Movimento */
  --duracao: 400ms;   /* nunca acima de 600 ms, exceto a respiração da Maré */
}
```
Nunca use cor fora destes tokens. Nada de vermelho em lugar nenhum.

### 8.2 Tipografia
- **Fraunces** (400 e 600) só em títulos, saudações e frases-chave. **Atkinson Hyperlegible** (400 e 700) em todo o resto. Ambas OFL; servir de `/fonts` (offline).
- Escala (base 16 px, tudo em `rem` para P/M/G funcionar: `html { font-size: 100% | 112.5% | 125% }`):

| Uso | Fonte | Tamanho |
|---|---|---|
| Texto da respiração ("Inspire") | Fraunces 400 | 56 px |
| Frase "Você voltou. Isso conta." | Fraunces 400 | 30 px |
| Título de tela | Fraunces 600 | 28 px, line-height 1.15 |
| Saudação | Fraunces 400 | 26 px |
| Número de destaque | Atkinson 700 | 24 px |
| Título de botão grande | Atkinson 700 | 17–18 px |
| Corpo | Atkinson 400 | 15 px, line-height 1.45 |
| Apoio, legendas | Atkinson 400 | 13–14 px, `--texto-apoio` |
| Rótulo de seção | Atkinson 700 | 12 px, MAIÚSCULAS, letter-spacing 0.06em, `--texto-apoio` |

### 8.3 Componentes
- **Tela:** fundo `--fundo`, padding `20px 20px 24px`, coluna flex com `gap` 10–14 px. Ação principal empurrada para baixo (`margin-top: auto`).
- **Cartão:** branco, borda 1 px `--borda`, raio 16–20, padding 14–24, **sem sombra pesada**.
- **Cartão escuro:** `--marinho`, texto branco e `--texto-sobre-escuro`. **Um único por tela** (no Início, é a Maré).
- **Botão primário:** fundo `--marinho`, texto branco bold, raio 14–16, altura ≥ 48 (≥ 52 no CTA de tela inteira).
- **Botão secundário:** branco, borda 1 px `--destaque` (ou `--borda` em listas de opções), texto `--marinho`.
- **Botão só-ícone:** 44×44, branco, borda `--borda`, raio 12, `aria-label` obrigatório.
- **Atalho em grade:** altura ≥ 64, ícone 20 px colorido por pilar (Missão `--verde-borda`, Dívidas `--ocre-texto`, Tripulação `--azul`, Ajuda `--marinho`) + rótulo 12 px.
- **Chip/pílula:** raio 999, padding 4–6 × 12, 13–14 px bold, cores por pilar (8.1). Ex.: "Sul recuperado" em `--verde-suave`/`--verde-texto`.
- **Barra de progresso:** trilho `--trilho` 8–10 px, preenchimento `--verde`, raio 999. Sempre com o número em texto ao lado ("21 de 30 dias").
- **Input:** altura 44, borda `--borda-input`, raio 12, padding 0 12, rótulo bold 14 px acima (dentro de `<label>`).
- **Checkbox de barreira:** `<label>` inteiro clicável, altura ≥ 44, caixa 20 px.
- **Linha do tempo de passos:** feito = círculo `--verde` com ✓ branco; atual = anel 3 px `--destaque` + texto bold; futuro = anel 2 px `--tracejado` + texto de apoio.
- **Voltar:** link "‹ Início" 15 px `--texto-apoio`, sem sublinhado, alvo 44.
- **Linha de fonte:** "Fonte: ... · saiba mais" 12 px `--texto-apoio` no rodapé do cartão/tela.

### 8.4 Acessibilidade (vale bônus: demonstrar no pitch)
- HTML semântico: `<button>`, `<a href>`, `<input>` + `<label>`. Nunca clique em `<div>`/`<span>`.
- Alvos ≥ 44 px. Contraste de texto ≥ 4,5:1 (3:1 só para texto ≥ 24 px). Nada informado só por cor: sempre texto, ícone ou textura junto.
- Foco visível (contorno 2 px `--destaque` com offset 2). Ordem de Tab lógica.
- Leitor de tela: o botão da Maré e o planeta precisam ser lidos com sentido. Mudanças importantes (meta cumprida, passo feito) em `aria-live="polite"`.
- **Tamanho do texto P/M/G** via `font-size` do `html`; layout não pode quebrar em G.
- **Alto contraste** `[data-contraste="alto"]` **[decidir valores]**: sugerido fundo `#FFFFFF`, texto e bordas `#0F2340`, bordas 2 px, texto de apoio = `--texto`, cartão escuro mantém `#042C53`.
- **Modo para daltonismo** `[data-daltonismo]` **[decidir]**: sugerido reforçar texturas, trocar verde/ocre do planeta por azul/laranja de luminâncias bem diferentes e mostrar rótulos de texto nas regiões.
- **Animações:** respeitar `prefers-reduced-motion` quando "seguir o celular"; "reduzidas" desliga tudo menos o essencial; duração ≤ 600 ms.
- **Som** opcional, desligável, e todo som tem **legenda** quando "Legendas dos sons" está ligado.

---

## 9. Conteúdo e tom · módulo 06

- Calmo, adulto, acolhedor, direto. Frases curtas. Tratar por "você".
- Nunca culpar a pessoa; quem secou o planeta foram as apostas. Nunca usar "vício" como rótulo da pessoa, nem "fracasso", "recaída" como bronca, "você perdeu".
- Termos do app: **dia de recomeço**, **dia de tempestade**, **Maré**, **tripulação**, **Barreiras**, **missão**, **meta**.
- Frases fixas: "Você voltou. Isso conta." · "Nada do que você recuperou foi perdido." · "Tudo fica só neste celular." · "Apostei hoje · conte sem medo".
- Toda afirmação de saúde, finanças ou lei leva linha "Fonte:" e entra na tela Fontes. Links ficam `A_CONFERIR` até alguém da equipe abrir e confirmar.
- Todos os textos moram em `js/conteudo.js`, nunca espalhados pelas telas.

---

## 10. Dados da demo (sintéticos) e jornada do palco

Persona **Rafael**: motivo "Para voltar a dormir em paz", apostava ~R$ 120/semana.
Estado no dia 21: Sul e Sudeste verdes, Centro-Oeste brotando (21 de 30), mar limpando (9 de 10 Marés), 1 rio (Amazonas), 1 ave (Ana), "R$ 360 longe das apostas".
Finanças: essenciais aluguel R$ 900 · luz R$ 120 · água R$ 60 · comida R$ 600. Dívidas: **cartão de crédito R$ 2.800 a 12% a.m.** (passo atual: ligar para negociar) → cheque especial 8% → empréstimo da irmã 0%.

**Painel Demo** (escondido, ex.: 5 toques na marca ou `?demo=1`) **[decidir gatilho]**: preencher com o Rafael, pular para o dia 21, informar o número de WhatsApp de um colega (nunca mostrado), resetar.

Jornada no palco (70 a 90 s):
1. Boas-vindas: Brasil seco e partido → "Começar a missão".
2. Pula para o dia 21: Sul e Sudeste verdes, Centro-Oeste brotando.
3. Maré: vontade 8 → 3 respirações → 4 → gatilho "jogo na TV". O mar clareia (10ª Maré → limpo).
4. Apostei hoje: nuvens, nada regride. "Você voltou. Isso conta."
5. Dívidas: cartão primeiro, um passo feito, autoexclusão marcada. Um rio volta.
6. Tripulação: "Preciso de você" abre o WhatsApp de um colega da equipe.
7. Ajuda: CVV 188 e os outros caminhos, com fonte.
8. Acessibilidade: alto contraste, daltonismo, fonte grande e leitor de tela lendo o botão Maré.

Essa jornada **tem que funcionar offline** e sem erros no console. É o teste de aceitação principal.

---

## 11. Equipe e módulos

| Módulo | Responsável por |
|---|---|
| 01 Arte | componente Planeta (Brasil em 5 regiões, mar, rios, aves, nuvens), ícone do app, sons |
| 02 Integrador | estado, navegação, componentes, PWA, Git |
| 03 Telas | Boas-vindas, Início, Maré, Dia de tempestade |
| 04 Telas | Dívidas e Barreiras, Tripulação, Visão do familiar, Ajuda, Fontes |
| 05 Game Design | regras das missões, tela Missão, celebração, Ajustes e acessibilidade |
| 06 Conteúdo | todos os textos, `detectarRisco`, Ajuda, Fontes, dados do Rafael |
| 07 Produto | pitch deck (PDF), declaração de IA e assets, vídeo de reserva, pitch |

Ao trabalhar num módulo, não altere arquivos de outro sem avisar. Mudança no formato do estado passa pelo 02.

### Declaração de IA e assets (edital 8.5)
Mantenha um `CREDITOS.md` atualizado: ferramentas de IA usadas e para quê (inclui o Claude Code), fontes (Fraunces, Atkinson Hyperlegible · OFL), malha do IBGE, qualquer biblioteca ou som de terceiros com licença. O 07 usa esse arquivo na entrega.

---

## 12. Antes de dar uma tarefa por pronta

- [ ] Segue as regras da seção 2 (nada regride, sem moeda, sem vermelho, sem marcas).
- [ ] Usa só tokens da seção 8; Fraunces só em títulos.
- [ ] Funciona em 320–480 px de largura e com texto G.
- [ ] Teclado e leitor de tela funcionam; alvos ≥ 44 px; foco visível.
- [ ] Respeita animações reduzidas.
- [ ] Textos vêm de `conteudo.js`; afirmações têm fonte.
- [ ] Funciona offline (menos a Luneta); nenhum dado pessoal sai do aparelho.
- [ ] A jornada da demo (seção 10) continua passando.
- [ ] Crie testes para cada nova feature.