// Testes das regras da Luneta (sem HTTP): anonimato, moderação, denúncia, ordem.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { criarLuneta, hashDe, nomeDoPlaneta, textosDeSemente, CONSTELACOES } from '../src/luneta.js'
import { moderar } from '../src/moderacao.js'
import { config as configPadrao } from '../src/config.js'

const TOKEN_A = 'token-da-pessoa-A-123456'
const TOKEN_B = 'token-da-pessoa-B-123456'
const TOKEN_C = 'token-da-pessoa-C-123456'
const TOKEN_D = 'token-da-pessoa-D-123456'

function nova({ semear = false, config = {}, hora = '2026-10-28T12:00:00Z' } = {}) {
  let t = new Date(hora).getTime()
  const relogio = () => new Date(t)
  const avancar = (ms) => { t += ms }
  return { luneta: criarLuneta({ relogio, semear, config: { ...configPadrao, ...config } }), avancar }
}

const publicar = (luneta, token = TOKEN_A, texto = 'Hoje eu voltei.') =>
  luneta.criarPost({ token, constelacao: 'tempestades', texto, dias: 5 })

describe('publicar', () => {
  test('publica e devolve o post com planeta anônimo', () => {
    const { luneta } = nova()
    const r = publicar(luneta)
    assert.equal(r.publicado, true)
    assert.equal(r.post.texto, 'Hoje eu voltei.')
    assert.match(r.post.planeta.nome, /^[A-Za-zÀ-ú]+-\d{2}$/)
    assert.equal(r.post.planeta.dias, 5)
  })

  test('o nome do planeta é sempre o mesmo para o mesmo aparelho', () => {
    assert.equal(nomeDoPlaneta(hashDe(TOKEN_A)), nomeDoPlaneta(hashDe(TOKEN_A)))
  })

  test('o token nunca aparece na resposta', () => {
    const { luneta } = nova()
    const r = publicar(luneta)
    assert.ok(!JSON.stringify(r).includes(TOKEN_A))
    assert.ok(!JSON.stringify(luneta.listarPosts({ token: TOKEN_A })).includes(TOKEN_A))
  })

  test('token inválido é recusado', () => {
    const { luneta } = nova()
    assert.throws(() => luneta.criarPost({ token: 'curto', constelacao: 'dividas', texto: 'oi' }), { codigo: 'token_invalido' })
  })

  test('constelação inexistente é recusada', () => {
    const { luneta } = nova()
    assert.throws(() => luneta.criarPost({ token: TOKEN_A, constelacao: 'x', texto: 'oi' }), { codigo: 'constelacao_invalida' })
  })

  test('dias: aceita vazio, recusa negativo, decimal e exagero', () => {
    const { luneta } = nova()
    assert.equal(luneta.criarPost({ token: TOKEN_A, constelacao: 'dividas', texto: 'oi' }).post.planeta.dias, null)
    for (const dias of [-1, 1.5, 4000, '10']) {
      assert.throws(() => luneta.criarPost({ token: TOKEN_A, constelacao: 'dividas', texto: 'oi', dias }), { codigo: 'dias_invalidos' })
    }
  })
})

describe('moderação na publicação', () => {
  test('texto barrado vira erro 422 com os motivos, e não é publicado', () => {
    const { luneta } = nova()
    assert.throws(
      () => publicar(luneta, TOKEN_A, 'olha https://x.com'),
      (e) => e.status === 422 && e.extra.motivos.includes('link'),
    )
    assert.equal(luneta.listarPosts().length, 0)
  })

  test('risco à vida: não publica, não guarda e devolve SAMU 192 e CVV 188', () => {
    const { luneta } = nova()
    const r = publicar(luneta, TOKEN_A, 'eu quero morrer')
    assert.equal(r.publicado, false)
    assert.equal(r.risco, true)
    assert.deepEqual(r.ajuda.map((s) => s.id), ['samu', 'cvv'])
    assert.equal(luneta.listarPosts().length, 0)
  })

  test('as respostas também passam pela moderação', () => {
    const { luneta } = nova()
    const { post } = publicar(luneta)
    assert.throws(() => luneta.responder({ token: TOKEN_B, postId: post.id, texto: 'liga (61) 99999-9999' }), { codigo: 'conteudo_nao_permitido' })
    const r = luneta.responder({ token: TOKEN_B, postId: post.id, texto: 'Estou com você.' })
    assert.equal(r.post.respostas.length, 1)
  })

  test('limite de respostas por post', () => {
    const { luneta } = nova({ config: { maxRespostas: 2 } })
    const { post } = publicar(luneta)
    luneta.responder({ token: TOKEN_B, postId: post.id, texto: 'um' })
    luneta.responder({ token: TOKEN_B, postId: post.id, texto: 'dois' })
    assert.throws(() => luneta.responder({ token: TOKEN_B, postId: post.id, texto: 'três' }), { codigo: 'limite_respostas' })
  })
})

