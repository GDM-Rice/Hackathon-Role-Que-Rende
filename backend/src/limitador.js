// Backend do Terraformar · limite de ações por minuto (janela deslizante).
//
// Evita spam na Luneta. Guarda só horários de ações, em memória, por "chave"
// (um hash anônimo ou um IP). Nada vai para disco.

/**
 * @param {{ limite: number, janelaMs?: number, agora?: () => number }} opcoes
 */
export function criarLimitador({ limite, janelaMs = 60_000, agora = Date.now }) {
  const historico = new Map() // chave -> [horários das ações permitidas]

  // De tempos em tempos, apaga chaves que não têm mais nada na janela.
  function varrer(t) {
    for (const [chave, horas] of historico) {
      if (!horas.some((h) => t - h < janelaMs)) historico.delete(chave)
    }
  }

  return {
    /** Tenta registrar uma ação. Devolve se pode e, se não, em quantos segundos tentar. */
    permitir(chave) {
      const t = agora()
      if (historico.size > 1000) varrer(t)

      const recentes = (historico.get(chave) ?? []).filter((h) => t - h < janelaMs)
      if (recentes.length >= limite) {
        historico.set(chave, recentes)
        const tentarEmSeg = Math.max(1, Math.ceil((recentes[0] + janelaMs - t) / 1000))
        return { permitido: false, tentarEmSeg }
      }
      recentes.push(t)
      historico.set(chave, recentes)
      return { permitido: true, tentarEmSeg: 0 }
    },
  }
}
