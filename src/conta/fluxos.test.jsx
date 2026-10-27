// Fluxos de conta de ponta a ponta na interface, com o Supabase simulado.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'

const falso = vi.hoisted(() => ({ ouvinte: null }))

vi.mock('../api/supabase.js', () => ({ supabaseConfigurado: true, supabase: {} }))
vi.mock('../api/conta.js', async (original) => {
  const real = await original()
  return {
    ...real,
    obterUsuario: vi.fn(async () => null),
    ouvirSessao: vi.fn((aoMudar) => { falso.ouvinte = aoMudar; return () => {} }),
    entrar: vi.fn(),
    cadastrar: vi.fn(),
    sair: vi.fn(async () => {}),
    enviarLinkDeRecuperacao: vi.fn(async () => {}),
    definirSenha: vi.fn(async () => {}),
    atualizarApelido: vi.fn(),
    atualizarEmail: vi.fn(async () => {}),
    apagarConta: vi.fn(async () => {}),
    buscarProgresso: vi.fn(async () => null),
    salvarProgresso: vi.fn(async () => {}),
  }
})

import * as conta from '../api/conta.js'
import { CHAVE } from '../estado/estado.js'
import { estadoDoRafael } from '../demo/demo.js'
import { paraBackup } from './sincronia.js'
import { hojeISO } from '../util/datas.js'
import { botao, clicar, digitar, enviarFormulario, montar, titulo } from '../testes/ajudantes.jsx'

const ANA = { id: 'conta-ana', email: 'ana@exemplo.org', user_metadata: { apelido: 'Ana' } }

function backupDoRafael() {
  return { estado: paraBackup({ ...estadoDoRafael(hojeISO()), dono: ANA.id }), atualizadoEm: '2026-10-26T10:00:00Z' }
}

