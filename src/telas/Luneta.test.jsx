import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import Luneta from './Luneta.jsx'
import { EstadoProvider } from '../estado/EstadoContext.jsx'
import { estadoDoRafael } from '../demo/demo.js'
import { hojeISO } from '../util/datas.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const json = (status, corpo) => ({ ok: status < 300, status, json: async () => corpo })
const CONSTELACOES = [{ id: 'familia', nome: 'Família' }, { id: 'dividas', nome: 'Dívidas' }]
const POST = {
  id: 'p1', constelacao: 'familia', planeta: { nome: 'Jade-42', dias: 12 }, texto: 'Contei para a minha irmã.',
  criadoEm: '2026-10-27T12:00:00Z', respostas: [], minha: false, euMeIdentifico: false,
}

/** Responde como o backend: GET constelações/posts e o que vier em `extra`. */
function backendFalso(extra = {}) {
  return vi.fn(async (url, opcoes = {}) => {
    const chave = `${opcoes.method ?? 'GET'} ${url.split('?')[0]}`
    if (extra[chave]) return extra[chave](opcoes)
    if (chave === 'GET /api/luneta/constelacoes') return json(200, { constelacoes: CONSTELACOES })
    if (chave === 'GET /api/luneta/posts') return json(200, { posts: [POST] })
    throw new Error(`rota inesperada: ${chave}`)
  })
}

async function montar() {
  const el = document.createElement('main')
  document.body.replaceChildren(el)
  const inicial = { ...estadoDoRafael(hojeISO()), tela: 'luneta' }
  await act(async () => {
    createRoot(el).render(<EstadoProvider inicial={inicial}><Luneta /></EstadoProvider>)
  })
  return el
}

const botao = (el, texto) => [...el.querySelectorAll('button')].find((b) => b.textContent.trim() === texto)

async function escreverEPublicar(el, texto) {
  const area = el.querySelector('form textarea')
  const definir = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set
  await act(async () => {
    definir.call(area, texto)
    area.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(async () => {
    el.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
}

describe('tela Luneta', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.unstubAllGlobals())

  it('mostra constelações e posts vindos do backend', async () => {
    vi.stubGlobal('fetch', backendFalso())
    const el = await montar()
    expect(el.textContent).toContain('Planeta Jade-42')
    expect(el.textContent).toContain('12 dias')
    expect(botao(el, 'Família').getAttribute('aria-pressed')).toBe('false')
  })

  it('sem backend: aviso calmo e botão para tentar de novo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const el = await montar()
    expect(el.textContent).toContain('A Luneta precisa de internet')
    expect(botao(el, 'Tentar de novo')).toBeTruthy()
  })

  it('publica e coloca o post no topo da lista', async () => {
    const novo = { ...POST, id: 'p2', texto: 'Hoje foi melhor.', minha: true, planeta: { nome: 'Anil-11', dias: null } }
    const fetchFalso = backendFalso({ 'POST /api/luneta/posts': () => json(201, { publicado: true, post: novo }) })
    vi.stubGlobal('fetch', fetchFalso)
    const el = await montar()
    await escreverEPublicar(el, 'Hoje foi melhor.')
    expect(el.textContent).toContain('Publicado. Obrigado por dividir.')
    expect(el.querySelector('article').textContent).toContain('Hoje foi melhor.')
    const corpo = JSON.parse(fetchFalso.mock.calls.find(([, o]) => o?.method === 'POST')[1].body)
    expect(corpo).not.toHaveProperty('dias') // só vai se a pessoa marcar
  })

  it('moderação do backend: mostra o que precisa sair, sem bronca', async () => {
    vi.stubGlobal('fetch', backendFalso({
      'POST /api/luneta/posts': () => json(422, {
        erro: { codigo: 'conteudo_nao_permitido', mensagem: 'Não foi possível publicar.', motivos: ['link'], detalhes: ['Tire os links ou endereços de sites.'] },
      }),
    }))
    const el = await montar()
    await escreverEPublicar(el, 'olhem www.exemplo.com')
    expect(el.textContent).toContain('Tire os links ou endereços de sites.')
  })

  it('texto com risco à vida não sai do aparelho e mostra a ajuda', async () => {
    const fetchFalso = backendFalso()
    vi.stubGlobal('fetch', fetchFalso)
    const el = await montar()
    await escreverEPublicar(el, 'quero me matar')
    expect(fetchFalso.mock.calls.some(([, o]) => o?.method === 'POST')).toBe(false)
    expect(el.textContent).toContain('CVV 188')
    expect(el.textContent).toContain('Esse texto não foi publicado')
  })
})
