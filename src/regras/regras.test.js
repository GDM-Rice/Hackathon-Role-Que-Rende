import { describe, expect, it } from 'vitest'
import {
  aves, deixouDeIrParaApostas, diasDeRecomeco, estadoDoCeu, estadoDoMar,
  metaAtual, metasNovas, propsDoPlaneta, regioes, riosAtivos,
} from './regras.js'
import { estadoInicial } from '../estado/estado.js'
import { estadoDoRafael } from '../demo/demo.js'
import { somarDias } from '../util/datas.js'

const HOJE = '2026-10-27'

function comInicio(diasAtras, extra = {}) {
  const e = estadoInicial(HOJE)
  e.perfil.inicio = somarDias(HOJE, -diasAtras)
  return { ...e, ...extra }
}

describe('diasDeRecomeco', () => {
  it('é 0 sem início e no próprio dia do início', () => {
    expect(diasDeRecomeco(estadoInicial(HOJE))).toBe(0)
    expect(diasDeRecomeco(comInicio(0))).toBe(0)
  })
  it('conta só dias completos e desconta tempestades passadas', () => {
    const e = comInicio(10)
    expect(diasDeRecomeco(e)).toBe(10)
    e.recomeco.tempestades = [somarDias(HOJE, -3), somarDias(HOJE, -3)]
    expect(diasDeRecomeco(e)).toBe(9)
  })
  it('tempestade de hoje não diminui o número de hoje', () => {
    const e = comInicio(10)
    e.recomeco.tempestades = [HOJE]
    expect(diasDeRecomeco(e)).toBe(10)
  })
})

describe('regioes e metaAtual', () => {
  it('dia 1: Sul brotando, resto seco', () => {
    expect(regioes(comInicio(0))).toEqual({ sul: 'brotando', sudeste: 'seco', centroOeste: 'seco', nordeste: 'seco', norte: 'seco' })
  })
  it('Rafael no dia 21: Sul e Sudeste verdes, Centro-Oeste 21 de 30', () => {
    const r = estadoDoRafael(HOJE)
    expect(diasDeRecomeco(r)).toBe(21)
    expect(regioes(r)).toMatchObject({ sul: 'verde', sudeste: 'verde', centroOeste: 'brotando', nordeste: 'seco' })
    expect(metaAtual(r)).toEqual({ regiao: 'centroOeste', feitos: 21, alvo: 30 })
  })
  it('dia 90: Brasil inteiro verde e sem meta atual', () => {
    const e = comInicio(90)
    expect(Object.values(regioes(e)).every((v) => v === 'verde')).toBe(true)
    expect(metaAtual(e)).toBeNull()
  })
})

describe('mar, rios, aves, céu', () => {
  it('mar: 0–2 poluído, 3 limpando, 10 limpo', () => {
    const e = estadoInicial(HOJE)
    const comMares = (n) => ({ ...e, mares: Array(n).fill({}) })
    expect(estadoDoMar(comMares(2))).toBe('poluido')
    expect(estadoDoMar(comMares(3))).toBe('limpando')
    expect(estadoDoMar(comMares(9))).toBe('limpando')
    expect(estadoDoMar(comMares(10))).toBe('limpo')
  })
  it('rios seguem dívidas e barreiras', () => {
    const r = estadoDoRafael(HOJE)
    expect(riosAtivos(r)).toEqual({ amazonas: true, saoFrancisco: false, parana: false })
    r.mapa.barreiras.autoexclusao = true
    r.mapa.dividas[0].renegociada = true
    expect(riosAtivos(r)).toEqual({ amazonas: true, saoFrancisco: true, parana: true })
  })
  it('aves: uma por pessoa, no máximo 3', () => {
    const e = estadoInicial(HOJE)
    e.tripulacao = [{}, {}, {}, {}]
    expect(aves(e)).toBe(3)
  })
  it('céu só tem tempestade no dia marcado', () => {
    const e = comInicio(5)
    e.recomeco.tempestades = [somarDias(HOJE, -1)]
    expect(estadoDoCeu(e)).toBe('aberto')
    e.recomeco.tempestades.push(HOJE)
    expect(estadoDoCeu(e)).toBe('tempestade')
  })
})

describe('deixouDeIrParaApostas', () => {
  it('Rafael: R$ 360 em 21 dias', () => {
    expect(deixouDeIrParaApostas(estadoDoRafael(HOJE))).toBe(360)
  })
  it('null quando não informou', () => {
    expect(deixouDeIrParaApostas(comInicio(10))).toBeNull()
  })
})

describe('metasNovas', () => {
  it('lista metas cumpridas ainda não celebradas', () => {
    const e = comInicio(15)
    expect(metasNovas(e)).toEqual(['sul', 'sudeste'])
    e.metasVistas = ['sul']
    expect(metasNovas(e)).toEqual(['sudeste'])
  })
})

// Regra de ouro: nada regride.
describe('monotonicidade', () => {
  const ORDEM = { seco: 0, brotando: 1, verde: 2, poluido: 0, limpando: 1, limpo: 2 }
  const nota = (e, hoje) => {
    const p = propsDoPlaneta(e, hoje)
    return {
      regioes: Object.values(p.regioes).map((v) => ORDEM[v]),
      mar: ORDEM[p.mar],
      rios: Object.values(p.rios).map(Number),
      aves: p.aves,
    }
  }
  const naoPiorou = (antes, depois) => {
    antes.regioes.forEach((v, i) => expect(depois.regioes[i]).toBeGreaterThanOrEqual(v))
    antes.rios.forEach((v, i) => expect(depois.rios[i]).toBeGreaterThanOrEqual(v))
    expect(depois.mar).toBeGreaterThanOrEqual(antes.mar)
    expect(depois.aves).toBeGreaterThanOrEqual(antes.aves)
  }

  const ACOES = {
    'apostei hoje': (e) => e.recomeco.tempestades.push(HOJE),
    'fazer uma Maré': (e) => e.mares.push({ data: HOJE, antes: 8, depois: 4, gatilhos: [] }),
    'passo numa dívida': (e) => { e.mapa.dividas[0].passo += 1 },
    'marcar barreira': (e) => { e.mapa.barreiras.bloqueador = true },
    'adicionar pessoa': (e) => e.tripulacao.push({ id: 'x', nome: 'Bia' }),
  }

  for (const [nome, acao] of Object.entries(ACOES)) {
    it(`"${nome}" não piora o planeta`, () => {
      const e = estadoDoRafael(HOJE)
      const antes = nota(e)
      const depois = structuredClone(e)
      acao(depois)
      naoPiorou(antes, nota(depois))
    })
  }

  it('virar o dia depois de uma tempestade não piora o planeta', () => {
    const e = estadoDoRafael(HOJE)
    e.recomeco.tempestades.push(HOJE)
    naoPiorou(nota(e, HOJE), nota(e, somarDias(HOJE, 1)))
  })
})
