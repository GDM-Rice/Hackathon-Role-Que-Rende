// Testes do limitador de ações por minuto, com relógio falso.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { criarLimitador } from '../src/limitador.js'

test('permite até o limite e barra a seguinte', () => {
  let t = 0
  const lim = criarLimitador({ limite: 2, agora: () => t })
  assert.equal(lim.permitir('a').permitido, true)
  assert.equal(lim.permitir('a').permitido, true)
  const terceira = lim.permitir('a')
  assert.equal(terceira.permitido, false)
  assert.ok(terceira.tentarEmSeg >= 1)
})

test('libera de novo depois da janela', () => {
  let t = 0
  const lim = criarLimitador({ limite: 1, janelaMs: 60_000, agora: () => t })
  assert.equal(lim.permitir('a').permitido, true)
  assert.equal(lim.permitir('a').permitido, false)
  t = 60_001
  assert.equal(lim.permitir('a').permitido, true)
})

test('chaves diferentes não atrapalham uma à outra', () => {
  const lim = criarLimitador({ limite: 1, agora: () => 0 })
  assert.equal(lim.permitir('a').permitido, true)
  assert.equal(lim.permitir('b').permitido, true)
})

test('ação barrada não estica a espera', () => {
  let t = 0
  const lim = criarLimitador({ limite: 1, janelaMs: 60_000, agora: () => t })
  lim.permitir('a')
  t = 30_000
  lim.permitir('a') // barrada
  t = 60_001
  assert.equal(lim.permitir('a').permitido, true) // a janela conta da ação PERMITIDA
})
