// Contas · Criar senha nova. Abre sozinha quando a pessoa chega pelo link
// de recuperação (evento PASSWORD_RECOVERY do Supabase).
import { useState } from 'react'
import { useConta } from '../conta/ContaContext.jsx'
import { useEnvio } from '../conta/useEnvio.js'
import { SENHA_MINIMA, definirSenha } from '../api/conta.js'
import { TEXTOS } from '../conteudo/conteudo.js'
import Topo from '../componentes/Topo.jsx'
import CampoSenha from '../componentes/CampoSenha.jsx'
import { MensagemDeErro } from '../componentes/Mensagens.jsx'

const t = TEXTOS.conta

export default function NovaSenha() {
  const { terminarRecuperacao } = useConta()
  const { enviando, erro, setErro, enviar } = useEnvio()
  const [senha, setSenha] = useState('')
  const [repetir, setRepetir] = useState('')

  async function aoEnviar(evento) {
    evento.preventDefault()
    if (senha.length < SENHA_MINIMA) return setErro(t.erros.senhaCurta)
    if (senha !== repetir) return setErro(t.erros.senhasDiferentes)
    const r = await enviar(async () => { await definirSenha(senha); return true })
    if (r) terminarRecuperacao()
  }

  return (
    <section className="tela" aria-labelledby="titulo-tela">
      <Topo />
      <h1 id="titulo-tela" tabIndex={-1} className="titulo-tela">{t.novaSenha.titulo}</h1>
      <p className="texto-apoio m-0">{t.novaSenha.apoio}</p>
      <form className="flex flex-col gap-3" onSubmit={aoEnviar}>
        <CampoSenha rotulo={t.rotulos.novaSenha} valor={senha} aoMudar={setSenha} nova dica={t.dicaSenha} />
        <CampoSenha rotulo={t.rotulos.repetirSenha} valor={repetir} aoMudar={setRepetir} nova />
        <MensagemDeErro texto={erro} />
        <button type="submit" className="botao botao--primario" disabled={enviando}>
          {enviando ? t.novaSenha.enviando : t.novaSenha.botao}
        </button>
      </form>
    </section>
  )
}
