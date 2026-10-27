// Módulo 06 · cartão calmo mostrado quando detectarRisco(texto) é verdadeiro.
// Não bloqueia, não julga, não salva nada.
import { useEstado } from '../estado/EstadoContext.jsx'
import { TEXTOS } from '../conteudo/conteudo.js'

export default function CartaoRisco() {
  const { irPara } = useEstado()
  return (
    <div className="cartao flex flex-col gap-2" role="status" aria-live="polite">
      <p className="m-0">{TEXTOS.risco.mensagem}</p>
      <div className="flex gap-2 flex-wrap">
        <a className="botao botao--secundario" href="tel:188">CVV 188</a>
        <a className="botao botao--secundario" href="tel:192">SAMU 192</a>
        <button type="button" className="botao botao--secundario" onClick={() => irPara('ajuda')}>Ajuda</button>
      </div>
    </div>
  )
}
