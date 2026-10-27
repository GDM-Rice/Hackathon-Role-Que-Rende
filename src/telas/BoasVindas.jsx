// Módulo 03 · Boas-vindas (1ª vez). CLAUDE.md 4.1
import { useState } from 'react'
import { useEstado } from '../estado/EstadoContext.jsx'
import { TEXTOS, FRASES, detectarRisco } from '../conteudo/conteudo.js'
import { propsDoPlaneta } from '../regras/regras.js'
import Planeta from '../planeta/Planeta.jsx'
import CartaoRisco from '../componentes/CartaoRisco.jsx'

export default function BoasVindas() {
  const { estado, atualizar } = useEstado()
  const t = TEXTOS.boasVindas
  const [apelido, setApelido] = useState(estado.perfil.apelido)
  const [motivo, setMotivo] = useState(estado.perfil.motivo)
  const [gasto, setGasto] = useState(estado.perfil.gastoSemanal ?? '')
  const [naoDizer, setNaoDizer] = useState(false)

  function comecar(evento) {
    evento.preventDefault()
    atualizar((e) => {
      e.perfil = {
        apelido: apelido.trim(),
        motivo: motivo.trim(),
        gastoSemanal: naoDizer || gasto === '' ? null : Number(gasto),
        inicio: e.hoje.data,
      }
      e.tela = 'inicio'
    })
  }

  return (
    <section className="tela" aria-labelledby="titulo-tela">
      <Planeta {...propsDoPlaneta(estado)} tamanho={200} />
      <h1 id="titulo-tela" tabIndex={-1} className="titulo-tela">{t.titulo}</h1>
      <p className="texto-apoio m-0">{t.apoio}</p>

      <form className="flex flex-col gap-3" onSubmit={comecar}>
        <label className="campo">
          {t.rotuloApelido}
          <input value={apelido} onChange={(e) => setApelido(e.target.value)} required autoComplete="nickname" />
        </label>
        <label className="campo">
          {t.rotuloMotivo}
          <input value={motivo} onChange={(e) => setMotivo(e.target.value)} required />
        </label>
        {detectarRisco(motivo) && <CartaoRisco />}
        <label className="campo">
          {t.rotuloGasto}
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            value={gasto}
            disabled={naoDizer}
            onChange={(e) => setGasto(e.target.value.replace(/\D/g, ''))}
          />
        </label>
        <label className="flex items-center gap-2 min-h-11">
          <input type="checkbox" className="size-5" checked={naoDizer} onChange={(e) => setNaoDizer(e.target.checked)} />
          {t.prefiroNaoDizer}
        </label>
        <p className="texto-apoio m-0">{FRASES.soNesteCelular}</p>
        <button type="submit" className="botao botao--primario botao--cta">{t.botao}</button>
      </form>
    </section>
  )
}
