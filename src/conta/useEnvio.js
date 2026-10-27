// Estado de um formulário que fala com o servidor: enviando, erro e sucesso.
import { useCallback, useState } from 'react'
import { mensagemDeErro } from '../api/conta.js'

export function useEnvio() {
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)
  const [sucesso, setSucesso] = useState(null)

  /** Roda `acao`. Se der certo, mostra `mensagemDeSucesso` (texto ou função do resultado). */
  const enviar = useCallback(async (acao, mensagemDeSucesso) => {
    setEnviando(true)
    setErro(null)
    setSucesso(null)
    try {
      const resultado = await acao()
      const msg = typeof mensagemDeSucesso === 'function' ? mensagemDeSucesso(resultado) : mensagemDeSucesso
      if (msg) setSucesso(msg)
      return resultado
    } catch (e) {
      setErro(mensagemDeErro(e))
      return undefined
    } finally {
      setEnviando(false)
    }
  }, [])

  return { enviando, erro, setErro, sucesso, enviar }
}
