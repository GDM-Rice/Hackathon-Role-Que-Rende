// Armazenamento EM MEMÓRIA só para desenvolvimento: some quando o servidor reinicia.
// O backend real substitui estas rotas (ver docs/API.md). Todos os dados abaixo são fictícios (edital, item 8.5).
import type { EstadoUsuario, Evento, Barreira, Rios } from '@/lib/tipos';

export const eventos: Evento[] = [];

export const estado: EstadoUsuario = {
  conta: null,
  perfil: { nome: 'Rafael', motivo: 'Para voltar a dormir em paz', valor: 120, periodo: 'semana', sobre: {}, pesquisa: false },
  progresso: { inicio: new Date().toISOString(), diasDeRecomeco: 21, mares: 9, rios: { amazonas: false, saoFrancisco: false, parana: false }, tempestadeHoje: false },
  ajustes: { tema: 'auto', contraste: false, daltonismo: false, texto: 0, espaco: false, anim: 'auto', som: true, legendas: true },
  financas: {
    basico: { Moradia: true, Comida: true, 'Luz e água': false, Transporte: true, Remédios: true },
    estrategia: 'cara',
    dividas: [
      { id: 'cartao', tipo: 'Cartão de crédito', valor: 2400, juros: 'muito alto', passo: 1 },
      { id: 'cheque', tipo: 'Cheque especial', valor: 800, juros: 'muito alto', passo: 1 },
      { id: 'emprestimo', tipo: 'Empréstimo', valor: 3500, juros: 'alto', passo: 1 },
      { id: 'ana', tipo: 'Pessoa próxima', quem: 'Ana', valor: 500, juros: 'sem juros', passo: 1, familia: true },
    ],
    barreiras: { pix: false, bloqueador: false, combinado: false },
  },
  orbita: [
    { id: 'ana', nome: 'Ana', relacao: 'irmã', recados: [{ texto: 'Um dia de cada vez. Tô orgulhosa de você e tô aqui.', escritoEm: '2026-10-12' }] },
    { id: 'pedro', nome: 'Pedro', relacao: 'amigo', recados: [{ texto: 'Se apertar, me liga. Qualquer hora.', escritoEm: '2026-10-15' }] },
  ],
  trocas: { minhas: ['Jogar bola com o Pedro', 'Ouvir um podcast', 'Cozinhar algo'] },
  trilha: { feitas: {} },
  luneta: { planeta: { nome: 'Verde-42', cor: '#639922', mostrarDias: true }, bloqueados: [], meus: [] },
};

/** Cada Barreira traz um rio. Nada regride. */
export const RIO_DA_BARREIRA: Record<Barreira, keyof Rios> = { pix: 'amazonas', bloqueador: 'saoFrancisco', combinado: 'parana' };

/** Aplica as regras de negócio de cada evento ao estado (o backend real faz o mesmo). */
export function aplicarEvento(e: Evento) {
  const p = estado.progresso, d = e.dados as Record<string, any>;
  switch (e.tipo) {
    case 'login': case 'conta_criada': break; // autenticação é do backend real
    case 'dados_apagados': eventos.length = 0; break; // o backend real apaga tudo da pessoa (LGPD)
    case 'entrada': estado.conta = null; break;
    case 'perfil_criado':
      Object.assign(estado.perfil, { nome: d.nome, motivo: d.motivo, valor: d.valor ?? null, periodo: d.periodo ?? 'semana' });
      estado.progresso = { inicio: d.em, diasDeRecomeco: 1, mares: 0, rios: { amazonas: false, saoFrancisco: false, parana: false }, tempestadeHoje: false };
      break;
    case 'pesquisa': estado.perfil.pesquisa = !!d.participa; break;
    case 'sessao_respiracao': if (d.segundos >= 60) p.mares = Math.min(10, p.mares + 1); break;
    case 'tempestade': p.tempestadeHoje = true; break; // não tira nada
    case 'troca_registrada': if (d.vontade <= 3 && d.troca && !estado.trocas.minhas.includes(d.troca)) estado.trocas.minhas.unshift(d.troca); break;
    case 'passo_divida': {
      const div = estado.financas.dividas.find((x) => x.id === d.divida);
      if (div) { div.passo = Math.max(div.passo, d.passo) as typeof div.passo; div.plano = null; }
      break; // passo de dívida NÃO mexe em rio
    }
    case 'plano_divida': {
      const div = estado.financas.dividas.find((x) => x.id === d.divida);
      if (div) div.plano = { quando: d.quando, onde: d.onde };
      break;
    }
    case 'barreira_ativada': {
      const b = d.barreira as Barreira;
      if (b in RIO_DA_BARREIRA) { estado.financas.barreiras[b] = true; p.rios[RIO_DA_BARREIRA[b]] = true; }
      break;
    }
    case 'trilha_aula': case 'trilha_quiz': case 'trilha_pratica': {
      const k = `${d.capitulo}-${d.indice}`;
      estado.trilha.feitas[k] ??= { em: d.em, acertos: d.acertos ?? null, total: d.total ?? null, escolha: d.escolha ?? null };
      break;
    }
    case 'luneta_post':
      estado.luneta.meus.unshift({ id: d.id, constelacao: d.constelacao, texto: d.texto, em: d.em, emRevisao: !!d.revisao });
      break;
    default: break; // demais eventos da Luneta: registro, contagem e fila de moderação
  }
}
