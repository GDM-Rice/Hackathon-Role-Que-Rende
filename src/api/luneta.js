// Módulo 02 · funções da Luneta (comunidade anônima) usadas pelas telas.
// Rotas documentadas em docs/backend.md.

import { chamarApi } from './cliente.js'

const caminhoDoPost = (id) => `/luneta/posts/${encodeURIComponent(id)}`

export async function verificarSaude() {
  try {
    const r = await chamarApi('/saude', { comToken: false, tempoLimiteMs: 3000 })
    return r.status === 'ok'
  } catch {
    return false
  }
}

export async function listarConstelacoes() {
  const r = await chamarApi('/luneta/constelacoes', { comToken: false })
  return r.constelacoes
}

/** Mais novos primeiro. Com o token, o servidor marca os posts "minha". */
export async function listarPosts(constelacao) {
  const busca = constelacao ? `?constelacao=${encodeURIComponent(constelacao)}` : ''
  const r = await chamarApi(`/luneta/posts${busca}`)
  return r.posts
}

/**
 * Publica um post. `dias` é opcional: só vai se a pessoa escolher mostrar.
 * Devolve { publicado: true, post } ou { publicado: false, risco: true, ajuda }.
 */
export function publicarPost({ constelacao, texto, dias }) {
  const corpo = { constelacao, texto }
  if (Number.isInteger(dias)) corpo.dias = dias
  return chamarApi('/luneta/posts', { metodo: 'POST', corpo })
}

export function responderPost(id, texto) {
  return chamarApi(`${caminhoDoPost(id)}/respostas`, { metodo: 'POST', corpo: { texto } })
}

export function meIdentifico(id) {
  return chamarApi(`${caminhoDoPost(id)}/identifico`, { metodo: 'POST', corpo: {} })
}

export function denunciarPost(id, motivo) {
  return chamarApi(`${caminhoDoPost(id)}/denuncias`, { metodo: 'POST', corpo: { motivo } })
}
