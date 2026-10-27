// Contas · Minha conta: ver (Read), trocar apelido, e-mail e senha (Update),
// sair (logout) e apagar a conta (Delete, com confirmação em tela própria).
import { useState } from 'react'
import { useEstado } from '../estado/EstadoContext.jsx'
import { useConta } from '../conta/ContaContext.jsx'
import { useEnvio } from '../conta/useEnvio.js'
import { SENHA_MINIMA, atualizarApelido, atualizarEmail, definirSenha } from '../api/conta.js'
import { TEXTOS, detectarRisco } from '../conteudo/conteudo.js'
import Topo from '../componentes/Topo.jsx'
import CampoSenha from '../componentes/CampoSenha.jsx'
import CartaoRisco from '../componentes/CartaoRisco.jsx'
import { MensagemDeErro, MensagemDeSucesso } from '../componentes/Mensagens.jsx'

const t = TEXTOS.conta
const m = t.minhaConta

function FormApelido() {
  const { atualizar } = useEstado()
  const { usuario, setUsuario } = useConta()
  const { enviando, erro, sucesso, enviar } = useEnvio()
  const [apelido, setApelido] = useState(usuario?.user_metadata?.apelido ?? '')

  async function aoEnviar(evento) {
    evento.preventDefault()
    const novo = await enviar(() => atualizarApelido(apelido), m.apelidoSalvo)
    if (novo) {
      setUsuario(novo)
      atualizar((e) => { e.perfil.apelido = apelido.trim() })
    }
  }

  return (
    <form className="cartao flex flex-col gap-3" onSubmit={aoEnviar}>
      <label className="campo">
        {t.rotulos.apelido}
        <input value={apelido} onChange={(e) => setApelido(e.target.value)} autoComplete="nickname" required />
      </label>
      {detectarRisco(apelido) && <CartaoRisco />}
      <MensagemDeErro texto={erro} />
      <MensagemDeSucesso texto={sucesso} />
      <button type="submit" className="botao botao--secundario" disabled={enviando}>{m.salvarApelido}</button>
    </form>
  )
}

function FormEmail() {
  const { usuario } = useConta()
  const { enviando, erro, sucesso, enviar } = useEnvio()
  const [email, setEmail] = useState(usuario?.email ?? '')

  async function aoEnviar(evento) {
    evento.preventDefault()
    await enviar(() => atualizarEmail(email), m.emailEnviado(email.trim()))
  }

  return (
    <form className="cartao flex flex-col gap-3" onSubmit={aoEnviar}>
      <label className="campo">
        {t.rotulos.email}
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
      </label>
      <MensagemDeErro texto={erro} />
      <MensagemDeSucesso texto={sucesso} />
      <button type="submit" className="botao botao--secundario" disabled={enviando}>{m.trocarEmail}</button>
    </form>
  )
}

function FormSenha() {
  const { enviando, erro, setErro, sucesso, enviar } = useEnvio()
  const [senha, setSenha] = useState('')
  const [repetir, setRepetir] = useState('')

  async function aoEnviar(evento) {
    evento.preventDefault()
    if (senha.length < SENHA_MINIMA) return setErro(t.erros.senhaCurta)
    if (senha !== repetir) return setErro(t.erros.senhasDiferentes)
    const ok = await enviar(async () => { await definirSenha(senha); return true }, m.senhaAlterada)
    if (ok) { setSenha(''); setRepetir('') }
  }

  return (
    <form className="cartao flex flex-col gap-3" onSubmit={aoEnviar}>
      <CampoSenha rotulo={t.rotulos.novaSenha} valor={senha} aoMudar={setSenha} nova dica={t.dicaSenha} />
      <CampoSenha rotulo={t.rotulos.repetirSenha} valor={repetir} aoMudar={setRepetir} nova />
      <MensagemDeErro texto={erro} />
      <MensagemDeSucesso texto={sucesso} />
      <button type="submit" className="botao botao--secundario" disabled={enviando}>{m.trocarSenha}</button>
    </form>
  )
}

export default function Conta() {
  const { usuario, sair, apagarConta } = useConta()
  const saida = useEnvio()
  const exclusao = useEnvio()
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)

  if (confirmandoExclusao) {
    return (
      <section className="tela" aria-labelledby="titulo-tela">
        <Topo />
        <h1 id="titulo-tela" tabIndex={-1} className="titulo-tela">{m.apagar}</h1>
        <p className="m-0">{m.confirmarApagar}</p>
        <MensagemDeErro texto={exclusao.erro} />
        <button type="button" className="botao botao--primario" disabled={exclusao.enviando} onClick={() => exclusao.enviar(apagarConta)}>
          {m.simApagar}
        </button>
        <button type="button" className="botao botao--secundario" onClick={() => setConfirmandoExclusao(false)}>
          {m.cancelar}
        </button>
      </section>
    )
  }

  return (
    <section className="tela" aria-labelledby="titulo-tela">
      <Topo />
      <h1 id="titulo-tela" tabIndex={-1} className="titulo-tela">{m.titulo}</h1>
      <p className="texto-apoio m-0">{usuario?.email}</p>
      <p className="texto-apoio m-0">{t.privacidade}</p>

      <h2 className="rotulo-secao">{m.dados}</h2>
      <FormApelido />
      <FormEmail />
      <FormSenha />

      <h2 className="rotulo-secao">{m.sair}</h2>
      <p className="texto-apoio m-0">{m.sairApoio}</p>
      <MensagemDeErro texto={saida.erro} />
      <button type="button" className="botao botao--primario" disabled={saida.enviando} onClick={() => saida.enviar(sair)}>
        {saida.enviando ? m.saindo : m.sair}
      </button>
      <button type="button" className="link-voltar self-center underline" onClick={() => setConfirmandoExclusao(true)}>
        {m.apagar}
      </button>
    </section>
  )
}
