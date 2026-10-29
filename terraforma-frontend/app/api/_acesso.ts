import { NextResponse } from 'next/server';

// As rotas /api/eventos e /api/estado são só um backend de EXEMPLO em memória (ver _memoria.ts):
// sem login, e o que uma pessoa grava vale para todo mundo que cair na mesma instância.
// Em produção no Vercel ficam desligadas (404). API_EXEMPLO=1 liga de propósito.
// Em desenvolvimento, preview e local seguem ligadas (os testes de testes/ dependem delas).
// O app para de enviar eventos nesse caso: next.config.mjs define NEXT_PUBLIC_EVENTOS_API.
export const exemploLigado = () => process.env.VERCEL_ENV !== 'production' || process.env.API_EXEMPLO === '1';

export const desligada = () => NextResponse.json({ erro: 'não encontrado' }, { status: 404 });

/** Tamanho máximo do corpo de uma chamada: um evento ou uma atualização de estado cabem folgados. */
export const MAX_CORPO = 10_000;

type Corpo = { ok: true; valor: unknown } | { ok: false; resposta: NextResponse };

/** Lê o JSON do corpo com limite de tamanho. Corpo grande dá 413 e JSON quebrado dá 400 (em vez de erro 500). */
export async function lerJson(req: Request): Promise<Corpo> {
  const grande = () => ({ ok: false as const, resposta: NextResponse.json({ erro: 'corpo grande demais' }, { status: 413 }) });
  if (Number(req.headers.get('content-length') ?? 0) > MAX_CORPO) return grande();
  const texto = await req.text(); // sem Content-Length (chunked) o cabeçalho não basta: confere o tamanho de verdade
  if (texto.length > MAX_CORPO) return grande();
  try {
    return { ok: true, valor: JSON.parse(texto) };
  } catch {
    return { ok: false, resposta: NextResponse.json({ erro: 'JSON inválido' }, { status: 400 }) };
  }
}

export const objetoSimples = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
