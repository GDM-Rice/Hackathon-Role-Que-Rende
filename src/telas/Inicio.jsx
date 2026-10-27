// Módulo 03 · Início. CLAUDE.md 4.2
import { useEstado } from '../estado/EstadoContext.jsx'
import { TEXTOS, FRASES, NOMES_REGIOES } from '../conteudo/conteudo.js'
import { deixouDeIrParaApostas, diasDeRecomeco, metaAtual, propsDoPlaneta } from '../regras/regras.js'
import { periodoDoDia } from '../util/datas.js'
import Planeta from '../planeta/Planeta.jsx'
import Topo from '../componentes/Topo.jsx'
import Icone from '../componentes/Icone.jsx'
import BarraProgresso from '../componentes/BarraProgresso.jsx'

const ATALHOS = [
  { tela: 'missao', icone: 'missao', cor: 'text-verde-borda' },
  { tela: 'dividas', icone: 'dividas', cor: 'text-ocre-texto' },
  { tela: 'tripulacao', icone: 'tripulacao', cor: 'text-azul' },
  { tela: 'ajuda', icone: 'ajuda', cor: 'text-marinho' },
]

export default function Inicio() {
  const { estado, irPara } = useEstado()
  const t = TEXTOS.inicio
  const meta = metaAtual(estado)
  const dias = diasDeRecomeco(estado)
  const reais = deixouDeIrParaApostas(estado)

  return (
    <section className="tela" aria-labelledby="titulo-tela">
      <Topo />
      <div>
        <h1 id="titulo-tela" tabIndex={-1} className="saudacao">
          {periodoDoDia(new Date().getHours())}, {estado.perfil.apelido}.
        </h1>
        <p className="texto-apoio m-0">{estado.perfil.motivo}</p>
      </div>

      <Planeta {...propsDoPlaneta(estado)} tamanho={220} />

      <div className="cartao flex flex-col gap-2">
        {meta ? (
          <>
            <p className="m-0">Meta atual: <strong>{NOMES_REGIOES[meta.regiao]}</strong></p>
            <BarraProgresso feitos={meta.feitos} alvo={meta.alvo} />
          </>
        ) : (
          <p className="m-0"><strong>Brasil inteiro recuperado</strong></p>
        )}
        <p className="texto-apoio m-0">
          {dias} dias de recomeço{reais != null && ` · R$ ${reais.toLocaleString('pt-BR')} longe das apostas`}
        </p>
      </div>

      <button type="button" className="cartao cartao--escuro flex items-center justify-between text-left cursor-pointer" onClick={() => irPara('mare')}>
        <span className="flex flex-col">
          <span className="text-texto-sobre-escuro text-sm">{t.mareChamada}</span>
          <span className="font-bold text-lg">{t.mareBotao}</span>
        </span>
        <span className="flex items-center justify-center size-12 rounded-pilula bg-azul-claro text-marinho" aria-hidden="true">
          <Icone nome="mare" />
        </span>
      </button>

      <nav className="grid grid-cols-4 gap-2" aria-label="Seções">
        {ATALHOS.map((a) => (
          <button key={a.tela} type="button" className="cartao flex flex-col items-center justify-center gap-1 min-h-16 p-2 cursor-pointer" onClick={() => irPara(a.tela)}>
            <Icone nome={a.icone} pequeno className={a.cor} />
            <span className="text-xs">{t.atalhos[a.tela]}</span>
          </button>
        ))}
      </nav>

      <button type="button" className="link-voltar self-center underline" onClick={() => irPara('tempestade')}>
        {FRASES.apostei}
      </button>
    </section>
  )
}
