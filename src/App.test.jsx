import { describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { EstadoProvider } from './estado/EstadoContext.jsx'
import { estadoDoRafael } from './demo/demo.js'
import { estadoInicial } from './estado/estado.js'
import { hojeISO } from './util/datas.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

function montar(inicial) {
  const el = document.createElement('main')
  document.body.replaceChildren(el)
  act(() => createRoot(el).render(<EstadoProvider inicial={inicial}><App /></EstadoProvider>))
  return el
}

const botao = (el, texto) => [...el.querySelectorAll('button')].find((b) => b.textContent.includes(texto) || b.getAttribute('aria-label') === texto)

describe('App', () => {
  it('Início do Rafael mostra meta, valor e o planeta descrito', () => {
    const el = montar(estadoDoRafael(hojeISO()))
    expect(el.textContent).toContain('Centro-Oeste')
    expect(el.textContent).toContain('21 de 30 dias')
    expect(el.textContent).toContain('R$ 360 longe das apostas')
    expect(el.querySelector('svg title').textContent).toContain('2 de 5 regiões')
  })

  it('Maré e Ajuda ficam a um toque e "‹ Início" volta', () => {
    const el = montar(estadoDoRafael(hojeISO()))
    act(() => botao(el, 'Ajuda').click())
    expect(el.querySelector('h1').textContent).toBe('Ajuda')
    expect(botao(el, 'Maré')).toBeTruthy()
    act(() => botao(el, '‹ Início').click())
    expect(el.textContent).toContain('Respirar com a Maré')
  })

  it('primeira vez abre nas Boas-vindas', () => {
    const el = montar(estadoInicial(hojeISO()))
    expect(el.querySelector('h1').textContent).toContain('As apostas secaram a terra')
  })
})
