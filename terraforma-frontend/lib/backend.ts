// Cliente do back-end NestJS (conta, perfil e conversas). Porta padrão 3001.
// - Põe "Authorization: Bearer <token>" sozinho.
// - Converte os erros do Nest ({ message: string | string[] }) em BackendError com texto em português.
// - Token vencido ou conta apagada (401): limpa o token e avisa quem pediu (aoDeslogar).
// Eventos e estado do protótipo NÃO passam por aqui: ficam em lib/api.ts.

export const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001').replace(/\/$/, '');

const TOKEN = 'terraforma:token';

export const token = {
  ler(): string | null {
    try { return localStorage.getItem(TOKEN); } catch { return null; }
  },
  gravar(t: string) {
    try { localStorage.setItem(TOKEN, t); } catch { /* modo privado: a sessão dura até recarregar */ }
  },
  limpar() {
    try { localStorage.removeItem(TOKEN); } catch { /* ignora */ }
  },
};

export class BackendError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'BackendError';
  }
}

let aoDeslogar: (() => void) | null = null;
export function quandoDeslogar(fn: (() => void) | null) { aoDeslogar = fn; }

function mensagemDeErro(status: number, corpo: unknown): string {
  if (status === 429) return 'Muitas tentativas. Espere um minutinho e tente de novo.';
  if (corpo && typeof corpo === 'object' && 'message' in corpo) {
    const m = (corpo as { message: unknown }).message;
    if (Array.isArray(m)) return m.join(' ');
    if (typeof m === 'string') return m;
  }
  if (status >= 500) return 'Erro no servidor. Tente de novo em instantes.';
  return 'Algo deu errado.';
}

type Opcoes = { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown; publica?: boolean };

async function chamar<T>(caminho: string, { method = 'GET', body, publica = false }: Opcoes = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const t = publica ? null : token.ler();
  if (t) headers.Authorization = `Bearer ${t}`;

  let r: Response;
  try {
    r = await fetch(BACKEND_URL + caminho, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    // fora do ar ou bloqueado por CORS (o back só aceita FRONTEND_URL/CORS_ORIGINS)
    throw new BackendError(0, 'Não foi possível falar com o servidor agora. Você pode continuar sem conta.');
  }

  const texto = r.status === 204 ? '' : await r.text();
  let corpo: unknown;
  try { corpo = texto ? JSON.parse(texto) : undefined; } catch { corpo = undefined; }

  if (!r.ok) {
    if (r.status === 401 && !publica) { token.limpar(); aoDeslogar?.(); }
    throw new BackendError(r.status, mensagemDeErro(r.status, corpo));
  }
  return corpo as T;
}

// ---- Tipos que espelham as respostas do back ----

export type Usuario = { id: string; username: string; email: string; createdAt: string; updatedAt: string };
export type Pessoa = { id: string; username: string };
export type Mensagem = { id: string; chatId: string; autorId: string | null; autor: Pessoa | null; conteudo: string; moderada: boolean; createdAt: string };
export type Conversa = { id: string; titulo: string; createdAt: string; updatedAt: string; membros: Pessoa[] };
export type PaginaConversas = { itens: Conversa[]; proximoCursor: string | null };
export type ConversaComMensagens = Conversa & { mensagens: Mensagem[]; proximoCursor: string | null };

// ---- Conta ----

export async function entrar(email: string, senha: string): Promise<Usuario> {
  const { access_token } = await chamar<{ access_token: string }>('/auth/login', { method: 'POST', body: { email, senha }, publica: true });
  token.gravar(access_token);
  return eu();
}

export async function criarConta(username: string, email: string, senha: string): Promise<Usuario> {
  await chamar<Usuario>('/user', { method: 'POST', body: { username, email, senha }, publica: true });
  return entrar(email, senha);
}

/** Usuário do token salvo, ou null se não houver sessão válida. */
export async function sessao(): Promise<Usuario | null> {
  if (!token.ler()) return null;
  try { return await eu(); } catch (e) {
    if (e instanceof BackendError && e.status === 401) return null;
    throw e;   // fora do ar: quem chamou decide (mantém o token para tentar depois)
  }
}

export const eu = () => chamar<Usuario>('/auth/me');
export const sair = () => token.limpar();
export const esqueciSenha = (email: string) =>
  chamar<{ message: string }>('/auth/forgot-password', { method: 'POST', body: { email }, publica: true });
export const redefinirSenha = (tokenRecuperacao: string, novaSenha: string) =>
  chamar<{ message: string }>('/auth/reset-password', { method: 'POST', body: { token: tokenRecuperacao, novaSenha }, publica: true });

/** Apaga a conta no servidor (mensagens antigas ficam sem autor) e encerra a sessão. */
export async function apagarConta() {
  await chamar('/user/me', { method: 'DELETE' });
  token.limpar();
}

// ---- Conversas entre membros ----

export const listarConversas = () => chamar<PaginaConversas>('/chats?limit=50');
export const abrirConversa = (id: string) => chamar<ConversaComMensagens>(`/chats/${encodeURIComponent(id)}?limit=100`);
export const criarConversa = (membros: string[], titulo?: string) =>
  chamar<Conversa>('/chats', { method: 'POST', body: titulo ? { membros, titulo } : { membros } });
export const enviarMensagem = (id: string, conteudo: string) =>
  chamar<Mensagem>(`/chats/${encodeURIComponent(id)}/messages`, { method: 'POST', body: { conteudo } });
export const sairDaConversa = (id: string) => chamar<void>(`/chats/${encodeURIComponent(id)}`, { method: 'DELETE' });
