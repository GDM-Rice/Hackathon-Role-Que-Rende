// Ajudantes para os testes de tela (montar o app, achar botões, digitar).
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import App from '../App.jsx'
import { EstadoProvider } from '../estado/EstadoContext.jsx'
import { ContaProvider } from '../conta/ContaContext.jsx'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let raizAnterior = null

/** Monta `conteudo` (padrão: o App inteiro) com os providers. Desmonta o anterior. */
export async function montar({ inicial, demo = false, conteudo = <App /> } = {}) {
  if (raizAnterior) {
    const anterior = raizAnterior
    await act(async () => anterior.unmount())
  }
  const el = document.createElement('main')
  document.body.replaceChildren(el)
  raizAnterior = createRoot(el)
  await act(async () => {
    raizAnterior.render(
      <EstadoProvider inicial={inicial}>
        <ContaProvider demo={demo}>{conteudo}</ContaProvider>
      </EstadoProvider>,
    )
  })
  return el
}

/** Botão pelo texto visível ou pelo aria-label. */
export function botao(el, texto) {
  return [...el.querySelectorAll('button')].find(
    (b) => b.textContent.trim() === texto || b.getAttribute('aria-label') === texto,
  )
}

export async function clicar(el, texto) {
  const b = botao(el, texto)
  if (!b) throw new Error(`botão não encontrado: ${texto}`)
  await act(async () => b.click())
}

/** Digita num campo pelo texto do rótulo (o React só percebe pelo setter nativo). */
export async function digitar(el, rotulo, valor) {
  const label = [...el.querySelectorAll('label')].find((l) => l.textContent.trim().startsWith(rotulo))
  const campo = label?.querySelector('input, textarea')
  if (!campo) throw new Error(`campo não encontrado: ${rotulo}`)
  const proto = campo.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  await act(async () => {
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(campo, valor)
    campo.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

export async function enviarFormulario(el, indice = 0) {
  await act(async () => {
    el.querySelectorAll('form')[indice].dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
}

export const titulo = (el) => el.querySelector('h1')?.textContent
