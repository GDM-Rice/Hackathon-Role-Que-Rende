// Testes da API de ponta a ponta: sobe o servidor numa porta aleatória e
// conversa por HTTP de verdade (fetch), com relógio fixo.
import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { criarApp } from '../src/app.js'
import { METAS, diasDeRecomeco } from '../../src/regras/regras.js'

const TOKEN = 'aparelho-de-teste-123456'
const OUTRO = 'outro-aparelho-654321-xx'
const RELOGIO_FIXO = () => new Date('2026-10-28T15:00:00')

async function iniciar(opcoes = {}) {
  const { servidor } = criarApp({ relogio: RELOGIO_FIXO, semear: false, ...opcoes })
  await new Promise((ok) => servidor.listen(0, ok))
  const base = `http://localhost:${servidor.address().port}`
  const chamar = async (metodo, caminho, { corpo, token, bruto } = {}) => {
    const headers = {}
    if (corpo !== undefined || bruto !== undefined) headers['Content-Type'] = 'application/json'
    if (token) headers['X-Planeta-Token'] = token
    const r = await fetch(base + caminho, {
      method: metodo,
      headers,
      body: bruto ?? (corpo === undefined ? undefined : JSON.stringify(corpo)),
    })
    const texto = await r.text()
    return { status: r.status, headers: r.headers, json: texto ? JSON.parse(texto) : null }
  }
  const fechar = () => new Promise((ok) => { servidor.close(ok); servidor.closeAllConnections() })
  return { chamar, fechar, base }
}

describe('conteúdo público', () => {
  let api
  before(async () => { api = await iniciar({ config: { limiteEscritaPorMinuto: 1000 } }) })
  after(() => api.fechar())

  test('GET /api/saude', async () => {
    const r = await api.chamar('GET', '/api/saude')
    assert.equal(r.status, 200)
    assert.equal(r.json.status, 'ok')
  })

  test('cabeçalhos de segurança e CORS', async () => {
    const r = await api.chamar('GET', '/api/saude')
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff')
    assert.equal(r.headers.get('cache-control'), 'no-store')
    assert.equal(r.headers.get('access-control-allow-origin'), 'http://localhost:5173')
  })

  test('OPTIONS responde 204 (pré-requisição do navegador)', async () => {
    const r = await fetch(`${api.base}/api/luneta/posts`, { method: 'OPTIONS' })
    assert.equal(r.status, 204)
    assert.match(r.headers.get('access-control-allow-headers'), /X-Planeta-Token/i)
  })

  test('GET /api/metas devolve as mesmas metas fixas do app', async () => {
    const r = await api.chamar('GET', '/api/metas')
    assert.deepEqual(r.json.terra.map((m) => [m.regiao, m.alvo]), METAS.map((m) => [m.regiao, m.alvo]))
    assert.deepEqual(r.json.terra.map((m) => m.alvo), [7, 14, 30, 60, 90])
    assert.equal(r.json.mar.limpando, 3)
    assert.equal(r.json.mar.limpo, 10)
    assert.equal(r.json.tripulacaoMaxima, 3)
  })

  test('GET /api/ajuda mantém a ordem fixa e desliga links não conferidos', async () => {
    const { servicos } = (await api.chamar('GET', '/api/ajuda')).json
    assert.deepEqual(servicos.map((s) => s.id), ['samu', 'cvv', 'caps', 'meuSus', 'ja', 'autoexclusao'])
    const cvv = servicos.find((s) => s.id === 'cvv')
    assert.equal(cvv.acao.valor, '188')
    assert.equal(cvv.acao.ativo, true)
    // Links A_CONFERIR viram botão desligado.
    assert.equal(servicos.find((s) => s.id === 'meuSus').acao.ativo, false)
    assert.equal(servicos.find((s) => s.id === 'ja').acao.ativo, false)
    // Toda linha de ajuda traz a fonte (e se já foi conferida).
    assert.ok(servicos.every((s) => s.fonte && typeof s.fonte.verificada === 'boolean'))
  })

  test('GET /api/fontes', async () => {
    const { fontes } = (await api.chamar('GET', '/api/fontes')).json
    assert.ok(fontes.some((f) => f.id === 'lei14181'))
    assert.ok(fontes.every((f) => typeof f.verificada === 'boolean'))
  })

  test('GET /api/demo/rafael: dia 21 e dados sintéticos', async () => {
    const r = await api.chamar('GET', '/api/demo/rafael?hoje=2026-10-28')
    assert.equal(r.status, 200)
    assert.equal(r.json.sintetico, true)
    assert.equal(r.json.estado.perfil.apelido, 'Rafael')
    assert.equal(diasDeRecomeco(r.json.estado, '2026-10-28'), 21)
  })

  test('demo sem "hoje" usa a data do relógio do servidor', async () => {
    const r = await api.chamar('GET', '/api/demo/rafael')
    assert.equal(r.json.estado.hoje.data, '2026-10-28')
  })

  test('demo com data inválida', async () => {
    for (const hoje of ['ontem', '2026-13-40', '2026-02-30']) {
      const r = await api.chamar('GET', `/api/demo/rafael?hoje=${hoje}`)
      assert.equal(r.status, 400, hoje)
      assert.equal(r.json.erro.codigo, 'data_invalida')
    }
  })

  test('rota inexistente e método errado', async () => {
    assert.equal((await api.chamar('GET', '/api/nada')).status, 404)
    const r = await api.chamar('POST', '/api/saude', { corpo: {} , token: TOKEN })
    assert.equal(r.status, 405)
    assert.match(r.headers.get('allow'), /GET/)
  })
})

