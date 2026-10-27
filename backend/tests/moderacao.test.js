// Testes da moderação automática (funções puras).
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { moderar, MAX_CARACTERES } from '../src/moderacao.js'

describe('moderar · o que pode publicar', () => {
  test('texto acolhedor passa', () => {
    const r = moderar('Hoje foi difícil, mas respirei e passou. Estou há 34 dias aqui.')
    assert.deepEqual(r, { ok: true, motivos: [], risco: false })
  })

  test('números pequenos e "dias" não são confundidos com dinheiro ou telefone', () => {
    assert.equal(moderar('Já são 34 dias e 3 meses de recomeço.').ok, true)
    assert.equal(moderar('Dia 27/10 foi o melhor.').ok, true)
  })
})

describe('moderar · o que barra', () => {
  test('texto vazio ou que não é texto', () => {
    assert.deepEqual(moderar('   ').motivos, ['vazio'])
    assert.deepEqual(moderar(undefined).motivos, ['vazio'])
    assert.deepEqual(moderar(42).motivos, ['vazio'])
  })

  test('texto longo demais', () => {
    const r = moderar('a'.repeat(MAX_CARACTERES + 1))
    assert.equal(r.ok, false)
    assert.ok(r.motivos.includes('longo'))
  })

  test('links', () => {
    for (const t of ['veja https://exemplo.com', 'entra em www.site', 'meusite.com ajuda', 'olha isso.bet']) {
      assert.ok(moderar(t).motivos.includes('link'), t)
    }
  })

  test('valores em dinheiro', () => {
    for (const t of ['perdi R$ 50', 'devo 3 mil', 'foram 200 reais', 'gastei 10 contos']) {
      assert.ok(moderar(t).motivos.includes('valor'), t)
    }
  })

  test('telefones, e-mails e @usuários', () => {
    for (const t of ['(61) 99999-9999', '61999999999', '+55 61 9 9999 9999', 'me chama em a@b.co', 'sigo @fulano']) {
      assert.ok(moderar(t).motivos.includes('contato'), t)
    }
  })

  test('ofertas e dicas de aposta, sem importar acento ou maiúscula', () => {
    assert.ok(moderar('BÔNUS DE CADASTRO liberado').motivos.includes('termo'))
    assert.ok(moderar('Cadastre-se agora').motivos.includes('termo'))
  })

  test('termos extras vindos da configuração', () => {
    assert.equal(moderar('conheci a casaxyz').ok, true)
    const r = moderar('conheci a CasaXYZ', { termosExtras: ['casaxyz'] })
    assert.ok(r.motivos.includes('termo'))
  })

  test('junta vários motivos de uma vez', () => {
    const r = moderar('R$ 50 em https://x.com')
    assert.deepEqual(r.motivos.sort(), ['link', 'valor'])
  })
})

describe('moderar · risco à vida', () => {
  test('sinal de risco não publica e não vira "motivo de bloqueio"', () => {
    const r = moderar('eu quero morrer')
    assert.deepEqual(r, { ok: false, motivos: [], risco: true })
  })

  test('risco tem prioridade sobre os outros motivos', () => {
    const r = moderar('quero morrer, ligue (61) 99999-9999')
    assert.equal(r.risco, true)
    assert.deepEqual(r.motivos, [])
  })
})
