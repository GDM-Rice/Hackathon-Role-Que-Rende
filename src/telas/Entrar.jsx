// Contas · Entrar (login). Maré e Ajuda ficam no topo, sem precisar de conta.
import { useState } from 'react'
import { useEstado } from '../estado/EstadoContext.jsx'
import { useConta } from '../conta/ContaContext.jsx'
import { useEnvio } from '../conta/useEnvio.js'
import { entrar } from '../api/conta.js'
import { supabaseConfigurado } from '../api/supabase.js'
import { TEXTOS } from '../conteudo/conteudo.js'
import Topo from '../componentes/Topo.jsx'
import CampoSenha from '../componentes/CampoSenha.jsx'
import { MensagemDeErro } from '../componentes/Mensagens.jsx'

const t = TEXTOS.conta

export default function Entrar() {
  const { irPara } = useEstado()
  const { setUsuario } = useConta()
  const { enviando, erro, enviar } = useEnvio()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  async function aoEnviar(evento) {
    evento.preventDefault()
    const usuario = await enviar(() => entrar({ email, senha }))
    if (usuario) setUsuario(usuario)
  }

  return (
    <section className="tela" aria-labelledby="titulo-tela">
      <Topo />
      <h1 id="titulo-tela" tabIndex={-1} className="titulo-tela">{t.entrar.titulo}</h1>
      <p className="texto-apoio m-0">{t.entrar.apoio}</p>
      {!supabaseConfigurado && <MensagemDeErro texto={t.erros.naoConfigurado} />}

      <form className="flex flex-col gap-3" onSubmit={aoEnviar}>
        <label className="campo">
          {t.rotulos.email}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <CampoSenha rotulo={t.rotulos.senha} valor={senha} aoMudar={setSenha} />
        <MensagemDeErro texto={erro} />
        <button type="submit" className="botao botao--primario" disabled={enviando}>
          {enviando ? t.entrar.enviando : t.entrar.botao}
        </button>
      </form>

      <button type="button" className="link-voltar self-center underline" onClick={() => irPara('recuperarSenha')}>
        {t.entrar.esqueci}
      </button>
      <button type="button" className="botao botao--secundario botao--cta" onClick={() => irPara('cadastro')}>
        {t.entrar.criar}
      </button>
    </section>
  )
}
