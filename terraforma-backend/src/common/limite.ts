import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';

// Limite de tentativas por IP e por rota (janela fixa, em memória).
// Substitui o @nestjs/throttler, que ainda é CommonJS e faz require() do @nestjs/common (só ESM
// no Nest 12): o Vercel não carrega isso e a função caía ao iniciar (ERR_REQUIRE_ESM).
// Mesma API de antes: @Throttle({ default: { limit, ttl } }) e @SkipThrottle().
// Em memória quer dizer: por instância. No Vercel, cada instância da função conta separado.

export type Limite = { limit: number; ttl: number };

export const LIMITE_PADRAO: Limite = { limit: 60, ttl: 60_000 };
const CHAVE_LIMITE = 'terraforma:limite';
const CHAVE_SEM_LIMITE = 'terraforma:sem-limite';
const MAX_CHAVES = 10_000;

export const Throttle = (opcoes: { default: Limite }) =>
  SetMetadata(CHAVE_LIMITE, opcoes.default);
export const SkipThrottle = () => SetMetadata(CHAVE_SEM_LIMITE, true);

@Injectable()
export class LimiteGuard implements CanActivate {
  private readonly contagens = new Map<string, { n: number; fim: number }>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const alvos = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(CHAVE_SEM_LIMITE, alvos))
      return true;
    const { limit, ttl } =
      this.reflector.getAllAndOverride<Limite>(CHAVE_LIMITE, alvos) ??
      LIMITE_PADRAO;

    const req = ctx.switchToHttp().getRequest<Request>();
    const ip = req.ip ?? req.socket?.remoteAddress ?? 'desconhecido';
    const chave = `${ip}|${ctx.getClass().name}.${ctx.getHandler().name}`;
    const agora = Date.now();

    let c = this.contagens.get(chave);
    if (!c || c.fim <= agora) {
      if (this.contagens.size >= MAX_CHAVES) this.limpar(agora);
      c = { n: 0, fim: agora + ttl };
      this.contagens.set(chave, c);
    }
    c.n += 1;
    if (c.n > limit) {
      const res = ctx.switchToHttp().getResponse<Response>();
      res.setHeader?.('Retry-After', String(Math.ceil((c.fim - agora) / 1000)));
      throw new HttpException(
        'Muitas tentativas. Espere um minutinho e tente de novo.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }

  private limpar(agora: number) {
    for (const [k, v] of this.contagens)
      if (v.fim <= agora) this.contagens.delete(k);
    // ainda cheio (muitos IPs ao mesmo tempo): começa de novo em vez de crescer sem limite
    if (this.contagens.size >= MAX_CHAVES) this.contagens.clear();
  }
}
