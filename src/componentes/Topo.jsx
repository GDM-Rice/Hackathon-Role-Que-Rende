// Módulo 02 · topo de todas as telas. Maré e Ajuda ficam sempre a um toque.
import { useEstado } from '../estado/EstadoContext.jsx'
import { TEXTOS } from '../conteudo/conteudo.js'
import Icone from './Icone.jsx'

export default function Topo({ escuro = false }) {
  const { estado, irPara } = useEstado()
  const { tela } = estado
  const t = TEXTOS.comum

  return (
    <header className="flex items-center justify-between gap-2">
      {tela === 'inicio' ? (
        <span className="font-bold text-azul">{TEXTOS.inicio.marca}</span>
      ) : (
        <button type="button" className="link-voltar" style={escuro ? { color: 'var(--texto-sobre-escuro)' } : undefined} onClick={() => irPara('inicio')}>
          {t.voltar}
        </button>
      )}
      <nav className="flex gap-2" aria-label="Atalhos">
        {tela !== 'mare' && (
          <button type="button" className="botao-icone" aria-label={t.mare} onClick={() => irPara('mare')}>
            <Icone nome="mare" />
          </button>
        )}
        {tela !== 'ajuda' && (
          <button type="button" className="botao-icone" aria-label={t.ajuda} onClick={() => irPara('ajuda')}>
            <Icone nome="ajuda" />
          </button>
        )}
        {tela === 'inicio' && (
          <button type="button" className="botao-icone" aria-label={t.ajustes} onClick={() => irPara('ajustes')}>
            <Icone nome="ajustes" />
          </button>
        )}
      </nav>
    </header>
  )
}
