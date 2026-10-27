// Módulo 04 · Ajuda. CLAUDE.md 4.8. Ordem fixa vem de SERVICOS_AJUDA.
import TelaEmConstrucao from '../componentes/TelaEmConstrucao.jsx'
import { TEXTOS, FRASES } from '../conteudo/conteudo.js'

export default function Ajuda() {
  return (
    <TelaEmConstrucao titulo={TEXTOS.ajuda.titulo} modulo="04">
      <p className="texto-apoio">{FRASES.naoSubstitui}</p>
    </TelaEmConstrucao>
  )
}
