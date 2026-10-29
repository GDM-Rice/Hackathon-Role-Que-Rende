import { NextResponse } from 'next/server';
import { estado } from '../_memoria';
import { desligada, exemploLigado, lerJson, objetoSimples } from '../_acesso';

export async function GET() {
  if (!exemploLigado()) return desligada();
  return NextResponse.json(estado);
}

export async function PATCH(req: Request) {
  if (!exemploLigado()) return desligada();
  const corpo = await lerJson(req);
  if (!corpo.ok) return corpo.resposta;
  if (!objetoSimples(corpo.valor)) return NextResponse.json({ erro: 'estado inválido' }, { status: 400 });
  // só as seções que o estado já tem: chave desconhecida (ou "__proto__") é ignorada
  for (const k of Object.keys(estado)) if (Object.hasOwn(corpo.valor, k)) (estado as unknown as Record<string, unknown>)[k] = corpo.valor[k];
  return NextResponse.json(estado);
}
