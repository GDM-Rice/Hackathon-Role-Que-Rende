// Módulo 02 · desenha a tela atual (estado.tela).
// Login obrigatório: sem conta, só abrem as telas públicas (Maré, Ajuda e
// Fontes ficam livres pela regra 5). A demo (?demo=1) não pede login.
import { useEffect } from 'react'
import { useEstado } from './estado/EstadoContext.jsx'
import { useConta } from './conta/ContaContext.jsx'
import { TEXTOS } from './conteudo/conteudo.js'
import { TELAS } from './telas/index.js'

const TELAS_DA_CONTA = ['entrar', 'cadastro', 'recuperarSenha']
const TELAS_SEM_LOGIN = [...TELAS_DA_CONTA, 'mare', 'ajuda', 'fontes']

function Aguardando({ conta }) {
  return (
    <section className="tela justify-center" aria-labelledby="titulo-tela">
      <h1 id="titulo-tela" tabIndex={-1} className="saudacao text-center">
        {conta.falhaAoCarregar ? TEXTOS.conta.semConexao : TEXTOS.conta.carregando}
      </h1>
      {conta.falhaAoCarregar && (
        <button type="button" className="botao botao--primario" onClick={conta.tentarCarregarDeNovo}>
          {TEXTOS.conta.tentarDeNovo}
        </button>
      )}
    </section>
  )
}

/** Nome da tela a mostrar conforme a sessão (null = aguardando). */
function escolherTela(tela, conta) {
  if (conta.verificandoSessao) return null
  if (conta.demo) return TELAS[tela] ? tela : 'inicio'
  if (conta.recuperandoSenha) return 'novaSenha'
  if (!conta.usuario) return TELAS_SEM_LOGIN.includes(tela) ? tela : 'entrar'
  if (!conta.progressoPronto) return null
  if (TELAS_DA_CONTA.includes(tela) || !TELAS[tela]) return 'inicio'
  return tela
}

export default function App() {
  const { estado } = useEstado()
  const conta = useConta()
  const nome = escolherTela(estado.tela, conta)
  const Tela = nome ? TELAS[nome] : Aguardando

  // Leva o foco ao título da nova tela (leitor de tela e teclado).
  useEffect(() => {
    document.getElementById('titulo-tela')?.focus?.()
  }, [nome])

  return (
    <>
      <Tela conta={conta} />
      <div id="anuncios" className="so-leitor" aria-live="polite" />
    </>
  )
}
