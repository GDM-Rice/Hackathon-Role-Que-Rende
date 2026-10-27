// Mensagens de formulário: erro (sem vermelho, sem bronca) e sucesso.
export function MensagemDeErro({ texto }) {
  if (!texto) return null
  return <p className="cartao m-0 border-destaque" role="alert">{texto}</p>
}

export function MensagemDeSucesso({ texto }) {
  if (!texto) return null
  return <p className="cartao m-0 bg-verde-suave text-verde-texto border-verde" role="status">{texto}</p>
}
