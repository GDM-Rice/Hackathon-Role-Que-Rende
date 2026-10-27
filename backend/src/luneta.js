// Backend do Terraformar · Luneta (comunidade anônima), tudo em memória.
//
// O que a Luneta é: planetas anônimos ("Planeta Turquesa-27 · 34 dias") que
// conversam em constelações por tópico. Regras do produto que este módulo cumpre:
//   • sem ranking e sem curtida pública: posts em ordem cronológica, e a
//     contagem de "Me identifico" só aparece para QUEM ESCREVEU o post;
//   • anonimato: o aparelho gera um token aleatório. Guardamos só o HASH dele
//     (nunca o token, nunca IP, nunca nome). O nome do planeta sai do hash;
//   • moderação automática ANTES de publicar (moderacao.js);
//   • denúncia: com N pessoas diferentes denunciando, o post some até revisão
//     humana (não apagamos nada: fica retido);
//   • nada de notificação: o servidor nunca avisa ninguém.
//
// Os dados ficam só na memória do servidor e somem ao reiniciar. Um piloto real
// precisaria de banco de dados e moderação humana (ver docs/backend.md).

import { createHash, randomUUID } from 'node:crypto'
import { ErroApi } from './erro.js'
import { MENSAGENS, MOTIVOS } from './mensagens.js'
import { moderar } from './moderacao.js'
import { ajudaDeRisco } from './conteudoPublico.js'

export const CONSTELACOES = [
  { id: 'primeiros-dias', nome: 'Primeiros dias' },
  { id: 'dividas', nome: 'Dívidas' },
  { id: 'familia', nome: 'Família' },
  { id: 'tempestades', nome: 'Tempestades' },
]

export const MOTIVOS_DENUNCIA = ['link', 'golpe', 'ofensivo', 'risco', 'outro']

// Cores só de tons calmos (sem vermelho, regra do design system).
const CORES = ['Turquesa', 'Anil', 'Jade', 'Ocre', 'Lilás', 'Areia', 'Musgo', 'Marinho']

/** Hash (SHA-256) do token. É só ele que o servidor guarda. */
export const hashDe = (token) => createHash('sha256').update(token).digest('hex')

/** Nome estável do planeta a partir do hash: "Turquesa-27". */
export function nomeDoPlaneta(hash) {
  const cor = CORES[parseInt(hash.slice(0, 4), 16) % CORES.length]
  const numero = 10 + (parseInt(hash.slice(4, 8), 16) % 90)
  return `${cor}-${numero}`
}

/** O token é gerado pelo aparelho: 16 a 64 caracteres [A-Za-z0-9_-]. */
export function tokenValido(token) {
  return typeof token === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(token)
}

function validarToken(token) {
  if (!tokenValido(token)) throw new ErroApi(400, 'token_invalido', MENSAGENS.tokenInvalido)
  return hashDe(token)
}

/** "dias de recomeço" que a pessoa quer mostrar ao lado do planeta (opcional). */
function validarDias(dias) {
  if (dias === undefined || dias === null) return null
  if (!Number.isInteger(dias) || dias < 0 || dias > 3650) {
    throw new ErroApi(400, 'dias_invalidos', MENSAGENS.diasInvalidos)
  }
  return dias
}

function validarConstelacao(id) {
  if (!CONSTELACOES.some((c) => c.id === id)) {
    throw new ErroApi(400, 'constelacao_invalida', MENSAGENS.constelacaoInvalida)
  }
}

// Posts fictícios para a demo (todos passam pela moderação; há teste para isso).
const SEMENTES = [
  { constelacao: 'tempestades', dias: 21, horasAtras: 5, texto: 'Tive um dia de tempestade ontem. Hoje o céu abriu e eu voltei. Isso conta.' },
  { constelacao: 'familia', dias: 12, horasAtras: 26, texto: 'Contei para a minha irmã. Ela não julgou, só perguntou como podia ajudar.' },
  { constelacao: 'dividas', dias: 34, horasAtras: 50, texto: 'Liguei para negociar a primeira dívida. Foi mais leve do que eu imaginava. Se você está adiando, o primeiro passo é só ligar.' },
  { constelacao: 'primeiros-dias', dias: 3, horasAtras: 74, texto: 'Hoje foi o terceiro dia. A noite foi a parte mais difícil, mas respirar com calma ajudou.' },
]

/**
 * Cria a Luneta.
 * @param {{ relogio?: () => Date, config: object, semear?: boolean }} opcoes
 */
