import { moderar, REMOVIDO } from './moderacao.js';

const removeu = (texto: string) => moderar(texto).moderada;

describe('moderar', () => {
  describe('links', () => {
    it.each([
      'entra em https://site-qualquer.com/promo',
      'olha http://exemplo.net',
      'acessa www.exemplo.com.br',
      'manda no exemplo.com',
      'cupom em promo.bet',
      'segue o bit.ly/abc123',
      'me chama no t.me/fulano',
      'wa.me/5511999999999',
      'disfarçado exemplo . com',
      'disfarçado exemplo[.]com',
      'meu email fulano@exemplo.com',
    ])('remove: %s', (texto) => {
      expect(removeu(texto)).toBe(true);
    });

    it('mantém o resto da frase', () => {
      expect(moderar('entra em www.exemplo.com agora').texto).toBe(`entra em ${REMOVIDO} agora`);
    });
  });

  describe('casas de aposta', () => {
    it.each([
      'joguei na Bet365 ontem',
      'BETANO de novo',
      'perdi tudo na blaze',
      'a estrela bet me ligou',
      'esportes da sorte',
      'vai de bet',
      'Sportingbet',
      'jogo do tigrinho',
      'o tigrinho pagou',
      'fortune tiger',
      'galera.bet',
      // disfarces
      'b3t365',
      'b e t 3 6 5',
      'bet-365',
      'bl4ze',
      'betanó',
      '$take',
      'ｂｅｔａｎｏ',
      'be​tano',
      // padrão genérico
      'conhece a luvabet?',
      'tem a qualquercoisabet',
      'bet777',
    ])('remove: %s', (texto) => {
      expect(removeu(texto)).toBe(true);
    });
  });

  describe('valores em dinheiro', () => {
    it.each([
      'perdi R$ 500',
      'perdi R$500,00',
      'gastei R$ 2 mil',
      'deve uns 300 reais',
      'foram 1.000 contos',
      'dois mil reais',
      'cem reais',
      'US$ 50',
      'gastei $100',
      'paguei 1.250,90 no cartão',
      'perdi 10k',
      'manda um pix de 50',
      '20 pila',
    ])('remove: %s', (texto) => {
      expect(removeu(texto)).toBe(true);
    });
  });

  describe('não remove frases comuns', () => {
    it.each([
      'oi, tudo bem?',
      'tenho 30 anos',
      'faz 5 dias que não aposto',
      'dia 12 tenho consulta às 14h',
      'apostei na minha saúde agora',
      'comi beterraba no almoço',
      'Fiquei triste.Me ajuda?',
      'a reunião é às 19.30',
      'nota 9,5 na prova',
      'aprendi o alphabet em inglês',
      'que mistake',
    ])('mantém: %s', (texto) => {
      const r = moderar(texto);
      expect(r.moderada).toBe(false);
      expect(r.texto).toBe(texto);
    });
  });

  it('marca vazia quando só havia conteúdo proibido', () => {
    expect(moderar('www.exemplo.com').vazia).toBe(true);
    expect(moderar('bet365 R$ 50!!').vazia).toBe(true);
    expect(moderar('bet365 ajuda').vazia).toBe(false);
  });

  it('junta remoções seguidas em uma só', () => {
    expect(moderar('olha bet365 www.exemplo.com').texto).toBe(`olha ${REMOVIDO}`);
  });
});
