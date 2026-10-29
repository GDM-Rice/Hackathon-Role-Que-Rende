export function iniciar(opcoes?: {
  assets?: string;
  aoEvento?: (tipo: import('@/lib/tipos').TipoEvento, dados: Record<string, unknown>) => void;
}): Promise<void>;