export function criarLuneta({ relogio = () => new Date(), config, semear = false }) {
  const posts = [] // do mais antigo para o mais novo

  /** O que o front vê de um post. `hash` = quem está olhando (ou undefined). */
  function visao(post, hash) {
    const minha = Boolean(hash) && post.autorHash === hash
    return {
      id: post.id,
      constelacao: post.constelacao,
      planeta: { nome: post.planeta, dias: post.dias },
      texto: post.texto,
      criadoEm: post.criadoEm,
      respostas: post.respostas.map((r) => ({
        id: r.id, planeta: { nome: r.planeta }, texto: r.texto, criadoEm: r.criadoEm,
      })),
      minha,
      euMeIdentifico: Boolean(hash) && post.identificacoes.has(hash),
      // Só quem escreveu vê quantas pessoas se identificaram. Sem contagem pública.
      ...(minha ? { identificacoes: post.identificacoes.size } : {}),
    }
  }

  function acharPost(id) {
    const post = posts.find((p) => p.id === id && !p.oculto)
    if (!post) throw new ErroApi(404, 'nao_encontrado', MENSAGENS.naoEncontrado)
    return post
  }

  /** Passa pela moderação. Devolve null se pode publicar, ou a resposta pronta. */
  function barrar(texto) {
    const r = moderar(texto, { termosExtras: config.termosExtras })
    if (r.risco) {
      // Não publica, não salva o texto: só abre a Ajuda. Sem julgamento.
      return { publicado: false, risco: true, ajuda: ajudaDeRisco() }
    }
    if (!r.ok) {
      throw new ErroApi(422, 'conteudo_nao_permitido', MENSAGENS.conteudoNaoPermitido, {
        motivos: r.motivos,
        detalhes: r.motivos.map((m) => MOTIVOS[m]),
      })
    }
    return null
  }

  function guardar(post) {
    posts.push(post)
    // Passou do teto: tira o mais antigo que não seja de demonstração.
    if (posts.length > config.maxPosts) {
      const i = posts.findIndex((p) => !p.semente)
      if (i >= 0) posts.splice(i, 1)
    }
  }

  const api = {
    listarConstelacoes: () => CONSTELACOES,

    /** Mais novos primeiro. Sem ordenar por popularidade (não existe). */
    listarPosts({ constelacao, token } = {}) {
      if (constelacao) validarConstelacao(constelacao)
      const hash = tokenValido(token) ? hashDe(token) : undefined
      return [...posts]
        .reverse()
        .filter((p) => !p.oculto && (!constelacao || p.constelacao === constelacao))
        .slice(0, config.postsPorPagina)
        .map((p) => visao(p, hash))
    },

    criarPost({ token, constelacao, texto, dias }) {
      const hash = validarToken(token)
      validarConstelacao(constelacao)
      const diasOk = validarDias(dias)
      const bloqueio = barrar(texto)
      if (bloqueio) return bloqueio

      const post = {
        id: randomUUID(),
        constelacao,
        texto: texto.trim(),
        dias: diasOk,
        autorHash: hash,
        planeta: nomeDoPlaneta(hash),
        criadoEm: relogio().toISOString(),
        respostas: [],
        identificacoes: new Set(),
        denuncias: new Map(), // hash de quem denunciou -> motivo
        oculto: false,
        semente: false,
      }
      guardar(post)
      return { publicado: true, post: visao(post, hash) }
    },

    responder({ token, postId, texto }) {
      const hash = validarToken(token)
      const post = acharPost(postId)
      if (post.respostas.length >= config.maxRespostas) {
        throw new ErroApi(422, 'limite_respostas', MENSAGENS.limiteRespostas)
      }
      const bloqueio = barrar(texto)
      if (bloqueio) return bloqueio

      post.respostas.push({
        id: randomUUID(), texto: texto.trim(), planeta: nomeDoPlaneta(hash), criadoEm: relogio().toISOString(),
      })
      return { publicado: true, post: visao(post, hash) }
    },

    /** "Me identifico": uma vez por pessoa (repetir não soma). Só o autor vê o total. */
    identificar({ token, postId }) {
      const hash = validarToken(token)
      acharPost(postId).identificacoes.add(hash)
      return { euMeIdentifico: true }
    },

    /** Denúncia: uma por pessoa. Com N pessoas diferentes, o post fica retido. */
    denunciar({ token, postId, motivo = 'outro' }) {
      const hash = validarToken(token)
      const post = acharPost(postId)
      post.denuncias.set(hash, MOTIVOS_DENUNCIA.includes(motivo) ? motivo : 'outro')
      if (post.denuncias.size >= config.denunciasParaOcultar) post.oculto = true
      // Não contamos se o post sumiu: quem denuncia não precisa saber disso.
      return { recebida: true }
    },

    /** Fila para revisão humana (ainda sem endpoint: exigiria login de moderador). */
    pendentesDeRevisao: () =>
      posts.filter((p) => p.oculto).map((p) => ({
        id: p.id, constelacao: p.constelacao, motivos: [...p.denuncias.values()],
      })),
  }

  if (semear) {
    // Do mais antigo para o mais novo, para a ordem da lista ficar certa.
    SEMENTES.slice().reverse().forEach((s, i) => {
      const hash = hashDe(`semente-${i}`)
      posts.push({
        id: randomUUID(),
        constelacao: s.constelacao,
        texto: s.texto,
        dias: s.dias,
        autorHash: hash,
        planeta: nomeDoPlaneta(hash),
        criadoEm: new Date(relogio().getTime() - s.horasAtras * 3_600_000).toISOString(),
        respostas: [],
        identificacoes: new Set(),
        denuncias: new Map(),
        oculto: false,
        semente: true,
      })
    })
  }

  return api
}

export const textosDeSemente = () => SEMENTES.map((s) => s.texto)
