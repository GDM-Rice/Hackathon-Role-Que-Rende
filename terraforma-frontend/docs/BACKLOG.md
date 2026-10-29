# Backlog do front

Para quem (pessoa ou IA) pega uma tarefa: leia `AGENTS.md` antes. Cada item diz **onde** mexer e **como saber que terminou**. Ao terminar, troque `[ ]` por `[x]` e escreva a data.

Prioridades: **P0** bloqueia o uso real · **P1** qualidade de produto · **P2** depois · **Ideia** só com fonte e decisão da equipe.

---

## P0 · Ligar ao backend

### F-01 [ ] Carregar o estado do servidor ao abrir
- **Onde:** `prototipo/app.js` (seções `estado`, `Finanças`, `Órbita`, `Trilha`, `Luneta`, `início`) e `lib/api.ts` (`carregarEstado`).
- **O quê:** antes do `irPara` inicial, chamar `GET /estado` e preencher `s` (dias, Marés, rios, ajustes), `perfil`, `fin`, `troca.minhas`, `ORBITA`, `trilha`, `lun`. Sem rede ou sem conta: usar o que está no aparelho.
- **Pronto quando:** recarregar a página mantém tudo; com a rede desligada o app abre do mesmo jeito; `node testes/fumaca.mjs` passa.

### F-02 [ ] Salvar mudanças com `PATCH /estado`
- **Onde:** onde hoje só muda variável: dívidas (`salvar-divida`, "Tirar da lista"), Ajustes (`aplicarAjustes`), Perfil (nome, motivo, valor, "Sobre você"), planeta da Luneta, bloqueados.
- **Pronto quando:** cada uma dessas ações gera um `PATCH` com só o trecho alterado e sobrevive a recarregar. Progresso nunca é enviado para baixo (ver `docs/API.md`, princípio 2).

### F-03 [ ] Dias contam sozinhos
- **Onde:** seção `derivados` / `estado`.
- **O quê:** hoje `s.dias` só muda na entrada. Calcular `dias = dias completos desde progresso.inicio` (o servidor manda; o front só exibe). Virada à meia-noite com o app aberto atualiza o planeta.
- **Pronto quando:** com `inicio` de 8 dias atrás, o Início mostra 8 dias e o Sul verde; nada regride depois de "Apostei hoje".

### F-04 [ ] Login, criar conta e "Esqueci a senha" de verdade
- **Onde:** seção `Boas-vindas` (`form-login`, `#esqueci`, `#sem-conta`).
- **O quê:** hoje só valida formato. Chamar a autenticação do backend, mostrar erro em `#erro-login`, estado de carregando no botão. "Continuar sem conta" segue local. Oferecer "Criar conta" depois, em Perfil, levando os dados do aparelho.
- **Pronto quando:** senha errada mostra erro sem recarregar; quem entrou sem conta e cria conta depois não perde dias, trilha nem Órbita.

### F-05 [ ] Luneta com gente de verdade
- **Onde:** seção `Luneta` (`PLANETAS`, `POSTS_DEMO`, `PERGUNTA`, `MARCO`, `CONVERSAS`, `MUTIRAO`).
- **O quê:** trocar o conteúdo de exemplo por dados dos endpoints da Luneta (`docs/API.md`). **Remover as respostas automáticas** das conversas (hoje simuladas). Estados de vazio ("Ainda ninguém da sua região escreveu hoje"), carregando e erro. Posts com `revisao: true` só aparecem para quem escreveu, com o selo "em revisão".
- **Pronto quando:** nenhuma constante de exemplo sobra; mural vazio tem texto acolhedor e botão para escrever; moderação continua bloqueando links, valores, telefones e termos de aposta antes de enviar.

### F-06 [ ] Persistir os Ajustes no aparelho
- **Onde:** seção `Ajustes e acessibilidade`.
- **O quê:** tema, contraste, daltonismo, tamanho do texto, espaçamento, animações e legendas hoje somem ao recarregar. Guardar em `localStorage` (`terraforma:ajustes`) e, com conta, no servidor (F-02). Incluir a chave em "Apagar meus dados".
- **Pronto quando:** escolher "Escuro" e recarregar mantém escuro.

## P1 · Qualidade de produto

### F-07 [ ] Folhas (bottom sheets) acessíveis
- **Onde:** `#folha-orbita`, `#folha-preciso`, `#folha-divida`, folhas da Luneta.
- **O quê:** `Esc` já fecha todas. Falta: foco preso dentro da folha enquanto aberta e, ao fechar, o foco voltar para o botão que abriu.
- **Pronto quando:** dá para abrir, preencher e fechar cada folha só com teclado, e o leitor de tela anuncia o título.

### F-08 [ ] Auditoria de acessibilidade (edital 8.2)
- **O quê:** rodar axe (ou Lighthouse) em todas as telas nos dois temas e com alto contraste; testar TalkBack/VoiceOver no Início, Respire e Finanças.
- **Pronto quando:** zero erro grave no axe; alvos de toque ≥ 44 px; nenhuma informação só por cor.

