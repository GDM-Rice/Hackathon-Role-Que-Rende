// Módulo 01 · aplica o estado ao SVG do planeta trocando só atributos pelos ids
// (CLAUDE.md seção 6). Recebe as props calculadas por regras.propsDoPlaneta.

const REGIOES = [
  { chave: 'norte', id: 'norte', afastamento: 'translate(-5 -4)' },
  { chave: 'nordeste', id: 'nordeste', afastamento: 'translate(6 -4)' },
  { chave: 'centroOeste', id: 'centro-oeste', afastamento: 'translate(-2 3)' },
  { chave: 'sudeste', id: 'sudeste', afastamento: 'translate(6 5)' },
  { chave: 'sul', id: 'sul', afastamento: 'translate(1 8)' },
]

const RIOS = [
  { chave: 'amazonas', id: 'rio-amazonas', nome: 'Amazonas' },
  { chave: 'saoFrancisco', id: 'rio-sao-francisco', nome: 'São Francisco' },
  { chave: 'parana', id: 'rio-parana', nome: 'Paraná' },
]

// Cores vêm dos tokens para o modo daltonismo funcionar.
const COR = {
  forma: { seco: 'var(--terra-seca)', brotando: 'var(--terra-brotando)', verde: 'var(--terra-verde)' },
  contorno: { seco: 'var(--terra-racha)', brotando: 'var(--terra-racha)', verde: 'var(--verde-borda)' },
  arvores: { seco: '0', brotando: '0.55', verde: '1' },
  mar: { poluido: 'var(--mar-sujo)', limpando: 'var(--mar-limpando)', limpo: 'var(--mar-limpo)' },
  manchas: { poluido: '1', limpando: '0.35', limpo: '0' },
}

const NOME_MAR = { poluido: 'mar poluído', limpando: 'mar limpando', limpo: 'mar limpo' }

export function descricaoDoPlaneta({ regioes, mar, rios, nuvens }) {
  const verdes = Object.values(regioes).filter((r) => r === 'verde').length
  const correndo = Object.values(rios).filter(Boolean).length
  const partes = [
    `Planeta: ${verdes} de 5 regiões do Brasil recuperadas`,
    NOME_MAR[mar],
    `${correndo} de 3 rios correndo`,
  ]
  if (nuvens) partes.push('dia de tempestade')
  return partes.join(', ')
}

const definir = (raiz, seletor, atributos) => {
  const el = raiz.querySelector(seletor)
  if (!el) return
  for (const [nome, valor] of Object.entries(atributos)) {
    if (valor == null) el.removeAttribute(nome)
    else el.setAttribute(nome, valor)
  }
}

// Cores vão em style (var() não funciona em atributo de apresentação SVG).
const pintar = (raiz, seletor, estilos) => {
  const el = raiz.querySelector(seletor)
  if (!el) return
  for (const [nome, valor] of Object.entries(estilos)) el.style.setProperty(nome, valor)
}

/** Muda o <svg> já inserido na página. Não cria nem remove elementos. */
export function aplicarPlaneta(svg, props) {
  const { regioes, mar, rios, aves, nuvens } = props

  pintar(svg, '#mar', { fill: COR.mar[mar] })
  definir(svg, '#manchas', { opacity: COR.manchas[mar] })

  for (const r of REGIOES) {
    const estado = regioes[r.chave] ?? 'seco'
    definir(svg, `#regiao-${r.id}`, { transform: estado === 'verde' ? 'translate(0 0)' : r.afastamento })
    pintar(svg, `#regiao-${r.id}-forma`, { fill: COR.forma[estado], stroke: COR.contorno[estado] })
    definir(svg, `#racha-${r.id}`, { opacity: estado === 'seco' ? '0.9' : '0' })
    definir(svg, `#arvores-${r.id}`, { opacity: COR.arvores[estado] })
  }

  for (const rio of RIOS) {
    const correndo = Boolean(rios[rio.chave])
    pintar(svg, `#${rio.id}`, { stroke: correndo ? 'var(--rio)' : 'var(--rio-seco)' })
    definir(svg, `#${rio.id}`, correndo
      ? { 'stroke-dasharray': null, 'stroke-width': '2.4' }
      : { 'stroke-dasharray': '3 3', 'stroke-width': '1.2' })
  }

  for (let i = 1; i <= 3; i++) definir(svg, `#ave-${i}`, { opacity: i <= aves ? '1' : '0' })
  definir(svg, '#nuvens', { opacity: nuvens ? '1' : '0' })

  const titulo = svg.querySelector('title')
  if (titulo) titulo.textContent = descricaoDoPlaneta(props)
}
