import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CHAVE_TOKEN, apagarToken, gerarToken, obterToken } from './token.js'
import { ErroDaApi, SemConexao, chamarApi } from './cliente.js'
import { denunciarPost, listarPosts, publicarPost, verificarSaude } from './luneta.js'

function respostaJson(status, corpo) {
  return { ok: status >= 200 && status < 300, status, json: async () => corpo }
}

describe('token anônimo', () => {
  beforeEach(() => localStorage.clear())

  it('gera 32 caracteres aceitos pelo backend', () => {
    expect(gerarToken()).toMatch(/^[A-Za-z0-9_-]{32}$/)
    expect(gerarToken()).not.toBe(gerarToken())
  })

  it('é o mesmo enquanto não apagar os dados', () => {
    const a = obterToken()
    expect(obterToken()).toBe(a)
    expect(localStorage.getItem(CHAVE_TOKEN)).toBe(a)
    apagarToken()
    expect(localStorage.getItem(CHAVE_TOKEN)).toBeNull()
    expect(obterToken()).not.toBe(a)
  })
})

describe('chamarApi', () => {
  let fetchFalso
  beforeEach(() => {
    fetchFalso = vi.fn()
    vi.stubGlobal('fetch', fetchFalso)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('chama /api com o token anônimo e devolve o JSON', async () => {
    fetchFalso.mockResolvedValue(respostaJson(200, { ok: 1 }))
    expect(await chamarApi('/luneta/posts')).toEqual({ ok: 1 })
    const [url, opcoes] = fetchFalso.mock.calls[0]
    expect(url).toBe('/api/luneta/posts')
    expect(opcoes.headers['X-Planeta-Token']).toMatch(/^[A-Za-z0-9_-]{32}$/)
    expect(opcoes.credentials).toBe('omit')
  })

  it('envia o corpo em JSON', async () => {
    fetchFalso.mockResolvedValue(respostaJson(201, { publicado: true }))
    await publicarPost({ constelacao: 'familia', texto: 'oi', dias: 3 })
    const [, opcoes] = fetchFalso.mock.calls[0]
    expect(opcoes.method).toBe('POST')
    expect(JSON.parse(opcoes.body)).toEqual({ constelacao: 'familia', texto: 'oi', dias: 3 })
  })

  it('não envia dias quando a pessoa não quis mostrar', async () => {
    fetchFalso.mockResolvedValue(respostaJson(201, { publicado: true }))
    await publicarPost({ constelacao: 'familia', texto: 'oi', dias: null })
    expect(JSON.parse(fetchFalso.mock.calls[0][1].body)).toEqual({ constelacao: 'familia', texto: 'oi' })
  })

  it('erro da API vira ErroDaApi com motivos', async () => {
    fetchFalso.mockResolvedValue(respostaJson(422, {
      erro: { codigo: 'conteudo_nao_permitido', mensagem: 'Não foi possível publicar.', motivos: ['link'], detalhes: ['Tire os links.'] },
    }))
    const erro = await publicarPost({ constelacao: 'familia', texto: 'x' }).catch((e) => e)
    expect(erro).toBeInstanceOf(ErroDaApi)
    expect(erro.codigo).toBe('conteudo_nao_permitido')
    expect(erro.detalhes).toEqual(['Tire os links.'])
  })

  it('sem internet vira SemConexao', async () => {
    fetchFalso.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(listarPosts()).rejects.toBeInstanceOf(SemConexao)
  })

  it('resposta que não é JSON (backend desligado) vira SemConexao', async () => {
    fetchFalso.mockResolvedValue({ ok: false, status: 502, json: async () => { throw new SyntaxError() } })
    await expect(listarPosts()).rejects.toBeInstanceOf(SemConexao)
  })

  it('verificarSaude nunca lança', async () => {
    fetchFalso.mockRejectedValue(new TypeError('offline'))
    expect(await verificarSaude()).toBe(false)
    fetchFalso.mockResolvedValue(respostaJson(200, { status: 'ok' }))
    expect(await verificarSaude()).toBe(true)
  })

  it('ids entram codificados na rota', async () => {
    fetchFalso.mockResolvedValue(respostaJson(202, { recebida: true }))
    await denunciarPost('a/b', 'golpe')
    expect(fetchFalso.mock.calls[0][0]).toBe('/api/luneta/posts/a%2Fb/denuncias')
  })
})
