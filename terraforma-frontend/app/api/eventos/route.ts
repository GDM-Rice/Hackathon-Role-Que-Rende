import { NextResponse } from 'next/server';
import type { Evento } from '@/lib/tipos';
import { aplicarEvento, eventos } from '../_memoria';

const TIPOS = ['perfil_criado', 'sessao_respiracao', 'tempestade', 'passo_divida', 'plano_divida', 'barreira_ativada', 'troca_registrada'];

export async function POST(req: Request) {
  const e = (await req.json()) as Evento;
  if (!e || !TIPOS.includes(e.tipo) || typeof e.dados !== 'object') return NextResponse.json({ erro: 'evento inválido' }, { status: 400 });
  eventos.push(e); aplicarEvento(e);
  return NextResponse.json({ ok: true, total: eventos.length }, { status: 201 });
}

export async function GET() {
  return NextResponse.json(eventos.slice(-100));
}
