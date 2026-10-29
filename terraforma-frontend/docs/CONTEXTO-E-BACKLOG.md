# Terraforma · contexto e backlog

Cópia de 28/10/2026, 11h. O documento vivo, com status editável, é: https://claude.ai/artifact/46QuGx8qWFSCHh6mKjdQCs

## Resumo

O Terraforma é um app de apoio a quem quer parar de apostar: o planeta Terra começa destruído e se recupera a cada dia sem aposta. É a entrega da equipe (6 pessoas) no desafio **Além da Aposta** da Game Jam Rolê que Rende – BBDW 2026. A eliminatória é em **29/10, às 11h**, e pede protótipo demonstrável, deck em PDF e declaração de IA e de assets.

- **Mecânica central:** o Brasil começa seco em 5 regiões, que voltam a verdejar com os dias sem apostar: Sul 7, Sudeste 14, Centro-Oeste 30, Nordeste 60 e Norte 90 dias. O mar poluído limpa com as Marés (sessões de respiração de 60 s ou mais; 3 começa a limpar, 10 fica limpo). Os 3 rios voltam com passos nas finanças.
- **Protótipo 3D:** https://claude.ai/artifact/92jDdVALWzTNVFbAF5UEJz
- **Guia de estrutura do app (design):** https://claude.ai/artifact/YXKCM76orqrM7i5411vc6d (cópia dos arquivos em `docs/guia-de-design/`)
- **Ideia anterior abandonada:** o tema Maré/Tripulação. Restos de texto com esses nomes são erro.

## Regras que não podem ser quebradas

| Origem | Regra |
| --- | --- |
| Edital 8.4 | Não promover apostas. Sem dinheiro real, cripto ou item com valor monetário. Sorte ou recompensa só com fim educativo. |
| Edital 8.4 | Sem casas de aposta, clubes, atletas nem marcas BB/BBDW. Informação financeira e jurídica correta e com fonte. Linguagem respeitosa. |
| Edital 8.5 | Declarar o uso de IA e a licença de cada asset. Só dados públicos, sintéticos ou da organização; dado de cliente BB é proibido. |
| Edital, Anexo 2 | Apoiar a organização de despesas, dívidas, prioridades e metas. Sem integração com plataformas de aposta, sem moralismo; o app é apoio complementar. |
| Edital 8.2 | Acessibilidade conta pontos: legendas, alto contraste, leitor de tela e daltonismo. |
| Equipe | Nunca dizer que o BB vai financiar algo; nada de logo do BB. Fatos só com fonte verificada. |
| Equipe | "inspirado em" (nunca "baseado em"), "substituição de lazer" (nunca "dopamina"). |
| Produto | Nada regride: tempestade ("Apostei hoje") não tira dias, regiões, mar nem rios. Metas fixas, nada sorteado. Sem notificações para puxar a pessoa de volta. |
| Finanças | Rio volta pelo passo dado, nunca pelo valor. Nunca mostrar "quanto perdeu". Sem integração bancária, empréstimo ou investimento. Valores da demo fictícios. Rodapé "não é consultoria financeira". |

## O que já existe

- **Boas-vindas (3 passos):** "As apostas secaram esta terra" → lapso de 90 dias com os 3 hábitos que substituem a aposta → apelido e motivo.
- **Início:** planeta 3D, meta atual, cartão "A vontade de apostar apareceu? Faça uma meditação. / Respire com a Terra", botão amarelo "Hábitos saudáveis", link "Apostei hoje".
- **Respire com a Terra:** queda pelas nuvens até o oceano; respiração lenta 4/6, suspiro cíclico e surfar a vontade; 1/3/5 min; vontade 0–10 antes e depois; som do mar.
- **Hábitos saudáveis:** trocas por tempo disponível (2 min, 15 min, 1 h+), "Minhas trocas", nota da vontade depois.
- **Dia de tempestade:** nuvens, nada regride.
- **Mapa-Mundi:** regiões, mar e rios.
- **Finanças:** Básico (sem valores, mínimo existencial, Registrato), Dívidas (uma de cada vez, "Quando? Onde?", texto de negociação), Barreiras (Pix noturno, bloqueador, combinar com a Órbita, autoexclusão "a conferir").
- **Órbita:** satélites 3D com recados escritos pelas pessoas de confiança; "Preciso de você".
- **Menu:** 5 abas, pílula deslizante, cinza-claro.
- **Acessibilidade:** tema escuro, daltonismo, movimento reduzido, descrição do planeta para leitor de tela.

