// Tipos do domínio do Terraforma. São o contrato entre o front e o backend (ver docs/API.md).
// Regra de ouro: o planeta NUNCA é salvo. Ele é calculado a partir destes dados (estadoDoPlaneta em prototipo/globo.js),
// assim nada regride por erro.

export type Regiao = 'Sul' | 'Sudeste' | 'Centro-Oeste' | 'Nordeste' | 'Norte';

export interface Perfil {
  nome: string;                 // apelido escolhido na Boas-vindas
  motivo: string;               // "Para voltar a dormir em paz", "Pela minha família"...
  apostaSemanal?: number | null; // opcional, só alimenta o texto "longe das apostas"; nunca muda o planeta
}

export interface Acessibilidade {
  temaEscuro: boolean;
  daltonismo: boolean;
  movimentoReduzido: boolean;
}

/** Dados de onde o planeta é calculado. */
export interface Progresso {
  inicio: string;               // data ISO do primeiro dia
  diasDeRecomeco: number;       // dias completos sem apostar (contam sozinhos à meia-noite)
  mares: number;                // sessões de respiração de 60 s ou mais (0–10 limpa o mar)
  rios: { amazonas: boolean; saoFrancisco: boolean; parana: boolean };
  tempestadeHoje: boolean;      // "Apostei hoje" marcado hoje; não tira nada
}

export type EstrategiaDividas = 'cara' | 'menor';
export interface Divida {
  id: string;
  tipo: string;                 // "Cartão de crédito", "Ana"...
  detalhe?: string;             // "rotativo", "irmã"
  valor?: number | null;        // opcional; nunca afeta o planeta
  juros: 'muito alto' | 'alto' | 'sem juros';
  passo: 0 | 1 | 2 | 3 | 4 | 5; // listei, abri a negociação, renegociei, paguei a 1ª, quitei
  plano?: { quando: string; onde: string } | null;
  familia?: boolean;            // dívida com parente: passos de combinar
}
export interface Financas {
  basico: Record<'Moradia' | 'Comida' | 'Luz e água' | 'Transporte' | 'Remédios', boolean>;
  estrategia: EstrategiaDividas;
  dividas: Divida[];
  barreiras: { pix: boolean; bloqueador: boolean; combinado: boolean };
}

export interface PessoaOrbita {
  id: string;
  nome: string;
  relacao: string;              // "irmã", "amigo"
  telefone?: string;            // só no aparelho; na demo, número de teste
  recados: { texto: string; escritoEm: string }[]; // escritos pela própria pessoa, nunca gerados pelo app
}

export interface Trocas {
  minhas: string[];             // "Jogar bola com o Pedro"...
}

export interface EstadoUsuario {
  perfil: Perfil;
  progresso: Progresso;
  acessibilidade: Acessibilidade;
  financas: Financas;
  orbita: PessoaOrbita[];
  trocas: Trocas;
}

/** Eventos que o front já emite hoje (prototipo/app.js → registrarEvento). */
export type TipoEvento =
  | 'perfil_criado'        // { nome, motivo }
  | 'sessao_respiracao'    // { tecnica, segundos, antes, depois }  → 60 s ou mais soma uma Maré
  | 'tempestade'           // {}                                    → marca "Apostei hoje"
  | 'passo_divida'         // { divida, passo }                     → passo 2 traz o Amazonas, passo 3 o Paraná
  | 'plano_divida'         // { divida, quando, onde }
  | 'barreira_ativada'     // { barreira }                          → a 1ª traz o São Francisco
  | 'troca_registrada';    // { troca, vontade }                    → vontade de 0 a 10 depois da troca

export interface Evento {
  tipo: TipoEvento;
  dados: Record<string, unknown> & { em: string };
}