describe('contas', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    conta.obterUsuario.mockResolvedValue(null)
    conta.buscarProgresso.mockResolvedValue(null)
  })
  afterEach(() => { falso.ouvinte = null })

  it('sem login: abre Entrar e mesmo assim Maré e Ajuda abrem', async () => {
    const el = await montar()
    expect(titulo(el)).toBe('Entrar')
    await clicar(el, 'Ajuda')
    expect(titulo(el)).toBe('Ajuda')
    await clicar(el, '‹ Entrar')
    expect(titulo(el)).toBe('Entrar')
    await clicar(el, 'Maré')
    expect(titulo(el)).toBe('Maré')
  })

  it('login certo: restaura o backup e abre o Início', async () => {
    conta.entrar.mockResolvedValue(ANA)
    conta.buscarProgresso.mockResolvedValue(backupDoRafael())
    const el = await montar()
    await digitar(el, 'E-mail', 'ana@exemplo.org')
    await digitar(el, 'Senha', '12345678')
    await enviarFormulario(el)
    expect(conta.entrar).toHaveBeenCalledWith({ email: 'ana@exemplo.org', senha: '12345678' })
    expect(conta.buscarProgresso).toHaveBeenCalledWith(ANA.id)
    expect(el.textContent).toContain('Rafael')
    expect(el.textContent).toContain('21 de 30 dias')
  })

  it('conta nova: vai para as Boas-vindas com o apelido da conta', async () => {
    conta.entrar.mockResolvedValue(ANA)
    const el = await montar()
    await digitar(el, 'E-mail', 'ana@exemplo.org')
    await digitar(el, 'Senha', '12345678')
    await enviarFormulario(el)
    expect(titulo(el)).toContain('As apostas secaram a terra')
    expect(el.querySelector('input[autocomplete="nickname"]').value).toBe('Ana')
  })

  it('senha errada: mensagem calma, sem sair da tela', async () => {
    conta.entrar.mockRejectedValue(new conta.ErroDeConta('credenciais'))
    const el = await montar()
    await digitar(el, 'E-mail', 'ana@exemplo.org')
    await digitar(el, 'Senha', 'errada123')
    await enviarFormulario(el)
    expect(el.querySelector('[role="alert"]').textContent).toBe('E-mail ou senha não conferem.')
    expect(titulo(el)).toBe('Entrar')
  })

  it('cadastro: confere as senhas antes de enviar e avisa para confirmar o e-mail', async () => {
    conta.cadastrar.mockResolvedValue({ precisaConfirmar: true })
    const el = await montar()
    await clicar(el, 'Ainda não tenho conta')
    expect(titulo(el)).toBe('Criar conta')
    await digitar(el, 'Como quer ser chamado?', 'Ana')
    await digitar(el, 'E-mail', 'ana@exemplo.org')
    await digitar(el, 'Senha', '12345678')
    await digitar(el, 'Repita a senha', '87654321')
    await enviarFormulario(el)
    expect(el.textContent).toContain('As duas senhas não são iguais.')
    expect(conta.cadastrar).not.toHaveBeenCalled()

    await digitar(el, 'Repita a senha', '12345678')
    await enviarFormulario(el)
    expect(conta.cadastrar).toHaveBeenCalledWith({ email: 'ana@exemplo.org', senha: '12345678', apelido: 'Ana' })
    expect(el.textContent).toContain('Enviamos um link para ana@exemplo.org')
  })

  it('recuperar senha: envia o link e não revela se a conta existe', async () => {
    const el = await montar()
    await clicar(el, 'Esqueci minha senha')
    await digitar(el, 'E-mail', 'ana@exemplo.org')
    await enviarFormulario(el)
    expect(conta.enviarLinkDeRecuperacao).toHaveBeenCalledWith('ana@exemplo.org')
    expect(el.textContent).toContain('Se existir uma conta com esse e-mail')
  })

  it('link de recuperação: pede a senha nova e depois abre o app', async () => {
    const el = await montar()
    await act(async () => falso.ouvinte('PASSWORD_RECOVERY', ANA))
    expect(titulo(el)).toBe('Criar senha nova')
    await digitar(el, 'Senha nova', 'novaSenha123')
    await digitar(el, 'Repita a senha', 'novaSenha123')
    await enviarFormulario(el)
    expect(conta.definirSenha).toHaveBeenCalledWith('novaSenha123')
    expect(titulo(el)).toContain('As apostas secaram a terra')
  })

  it('sair: grava o backup, encerra a sessão e apaga os dados do celular', async () => {
    conta.obterUsuario.mockResolvedValue(ANA)
    conta.buscarProgresso.mockResolvedValue(backupDoRafael())
    const el = await montar()
    await clicar(el, 'Ajustes')
    await clicar(el, 'Minha conta')
    expect(titulo(el)).toBe('Minha conta')
    expect(el.textContent).toContain('ana@exemplo.org')
    await clicar(el, 'Sair da conta')
    expect(conta.salvarProgresso).toHaveBeenCalledWith(ANA.id, expect.objectContaining({ dono: ANA.id }))
    expect(conta.sair).toHaveBeenCalled()
    expect(titulo(el)).toBe('Entrar')
    expect(JSON.parse(localStorage.getItem(CHAVE)).perfil.apelido).toBe('')
  })

  it('trocar apelido: atualiza a conta e o Início', async () => {
    conta.obterUsuario.mockResolvedValue(ANA)
    conta.buscarProgresso.mockResolvedValue(backupDoRafael())
    conta.atualizarApelido.mockResolvedValue({ ...ANA, user_metadata: { apelido: 'Rafa' } })
    const el = await montar()
    await clicar(el, 'Ajustes')
    await clicar(el, 'Minha conta')
    await digitar(el, 'Como quer ser chamado?', 'Rafa')
    await enviarFormulario(el, 0)
    expect(conta.atualizarApelido).toHaveBeenCalledWith('Rafa')
    expect(el.textContent).toContain('Apelido salvo.')
    await clicar(el, '‹ Início')
    expect(el.textContent).toContain('Rafa.')
  })

  it('backup automático: grava 1,5 s depois de uma mudança, sem o celular da tripulação', async () => {
    const backup = backupDoRafael()
    conta.obterUsuario.mockResolvedValue(ANA)
    conta.buscarProgresso.mockResolvedValue(backup)
    localStorage.setItem(CHAVE, JSON.stringify({
      ...estadoDoRafael(hojeISO()), dono: ANA.id, atualizadoEm: '2026-10-01T00:00:00Z',
      tripulacao: [{ id: 'ana', nome: 'Ana', relacao: 'irmã', celular: '61999990000' }],
    }))
    conta.atualizarApelido.mockResolvedValue(ANA)
    const el = await montar()
    await clicar(el, 'Ajustes')
    await clicar(el, 'Minha conta')
    conta.salvarProgresso.mockClear()
    await digitar(el, 'Como quer ser chamado?', 'Rafa')
    await enviarFormulario(el, 0)
    expect(conta.salvarProgresso).not.toHaveBeenCalled()
    await act(() => new Promise((ok) => setTimeout(ok, 1700)))
    expect(conta.salvarProgresso).toHaveBeenCalledTimes(1)
    const [id, enviado] = conta.salvarProgresso.mock.calls[0]
    expect(id).toBe(ANA.id)
    expect(enviado.perfil.apelido).toBe('Rafa')
    expect(enviado.tripulacao[0].celular).toBe('61999990000') // o filtro acontece dentro de salvarProgresso
  })

  it('apagar conta: pede confirmação em tela própria e volta para Entrar', async () => {
    conta.obterUsuario.mockResolvedValue(ANA)
    conta.buscarProgresso.mockResolvedValue(backupDoRafael())
    const el = await montar()
    await clicar(el, 'Ajustes')
    await clicar(el, 'Minha conta')
    await clicar(el, 'Apagar minha conta')
    expect(el.textContent).toContain('Não dá para desfazer')
    expect(conta.apagarConta).not.toHaveBeenCalled()
    await clicar(el, 'Sim, apagar minha conta')
    expect(conta.apagarConta).toHaveBeenCalled()
    expect(titulo(el)).toBe('Entrar')
  })

  it('offline com dados de outra conta: não sobrescreve nada e oferece tentar de novo', async () => {
    localStorage.setItem(CHAVE, JSON.stringify({ ...estadoDoRafael(hojeISO()), dono: 'outra-conta' }))
    conta.obterUsuario.mockResolvedValue(ANA)
    conta.buscarProgresso.mockRejectedValue(new TypeError('Failed to fetch'))
    const el = await montar()
    expect(el.textContent).toContain('Não foi possível buscar seu progresso')
    expect(botao(el, 'Tentar de novo')).toBeTruthy()
    expect(conta.salvarProgresso).not.toHaveBeenCalled()
  })
})
