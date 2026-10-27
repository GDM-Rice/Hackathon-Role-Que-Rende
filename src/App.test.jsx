import { describe, expect, it } from 'vitest'
import { estadoDoRafael } from './demo/demo.js'
import { estadoInicial } from './estado/estado.js'
import { hojeISO } from './util/datas.js'
import { clicar, botao, montar, titulo } from './testes/ajudantes.jsx'

describe('App na demo (sem login)', () => {
  it('Início do Rafael mostra meta, valor e o planeta descrito', async () => {
    const el = await montar({ inicial: estadoDoRafael(hojeISO()), demo: true })
    expect(el.textContent).toContain('Centro-Oeste')
    expect(el.textContent).toContain('21 de 30 dias')
    expect(el.textContent).toContain('R$ 360 longe das apostas')
    expect(el.querySelector('svg title').textContent).toContain('2 de 5 regiões')
  })

  it('Maré e Ajuda ficam a um toque e "‹ Início" volta', async () => {
    const el = await montar({ inicial: estadoDoRafael(hojeISO()), demo: true })
    await clicar(el, 'Ajuda')
    expect(titulo(el)).toBe('Ajuda')
    expect(botao(el, 'Maré')).toBeTruthy()
    await clicar(el, '‹ Início')
    expect(el.textContent).toContain('Respirar com a Maré')
  })
})

describe('App sem conta', () => {
  it('sem Supabase configurado abre em Entrar e avisa a equipe', async () => {
    const el = await montar({ inicial: estadoInicial(hojeISO()) })
    expect(titulo(el)).toBe('Entrar')
    expect(el.textContent).toContain('faltam as chaves do Supabase')
  })
})