describe('sem ranking e sem curtida pública', () => {
  test('lista do mais novo para o mais antigo, sem ordenar por popularidade', () => {
    const { luneta, avancar } = nova()
    publicar(luneta, TOKEN_A, 'primeiro')
    avancar(1000)
    const segundo = publicar(luneta, TOKEN_B, 'segundo')
    luneta.identificar({ token: TOKEN_C, postId: segundo.post.id })
    avancar(1000)
    publicar(luneta, TOKEN_C, 'terceiro')
    assert.deepEqual(luneta.listarPosts().map((p) => p.texto), ['terceiro', 'segundo', 'primeiro'])
  })

  test('"Me identifico" não soma duas vezes e só o autor vê o total', () => {
    const { luneta } = nova()
    const { post } = publicar(luneta, TOKEN_A)
    luneta.identificar({ token: TOKEN_B, postId: post.id })
    luneta.identificar({ token: TOKEN_B, postId: post.id })
    luneta.identificar({ token: TOKEN_C, postId: post.id })

    const doAutor = luneta.listarPosts({ token: TOKEN_A })[0]
    assert.equal(doAutor.minha, true)
    assert.equal(doAutor.identificacoes, 2)

    const deOutra = luneta.listarPosts({ token: TOKEN_B })[0]
    assert.equal(deOutra.minha, false)
    assert.equal('identificacoes' in deOutra, false)
    assert.equal(deOutra.euMeIdentifico, true)

    const anonimo = luneta.listarPosts()[0]
    assert.equal('identificacoes' in anonimo, false)
  })

  test('filtra por constelação', () => {
    const { luneta } = nova()
    luneta.criarPost({ token: TOKEN_A, constelacao: 'dividas', texto: 'a' })
    luneta.criarPost({ token: TOKEN_A, constelacao: 'familia', texto: 'b' })
    assert.deepEqual(luneta.listarPosts({ constelacao: 'familia' }).map((p) => p.texto), ['b'])
    assert.throws(() => luneta.listarPosts({ constelacao: 'x' }), { codigo: 'constelacao_invalida' })
  })
})

describe('denúncias', () => {
  test('3 pessoas DIFERENTES escondem o post (não apaga: fica para revisão)', () => {
    const { luneta } = nova()
    const { post } = publicar(luneta, TOKEN_A)
    luneta.denunciar({ token: TOKEN_B, postId: post.id, motivo: 'golpe' })
    luneta.denunciar({ token: TOKEN_C, postId: post.id })
    assert.equal(luneta.listarPosts().length, 1)
    luneta.denunciar({ token: TOKEN_D, postId: post.id, motivo: 'qualquer-coisa' })
    assert.equal(luneta.listarPosts().length, 0)
    assert.deepEqual(luneta.pendentesDeRevisao(), [
      { id: post.id, constelacao: 'tempestades', motivos: ['golpe', 'outro', 'outro'] },
    ])
  })

  test('a mesma pessoa denunciando várias vezes conta uma só', () => {
    const { luneta } = nova()
    const { post } = publicar(luneta, TOKEN_A)
    for (let i = 0; i < 5; i += 1) luneta.denunciar({ token: TOKEN_B, postId: post.id })
    assert.equal(luneta.listarPosts().length, 1)
  })

  test('post escondido não aceita resposta nem "me identifico"', () => {
    const { luneta } = nova({ config: { denunciasParaOcultar: 1 } })
    const { post } = publicar(luneta)
    luneta.denunciar({ token: TOKEN_B, postId: post.id })
    assert.throws(() => luneta.responder({ token: TOKEN_C, postId: post.id, texto: 'oi' }), { codigo: 'nao_encontrado' })
    assert.throws(() => luneta.identificar({ token: TOKEN_C, postId: post.id }), { codigo: 'nao_encontrado' })
  })
})

describe('memória limitada e demonstração', () => {
  test('passou do teto, sai o post mais antigo', () => {
    const { luneta, avancar } = nova({ config: { maxPosts: 2 } })
    publicar(luneta, TOKEN_A, 'um')
    avancar(1000)
    publicar(luneta, TOKEN_A, 'dois')
    avancar(1000)
    publicar(luneta, TOKEN_A, 'três')
    assert.deepEqual(luneta.listarPosts().map((p) => p.texto), ['três', 'dois'])
  })

  test('posts de demonstração nunca são os removidos pelo teto', () => {
    const { luneta } = nova({ semear: true, config: { maxPosts: 5 } })
    for (let i = 0; i < 4; i += 1) publicar(luneta, TOKEN_A, `post ${i}`)
    const textos = luneta.listarPosts().map((p) => p.texto)
    for (const semente of textosDeSemente()) assert.ok(textos.includes(semente))
  })

  test('todos os posts de demonstração passam pela própria moderação', () => {
    for (const texto of textosDeSemente()) assert.equal(moderar(texto).ok, true, texto)
  })

  test('semear cria posts fictícios nas constelações certas', () => {
    const { luneta } = nova({ semear: true })
    const posts = luneta.listarPosts()
    assert.equal(posts.length, textosDeSemente().length)
    const ids = CONSTELACOES.map((c) => c.id)
    assert.ok(posts.every((p) => ids.includes(p.constelacao)))
  })
})
