# Acessibilidade

Acessibilidade vale até 5% de bônus no edital e é prioridade de produto. Este guia diz o que já está pronto na base e como testar.

## O que a base já faz

| Recurso | Onde |
|---|---|
| `lang="pt-BR"` | `index.html` |
| Foco visível (2 px `--destaque`, offset 2) | `estilos/base.css` (`:focus-visible`) |
| Foco vai para o título ao trocar de tela | `App.jsx` + `<h1 id="titulo-tela" tabIndex={-1}>` |
| Região `aria-live="polite"` para anúncios | `App.jsx` (`#anuncios`) |
| Planeta lido com sentido (`<title>` atualizado) | `planeta/planeta.js` |
| Seco × verde por textura e posição, não só cor | molde do planeta + `planeta.js` |
| Barra de progresso com número em texto e `role="progressbar"` | `componentes/BarraProgresso.jsx` |
| Botões só-ícone com `aria-label` | `componentes/Topo.jsx` |
| Ícones decorativos com `aria-hidden` | `componentes/Icone.jsx` |
| Alvos ≥ 44 px | tokens `--alvo-min` e classes base |
| Cartão de risco com `role="status"` | `componentes/CartaoRisco.jsx` |

## Ajustes do usuário

Os ajustes ficam em `estado.acessibilidade` e viram atributos no `<html>` (`EstadoContext.jsx`). O CSS reage sozinho:

| Ajuste | Atributo | Efeito |
|---|---|---|
| Texto P/M/G | `data-texto` | `font-size` do `html` em 100% / 112,5% / 125% (tudo em `rem`) |
| Alto contraste | `data-contraste="alto"` | fundo branco, texto de apoio escuro, bordas 2 px |
| Daltonismo | `data-daltonismo="sim"` | planeta e progresso em azul/laranja |
| Animações | `data-animacoes` | `seguir` respeita `prefers-reduced-motion`; `reduzidas` desliga |

Os valores de alto contraste e daltonismo ainda estão **[decidir]** (CLAUDE.md 8.4).

## Regras ao escrever código

- Só elementos nativos para interação: `<button>`, `<a href>`, `<input>` dentro de `<label>`. Nunca `onClick` em `<div>` ou `<span>`.
- Nada informado só por cor: sempre texto, ícone ou textura junto.
- Contraste ≥ 4,5:1 (3:1 só em texto ≥ 24 px). Os tokens de texto já cumprem isso sobre branco.
- Tamanhos em `rem` para o texto G funcionar.
- Animação ≤ 600 ms (exceto a respiração da Maré) e usando `var(--duracao)`, que vira 0 com animações reduzidas.
- Mudança importante (meta cumprida, passo feito) → anunciar no `aria-live`.

## Como testar

1. **Teclado:** navegue só com Tab, Shift+Tab, Enter e Espaço. Todo botão precisa ser alcançável e o foco sempre visível.
2. **Leitor de tela:** TalkBack (Android), VoiceOver (iPhone/Mac) ou NVDA (Windows). Confira o botão da Maré e o planeta.
3. **Texto G:** mude nos Ajustes e veja se nada corta ou sobrepõe em 320 px.
4. **Movimento reduzido:** no DevTools do Chrome, aba Rendering → "Emulate CSS prefers-reduced-motion: reduce".
5. **Contraste e daltonismo:** DevTools → Rendering → "Emulate vision deficiencies".
6. **Lighthouse:** aba Lighthouse do DevTools, categoria Acessibilidade.

## Para o pitch

Roteiro do passo 8 da jornada da demo: ligar alto contraste, daltonismo, texto G e mostrar o leitor de tela lendo o botão da Maré e o planeta.
