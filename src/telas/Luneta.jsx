// Luneta · comunidade anônima (única tela que usa o backend).
// Regras: sem ranking, sem curtida pública, sem notificação. Se a API não
// responder, mostra um aviso calmo; o resto do app segue offline.
// [decidir] módulo dono desta tela.

import { useCallback, useEffect, useState } from 'react'
import { useEstado } from '../estado/EstadoContext.jsx'
import { TEXTOS, detectarRisco } from '../conteudo/conteudo.js'
import { diasDeRecomeco } from '../regras/regras.js'
import { ErroDaApi } from '../api/cliente.js'
import {
  denunciarPost, listarConstelacoes, listarPosts, meIdentifico, publicarPost, responderPost,
} from '../api/luneta.js'
import Topo from '../componentes/Topo.jsx'
import CartaoRisco from '../componentes/CartaoRisco.jsx'

const t = TEXTOS.luneta

/** Mensagem calma a partir de qualquer erro da API. */
function mensagemDeErro(erro) {
  if (erro instanceof ErroDaApi) return { texto: erro.message, detalhes: erro.detalhes }
  return { texto: t.semConexao, detalhes: [] }
}

function Aviso({ aviso }) {
  if (!aviso) return null
  return (
    <div className="cartao" role="status">
      <p className="m-0">{aviso.texto}</p>
      {aviso.detalhes?.length > 0 && (
        <ul className="m-0 mt-2 pl-5 texto-apoio">
          {aviso.detalhes.map((d) => <li key={d}>{d}</li>)}
        </ul>
      )}
    </div>
  )
}

