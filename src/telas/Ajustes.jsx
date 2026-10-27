// Módulo 05 · Ajustes e acessibilidade. CLAUDE.md 4.9
import TelaEmConstrucao from '../componentes/TelaEmConstrucao.jsx'
import { TEXTOS } from '../conteudo/conteudo.js'

export default function Ajustes() {
  return (
    <TelaEmConstrucao titulo={TEXTOS.ajustes.titulo} modulo="05">
      <p className="texto-apoio">{TEXTOS.ajustes.privacidade}</p>
    </TelaEmConstrucao>
  )
}
