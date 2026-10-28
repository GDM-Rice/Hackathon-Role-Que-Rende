// Cliente HTTP único do front. Toda conversa com o back-end (NestJS, porta 3001) passa por aqui.
// - Põe o "Authorization: Bearer <token>" automaticamente.
// - Converte os erros do Nest ({ message: string | string[] }) em um ApiError com texto em português.
// - Se uma rota protegida responder 401 (token vencido, senha trocada, conta apagada),
//   avisa o AuthProvider para deslogar.

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"
).replace(/\/$/, "");

const TOKEN_KEY = "terraforma:token";

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* navegador bloqueou o storage: a sessão só dura até recarregar */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignora */
    }
  },
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

type Options = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** false = rota pública (login, cadastro...): não manda token e 401 não desloga. */
  auth?: boolean;
};

function mensagemDeErro(status: number, data: unknown): string {
  if (status === 429) return "Muitas tentativas. Espere um minutinho e tente de novo.";
  if (data && typeof data === "object" && "message" in data) {
    const m = (data as { message: unknown }).message;
    if (Array.isArray(m)) return m.join(" ");
    if (typeof m === "string") return m;
  }
  if (status >= 500) return "Erro no servidor. Tente novamente em instantes.";
  return "Algo deu errado.";
}

export async function api<T = unknown>(
  path: string,
  { method = "GET", body, auth = true }: Options = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fetch só lança erro aqui se o servidor está fora do ar OU se o navegador bloqueou por CORS.
    throw new ApiError(
      0,
      `Não foi possível falar com o servidor (${API_URL}). Verifique se o back está rodando e se esta página foi aberta pelo endereço de FRONTEND_URL/CORS_ORIGINS do back (use localhost, não 127.0.0.1).`,
    );
  }

  // 204 (DELETE /chats/:id) não tem corpo.
  const text = res.status === 204 ? "" : await res.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = undefined;
    }
  }

  if (!res.ok) {
    if (res.status === 401 && auth) onUnauthorized?.();
    throw new ApiError(res.status, mensagemDeErro(res.status, data));
  }
  return data as T;
}

// ---- Tipos que espelham as respostas do back-end ----

export type User = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type Chat = {
  id: string;
  titulo: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  chatId: string;
  role: "USER" | "ASSISTANT";
  conteudo: string;
  createdAt: string;
};

export type ChatPage = { itens: Chat[]; proximoCursor: string | null };
export type ChatDetail = Chat & { mensagens: Message[]; proximoCursor: string | null };
