// Módulo 02 · contas (Supabase Auth) e backup do progresso (tabela progresso).
// Telas usam só estas funções, nunca o cliente do Supabase direto.
// Erros viram ErroDeConta (mensagem calma de conteudo.js) ou SemConexao.

import { supabase, supabaseConfigurado } from './supabase.js'
import { SemConexao } from './cliente.js'
import { TEXTOS } from '../conteudo/conteudo.js'
import { paraBackup } from '../conta/sincronia.js'

export const SENHA_MINIMA = 8

const ERROS = TEXTOS.conta.erros

/** Código do Supabase → chave de TEXTOS.conta.erros */
const CODIGOS = {
  invalid_credentials: 'credenciais',
  user_already_exists: 'jaExiste',
  email_exists: 'jaExiste',
  weak_password: 'senhaFraca',
  same_password: 'mesmaSenha',
  email_not_confirmed: 'naoConfirmado',
  email_address_invalid: 'emailInvalido',
  validation_failed: 'emailInvalido',
  over_email_send_rate_limit: 'muitosEmails',
  over_request_rate_limit: 'muitasTentativas',
  otp_expired: 'linkExpirado',
}

export class ErroDeConta extends Error {
  constructor(codigo, causa) {
    super(ERROS[codigo] ?? ERROS.desconhecido)
    this.name = 'ErroDeConta'
    this.codigo = codigo
    this.cause = causa
  }
}

function semRede(erro) {
  return erro?.name === 'AuthRetryableFetchError'
    || erro?.status === 0
    || /failed to fetch|networkerror|network request failed|load failed/i.test(erro?.message ?? '')
}

/** Converte o erro do Supabase. Devolve null quando não houve erro. */
export function traduzirErro(erro) {
  if (!erro) return null
  if (semRede(erro)) return new SemConexao(erro)
  return new ErroDeConta(CODIGOS[erro.code] ?? 'desconhecido', erro)
}

/** Mensagem pronta para a tela a partir de qualquer erro. */
export function mensagemDeErro(erro) {
  if (erro instanceof ErroDeConta) return erro.message
  if (erro instanceof SemConexao) return ERROS.semConexao
  return ERROS.desconhecido
}

function cliente() {
  if (!supabaseConfigurado) throw new ErroDeConta('naoConfigurado')
  return supabase
}

async function executar(promessa) {
  let resposta
  try {
    resposta = await promessa
  } catch (e) {
    throw traduzirErro(e) ?? e
  }
  const erro = traduzirErro(resposta.error)
  if (erro) throw erro
  return resposta.data
}

/** Para onde os links de e-mail voltam (precisa estar liberado no Supabase). */
const enderecoDoApp = () => `${globalThis.location?.origin ?? ''}/`

// ---- Sessão ----------------------------------------------------------------

export async function obterUsuario() {
  if (!supabaseConfigurado) return null
  const { session } = await executar(supabase.auth.getSession())
  return session?.user ?? null
}

/** Avisa a cada mudança de sessão. Devolve a função para parar de ouvir. */
export function ouvirSessao(aoMudar) {
  if (!supabaseConfigurado) return () => {}
  const { data } = supabase.auth.onAuthStateChange((evento, sessao) => {
    aoMudar(evento, sessao?.user ?? null)
  })
  return () => data.subscription.unsubscribe()
}

// ---- CRUD da conta ---------------------------------------------------------

/** Create. Devolve { precisaConfirmar } (quando o Supabase pede confirmação por e-mail). */
export async function cadastrar({ email, senha, apelido }) {
  const data = await executar(cliente().auth.signUp({
    email: email.trim(),
    password: senha,
    options: { data: { apelido: apelido.trim() }, emailRedirectTo: enderecoDoApp() },
  }))
  return { precisaConfirmar: !data.session }
}

export async function entrar({ email, senha }) {
  const data = await executar(cliente().auth.signInWithPassword({ email: email.trim(), password: senha }))
  return data.user
}

/** Logout só neste aparelho (funciona offline). */
export async function sair() {
  if (!supabaseConfigurado) return
  await executar(supabase.auth.signOut({ scope: 'local' }))
}

export async function enviarLinkDeRecuperacao(email) {
  await executar(cliente().auth.resetPasswordForEmail(email.trim(), { redirectTo: enderecoDoApp() }))
}

/** Usada depois do link de recuperação (evento PASSWORD_RECOVERY) e em "Trocar senha". */
export async function definirSenha(senha) {
  await executar(cliente().auth.updateUser({ password: senha }))
}

/** Update do apelido (fica nos metadados da conta). */
export async function atualizarApelido(apelido) {
  const data = await executar(cliente().auth.updateUser({ data: { apelido: apelido.trim() } }))
  return data.user
}

/** Update do e-mail. O Supabase manda um link; a troca vale depois de confirmar. */
export async function atualizarEmail(email) {
  await executar(cliente().auth.updateUser({ email: email.trim() }, { emailRedirectTo: enderecoDoApp() }))
}

/** Delete. Apaga a conta e o backup (cascata no banco) e encerra a sessão local. */
export async function apagarConta() {
  await executar(cliente().rpc('apagar_minha_conta'))
  await sair().catch(() => {})
}

// ---- Backup do progresso ---------------------------------------------------

/** Devolve { estado, atualizadoEm } ou null se a conta ainda não tem backup. */
export async function buscarProgresso(usuarioId) {
  const data = await executar(
    cliente().from('progresso').select('estado, atualizado_em').eq('usuario_id', usuarioId).maybeSingle(),
  )
  return data ? { estado: data.estado, atualizadoEm: data.atualizado_em } : null
}

/** Grava o backup. O celular da tripulação é removido antes de sair do aparelho. */
export async function salvarProgresso(usuarioId, estado) {
  await executar(cliente().from('progresso').upsert({
    usuario_id: usuarioId,
    estado: paraBackup(estado),
    atualizado_em: estado.atualizadoEm ?? new Date().toISOString(),
  }))
}
