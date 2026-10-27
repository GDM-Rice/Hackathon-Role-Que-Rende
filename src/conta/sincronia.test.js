import { describe, expect, it } from 'vitest'
import { escolherEstado, paraBackup } from './sincronia.js'
import { estadoInicial } from '../estado/estado.js'
import { estadoDoRafael } from '../demo/demo.js'

const HOJE = '2026-10-27'
const CONTA = 'conta-1'

function daConta(extra = {}) {
  const e = estadoDoRafael(HOJE)
  e.dono = CONTA
  e.tripulacao = [{ id: 'ana', nome: 'Ana', relacao: 'irmã', celular: '61999990000' }]
  return { ...e, ...extra }
}

describe('paraBackup', () => {
  it('nunca leva o celular da tripulação nem a tela atual', () => {
    const b = paraBackup(daConta())
    expect(b.tripulacao[0]).toEqual({ id: 'ana', nome: 'Ana', relacao: 'irmã' })
    expect(b).not.toHaveProperty('tela')
    expect(JSON.stringify(b)).not.toContain('61999990000')
  })
  it('não altera o estado original', () => {
    const e = daConta()
    paraBackup(e)
    expect(e.tripulacao[0].celular).toBe('61999990000')
  })
})

describe('escolherEstado', () => {
  it('conta nova num celular sem dados: começa nas Boas-vindas', () => {
    const r = escolherEstado({ local: estadoInicial(HOJE), remoto: null, usuarioId: CONTA, hoje: HOJE })
    expect(r.estado.dono).toBe(CONTA)
    expect(r.estado.tela).toBe('boasVindas')
    expect(r.enviar).toBe(false)
  })

  it('restaura o backup e devolve os celulares que o aparelho já conhecia', () => {
    const local = daConta({ atualizadoEm: '2026-10-20T10:00:00Z' })
    const remoto = { estado: paraBackup(daConta({ mares: [] })), atualizadoEm: '2026-10-26T10:00:00Z' }
    const r = escolherEstado({ local, remoto, usuarioId: CONTA, hoje: HOJE })
    expect(r.estado.mares).toEqual([])
    expect(r.estado.tripulacao[0].celular).toBe('61999990000')
    expect(r.estado.tela).toBe('inicio')
    expect(r.estado.hoje.data).toBe(HOJE)
    expect(r.enviar).toBe(false)
  })

  it('local mais novo da mesma conta ganha e vai para o backup', () => {
    const local = daConta({ atualizadoEm: '2026-10-27T10:00:00Z' })
    const remoto = { estado: paraBackup(daConta()), atualizadoEm: '2026-10-26T10:00:00Z' }
    const r = escolherEstado({ local, remoto, usuarioId: CONTA, hoje: HOJE })
    expect(r.estado).toMatchObject({ dono: CONTA, atualizadoEm: '2026-10-27T10:00:00Z' })
    expect(r.enviar).toBe(true)
  })

  it('dados de outra conta no mesmo celular nunca se misturam', () => {
    const local = daConta({ dono: 'outra-conta' })
    const semBackup = escolherEstado({ local, remoto: null, usuarioId: CONTA, hoje: HOJE })
    expect(semBackup.estado.perfil.apelido).toBe('')
    expect(semBackup.estado.tripulacao).toEqual([])
    const comBackup = escolherEstado({
      local, remoto: { estado: paraBackup(daConta()), atualizadoEm: '2026-10-01T00:00:00Z' }, usuarioId: CONTA, hoje: HOJE,
    })
    expect(comBackup.estado.tripulacao[0]).not.toHaveProperty('celular')
  })

  it('a demo nunca vira backup de uma conta', () => {
    const r = escolherEstado({ local: estadoDoRafael(HOJE), remoto: null, usuarioId: CONTA, hoje: HOJE })
    expect(r.estado.perfil.apelido).toBe('')
    expect(r.enviar).toBe(false)
  })

  it('dados de antes de existir conta entram na conta', () => {
    const local = { ...estadoDoRafael(HOJE), dono: null }
    const r = escolherEstado({ local, remoto: null, usuarioId: CONTA, hoje: HOJE })
    expect(r.estado).toMatchObject({ dono: CONTA, perfil: { apelido: 'Rafael' } })
    expect(r.enviar).toBe(true)
  })
})