function Escrever({ constelacoes, dias, aoPublicar }) {
  const [constelacao, setConstelacao] = useState(constelacoes[0]?.id ?? '')
  const [texto, setTexto] = useState('')
  const [mostrarDias, setMostrarDias] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState(null)
  const [risco, setRisco] = useState(false)

  async function enviar(evento) {
    evento.preventDefault()
    setAviso(null)
    // Texto com sinal de risco nem sai do aparelho: mostra a ajuda na hora.
    if (detectarRisco(texto)) {
      setRisco(true)
      return
    }
    setEnviando(true)
    try {
      const r = await publicarPost({ constelacao, texto, dias: mostrarDias ? dias : null })
      if (r.publicado) {
        setTexto('')
        setRisco(false)
        setAviso({ texto: t.publicado })
        aoPublicar(r.post)
      } else if (r.risco) {
        setRisco(true)
      }
    } catch (e) {
      setAviso(mensagemDeErro(e))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="cartao flex flex-col gap-3" onSubmit={enviar} aria-labelledby="titulo-escrever">
      <h2 id="titulo-escrever" className="rotulo-secao">{t.escrever}</h2>
      <label className="campo">
        {t.rotuloConstelacao}
        <select
          className="min-h-11 px-3 rounded-input border border-borda-input bg-superficie font-normal"
          value={constelacao}
          onChange={(e) => setConstelacao(e.target.value)}
        >
          {constelacoes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </label>
      <label className="campo">
        {t.rotuloTexto}
        <textarea
          className="min-h-24 p-3 rounded-input border border-borda-input bg-superficie font-normal"
          value={texto}
          maxLength={500}
          required
          onChange={(e) => { setTexto(e.target.value); setRisco(false) }}
          aria-describedby="regras-luneta"
        />
      </label>
      <p id="regras-luneta" className="texto-apoio m-0">{t.regras}</p>
      <label className="flex items-center gap-2 min-h-11">
        <input type="checkbox" className="size-5" checked={mostrarDias} onChange={(e) => setMostrarDias(e.target.checked)} />
        {t.mostrarDias(dias)}
      </label>
      {risco && (
        <>
          <p className="m-0" role="status">{t.riscoNaoPublicado}</p>
          <CartaoRisco />
        </>
      )}
      <div aria-live="polite"><Aviso aviso={aviso} /></div>
      <button type="submit" className="botao botao--primario" disabled={enviando}>
        {enviando ? t.publicando : t.publicar}
      </button>
    </form>
  )
}

function Post({ post, aoAtualizar }) {
  const [respondendo, setRespondendo] = useState(false)
  const [resposta, setResposta] = useState('')
  const [denunciando, setDenunciando] = useState(false)
  const [aviso, setAviso] = useState(null)
  const [risco, setRisco] = useState(false)

  async function identificar() {
    try {
      await meIdentifico(post.id)
      aoAtualizar({ ...post, euMeIdentifico: true })
    } catch (e) {
      setAviso(mensagemDeErro(e))
    }
  }

  async function enviarResposta(evento) {
    evento.preventDefault()
    setAviso(null)
    if (detectarRisco(resposta)) {
      setRisco(true)
      return
    }
    try {
      const r = await responderPost(post.id, resposta)
      if (r.publicado) {
        setResposta('')
        setRespondendo(false)
        aoAtualizar(r.post)
      } else if (r.risco) {
        setRisco(true)
      }
    } catch (e) {
      setAviso(mensagemDeErro(e))
    }
  }

  async function denunciar(motivo) {
    try {
      await denunciarPost(post.id, motivo)
      setDenunciando(false)
      setAviso({ texto: t.denunciaRecebida })
    } catch (e) {
      setAviso(mensagemDeErro(e))
    }
  }

  const data = new Date(post.criadoEm).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })

  return (
    <article className="cartao flex flex-col gap-2">
      <header className="flex flex-wrap items-baseline gap-x-2">
        <strong>{post.minha ? t.voce : t.planeta(post.planeta.nome)}</strong>
        {post.planeta.dias != null && <span className="chip bg-verde-suave text-verde-texto">{t.dias(post.planeta.dias)}</span>}
        <span className="texto-apoio">{data}</span>
      </header>
      <p className="m-0 whitespace-pre-line">{post.texto}</p>

      {post.minha && post.identificacoes > 0 && (
        <p className="texto-apoio m-0">{t.identificacoes(post.identificacoes)}</p>
      )}

      {post.respostas.length > 0 && (
        <ul className="m-0 p-0 list-none flex flex-col gap-2 border-l-2 border-borda pl-3">
          {post.respostas.map((r) => (
            <li key={r.id}>
              <strong className="text-sm">{t.planeta(r.planeta.nome)}</strong>
              <p className="m-0">{r.texto}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        {!post.minha && (
          <button
            type="button"
            className="botao botao--secundario text-sm"
            aria-pressed={post.euMeIdentifico}
            disabled={post.euMeIdentifico}
            onClick={identificar}
          >
            {post.euMeIdentifico ? t.identificado : t.meIdentifico}
          </button>
        )}
        <button type="button" className="botao botao--secundario text-sm" aria-expanded={respondendo} onClick={() => setRespondendo((v) => !v)}>
          {t.responder}
        </button>
        {!post.minha && (
          <button type="button" className="link-voltar underline text-sm" aria-expanded={denunciando} onClick={() => setDenunciando((v) => !v)}>
            {t.denunciar}
          </button>
        )}
      </div>

      {respondendo && (
        <form className="flex flex-col gap-2" onSubmit={enviarResposta}>
          <label className="campo">
            {t.rotuloResposta}
            <textarea
              className="min-h-20 p-3 rounded-input border border-borda-input bg-superficie font-normal"
              value={resposta}
              maxLength={500}
              required
              onChange={(e) => { setResposta(e.target.value); setRisco(false) }}
            />
          </label>
          <button type="submit" className="botao botao--primario">{t.enviarResposta}</button>
        </form>
      )}

      {denunciando && (
        <fieldset className="border-0 p-0 m-0 flex flex-col gap-2">
          <legend className="font-bold mb-2">{t.porqueDenunciar}</legend>
          {Object.entries(t.motivosDenuncia).map(([id, rotulo]) => (
            <button key={id} type="button" className="botao botao--secundario" onClick={() => denunciar(id)}>{rotulo}</button>
          ))}
          <button type="button" className="link-voltar" onClick={() => setDenunciando(false)}>{t.cancelar}</button>
        </fieldset>
      )}

      {risco && <CartaoRisco />}
      <div aria-live="polite"><Aviso aviso={aviso} /></div>
    </article>
  )
}

export default function Luneta() {
  const { estado } = useEstado()
  const [constelacoes, setConstelacoes] = useState([])
  const [filtro, setFiltro] = useState(null)
  const [posts, setPosts] = useState([])
  const [situacao, setSituacao] = useState('carregando') // carregando | pronto | semConexao
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let ativo = true
    Promise.all([listarConstelacoes(), listarPosts(filtro ?? undefined)])
      .then(([cs, ps]) => {
        if (!ativo) return
        setConstelacoes(cs)
        setPosts(ps)
        setSituacao('pronto')
      })
      .catch(() => ativo && setSituacao('semConexao'))
    return () => { ativo = false }
  }, [filtro, tentativa])

  const tentarDeNovo = () => {
    setSituacao('carregando')
    setTentativa((n) => n + 1)
  }

  const escolherFiltro = (id) => {
    setSituacao('carregando')
    setFiltro(id)
  }

  const atualizarPost = useCallback((novo) => {
    setPosts((lista) => lista.map((p) => (p.id === novo.id ? novo : p)))
  }, [])

  const aoPublicar = useCallback((post) => {
    setPosts((lista) => (!filtro || post.constelacao === filtro ? [post, ...lista] : lista))
  }, [filtro])

  return (
    <section className="tela" aria-labelledby="titulo-tela">
      <Topo />
      <h1 id="titulo-tela" tabIndex={-1} className="titulo-tela">{t.titulo}</h1>
      <p className="texto-apoio m-0">{t.apoio}</p>

      {situacao === 'carregando' && <p className="texto-apoio" role="status">{t.carregando}</p>}

      {situacao === 'semConexao' && (
        <div className="cartao flex flex-col gap-3" role="status">
          <p className="m-0">{t.semConexao}</p>
          <button type="button" className="botao botao--secundario" onClick={tentarDeNovo}>{t.tentarDeNovo}</button>
        </div>
      )}

      {situacao === 'pronto' && (
        <>
          <nav aria-label={t.filtro} className="flex flex-wrap gap-2">
            {[{ id: null, nome: t.todas }, ...constelacoes].map((c) => (
              <button
                key={c.id ?? 'todas'}
                type="button"
                className={`chip min-h-11 border ${filtro === c.id ? 'bg-marinho text-branco border-marinho' : 'bg-chip-crise-bg text-chip-crise-tx border-borda'}`}
                aria-pressed={filtro === c.id}
                onClick={() => escolherFiltro(c.id)}
              >
                {c.nome}
              </button>
            ))}
          </nav>

          <Escrever constelacoes={constelacoes} dias={diasDeRecomeco(estado)} aoPublicar={aoPublicar} />

          {posts.length === 0 ? (
            <p className="texto-apoio">{t.vazio}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {posts.map((p) => <Post key={p.id} post={p} aoAtualizar={atualizarPost} />)}
            </div>
          )}
        </>
      )}
    </section>
  )
}
