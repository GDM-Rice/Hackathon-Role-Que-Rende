export function iniciar(opcoes?: {
  assets?: string;
  aoEvento?: (tipo: import('@/lib/tipos').TipoEvento, dados: Record<string, unknown>) => void;
  /** cliente do back NestJS (conta, senha e conversas); sem ele o app só funciona sem conta */
  backend?: typeof import('@/lib/backend');
}): Promise<void>;
