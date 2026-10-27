// Backend do Terraformar · moderação AUTOMÁTICA da Luneta (antes de publicar).
//
// Regra do produto: a comunidade é anônima e segura. Antes de qualquer texto
// aparecer para outras pessoas, passamos por aqui. Funções puras: sem relógio,
// sem rede, sem guardar nada.
//
// Barra: links, valores em dinheiro, telefones/e-mails/@usuários, ofertas e
// nomes de plataformas de apostas. Se achar sinal de risco à vida, NÃO publica
// e devolve `risco: true` para a API abrir a Ajuda (CVV 188 e SAMU 192).

import { detectarRisco } from '../../src/conteudo/conteudo.js'

export const MAX_CARACTERES = 500

// Ofertas e "dicas" de aposta. Só termos GENÉRICOS: nomes de casas de apostas
// não entram no código (edital 8.4). Para barrar marcas, use a variável de
// ambiente MODERACAO_TERMOS_EXTRAS (ver config.js).
export const TERMOS_BLOQUEADOS = [
  'bonus de cadastro', 'bonus de boas-vindas', 'codigo promocional', 'codigo de bonus',
  'cadastre-se', 'cadastre se', 'rodadas gratis', 'giros gratis',
  'dica de aposta', 'dicas de aposta', 'sinais de aposta', 'palpite certo', 'ganho garantido',
]

// Tira acento e maiúscula para comparar ("Depósito" == "deposito").
const normalizar = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

// http://, https://, www. ou algo.com / algo.br / algo.bet ...
const REGEX_LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|bet|gov|edu|br|io|app|me|co)\b)/

// "R$ 50", "200 reais", "3 mil", "10 contos"... ("34 dias" NÃO entra).
const REGEX_VALOR = /r\$\s*\d|\d[\d.,]*\s*(reais|real|contos?|pilas?|mil)\b/

// Qualquer "@" colado em letra/número: e-mail ou @usuário.
const REGEX_ARROBA = /@\w/

// Telefone: some separadores ENTRE dígitos e procura 8+ dígitos seguidos.
// "(61) 9 9999-9999" vira "61999999999".
const juntarDigitos = (t) => t.replace(/(?<=\d)[\s().-]+(?=\d)/g, '')
const temTelefone = (t) => /\d{8,}/.test(juntarDigitos(t))

/**
 * Analisa um texto.
 * @param {unknown} texto
 * @param {{ termosExtras?: string[] }} [opcoes]
 * @returns {{ ok: boolean, motivos: string[], risco: boolean }}
 *   ok     → pode publicar
 *   motivos→ códigos do que precisa sair (ver MOTIVOS em mensagens.js)
 *   risco  → sinal de risco à vida (não publica; a API mostra a Ajuda)
 */
export function moderar(texto, { termosExtras = [] } = {}) {
  if (typeof texto !== 'string' || texto.trim() === '') {
    return { ok: false, motivos: ['vazio'], risco: false }
  }

  // Risco à vida tem prioridade sobre qualquer outra coisa.
  if (detectarRisco(texto)) return { ok: false, motivos: [], risco: true }

  const t = normalizar(texto)
  const motivos = []

  if (texto.length > MAX_CARACTERES) motivos.push('longo')
  if (REGEX_LINK.test(t)) motivos.push('link')
  if (REGEX_VALOR.test(t)) motivos.push('valor')
  if (REGEX_ARROBA.test(t) || temTelefone(t)) motivos.push('contato')

  const proibidos = [...TERMOS_BLOQUEADOS, ...termosExtras.map(normalizar)]
  if (proibidos.some((termo) => termo && t.includes(termo))) motivos.push('termo')

  return { ok: motivos.length === 0, motivos, risco: false }
}