### F-09 [ ] Recado da Órbita escrito pela própria pessoa, à distância
- **Onde:** seção `Órbita`.
- **O quê:** hoje o recado é escrito no celular de quem usa o app (a pessoa empresta o celular). Com o backend: botão "Pedir um recado" gera um link que a pessoa de confiança abre para escrever. O app nunca escreve recado sozinho.
- **Pronto quando:** recado escrito pelo link aparece na próxima volta do satélite.

### F-10 [ ] PWA: instalar na tela inicial
- **Onde:** `app/layout.tsx`, `public/`.
- **O quê:** `manifest.webmanifest`, ícone próprio (planeta; **sem marca do BB**), cor do tema clara/escura, abrir em tela cheia.
- **Pronto quando:** no Android e no iPhone dá para "Adicionar à tela inicial" e o app abre sem a barra do navegador.

### F-11 [ ] Peso da primeira carga
- **O quê:** `terra-dia.jpg` tem 1,2 MB e `mar.mp3` 3 MB. Gerar WebP/AVIF da textura em 2 tamanhos, áudio em AAC/Opus menor, carregar o oceano e o som só ao entrar em Respire.
- **Pronto quando:** Lighthouse mobile ≥ 80 em desempenho no Início; Respire continua igual.

### F-12 [ ] Limpeza de código
- **O quê:** tirar CSS morto (`.bancada` original, `.celular` original, regras que o bloco "produto" sobrescreve), funções não usadas (`carregarTexturas` não é chamada), comentários que falam em "demo" e "protótipo".
- **Pronto quando:** `npm run build` sem aviso novo, `fumaca.mjs` passa, nenhuma diferença visual nas capturas.

### F-13 [ ] Estados de erro e sem rede
- **O quê:** se o planeta 3D não carregar (WebGL indisponível), mostrar uma imagem estática do planeta em vez de só o aviso. Sem rede: aviso discreto "Sem conexão. Tudo fica salvo aqui e envia depois" (a fila de `lib/api.ts` já existe).
- **Pronto quando:** com WebGL desligado o Início continua usável.

## P2 · Depois

### F-14 [ ] Fase 2: telas em componentes React
Seguir a ordem de `docs/MIGRACAO.md`: store de estado → planeta persistente no layout → telas sem 3D (Finanças, Ajuda, Perfil, Ajustes, Hábitos, Órbita, Luneta) → telas com câmera (Respire, Mapa-Mundi, Trilha). Uma tela por PR, com captura antes/depois.

### F-15 [ ] Testes automatizados de verdade
Transformar `testes/fumaca.mjs` em suíte do `@playwright/test`, rodando no CI a cada PR: entrada, quiz completo (acertar e errar), dívida do início ao fim, Barreira → rio, publicação com moderação e com crise.

### F-16 [ ] Trilha
- Conferir na edição final os trechos `i`/`f` de cada aula (alguns cortes do vídeo não são contínuos).
- Decidir com a equipe: o botão "Já assisti" continua liberando o quiz sem ver o vídeo?

## Pendências que não são código

- [ ] **Licenças (edital 8.5):** canal e licença dos 5 vídeos da trilha e do som do mar; declarar o uso de IA.
- [ ] **Autoexclusão:** reconferir o texto depois da decisão do STF sobre a MP 1.394.
- [ ] **Números do Info:** reconferir a cada 6 meses (fontes em `docs/CONTEXTO.md`).

## Ideias (precisam de fonte e decisão)

- Meta de reduzir antes de parar (Ladouceur et al., 2009).
- Dicas por perfil de apostador (Blaszczynski e Nower, 2002).
- Resumo da semana (Larimer et al., 2012).
- Modo família e triagem com equipe clínica: só em piloto com CAPS.

## Feito

- [x] 28/10/2026 · Produto sem painel de testes nem moldura de celular; começa vazio.
- [x] 28/10/2026 · Órbita: colocar, tirar, "Preciso de você" com mensagem e ligação.
- [x] 28/10/2026 · "Apagar meus dados" apaga também a Órbita, o som e o modo de vídeo.
- [x] 28/10/2026 · Quiz revisado (alternativas plausíveis, a certa não é mais sempre a mais longa).
- [x] 28/10/2026 · Fontes conferidas: CET, números por região (5 regiões no Info).
- [x] 29/10/2026 · Progresso da trilha salvo na conta (back NestJS, `/trilha`): sobe ao entrar, vai a cada conclusão, volta em outro aparelho (`node testes/trilha-conta.mjs`). Parte de F-01 só para `trilha`.
- [x] 29/10/2026 · Trilha v2: troca de módulo contínua, estrada emendada entre capítulos, chão sem emendas, fauna nova. Sem o sistema de energia.
- [x] 29/10/2026 · Responsivo: tablet e computador com o fundo na tela inteira e o conteúdo numa coluna central; navegação vira barra lateral no computador e no celular deitado; trilha cabe em 320 px; lista de regiões não some em telas baixas.
- [x] 29/10/2026 · Mapa-Mundi: a lista de regiões não aparecia (barra vazia sobre o título) porque o menu de regiões da trilha usava o mesmo id; ele agora é `#menu-regioes`.
