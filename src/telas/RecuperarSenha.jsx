// Contas · Recuperar senha: envia o link por e-mail (Supabase).
// A mensagem é a mesma exista ou não a conta (não revela quem tem cadastro).
import { useState } from 'react'
import { useEnvio } from '../conta/useEnvio.js'
import { enviarLinkDeRecuperacao } from '../api/conta.js'
import { TEXTOS } from '../conteudo/conteudo.js'
import Topo from '../componentes/Topo.jsx'
import { MensagemDeErro, MensagemDeSucesso } from '../componentes/Mensagens.jsx'

const t = TEXTOS.conta

export default function RecuperarSenha() {
  const { enviando, erro, sucesso, enviar } = useEnvio()
  const [email, setEmail] = useState('')

  async function aoEnviar(evento) {
    evento.preventDefault()
    await enviar(() => enviarLinkDeRecuperacao(email), t.recuperar.enviado)
  }

  return (
    <section className="tela" aria-labelledby="titulo-tela">
      <Topo />
      <h1 id="titulo-tela" tabIndex={-1} className="titulo-tela">{t.recuperar.titulo}</h1>
      <p className="texto-apoio m-0">{t.recuperar.apoio}</p>
      <form className="flex flex-col gap-3" onSubmit={aoEnviar}>
        <label className="campo">
          {t.rotulos.email}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <MensagemDeErro texto={erro} />
        <MensagemDeSucesso texto={sucesso} />
        <button type="submit" className="botao botao--primario" disabled={enviando}>
          {enviando ? t.recuperar.enviando : t.recuperar.botao}
        </button>
      </form>
    </section>
  )
}
