import { describe, expect, it } from 'vitest'
import { FONTES, SERVICOS_AJUDA, detectarRisco } from './conteudo.js'

describe('detectarRisco', () => {
  it('encontra sinais de risco mesmo sem acento e com maiúsculas', () => {
    expect(detectarRisco('Às vezes penso em SUICÍDIO')).toBe(true)
    expect(detectarRisco('quero me matar')).toBe(true)
  })
  it('não dispara em texto comum', () => {
    expect(detectarRisco('Para voltar a dormir em paz')).toBe(false)
    expect(detectarRisco('')).toBe(false)
  })
})

describe('Ajuda e Fontes', () => {
  it('ordem fixa da Ajuda', () => {
    expect(SERVICOS_AJUDA.map((s) => s.id)).toEqual(['samu', 'cvv', 'caps', 'meuSus', 'ja', 'autoexclusao'])
  })
  it('todo serviço da Ajuda tem fonte cadastrada', () => {
    const ids = new Set(FONTES.map((f) => f.id))
    for (const s of SERVICOS_AJUDA) expect(ids.has(s.fonte)).toBe(true)
  })
})
