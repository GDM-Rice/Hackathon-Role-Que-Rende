// "Fonte: ... · saiba mais" → tela Fontes, rolando até o item.
import { useEstado } from '../estado/EstadoContext.jsx'

export default function LinhaFonte({ texto, idFonte }) {
  const { irPara } = useEstado()
  return (
    <p className="linha-fonte">
      Fonte: {texto} ·{' '}
      <button type="button" className="underline text-azul min-h-11" onClick={() => irPara('fontes', idFonte)}>
        saiba mais
      </button>
    </p>
  )
}
