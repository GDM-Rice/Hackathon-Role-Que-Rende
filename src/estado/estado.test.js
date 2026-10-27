import { describe, expect, it } from 'vitest'
import { CHAVE, apagar, carregar, estadoInicial, migrar, salvar } from './estado.js'

const HOJE = '2026-10-27'

function memoria() {
  const dados = new Map()
  return {
    getItem: (k) => dados.get(k) ?? null,
    setItem: (k, v) => dados.set(k, v),
    removeItem: (k) => dados.delete(k),
  }
}

describe('estado', () => {
  it('primeira vez abre nas Boas-vindas', () => {
    expect(carregar(HOJE, memoria()).tela).toBe('boasVindas')
  })

  it('salva e carrega sem perder dados, com "hoje" sempre atualizado', () => {
    const mem = memoria()
    const e = estadoInicial('2026-10-01')
    e.tela = 'missao'
    e.perfil.inicio = '2026-10-01'
    e.mares.push({ data: '2026-10-02', antes: 8, depois: 4, gatilhos: [] })
    salvar(e, mem)
    const lido = carregar(HOJE, mem)
    expect(lido.mares).toHaveLength(1)
    expect(lido.tela).toBe('missao')
    expect(lido.hoje.data).toBe(HOJE)
  })

  it('migrar completa campos que faltam', () => {
    const e = migrar({ perfil: { apelido: 'Ana', inicio: '2026-10-01' }, mapa: { barreiras: { bloqueador: true } } }, HOJE)
    expect(e.acessibilidade.texto).toBe('M')
    expect(e.mapa.barreiras).toMatchObject({ bloqueador: true, autoexclusao: false })
    expect(e.mapa.dividas).toEqual([])
  })

  it('JSON corrompido não quebra o app', () => {
    const mem = memoria()
    mem.setItem(CHAVE, '{quebrado')
    expect(carregar(HOJE, mem).tela).toBe('boasVindas')
  })

  it('apagar remove tudo', () => {
    const mem = memoria()
    salvar(estadoInicial(HOJE), mem)
    apagar(mem)
    expect(mem.getItem(CHAVE)).toBeNull()
  })
})
