// Módulo 02 · cliente do Supabase (contas e backup do progresso).
// As chaves vêm do .env.local (ver .env.example). Só a chave PÚBLICA:
// tudo que começa com VITE_ vai para o navegador.
// Sem chaves, o app avisa na tela de entrar; a demo (?demo=1) segue funcionando.

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env?.VITE_SUPABASE_URL
const chave = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabaseConfigurado = Boolean(url && chave)

export const supabase = supabaseConfigurado
  ? createClient(url, chave, {
      auth: {
        persistSession: true, // sessão no localStorage: o app reabre offline já logado
        autoRefreshToken: true,
        detectSessionInUrl: true, // links de confirmação e de recuperação de senha
        storageKey: 'terraformar:sessao',
      },
    })
  : null
