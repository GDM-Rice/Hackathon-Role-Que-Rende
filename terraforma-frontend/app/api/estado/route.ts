import { NextResponse } from 'next/server';
import { estado } from '../_memoria';

export async function GET() {
  return NextResponse.json(estado);
}

export async function PATCH(req: Request) {
  const parcial = await req.json();
  Object.assign(estado, parcial);
  return NextResponse.json(estado);
}
