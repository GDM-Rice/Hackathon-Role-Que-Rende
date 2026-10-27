// Backend do Terraformar · monta as respostas de conteúdo PÚBLICO.
//
// Fonte única: src/conteudo/conteudo.js (módulo 06) e src/regras/regras.js
// (módulo 05). O backend só LÊ e organiza; não duplica nenhum texto ou regra.
// Assim, quando o 06 confere uma fonte (A_CONFERIR → CONFERIDO), o app e a
// API mudam juntos.

import { CONFERIDO, FONTES, NOMES_REGIOES, SERVICOS_AJUDA } from '../../src/conteudo/conteudo.js'
import { MARES_LIMPANDO, MARES_LIMPO, MAX_TRIPULACAO, METAS } from '../../src/regras/regras.js'

/** Telefone sempre pode ligar. Link só liga depois de conferido e com endereço. */
function acaoAtiva(acao) {
  if (acao.tipo === 'tel') return true
  return acao.status === CONFERIDO && Boolean(acao.valor)
}

function fontePublica(id) {
  const f = FONTES.find((x) => x.id === id)
  if (!f) return null
  return {
    id: f.id, titulo: f.titulo, diz: f.diz, origem: f.origem, link: f.link,
    verificada: f.status === CONFERIDO, // false enquanto estiver A_CONFERIR
  }
}

/** Tela Ajuda, na ordem fixa: SAMU → CVV → CAPS → SUS → Jogadores Anônimos → Autoexclusão. */
export function servicosDeAjuda() {
  return SERVICOS_AJUDA.map((s) => ({
    id: s.id,
    nome: s.nome,
    oQueE: s.oQueE,
    acao: { tipo: s.acao.tipo, valor: s.acao.valor, ativo: acaoAtiva(s.acao) },
    fonte: fontePublica(s.fonte),
  }))
}

/** O que abre quando a moderação encontra risco à vida: só SAMU 192 e CVV 188. */
export function ajudaDeRisco() {
  return servicosDeAjuda().filter((s) => s.id === 'samu' || s.id === 'cvv')
}

/** Tela Fontes. */
export function fontesPublicas() {
  return FONTES.map((f) => fontePublica(f.id))
}

/** Metas fixas e iguais para todos (Mapa-Mundi). */
export function metasPublicas() {
  return {
    terra: METAS.map((m) => ({ id: m.id, regiao: m.regiao, nome: NOMES_REGIOES[m.regiao], alvo: m.alvo })),
    mar: { limpando: MARES_LIMPANDO, limpo: MARES_LIMPO },
    tripulacaoMaxima: MAX_TRIPULACAO,
  }
}
