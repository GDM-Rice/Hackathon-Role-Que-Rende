// Ícone do sprite public/icones.svg. Sempre decorativo: quem dá nome é o botão (aria-label).
export default function Icone({ nome, pequeno = false, className = '' }) {
  return (
    <svg className={`icone ${pequeno ? 'icone--p' : ''} ${className}`} aria-hidden="true" focusable="false">
      <use href={`/icones.svg#i-${nome}`} />
    </svg>
  )
}
