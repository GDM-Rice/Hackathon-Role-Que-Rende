import type { EstadoUsuario, Evento, TipoEvento } from './tipos';

// Se NEXT_PUBLIC_API_URL estiver vazio, usa as rotas de exemplo deste próprio app (/api/...).
const BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '') || '/api';
const FILA = 'terraforma:eventos-pendentes';

async function chamar<T>(caminho: string, init?: RequestInit): Promise<T> {
  const r = await fetch(BASE + caminho, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    // Autenticação: o backend decide (cookie de sessão ou Bearer). Ajuste aqui.
    credentials: 'include',
  });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} em ${caminho}`);
  return (await r.json()) as T;
}

/** Envia um evento. Sem conexão, guarda numa fila local e tenta de novo no próximo envio. */
export async function registrarEvento(tipo: TipoEvento, dados: Record<string, unknown>) {
  const evento: Evento = { tipo, dados: { em: new Date().toISOString(), ...dados } };
  const pendentes = lerFila();
  try {
    for (const e of [...pendentes, evento]) await chamar('/eventos', { method: 'POST', body: JSON.stringify(e) });
    gravarFila([]);
  } catch {
    gravarFila([...pendentes, evento]);
  }
}

export const carregarEstado = () => chamar<EstadoUsuario>('/estado');
export const salvarEstado = (parcial: Partial<EstadoUsuario>) =>
  chamar<EstadoUsuario>('/estado', { method: 'PATCH', body: JSON.stringify(parcial) });

function lerFila(): Evento[] {
  try { return JSON.parse(localStorage.getItem(FILA) ?? '[]'); } catch { return []; }
}
function gravarFila(f: Evento[]) {
  try { localStorage.setItem(FILA, JSON.stringify(f)); } catch { /* modo privado */ }
}
