// Tipos do domínio do Terraforma. São o contrato entre o front e o backend (ver docs/API.md).
// Regra de ouro: o planeta NUNCA é salvo. Ele é calculado a partir destes dados (estadoDoPlaneta em prototipo/globo.js),
// assim nada regride por erro.

export type Regiao = 'Sul' | 'Sudeste' | 'Centro-Oeste' | 'Nordeste' | 'Norte';
export type Periodo = 'dia' | 'semana' | 'mes';

export interface Conta {
  email: string;                // login simples do protótipo; a autenticação real é do backend
}

export interface Perfil {
  nome: string;                 // apelido escolhido na entrada
  motivo: string;               // da lista ou escrito pela pessoa ("+ Outro motivo")
  valor?: number | null;        // "Quanto você apostava?" (opcional). Só alimenta o "R$ longe das apostas"; nunca muda o planeta
  periodo?: Periodo;            // período do valor: R$ por dia, semana ou mês
  sobre?: Partial<Record<'tempo' | 'tipo' | 'familia' | 'atendimento', string>>; // "Sobre você", 4 perguntas opcionais
  pesquisa?: boolean;           // aceitou enviar números anônimos para pesquisa
}

export interface Ajustes {
  tema: 'auto' | 'claro' | 'escuro';
  contraste: boolean;
  daltonismo: boolean;
  texto: 0 | 1 | 2;             // tamanho do texto
  espaco: boolean;              // mais espaço entre linhas
  anim: 'auto' | 'reduzidas' | 'normais';
  som: boolean;
  legendas: boolean;
}

export interface Rios { amazonas: boolean; saoFrancisco: boolean; parana: boolean }

/** Dados de onde o planeta é calculado. */
export interface Progresso {
  inicio: string;               // data ISO do primeiro dia
  diasDeRecomeco: number;       // dias completos sem apostar (contam sozinhos à meia-noite)
  mares: number;                // sessões de respiração de 60 s ou mais (0 a 10 limpa o mar)
  rios: Rios;                   // cada Barreira ativada traz um rio
  tempestadeHoje: boolean;      // "Apostei hoje" marcado hoje; não tira nada
}

export type Juros = 'muito alto' | 'alto' | 'sem juros';
export interface Divida {
  id: string;
  tipo: string;                 // "Cartão de crédito", "Cheque especial", "Empréstimo", "Crediário", "Conta atrasada", "Pessoa próxima"
  quem?: string;                // nome, quando é com pessoa próxima
  valor?: number | null;        // opcional; nunca afeta o planeta
  juros: Juros;
  passo: 0 | 1 | 2 | 3 | 4 | 5; // 1 anotar · 2 pedir proposta · 3 fechar acordo · 4 pagar a 1ª parcela · 5 pagar até o fim
  plano?: { quando: string; onde: string } | null; // "Quando você vai fazer?" e "Por onde?"
  familia?: boolean;            // dívida com pessoa próxima: passos de combinar, sem juros
}
export type Barreira = 'pix' | 'bloqueador' | 'combinado';
export interface Financas {
  basico: Record<'Moradia' | 'Comida' | 'Luz e água' | 'Transporte' | 'Remédios', boolean>;
  estrategia: 'cara' | 'menor';  // "Qual pagar primeiro?": juros mais altos ou a menor
  dividas: Divida[];
  barreiras: Record<Barreira, boolean>;
}

export interface PessoaOrbita {
  id: string;
  nome: string;
  relacao: string;              // "irmã", "amigo"
  telefone?: string;            // só no aparelho; na demo, número de teste
  recados: { texto: string; escritoEm: string }[]; // escritos pela própria pessoa, nunca gerados pelo app
}

export interface Trocas { minhas: string[] }

/** Trilha: 5 capítulos (um por região), 3 aulas com vídeo + quiz e um "Na prática" por capítulo. */
export interface Trilha {
  // chave "capitulo-indice" (índice do círculo no capítulo: 0 aula 1, 1 quiz 1, ..., 6 Na prática)
  feitas: Record<string, { em: string; acertos?: number | null; total?: number | null; escolha?: string | null }>;
}

/** Luneta: rede de apoio entre pares. */
export interface Luneta {
  planeta: { nome: string; cor: string; regiao?: Regiao; mostrarDias: boolean };
  bloqueados: string[];
  meus: { id: string; constelacao: string; texto: string; em: string; emRevisao: boolean }[];
}

export interface EstadoUsuario {
  conta: Conta | null;          // null = usando sem conta (só no aparelho)
  perfil: Perfil;
  progresso: Progresso;
  ajustes: Ajustes;
  financas: Financas;
  orbita: PessoaOrbita[];
  trocas: Trocas;
  trilha: Trilha;
  luneta: Luneta;
}

/** Eventos que o front emite hoje (prototipo/app.js → registrarEvento). Detalhes em docs/API.md. */
export const TIPOS_EVENTO = [
  // entrada e perfil
  'entrada', 'login', 'conta_criada', 'senha_esquecida', 'perfil_criado', 'pesquisa', 'dados_apagados',
  // órbita (sem nome nem telefone: ficam só no aparelho)
  'orbita_pessoa_adicionada', 'orbita_pessoa_removida', 'preciso_de_voce',
  // planeta
  'sessao_respiracao', 'tempestade', 'troca_registrada',
  // finanças
  'divida_adicionada', 'passo_divida', 'plano_divida', 'barreira_ativada',
  // trilha
  'trilha_aula', 'trilha_quiz', 'trilha_pratica',
  // luneta
  'luneta_post', 'luneta_resposta', 'luneta_mensagem', 'luneta_identifico', 'luneta_forca', 'luneta_mutirao',
  'luneta_denuncia', 'luneta_bloqueio', 'luneta_planeta_editado', 'luneta_alerta_crise',
] as const;
export type TipoEvento = (typeof TIPOS_EVENTO)[number];

export interface Evento {
  tipo: TipoEvento;
  dados: Record<string, unknown> & { em: string };
}
