// Barra sempre com o número em texto ao lado (nada só por cor).
export default function BarraProgresso({ feitos, alvo, unidade = 'dias' }) {
  const pct = Math.min(100, Math.round((feitos / alvo) * 100))
  return (
    <div className="flex flex-col gap-1">
      <span className="font-bold">{feitos} de {alvo} {unidade}</span>
      <div className="barra" role="progressbar" aria-valuemin={0} aria-valuemax={alvo} aria-valuenow={feitos} aria-label={`${feitos} de ${alvo} ${unidade}`}>
        <div className="barra__preenchimento" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
