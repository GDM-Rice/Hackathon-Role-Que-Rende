// Módulo 03 · Dia de tempestade (acolher sem julgar). CLAUDE.md 4.4
// Nunca: vermelho, alerta, contador zerando, tom de bronca.
import TelaEmConstrucao from '../componentes/TelaEmConstrucao.jsx'
import { FRASES } from '../conteudo/conteudo.js'

export default function Tempestade() {
  return <TelaEmConstrucao titulo={FRASES.assinatura} modulo="03" className="tela--tempestade" />
}
