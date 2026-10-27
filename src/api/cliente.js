// Módulo 02 · ÚNICO ponto do front que fala com o backend.
// Nenhuma tela chama fetch direto: use as funções de src/api/luneta.js.
//
// Endereço: em desenvolvimento, "/api" (o Vite encaminha para a porta 3001).
// No build, defina VITE_API_URL (ex.: https://api.exemplo.org) se a API
// estiver em outro endereço.

import { obterToken } from './token.js'

export const BASE_API = `${(import.meta.env?.VITE_API_URL ?? '').replace(/\/+$/, '')}/api`
export const TEMPO_LIMITE_MS = 8000

/** A API respondeu com um erro dela ({ erro: { codigo, mensagem, ... } }). */
export class ErroDaApi extends Error {
  constructor(status, { codigo, mensagem, ...extra }) {
    super(mensagem)
    this.name = 'ErroDaApi'
    this.status = status
    this.codigo = codigo
    this.motivos = extra.motivos ?? []
    this.detalhes = extra.detalhes ?? []
  }
}

/** Não deu para falar com a API (sem internet, servidor desligado, demorou). */
export class SemConexao extends Error {
  constructor(causa) {
    super('Sem conexão com o servidor.')
    this.name = 'SemConexao'
    this.cause = causa
  }
}

/**
 * Chama a API e devolve o JSON da resposta.
 * Lança ErroDaApi (erro de regra, ex.: moderação) ou SemConexao.
 */
export async function chamarApi(caminho, { metodo = 'GET', corpo, comToken = true, tempoLimiteMs = TEMPO_LIMITE_MS } = {}) {
  const headers = { Accept: 'application/json' }
  if (corpo !== undefined) headers['Content-Type'] = 'application/json'
  if (comToken) headers['X-Planeta-Token'] = obterToken()

  const controle = new AbortController()
  const relogio = setTimeout(() => controle.abort(), tempoLimiteMs)

  let resposta
  try {
    resposta = await fetch(`${BASE_API}${caminho}`, {
      method: metodo,
      headers,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      signal: controle.signal,
      credentials: 'omit',
      cache: 'no-store',
    })
  } catch (e) {
    throw new SemConexao(e)
  } finally {
    clearTimeout(relogio)
  }

  // Resposta que não é JSON (ex.: proxy sem backend, página do service worker)
  // conta como "sem conexão": a tela mostra o aviso calmo.
  let json
  try {
    json = await resposta.json()
  } catch (e) {
    throw new SemConexao(e)
  }

  if (!resposta.ok) {
    if (json?.erro) throw new ErroDaApi(resposta.status, json.erro)
    throw new SemConexao(new Error(`HTTP ${resposta.status}`))
  }
  return json
}
