// Módulo 02 · sessão da conta e backup automático do progresso.
// Fica DENTRO do EstadoProvider: ao entrar, escolhe entre o estado local e o
// backup; depois de cada mudança, grava o backup (com 1,5 s de espera).
// Na demo (?demo=1) nada disso roda: sem login, sem rede.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useEstado } from '../estado/EstadoContext.jsx'
import { supabaseConfigurado } from '../api/supabase.js'
import {
  apagarConta as apagarContaNoServidor, buscarProgresso, obterUsuario, ouvirSessao, salvarProgresso,
  sair as sairNoServidor,
} from '../api/conta.js'
import { escolherEstado } from './sincronia.js'
import { hojeISO } from '../util/datas.js'

const ContaContext = createContext(null)
const ESPERA_BACKUP_MS = 1500

export function ContaProvider({ children, demo = false }) {
  const { estado, atualizar, apagarTudo } = useEstado()
  const [usuario, setUsuario] = useState(null)
  const [verificandoSessao, setVerificandoSessao] = useState(supabaseConfigurado && !demo)
  const [recuperandoSenha, setRecuperandoSenha] = useState(false)
  const [carregadoPara, setCarregadoPara] = useState(null) // id da conta já carregada
  const [falhaAoCarregar, setFalhaAoCarregar] = useState(false)
  const [tentativa, setTentativa] = useState(0)

  const estadoRef = useRef(estado)
  useEffect(() => { estadoRef.current = estado }, [estado])
  const usuarioId = usuario?.id ?? null

  // 1. Sessão: lê a salva (funciona offline) e ouve entradas, saídas e o link de recuperação.
  useEffect(() => {
    if (demo || !supabaseConfigurado) return undefined
    let ativo = true
    obterUsuario()
      .then((u) => ativo && setUsuario(u))
      .catch(() => {})
      .finally(() => ativo && setVerificandoSessao(false))
    const parar = ouvirSessao((evento, u) => {
      if (evento === 'PASSWORD_RECOVERY') setRecuperandoSenha(true)
      setUsuario(u)
    })
    return () => { ativo = false; parar() }
  }, [demo])

  // 2. Ao entrar: busca o backup e decide qual estado usar.
  useEffect(() => {
    if (demo || !usuarioId || carregadoPara === usuarioId) return undefined
    let ativo = true
    buscarProgresso(usuarioId)
      .then((remoto) => {
        if (!ativo) return
        const escolha = escolherEstado({ local: estadoRef.current, remoto, usuarioId, hoje: hojeISO() })
        atualizar(() => escolha.estado, { marcar: false })
        setCarregadoPara(usuarioId)
        if (escolha.enviar) salvarProgresso(usuarioId, escolha.estado).catch(() => {})
      })
      .catch(() => {
        if (!ativo) return
        // Offline: segue com o local só se ele já é desta conta. Senão, espera a
        // internet (usar um estado vazio poderia sobrescrever o backup).
        if (estadoRef.current.dono === usuarioId) setCarregadoPara(usuarioId)
        else setFalhaAoCarregar(true)
      })
    return () => { ativo = false }
  }, [demo, usuarioId, carregadoPara, tentativa, atualizar])

  const podeSalvar = !demo && usuarioId && carregadoPara === usuarioId && estado.dono === usuarioId

  // 3. Backup automático depois de cada mudança.
  useEffect(() => {
    if (!podeSalvar) return undefined
    const espera = setTimeout(() => salvarProgresso(usuarioId, estado).catch(() => {}), ESPERA_BACKUP_MS)
    return () => clearTimeout(espera)
  }, [podeSalvar, usuarioId, estado])

  // 4. Voltou a internet: manda o que ficou pendente.
  useEffect(() => {
    if (!podeSalvar) return undefined
    const aoVoltar = () => salvarProgresso(usuarioId, estadoRef.current).catch(() => {})
    window.addEventListener('online', aoVoltar)
    return () => window.removeEventListener('online', aoVoltar)
  }, [podeSalvar, usuarioId])

  const limparAparelho = useCallback(() => {
    apagarTudo()
    setUsuario(null)
    setCarregadoPara(null)
    setRecuperandoSenha(false)
    setFalhaAoCarregar(false)
  }, [apagarTudo])

  /** Logout: grava o último backup, encerra a sessão e apaga os dados deste celular. */
  const sair = useCallback(async () => {
    if (podeSalvar) await salvarProgresso(usuarioId, estadoRef.current).catch(() => {})
    await sairNoServidor().catch(() => {})
    limparAparelho()
  }, [podeSalvar, usuarioId, limparAparelho])

  /** Delete: apaga a conta e o backup no servidor e os dados deste celular. */
  const apagarConta = useCallback(async () => {
    await apagarContaNoServidor()
    limparAparelho()
  }, [limparAparelho])

  const valor = useMemo(() => ({
    demo,
    usuario,
    setUsuario,
    verificandoSessao,
    recuperandoSenha,
    terminarRecuperacao: () => setRecuperandoSenha(false),
    progressoPronto: demo || (Boolean(usuarioId) && carregadoPara === usuarioId),
    falhaAoCarregar,
    tentarCarregarDeNovo: () => {
      setFalhaAoCarregar(false)
      setTentativa((n) => n + 1)
    },
    sair,
    apagarConta,
  }), [demo, usuario, usuarioId, verificandoSessao, recuperandoSenha, carregadoPara, falhaAoCarregar, sair, apagarConta])

  return <ContaContext.Provider value={valor}>{children}</ContaContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConta() {
  const ctx = useContext(ContaContext)
  if (!ctx) throw new Error('useConta precisa estar dentro de <ContaProvider>')
  return ctx
}
