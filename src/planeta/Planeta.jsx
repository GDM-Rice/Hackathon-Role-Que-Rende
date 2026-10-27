// Módulo 01 · componente Planeta. O SVG entra INLINE (leitor de tela + animação).
// Uso: <Planeta {...propsDoPlaneta(estado)} tamanho={220} />

import { useId, useLayoutEffect, useRef } from 'react'
import moldeSvg from '../assets/planeta.svg?raw'
import { aplicarPlaneta } from './planeta.js'

export default function Planeta({ tamanho = 220, regioes, mar, rios, aves, nuvens }) {
  const ref = useRef(null)
  const idTitulo = useId()

  // Insere o molde uma vez. Ids do <svg> e do <title> são trocados para
  // poder ter mais de um planeta na mesma tela (ex.: prévia nos Ajustes).
  useLayoutEffect(() => {
    const el = ref.current
    el.innerHTML = moldeSvg
    const svg = el.querySelector('svg')
    svg.removeAttribute('id')
    svg.setAttribute('aria-labelledby', idTitulo)
    svg.querySelector('title')?.setAttribute('id', idTitulo)
  }, [idTitulo])

  useLayoutEffect(() => {
    const svg = ref.current?.querySelector('svg')
    if (svg) aplicarPlaneta(svg, { regioes, mar, rios, aves, nuvens })
  }, [regioes, mar, rios, aves, nuvens])

  return (
    <div ref={ref} className="planeta mx-auto" style={{ width: tamanho, maxWidth: '100%' }} />
  )
}
