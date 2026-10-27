import { describe, expect, it } from 'vitest'
import molde from '../assets/planeta.svg?raw'
import { aplicarPlaneta, descricaoDoPlaneta } from './planeta.js'
import { propsDoPlaneta } from '../regras/regras.js'
import { estadoDoRafael } from '../demo/demo.js'

const HOJE = '2026-10-27'

function svgDoMolde() {
  const div = document.createElement('div')
  div.innerHTML = molde
  return div.querySelector('svg')
}

describe('planeta', () => {
  it('Rafael no dia 21: Sul encaixado e verde, Norte afastado e rachado', () => {
    const svg = svgDoMolde()
    aplicarPlaneta(svg, propsDoPlaneta(estadoDoRafael(HOJE)))
    expect(svg.querySelector('#regiao-sul').getAttribute('transform')).toBe('translate(0 0)')
    expect(svg.querySelector('#regiao-norte').getAttribute('transform')).toBe('translate(-5 -4)')
    expect(svg.querySelector('#racha-norte').getAttribute('opacity')).toBe('0.9')
    expect(svg.querySelector('#arvores-sul').getAttribute('opacity')).toBe('1')
    expect(svg.querySelector('#rio-amazonas').getAttribute('stroke-width')).toBe('2.4')
    expect(svg.querySelector('#ave-1').getAttribute('opacity')).toBe('1')
    expect(svg.querySelector('#ave-2').getAttribute('opacity')).toBe('0')
  })

  it('atualiza o <title> para o leitor de tela', () => {
    const svg = svgDoMolde()
    const props = propsDoPlaneta(estadoDoRafael(HOJE))
    aplicarPlaneta(svg, props)
    expect(svg.querySelector('title').textContent).toBe(
      'Planeta: 2 de 5 regiões do Brasil recuperadas, mar limpando, 1 de 3 rios correndo',
    )
    expect(descricaoDoPlaneta({ ...props, nuvens: true })).toMatch(/dia de tempestade$/)
  })
})
