// Campo de senha com "Mostrar senha" (ajuda quem tem dificuldade para digitar).
import { useId, useState } from 'react'
import { TEXTOS } from '../conteudo/conteudo.js'

export default function CampoSenha({ rotulo, valor, aoMudar, nova = false, dica }) {
  const [visivel, setVisivel] = useState(false)
  const idDica = useId()
  return (
    <div className="flex flex-col gap-1">
      <label className="campo">
        {rotulo}
        <input
          type={visivel ? 'text' : 'password'}
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          autoComplete={nova ? 'new-password' : 'current-password'}
          minLength={nova ? 8 : undefined}
          required
          aria-describedby={dica ? idDica : undefined}
        />
      </label>
      {dica && <p id={idDica} className="texto-apoio m-0">{dica}</p>}
      <label className="flex items-center gap-2 min-h-11 text-sm">
        <input type="checkbox" className="size-5" checked={visivel} onChange={(e) => setVisivel(e.target.checked)} />
        {TEXTOS.conta.rotulos.mostrarSenha}
      </label>
    </div>
  )
}
