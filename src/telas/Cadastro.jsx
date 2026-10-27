// Contas · Criar conta (Create do CRUD).
import { useState } from 'react'
import { useEstado } from '../estado/EstadoContext.jsx'
import { useEnvio } from '../conta/useEnvio.js'
import { SENHA_MINIMA, cadastrar } from '../api/conta.js'
import { TEXTOS, detectarRisco } from '../conteudo/conteudo.js'
import Topo from '../componentes/Topo.jsx'
import CampoSenha from '../componentes/CampoSenha.jsx'
import CartaoRisco from '../componentes/CartaoRisco.jsx'
import { MensagemDeErro, MensagemDeSucesso } from '../componentes/Mensagens.jsx'

const t = TEXTOS.conta

export default function Cadastro() {
  const { irPara } = useEstado()
  const { enviando, erro, setErro, sucesso, enviar } = useEnvio()
  const [apelido, setApelido] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [repetir, setRepetir] = useState('')

  async function aoEnviar(evento) {
    evento.preventDefault()
    if (senha.length < SENHA_MINIMA) return setErro(t.erros.senhaCurta)
    if (senha !== repetir) return setErro(t.erros.senhasDiferentes)
    // Com confirmação por e-mail ligada, a pessoa entra depois de abrir o link.
    // Sem confirmação, o Supabase já abre a sessão e o app segue sozinho.
    await enviar(
      () => cadastrar({ email, senha, apelido }),
      (r) => (r.precisaConfirmar ? t.cadastro.confirmar(email.trim()) : null),
    )
  }

  return (
    <section className="tela" aria-labelledby="titulo-tela">
      <Topo />
      <h1 id="titulo-tela" tabIndex={-1} className="titulo-tela">{t.cadastro.titulo}</h1>
      <p className="texto-apoio m-0">{t.cadastro.apoio}</p>

      {sucesso ? (
        <>
          <MensagemDeSucesso texto={sucesso} />
          <button type="button" className="botao botao--primario botao--cta" onClick={() => irPara('entrar')}>
            {t.entrar.botao}
          </button>
        </>
      ) : (
        <form className="flex flex-col gap-3" onSubmit={aoEnviar}>
          <label className="campo">
            {t.rotulos.apelido}
            <input value={apelido} onChange={(e) => setApelido(e.target.value)} autoComplete="nickname" required />
          </label>
          {detectarRisco(apelido) && <CartaoRisco />}
          <label className="campo">
            {t.rotulos.email}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </label>
          <CampoSenha rotulo={t.rotulos.senha} valor={senha} aoMudar={setSenha} nova dica={t.dicaSenha} />
          <CampoSenha rotulo={t.rotulos.repetirSenha} valor={repetir} aoMudar={setRepetir} nova />
          <p className="texto-apoio m-0">{t.privacidade}</p>
          <MensagemDeErro texto={erro} />
          <button type="submit" className="botao botao--primario" disabled={enviando}>
            {enviando ? t.cadastro.enviando : t.cadastro.botao}
          </button>
          <button type="button" className="link-voltar self-center underline" onClick={() => irPara('entrar')}>
            {t.cadastro.jaTenho}
          </button>
        </form>
      )}
    </section>
  )
}
