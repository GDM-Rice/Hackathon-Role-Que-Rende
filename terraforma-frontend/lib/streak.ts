// Contagem de "dias sem apostar" e estágios do planeta.
//
// ATENÇÃO: o back-end ainda NÃO tem tabela/rota para isso (só usuários e chats).
// Por enquanto a contagem fica no navegador (localStorage), separada por usuário.
// Para ir ao back depois, basta trocar as funções abaixo por chamadas em lib/api.ts.

export type Streak = {
  /** ISO da data de início da contagem atual; null = ainda não começou */
  inicio: string | null;
  /** recorde em dias */
  melhor: number;
};

export type Estagio = { min: number; nome: string; descricao: string };

export const ESTAGIOS: Estagio[] = [
  { min: 0, nome: "Terra árida", descricao: "O planeta está seco. Cada dia sem apostar planta a primeira semente." },
  { min: 1, nome: "Primeiros brotos", descricao: "A vida começa a voltar. Continue, um dia de cada vez." },
  { min: 7, nome: "Vida voltando", descricao: "Rios e verde aparecem. Uma semana inteira — isso é enorme." },
  { min: 30, nome: "Floresta crescendo", descricao: "Um mês! As florestas já cobrem boa parte do planeta." },
  { min: 90, nome: "Planeta vivo", descricao: "Três meses ou mais. O planeta está respirando de novo." },
];

export function indiceEstagio(dias: number): number {
  let idx = 0;
  ESTAGIOS.forEach((e, i) => {
    if (dias >= e.min) idx = i;
  });
  return idx;
}

export function diasDesde(inicioISO: string | null, agora: number = Date.now()): number {
  if (!inicioISO) return 0;
  const t = Date.parse(inicioISO);
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((agora - t) / 86_400_000));
}

const key = (userId: string) => `terraforma:streak:${userId}`;

export function lerStreak(userId: string): Streak {
  try {
    const raw = localStorage.getItem(key(userId));
    if (raw) {
      const p = JSON.parse(raw) as Partial<Streak>;
      return {
        inicio: typeof p.inicio === "string" ? p.inicio : null,
        melhor: typeof p.melhor === "number" ? p.melhor : 0,
      };
    }
  } catch {
    /* storage indisponível ou JSON quebrado: começa do zero */
  }
  return { inicio: null, melhor: 0 };
}

function salvar(userId: string, s: Streak) {
  try {
    localStorage.setItem(key(userId), JSON.stringify(s));
  } catch {
    /* ignora */
  }
}

export function iniciarStreak(userId: string, desde: Date = new Date()): Streak {
  const atual = lerStreak(userId);
  const novo = { ...atual, inicio: desde.toISOString() };
  salvar(userId, novo);
  return novo;
}

/** Recaída: guarda o recorde e zera a contagem (o usuário recomeça quando quiser). */
export function zerarStreak(userId: string): Streak {
  const atual = lerStreak(userId);
  const melhor = Math.max(atual.melhor, diasDesde(atual.inicio));
  const novo = { inicio: null, melhor };
  salvar(userId, novo);
  return novo;
}
