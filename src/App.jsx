// Módulo 02 · desenha a tela atual (estado.tela).
import { useEffect } from 'react'
import { useEstado } from './estado/EstadoContext.jsx'
import { TELAS } from './telas/index.js'

export default function App() {
  const { estado } = useEstado()
  const Tela = TELAS[estado.tela] ?? TELAS.inicio

  // Leva o foco ao título da nova tela (leitor de tela e teclado).
  useEffect(() => {
    document.getElementById('titulo-tela')?.focus?.()
  }, [estado.tela])

  return (
    <>
      <Tela />
      <div id="anuncios" className="so-leitor" aria-live="polite" />
    </>
  )
}
