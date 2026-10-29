import { NextResponse } from 'next/server';
import { TIPOS_EVENTO, type Evento } from '@/lib/tipos';
import { aplicarEvento, eventos } from '../_memoria';

export async function POST(req: Request) {
  const e = (await req.json()) as Evento;
  if (!e || !(TIPOS_EVENTO as readonly string[]).includes(e.tipo) || typeof e.dados !== 'object') return NextResponse.json({ erro: 'evento inválido' }, { status: 400 });
  eventos.push(e); aplicarEvento(e);
  return NextResponse.json({ ok: true, total: eventos.length }, { status: 201 });
}

export async function GET() {
  return NextResponse.json(eventos.slice(-100));
}
