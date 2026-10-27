// Módulo 05 · regras do jogo. Funções PURAS: nenhuma lê o relógio.
// `hoje` (ISO) vem por parâmetro; por padrão usa estado.hoje.data.
// Regra de ouro: nada regride (CLAUDE.md seção 2).

import { diasEntre } from '../util/datas.js'

/** Metas fixas, iguais para todos, na ordem de recuperação. */
export const METAS = [
  { id: 'sul', regiao: 'sul', alvo: 7 },
  { id: 'sudeste', regiao: 'sudeste', alvo: 14 },
  { id: 'centroOeste', regiao: 'centroOeste', alvo: 30 },
  { id: 'nordeste', regiao: 'nordeste', alvo: 60 },
  { id: 'norte', regiao: 'norte', alvo: 90 }, // Norte = Brasil inteiro
]

export const MARES_LIMPANDO = 3
export const MARES_LIMPO = 10
export const MAX_TRIPULACAO = 3

const dataDe = (estado, hoje) => hoje ?? estado.hoje?.data

/**
 * Dias completos desde perfil.inicio até ontem, menos os dias de tempestade.
 * Só conta dia terminado, então o número de hoje nunca diminui.
 */
export function diasDeRecomeco(estado, hoje) {
  const data = dataDe(estado, hoje)
  const inicio = estado.perfil?.inicio
  if (!inicio || !data) return 0
  const completos = Math.max(0, diasEntre(inicio, data))
  const tempestades = new Set(
    (estado.recomeco?.tempestades ?? []).filter((t) => t >= inicio && t < data),
  )
  return Math.max(0, completos - tempestades.size)
}

/** { sul, sudeste, centroOeste, nordeste, norte } → 'seco' | 'brotando' | 'verde' */
export function regioes(estado, hoje) {
  const dias = diasDeRecomeco(estado, hoje)
  const resultado = {}
  let atualMarcada = false
  for (const meta of METAS) {
    if (dias >= meta.alvo) resultado[meta.regiao] = 'verde'
    else if (!atualMarcada) {
      resultado[meta.regiao] = 'brotando'
      atualMarcada = true
    } else resultado[meta.regiao] = 'seco'
  }
  return resultado
}

/** { regiao, feitos, alvo } da próxima meta, ou null quando o Brasil inteiro está verde. */
export function metaAtual(estado, hoje) {
  const dias = diasDeRecomeco(estado, hoje)
  const meta = METAS.find((m) => dias < m.alvo)
  return meta ? { regiao: meta.regiao, feitos: dias, alvo: meta.alvo } : null
}

export function estadoDoMar(estado) {
  const feitas = estado.mares?.length ?? 0
  if (feitas >= MARES_LIMPO) return 'limpo'
  if (feitas >= MARES_LIMPANDO) return 'limpando'
  return 'poluido'
}

/**
 * Amazonas: 1º passo numa dívida · São Francisco: 1ª Barreira marcada ·
 * Paraná: 1ª dívida renegociada.
 */
export function riosAtivos(estado) {
  const dividas = estado.mapa?.dividas ?? []
  const barreiras = estado.mapa?.barreiras ?? {}
  return {
    amazonas: dividas.some((d) => (d.passo ?? 0) >= 1),
    saoFrancisco: Object.values(barreiras).some(Boolean),
    parana: dividas.some((d) => d.renegociada || (d.passo ?? 0) >= 3),
  }
}

/**
 * Uma ave por pessoa na tripulação (0–3).
 * [decidir] remover alguém: sugerido manter a ave (nada regride).
 */
export function aves(estado) {
  return Math.min(MAX_TRIPULACAO, estado.tripulacao?.length ?? 0)
}

/** 'tempestade' só no dia em que a pessoa marcou "Apostei hoje". */
export function estadoDoCeu(estado, hoje) {
  const data = dataDe(estado, hoje)
  return (estado.recomeco?.tempestades ?? []).includes(data) ? 'tempestade' : 'aberto'
}

/** gastoSemanal ÷ 7 × diasDeRecomeco, arredondado. null se não informou. Só texto. */
export function deixouDeIrParaApostas(estado, hoje) {
  const gasto = estado.perfil?.gastoSemanal
  if (gasto == null || Number.isNaN(Number(gasto))) return null
  return Math.round((Number(gasto) / 7) * diasDeRecomeco(estado, hoje))
}

/** Metas cumpridas que ainda não foram celebradas. */
export function metasNovas(estado, hoje) {
  const r = regioes(estado, hoje)
  const vistas = new Set(estado.metasVistas ?? [])
  return METAS.filter((m) => r[m.regiao] === 'verde' && !vistas.has(m.id)).map((m) => m.id)
}

/** Tudo o que o componente Planeta precisa, calculado do estado. */
export function propsDoPlaneta(estado, hoje) {
  return {
    regioes: regioes(estado, hoje),
    mar: estadoDoMar(estado),
    rios: riosAtivos(estado),
    aves: aves(estado),
    nuvens: estadoDoCeu(estado, hoje) === 'tempestade',
  }
}
