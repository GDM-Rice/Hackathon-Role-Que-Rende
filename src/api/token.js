// Módulo 02 · identificador ANÔNIMO deste aparelho para a Luneta.
// É um texto aleatório, sem nome, telefone ou e-mail. O backend guarda só o
// hash dele (docs/backend.md). Fica separado do estado do app e é apagado
// junto com "Apagar meus dados".

export const CHAVE_TOKEN = 'terraformar:token'

let emMemoria = null // usado quando o localStorage não está disponível

/** 32 caracteres [A-Za-z0-9_-] (o backend aceita de 16 a 64). */
export function gerarToken(cripto = globalThis.crypto) {
  const bytes = cripto.getRandomValues(new Uint8Array(24))
  const base64 = btoa(String.fromCharCode(...bytes))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function obterToken(armazenamento = globalThis.localStorage) {
  try {
    const salvo = armazenamento?.getItem(CHAVE_TOKEN)
    if (salvo) return salvo
    const novo = gerarToken()
    armazenamento?.setItem(CHAVE_TOKEN, novo)
    return novo
  } catch {
    emMemoria ??= gerarToken()
    return emMemoria
  }
}

export function apagarToken(armazenamento = globalThis.localStorage) {
  emMemoria = null
  try {
    armazenamento?.removeItem(CHAVE_TOKEN)
  } catch {
    // ignorado
  }
}
