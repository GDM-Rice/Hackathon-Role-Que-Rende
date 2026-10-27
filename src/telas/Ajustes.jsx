// Módulo 05 · Ajustes e acessibilidade. CLAUDE.md 4.9
import TelaEmConstrucao from '../componentes/TelaEmConstrucao.jsx'
import { TEXTOS } from '../conteudo/conteudo.js'
import { useEstado } from '../estado/EstadoContext.jsx'
import { useConta } from '../conta/ContaContext.jsx'

export default function Ajustes() {
  const { irPara } = useEstado()
  const { demo } = useConta()
  return (
    <TelaEmConstrucao titulo={TEXTOS.ajustes.titulo} modulo="05">
      <p className="texto-apoio">{TEXTOS.ajustes.privacidade}</p>
      {!demo && (
        <button type="button" className="botao botao--secundario" onClick={() => irPara('conta')}>
          {TEXTOS.conta.minhaConta.acesso}
        </button>
      )}
    </TelaEmConstrucao>
  )
}
