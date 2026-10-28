// Armazenamento EM MEMÓRIA só para desenvolvimento: some quando o servidor reinicia.
// O backend real substitui estas rotas (ver docs/API.md).
import type { EstadoUsuario, Evento } from '@/lib/tipos';

export const eventos: Evento[] = [];

export const estado: EstadoUsuario = {
  perfil: { nome: 'Rafael', motivo: 'Para voltar a dormir em paz', apostaSemanal: null },
  progresso: { inicio: new Date().toISOString(), diasDeRecomeco: 21, mares: 9, rios: { amazonas: false, saoFrancisco: false, parana: false }, tempestadeHoje: false },
  acessibilidade: { temaEscuro: false, daltonismo: false, movimentoReduzido: false },
  financas: {
    basico: { Moradia: true, Comida: true, 'Luz e água': false, Transporte: true, Remédios: true },
    estrategia: 'cara',
    dividas: [
      { id: 'cartao', tipo: 'Cartão de crédito', detalhe: 'rotativo', valor: 2400, juros: 'muito alto', passo: 1 },
      { id: 'cheque', tipo: 'Cheque especial', valor: 800, juros: 'muito alto', passo: 1 },
      { id: 'emprestimo', tipo: 'Empréstimo pessoal', valor: 3500, juros: 'alto', passo: 1 },
      { id: 'ana', tipo: 'Ana', detalhe: 'irmã', valor: 500, juros: 'sem juros', passo: 1, familia: true },
    ],
    barreiras: { pix: false, bloqueador: false, combinado: false },
  },
  orbita: [
    { id: 'ana', nome: 'Ana', relacao: 'irmã', recados: [{ texto: 'Um dia de cada vez. Tô orgulhosa de você e tô aqui.', escritoEm: '2026-10-12' }] },
    { id: 'pedro', nome: 'Pedro', relacao: 'amigo', recados: [{ texto: 'Se apertar, me liga. Qualquer hora.', escritoEm: '2026-10-15' }] },
  ],
  trocas: { minhas: ['Jogar bola com o Pedro', 'Ouvir um podcast', 'Cozinhar algo'] },
};

/** Aplica as regras de negócio de cada evento ao estado (o backend real faz o mesmo). */
export function aplicarEvento(e: Evento) {
  const p = estado.progresso, d = e.dados as Record<string, any>;
  switch (e.tipo) {
    case 'perfil_criado': estado.perfil.nome = d.nome; estado.perfil.motivo = d.motivo; break;
    case 'sessao_respiracao': if (d.segundos >= 60) p.mares = Math.min(10, p.mares + 1); break;
    case 'tempestade': p.tempestadeHoje = true; break; // nada regride
    case 'passo_divida': {
      const div = estado.financas.dividas.find((x) => x.id === d.divida);
      if (div) div.passo = Math.max(div.passo, d.passo) as typeof div.passo;
      if (d.passo >= 2) p.rios.amazonas = true;
      if (d.passo >= 3) p.rios.parana = true;
      break;
    }
    case 'plano_divida': {
      const div = estado.financas.dividas.find((x) => x.id === d.divida);
      if (div) div.plano = { quando: d.quando, onde: d.onde };
      break;
    }
    case 'barreira_ativada': (estado.financas.barreiras as any)[d.barreira] = true; p.rios.saoFrancisco = true; break;
    case 'troca_registrada': if (d.vontade <= 3 && d.troca && !estado.trocas.minhas.includes(d.troca)) estado.trocas.minhas.unshift(d.troca); break;
  }
}
