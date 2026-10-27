// Datas como texto ISO local 'AAAA-MM-DD'. Só hojeISO() lê o relógio;
// o resto é puro para testar e para o modo demo.

const UM_DIA = 24 * 60 * 60 * 1000

export function hojeISO(agora = new Date()) {
  const a = agora.getFullYear()
  const m = String(agora.getMonth() + 1).padStart(2, '0')
  const d = String(agora.getDate()).padStart(2, '0')
  return `${a}-${m}-${d}`
}

function paraUTC(iso) {
  const [a, m, d] = iso.split('-').map(Number)
  return Date.UTC(a, m - 1, d)
}

/** Dias inteiros de `de` até `ate` (pode ser negativo). */
export function diasEntre(de, ate) {
  return Math.round((paraUTC(ate) - paraUTC(de)) / UM_DIA)
}

/** Soma `n` dias a uma data ISO. */
export function somarDias(iso, n) {
  const d = new Date(paraUTC(iso) + n * UM_DIA)
  return d.toISOString().slice(0, 10)
}

/** 'bom dia' · 'boa tarde' · 'boa noite' pela hora (0–23). */
export function periodoDoDia(hora) {
  if (hora >= 5 && hora < 12) return 'Bom dia'
  if (hora >= 12 && hora < 18) return 'Boa tarde'
  return 'Boa noite'
}
