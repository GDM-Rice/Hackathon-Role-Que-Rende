// Módulo 02 · estado global. Toda ação chama atualizar(fn): fn recebe uma cópia
// do estado e pode mudá-la ou devolver um novo. Depois salva e redesenha.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apagar, carregar, estadoInicial, salvar } from './estado.js'
import { hojeISO } from '../util/datas.js'
import { apagarToken } from '../api/token.js'

const EstadoContext = createContext(null)

function aplicarAcessibilidade(a) {
  const html = document.documentElement
  html.dataset.texto = a.texto
  html.dataset.contraste = a.altoContraste ? 'alto' : 'normal'
  html.dataset.daltonismo = a.daltonismo ? 'sim' : 'nao'
  html.dataset.animacoes = a.animacoes
}

export function EstadoProvider({ children, inicial }) {
  const [estado, setEstado] = useState(() => inicial ?? carregar(hojeISO()))

  useEffect(() => {
    salvar(estado)
    aplicarAcessibilidade(estado.acessibilidade)
  }, [estado])

  const atualizar = useCallback((fn) => {
    setEstado((atual) => {
      const copia = structuredClone(atual)
      return fn(copia) ?? copia
    })
  }, [])

  const irPara = useCallback((tela, ancora) => {
    atualizar((e) => {
      e.tela = tela
      e.ancora = ancora ?? null
    })
    window.scrollTo?.(0, 0)
  }, [atualizar])

  const apagarTudo = useCallback(() => {
    apagar()
    apagarToken() // a Luneta passa a ver este aparelho como um planeta novo
    setEstado(estadoInicial(hojeISO()))
  }, [])

  const valor = useMemo(
    () => ({ estado, atualizar, irPara, apagarTudo }),
    [estado, atualizar, irPara, apagarTudo],
  )
  return <EstadoContext.Provider value={valor}>{children}</EstadoContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useEstado() {
  const ctx = useContext(EstadoContext)
  if (!ctx) throw new Error('useEstado precisa estar dentro de <EstadoProvider>')
  return ctx
}
