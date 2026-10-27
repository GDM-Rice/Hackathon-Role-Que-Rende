import { beforeEach, describe, expect, it, vi } from 'vitest'

// Cliente falso do Supabase: cada teste define o que as funções devolvem.
const falso = vi.hoisted(() => {
  const consulta = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn(), upsert: vi.fn() }
  consulta.select.mockReturnValue(consulta)
  consulta.eq.mockReturnValue(consulta)
  return {
    consulta,
    cliente: {
      auth: {
        signUp: vi.fn(), signInWithPassword: vi.fn(), signOut: vi.fn(), resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn(), getSession: vi.fn(), onAuthStateChange: vi.fn(),
      },
      from: vi.fn(() => consulta),
      rpc: vi.fn(),
    },
  }
})
vi.mock('./supabase.js', () => ({ supabaseConfigurado: true, supabase: falso.cliente }))

import {
  ErroDeConta, apagarConta, buscarProgresso, cadastrar, entrar, enviarLinkDeRecuperacao,
  mensagemDeErro, salvarProgresso,
} from './conta.js'
import { SemConexao } from './cliente.js'

const auth = falso.cliente.auth
const ok = (data = {}) => Promise.resolve({ data, error: null })
const falha = (error) => Promise.resolve({ data: {}, error })

describe('conta', () => {
  beforeEach(() => vi.clearAllMocks())

  it('cadastrar manda apelido e endereço de volta, e avisa quando precisa confirmar', async () => {
    auth.signUp.mockReturnValue(ok({ user: { id: 'u1' }, session: null }))
    expect(await cadastrar({ email: ' ana@ex.com ', senha: '12345678', apelido: ' Ana ' })).toEqual({ precisaConfirmar: true })
    const pedido = auth.signUp.mock.calls[0][0]
    expect(pedido.email).toBe('ana@ex.com')
    expect(pedido.options.data).toEqual({ apelido: 'Ana' })
    expect(pedido.options.emailRedirectTo).toMatch(/\/$/)
  })

  it('senha errada vira mensagem calma', async () => {
    auth.signInWithPassword.mockReturnValue(falha({ code: 'invalid_credentials', status: 400, message: 'Invalid login credentials' }))
    const erro = await entrar({ email: 'a@b.com', senha: 'x' }).catch((e) => e)
    expect(erro).toBeInstanceOf(ErroDeConta)
    expect(mensagemDeErro(erro)).toBe('E-mail ou senha não conferem.')
  })

  it('sem internet vira SemConexao', async () => {
    auth.signInWithPassword.mockReturnValue(falha({ name: 'AuthRetryableFetchError', status: 0, message: 'Failed to fetch' }))
    const erro = await entrar({ email: 'a@b.com', senha: 'x' }).catch((e) => e)
    expect(erro).toBeInstanceOf(SemConexao)
    expect(mensagemDeErro(erro)).toMatch(/Sem conexão/)
  })

  it('recuperação manda o link de volta para o app', async () => {
    auth.resetPasswordForEmail.mockReturnValue(ok())
    await enviarLinkDeRecuperacao('ana@ex.com')
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('ana@ex.com', { redirectTo: expect.stringMatching(/\/$/) })
  })

  it('apagar conta chama a função do banco e encerra a sessão', async () => {
    falso.cliente.rpc.mockReturnValue(ok())
    auth.signOut.mockReturnValue(ok())
    await apagarConta()
    expect(falso.cliente.rpc).toHaveBeenCalledWith('apagar_minha_conta')
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
  })

  it('backup: busca a linha da conta e devolve null quando não existe', async () => {
    falso.consulta.maybeSingle.mockReturnValue(ok(null))
    expect(await buscarProgresso('u1')).toBeNull()
    expect(falso.consulta.eq).toHaveBeenCalledWith('usuario_id', 'u1')
    falso.consulta.maybeSingle.mockReturnValue(ok({ estado: { a: 1 }, atualizado_em: '2026-10-27T00:00:00Z' }))
    expect(await buscarProgresso('u1')).toEqual({ estado: { a: 1 }, atualizadoEm: '2026-10-27T00:00:00Z' })
  })

  it('backup: grava sem o celular da tripulação', async () => {
    falso.consulta.upsert.mockReturnValue(ok())
    await salvarProgresso('u1', {
      tela: 'inicio', atualizadoEm: '2026-10-27T10:00:00Z',
      tripulacao: [{ id: 'ana', nome: 'Ana', celular: '61999990000' }],
    })
    const linha = falso.consulta.upsert.mock.calls[0][0]
    expect(linha).toMatchObject({ usuario_id: 'u1', atualizado_em: '2026-10-27T10:00:00Z' })
    expect(JSON.stringify(linha)).not.toContain('61999990000')
  })
})