## Embasamento (fontes conferidas)

| Tema | Fonte |
| --- | --- |
| Respiração | Balban et al., 2023 (Cell Reports Medicine); Zaccaro et al., 2018; Laborde et al., 2022 |
| Surfar a vontade | Bowen e Marlatt, 2009 |
| Problema do jogo | Tran et al., Lancet Public Health, 2024; Clark, 2009; Goodwin et al., 2017; Armoon et al., 2023; Schuler et al., 2016 |
| Dívida e saúde mental | Richardson et al., 2013 |
| Uma dívida de cada vez | Kettle et al., 2016; Gal e McShane, 2012 |
| Plano "Quando? Onde?" | Gollwitzer e Sheeran, 2006 |
| Meta de 90 dias | Inspirada em NIDA, Principles of Drug Addiction Treatment (3ª ed., 2018): pelo menos 3 meses de tratamento. Recaída segue comum depois (Müller et al., 2017, European Psychiatry: 41,6% abstinentes em 12 meses) |
| Mínimo existencial | Lei 14.181/2021; Decreto 11.150/2022; STF, ADPFs 1.005, 1.006 e 1.097 (23/04/2026) |
| Pix noturno | Banco Central: 20h às 6h, padrão R$ 1.000 |
| Apostas proibidas | MP 1.394, de 25/09/2026; audiência no STF em 3/11 |

## Backlog (28/10)

### Antes da eliminatória (29/10, 11h)
- [ ] Declaração de uso de IA e de assets, com a licença de cada um (edital 8.5)
- [ ] Deck em PDF abrindo pelo problema (slide 1 dado conferido; slide 2 "app de bem-estar para quem quer parar de apostar"; planeta no 3)
- [ ] Conferir a licença do som do mar (se CC BY, creditar o canal)
- [ ] Ajuda completa: CVV 188 e os outros caminhos, com fonte
- [ ] Validar Finanças com a equipe
- [ ] Definir e cronometrar a ordem das telas na demo
- [ ] Testar no aparelho da apresentação
- [ ] Ver se o botão amarelo "Hábitos saudáveis" rouba atenção do "Respire com a Terra"
- [ ] Levar NIDA (2018) e Müller (2017) para o Embasamento e a tela Info
- [ ] Escolher a paleta final e tirar os quadros de teste do guia
- [ ] Rodar de novo a avaliação só com o edital
- [ ] Tirar restos de "Tripulação" e "Maré"
- [ ] Perguntar à Comissão sobre o item 8.4

### Depois
- [ ] Reconferir a autoexclusão depois do STF (3/11)
- [ ] Ajustes e acessibilidade completos (fonte grande, alto contraste, aviso visual do som)
- [ ] Luneta e Perfil completos; "quanto apostava por semana" vai para o Perfil
- [ ] Telas restantes do guia no estilo novo
- [ ] Guardar a nota de vontade antes/depois como medida de resultado (o front já emite os eventos)
- [ ] **Backend:** implementar o contrato de `docs/API.md`

### Ideias
- Meta de reduzir antes de parar (Ladouceur et al., 2009)
- Dicas por perfil (Blaszczynski e Nower, 2002)
- Resumo da semana (Larimer et al., 2012)
- Modo família (fonte a conferir)
- Triagem com equipe clínica, só em piloto com o CAPS (fonte a conferir)
