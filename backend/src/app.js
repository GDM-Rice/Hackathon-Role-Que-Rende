// Backend do Terraformar · servidor HTTP e rotas.
//
// Usa só o que já vem no Node (node:http): nenhuma biblioteca nova para
// instalar, licenciar ou declarar no edital. `criarApp` NÃO abre porta: devolve
// o servidor para o servidor.js (uso real) ou para os testes (porta aleatória).
//
// Privacidade (CLAUDE.md, seção 2): os dados pessoais da pessoa (perfil,
// finanças, Marés, tripulação) continuam SÓ no celular. A API nunca os recebe.
// O que ela guarda é apenas o que a pessoa escolhe publicar na Luneta, de forma
// anônima. Não registramos corpo de requisição, IP nem token em log.

import { createServer } from 'node:http'
import { config as configPadrao } from './config.js'
import { ErroApi } from './erro.js'
import { MENSAGENS } from './mensagens.js'
import { criarLimitador } from './limitador.js'
import { criarLuneta, hashDe, tokenValido } from './luneta.js'
import { fontesPublicas, metasPublicas, servicosDeAjuda } from './conteudoPublico.js'
import { estadoDoRafael } from '../../src/demo/demo.js'
import { hojeISO } from '../../src/util/datas.js'

// Data ISO real ("2026-10-28"). Rejeita formato errado e datas que não existem
// ("2026-13-40" e "2026-02-30"). Cuidado: toISOString() LANÇA erro em data
// inválida, por isso checamos Number.isNaN antes.
function dataValida(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false
  const d = new Date(`${iso}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso
}

/** Declara uma rota. ":id" no caminho vira parâmetro. `escrita` = exige token e passa pelo limitador. */
function rota(metodo, caminho, tratar, { escrita = metodo === 'POST' } = {}) {
  const nomes = []
  const regex = new RegExp(
    `^${caminho.replace(/:([a-zA-Z]+)/g, (_, nome) => { nomes.push(nome); return '([^/]+)' })}$`,
  )
  return { metodo, regex, nomes, tratar, escrita }
}

/** Lê o corpo (JSON) respeitando o tamanho máximo. Sem corpo = {}. */
function lerCorpo(req, limite) {
  return new Promise((resolve, reject) => {
    const partes = []
    let total = 0
    let estourou = false
    req.on('data', (parte) => {
      if (estourou) return
      total += parte.length
      if (total > limite) {
        estourou = true
        partes.length = 0
        return
      }
      partes.push(parte)
    })
    req.on('error', reject)
    req.on('end', () => {
      if (estourou) return reject(new ErroApi(413, 'corpo_grande', MENSAGENS.corpoGrande))
      const texto = Buffer.concat(partes).toString('utf8').trim()
      if (!texto) return resolve({})
      try {
        const json = JSON.parse(texto)
        if (json === null || typeof json !== 'object' || Array.isArray(json)) throw new Error('não é objeto')
        resolve(json)
      } catch {
        reject(new ErroApi(400, 'json_invalido', MENSAGENS.jsonInvalido))
      }
    })
  })
}

function responder(res, status, corpo) {
  const texto = JSON.stringify(corpo)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(texto),
  })
  res.end(texto)
}

/**
 * Monta o app.
 * @param {{ config?: object, relogio?: () => Date, semear?: boolean }} [opcoes]
 *   `relogio` e `semear` existem para os testes controlarem a hora e os dados.
 */
export function criarApp(opcoes = {}) {
  const config = { ...configPadrao, ...opcoes.config }
  const relogio = opcoes.relogio ?? (() => new Date())
  const semear = opcoes.semear ?? config.semear

  const luneta = criarLuneta({ relogio, config, semear })
  const agora = () => relogio().getTime()
  const limitePorToken = criarLimitador({ limite: config.limiteEscritaPorMinuto, agora })
  const limitePorIp = criarLimitador({ limite: config.limiteEscritaPorMinuto * 5, agora })

  // ---- Rotas ---------------------------------------------------------------
  const rotas = [
    rota('GET', '/api/saude', () => ({
      status: 200,
      corpo: { status: 'ok', servico: 'terraformar-backend', hora: relogio().toISOString() },
    })),

    // Conteúdo público (mesma fonte do app: conteudo.js e regras.js)
    rota('GET', '/api/metas', () => ({ status: 200, corpo: metasPublicas() })),
    rota('GET', '/api/ajuda', () => ({ status: 200, corpo: { servicos: servicosDeAjuda() } })),
    rota('GET', '/api/fontes', () => ({ status: 200, corpo: { fontes: fontesPublicas() } })),

    // Demo: o Rafael (dados SINTÉTICOS). Datas relativas a `hoje`, então vale em qualquer dia.
    rota('GET', '/api/demo/rafael', ({ query }) => {
      const hoje = query.get('hoje') ?? hojeISO(relogio())
      if (!dataValida(hoje)) throw new ErroApi(400, 'data_invalida', MENSAGENS.dataInvalida)
      return { status: 200, corpo: { sintetico: true, estado: estadoDoRafael(hoje) } }
    }),

    // Luneta
    rota('GET', '/api/luneta/constelacoes', () => ({
      status: 200,
      corpo: { constelacoes: luneta.listarConstelacoes() },
    })),
    rota('GET', '/api/luneta/posts', ({ query, token }) => ({
      status: 200,
      corpo: { posts: luneta.listarPosts({ constelacao: query.get('constelacao') ?? undefined, token }) },
    })),
    rota('POST', '/api/luneta/posts', ({ corpo, token }) => {
      const r = luneta.criarPost({ token, constelacao: corpo.constelacao, texto: corpo.texto, dias: corpo.dias })
      // 201 = publicou. 200 com publicado:false = risco à vida (abre a Ajuda, não publica).
      return { status: r.publicado ? 201 : 200, corpo: r }
    }),
    rota('POST', '/api/luneta/posts/:id/respostas', ({ params, corpo, token }) => {
      const r = luneta.responder({ token, postId: params.id, texto: corpo.texto })
      return { status: r.publicado ? 201 : 200, corpo: r }
    }),
    rota('POST', '/api/luneta/posts/:id/identifico', ({ params, token }) => ({
      status: 200,
      corpo: luneta.identificar({ token, postId: params.id }),
    })),
    rota('POST', '/api/luneta/posts/:id/denuncias', ({ params, corpo, token }) => ({
      status: 202,
      corpo: luneta.denunciar({ token, postId: params.id, motivo: corpo.motivo }),
    })),
  ]

  // ---- Cabeçalhos comuns ---------------------------------------------------
  function cabecalhos(res) {
    res.setHeader('Access-Control-Allow-Origin', config.origemPermitida)
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Planeta-Token')
    res.setHeader('Vary', 'Origin')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'no-referrer')
    res.setHeader('Cache-Control', 'no-store') // nada de guardar respostas da comunidade em cache
  }

  // ---- Atendimento de cada requisição --------------------------------------
  async function atender(req, res) {
    cabecalhos(res)
    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      return res.end()
    }

    try {
      const url = new URL(req.url, 'http://localhost')
      const caminho = url.pathname.replace(/\/+$/, '') || '/'

      const casam = rotas
        .map((r) => ({ r, m: r.regex.exec(caminho) }))
        .filter((x) => x.m)
      if (casam.length === 0) throw new ErroApi(404, 'rota_nao_encontrada', MENSAGENS.rotaNaoEncontrada)

      const achada = casam.find((x) => x.r.metodo === req.method)
      if (!achada) {
        res.setHeader('Allow', [...new Set(casam.map((x) => x.r.metodo))].join(', '))
        throw new ErroApi(405, 'metodo_nao_permitido', MENSAGENS.metodoNaoPermitido)
      }

      const params = Object.fromEntries(
        achada.r.nomes.map((nome, i) => [nome, decodeURIComponent(achada.m[i + 1])]),
      )
      const token = req.headers['x-planeta-token']

      if (achada.r.escrita) {
        // Escrever exige o token anônimo do aparelho e respeita o limite por minuto.
        if (!tokenValido(token)) throw new ErroApi(400, 'token_invalido', MENSAGENS.tokenInvalido)
        const ip = req.socket.remoteAddress ?? 'desconhecido'
        const a = limitePorToken.permitir(hashDe(token))
        const b = limitePorIp.permitir(ip)
        if (!a.permitido || !b.permitido) {
          res.setHeader('Retry-After', String(Math.max(a.tentarEmSeg, b.tentarEmSeg)))
          throw new ErroApi(429, 'muitas_requisicoes', MENSAGENS.muitasRequisicoes)
        }
      }

      const corpo = req.method === 'POST' ? await lerCorpo(req, config.limiteCorpoBytes) : {}
      const resultado = await achada.r.tratar({ params, query: url.searchParams, corpo, token })
      responder(res, resultado.status, resultado.corpo)
    } catch (e) {
      if (e instanceof ErroApi) {
        return responder(res, e.status, { erro: { codigo: e.codigo, mensagem: e.message, ...e.extra } })
      }
      // Erro inesperado: registra só a mensagem (nunca o corpo da requisição).
      console.error('erro interno:', e?.message)
      responder(res, 500, { erro: { codigo: 'erro_interno', mensagem: MENSAGENS.erroInterno } })
    }
  }

  const servidor = createServer(atender)
  return { servidor, luneta, config }
}