describe('Luneta pela API', () => {
  let api
  before(async () => { api = await iniciar({ config: { limiteEscritaPorMinuto: 1000 } }) })
  after(() => api.fechar())

  test('constelações', async () => {
    const { constelacoes } = (await api.chamar('GET', '/api/luneta/constelacoes')).json
    assert.deepEqual(constelacoes.map((c) => c.id), ['primeiros-dias', 'dividas', 'familia', 'tempestades'])
  })

  test('escrever sem token é recusado', async () => {
    const r = await api.chamar('POST', '/api/luneta/posts', { corpo: { constelacao: 'dividas', texto: 'oi' } })
    assert.equal(r.status, 400)
    assert.equal(r.json.erro.codigo, 'token_invalido')
  })

  test('publicar, listar e responder', async () => {
    const criado = await api.chamar('POST', '/api/luneta/posts', {
      token: TOKEN, corpo: { constelacao: 'primeiros-dias', texto: 'Hoje consegui respirar e esperar passar.', dias: 2 },
    })
    assert.equal(criado.status, 201)
    assert.equal(criado.json.publicado, true)
    const id = criado.json.post.id

    const lista = await api.chamar('GET', '/api/luneta/posts?constelacao=primeiros-dias', { token: OUTRO })
    assert.equal(lista.json.posts.length, 1)
    assert.equal(lista.json.posts[0].minha, false)

    const resp = await api.chamar('POST', `/api/luneta/posts/${id}/respostas`, {
      token: OUTRO, corpo: { texto: 'Estou com você.' },
    })
    assert.equal(resp.status, 201)
    assert.equal(resp.json.post.respostas.length, 1)
  })

  test('"me identifico": o autor vê o total, os outros não', async () => {
    const criado = await api.chamar('POST', '/api/luneta/posts', {
      token: TOKEN, corpo: { constelacao: 'familia', texto: 'Conversei com a minha mãe.' },
    })
    const id = criado.json.post.id
    const r = await api.chamar('POST', `/api/luneta/posts/${id}/identifico`, { token: OUTRO })
    assert.deepEqual(r.json, { euMeIdentifico: true })

    const doAutor = (await api.chamar('GET', '/api/luneta/posts?constelacao=familia', { token: TOKEN })).json.posts[0]
    assert.equal(doAutor.identificacoes, 1)
    const publico = (await api.chamar('GET', '/api/luneta/posts?constelacao=familia')).json.posts[0]
    assert.equal('identificacoes' in publico, false)
  })

  test('moderação: 422 com motivos e mensagem sem bronca', async () => {
    const r = await api.chamar('POST', '/api/luneta/posts', {
      token: TOKEN, corpo: { constelacao: 'dividas', texto: 'perdi R$ 500, veja https://x.com' },
    })
    assert.equal(r.status, 422)
    assert.equal(r.json.erro.codigo, 'conteudo_nao_permitido')
    assert.deepEqual(r.json.erro.motivos.sort(), ['link', 'valor'])
    assert.ok(!/culpa|erro seu|fracasso/i.test(r.json.erro.mensagem))
  })

  test('risco à vida: 200, não publica e abre CVV 188 e SAMU 192', async () => {
    const antes = (await api.chamar('GET', '/api/luneta/posts')).json.posts.length
    const r = await api.chamar('POST', '/api/luneta/posts', {
      token: TOKEN, corpo: { constelacao: 'tempestades', texto: 'não aguento mais viver' },
    })
    assert.equal(r.status, 200)
    assert.equal(r.json.publicado, false)
    assert.equal(r.json.risco, true)
    assert.deepEqual(r.json.ajuda.map((s) => s.acao.valor), ['192', '188'])
    const depois = (await api.chamar('GET', '/api/luneta/posts')).json.posts.length
    assert.equal(depois, antes)
  })

  test('denúncias: 202 e, com 3 pessoas diferentes, o post some da lista', async () => {
    const criado = await api.chamar('POST', '/api/luneta/posts', {
      token: TOKEN, corpo: { constelacao: 'tempestades', texto: 'Post para denunciar.' },
    })
    const id = criado.json.post.id
    for (const t of ['denunciante-um-123456', 'denunciante-dois-12345', 'denunciante-tres-1234']) {
      const r = await api.chamar('POST', `/api/luneta/posts/${id}/denuncias`, { token: t, corpo: { motivo: 'golpe' } })
      assert.equal(r.status, 202)
    }
    const lista = (await api.chamar('GET', '/api/luneta/posts?constelacao=tempestades')).json.posts
    assert.ok(!lista.some((p) => p.id === id))
  })

  test('post inexistente é 404', async () => {
    const r = await api.chamar('POST', '/api/luneta/posts/nao-existe/identifico', { token: TOKEN })
    assert.equal(r.status, 404)
  })

  test('JSON inválido, corpo que não é objeto e corpo grande', async () => {
    const ruim = await api.chamar('POST', '/api/luneta/posts', { token: TOKEN, bruto: '{ isso nao e json' })
    assert.equal(ruim.status, 400)
    assert.equal(ruim.json.erro.codigo, 'json_invalido')

    const lista = await api.chamar('POST', '/api/luneta/posts', { token: TOKEN, bruto: '[1,2]' })
    assert.equal(lista.status, 400)

    const grande = await api.chamar('POST', '/api/luneta/posts', {
      token: TOKEN, corpo: { constelacao: 'dividas', texto: 'a'.repeat(20_000) },
    })
    assert.equal(grande.status, 413)
  })
})

