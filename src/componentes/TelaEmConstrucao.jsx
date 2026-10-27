// Casca provisória para as telas que cada módulo ainda vai construir.
import Topo from './Topo.jsx'
import { TEXTOS } from '../conteudo/conteudo.js'

export default function TelaEmConstrucao({ titulo, modulo, children, className = '' }) {
  return (
    <section className={`tela ${className}`} aria-labelledby="titulo-tela">
      <Topo />
      <h1 id="titulo-tela" tabIndex={-1} className="titulo-tela">{titulo}</h1>
      {children}
      <p className="texto-apoio">{TEXTOS.comum.emConstrucao} · módulo {modulo}</p>
    </section>
  )
}
