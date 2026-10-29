import { NextResponse } from 'next/server';
import { TIPOS_EVENTO, type Evento } from '@/lib/tipos';
import { aplicarEvento, eventos, MAX_EVENTOS } from '../_memoria';
import { desligada, exemploLigado, lerJson, objetoSimples } from '../_acesso';

export async function POST(req: Request) {
  if (!exemploLigado()) return desligada();
  const corpo = await lerJson(req);
  if (!corpo.ok) return corpo.resposta;
  const e = corpo.valor as Evento;
  if (!objetoSimples(e) || !(TIPOS_EVENTO as readonly string[]).includes(e.tipo) || !objetoSimples(e.dados)) return NextResponse.json({ erro: 'evento inválido' }, { status: 400 });
  eventos.push(e); aplicarEvento(e);
  if (eventos.length > MAX_EVENTOS) eventos.splice(0, eventos.length - MAX_EVENTOS); // a memória não cresce sem limite
  return NextResponse.json({ ok: true, total: eventos.length }, { status: 201 });
}

export async function GET() {
  if (!exemploLigado()) return desligada();
  return NextResponse.json(eventos.slice(-100));
}