describe('limite de ações por minuto', () => {
  test('a terceira escrita seguida recebe 429 com Retry-After', async () => {
    const api = await iniciar({ config: { limiteEscritaPorMinuto: 2 } })
    try {
      const post = () => api.chamar('POST', '/api/luneta/posts', {
        token: TOKEN, corpo: { constelacao: 'dividas', texto: 'oi' },
      })
      assert.equal((await post()).status, 201)
      assert.equal((await post()).status, 201)
      const r = await post()
      assert.equal(r.status, 429)
      assert.ok(Number(r.headers.get('retry-after')) >= 1)
      // Outro aparelho não é afetado.
      const outro = await api.chamar('POST', '/api/luneta/posts', {
        token: OUTRO, corpo: { constelacao: 'dividas', texto: 'oi' },
      })
      assert.equal(outro.status, 201)
    } finally {
      await api.fechar()
    }
  })

  test('leitura nunca é limitada', async () => {
    const api = await iniciar({ config: { limiteEscritaPorMinuto: 1 } })
    try {
      for (let i = 0; i < 10; i += 1) assert.equal((await api.chamar('GET', '/api/luneta/posts')).status, 200)
    } finally {
      await api.fechar()
    }
  })
})

describe('semear', () => {
  test('com semear: true a Luneta já abre com posts fictícios', async () => {
    const api = await iniciar({ semear: true })
    try {
      const { posts } = (await api.chamar('GET', '/api/luneta/posts')).json
      assert.equal(posts.length, 4)
    } finally {
      await api.fechar()
    }
  })
})
