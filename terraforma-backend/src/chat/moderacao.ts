// Moderação automática do chat. Função pura: recebe o texto e devolve o texto limpo.
// Remove (troca por REMOVIDO): links, valores em dinheiro e nomes de casas de aposta.
// Roda no servidor antes de gravar qualquer mensagem ou título — o cliente não consegue pular.

export const REMOVIDO = '[removido]';

export type ResultadoModeracao = {
  texto: string;
  /** true se algum trecho foi removido */
  moderada: boolean;
  /** true se não sobrou nada além do que foi removido */
  vazia: boolean;
};

// ---------- Casas de aposta ----------

// Para ampliar, basta acrescentar o nome aqui (espaços e pontos são ignorados na comparação).
export const CASAS_DE_APOSTA = [
  'bet365',
  'betano',
  'sportingbet',
  'superbet',
  'novibet',
  'betfair',
  'betnacional',
  'pixbet',
  'kto',
  'stake',
  'blaze',
  'estrela bet',
  'esportes da sorte',
  'vai de bet',
  'parimatch',
  '1xbet',
  'f12.bet',
  'galera.bet',
  'rivalo',
  'betway',
  'betsson',
  'bwin',
  'br4bet',
  'mr. jack bet',
  'aposta ganha',
  'betmotion',
  'lottoland',
  'bet7k',
  'luva bet',
  'seguro bet',
  'jogo do tigrinho',
  'tigrinho',
  'fortune tiger',
];

// Trocas comuns para disfarçar o nome (b3t365, bl4ze, $take, betanó...).
const VARIANTES: Record<string, string> = {
  a: 'aáàâãä4@',
  e: 'eéèêë3',
  i: 'iíìîï1!|l',
  o: 'oóòôõö0',
  u: 'uúùûü',
  c: 'cç',
  s: 's5$',
  t: 't7',
  b: 'b8',
  g: 'g9',
  '0': '0o',
  '1': '1il!|',
  '3': '3e',
  '4': '4a',
  '5': '5s',
  '7': '7t',
  '8': '8b',
};

// Entre as letras do nome aceita até 2 separadores: "b e t 3 6 5", "bet-365", "b.e.t.365".
const SEPARADOR = String.raw`[\s._\-*'"·]{0,2}`;
// Não pode haver letra ou número colado antes/depois (evita pegar "beterraba" ou "mistake").
const ANTES = String.raw`(?<![\p{L}\p{N}])`;
const DEPOIS = String.raw`(?![\p{L}\p{N}])`;

function escapar(c: string) {
  return c.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
}

function regexDoNome(nome: string) {
  // Os nomes e variantes são só letras latinas e símbolos simples: split('') basta.
  const letras = nome.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '').split('');
  return letras
    .map((c) => `[${(VARIANTES[c] ?? c).split('').map(escapar).join('')}]`)
    .join(SEPARADOR);
}

const RE_CASAS = new RegExp(
  `${ANTES}(?:${CASAS_DE_APOSTA.map(regexDoNome).join('|')})${DEPOIS}`,
  'giu',
);

// Casas que não estão na lista mas seguem o padrão do nome: "qualquercoisabet", "bet123".
const RE_BET_GENERICO = new RegExp(
  `${ANTES}(?:[\\p{L}\\p{N}]{2,}bet|bet\\d+)${DEPOIS}`,
  'giu',
);
const PALAVRAS_PERMITIDAS = new Set(['alphabet', 'alfabet']);

// ---------- Links ----------

// Ficam de fora finais curtos que aparecem em frase sem espaço depois do ponto
// ("triste.Me ajuda", "foi.To"); os encurtadores com esses finais entram em RE_ENCURTADOR.
const TLDS =
  'com|net|org|br|bet|io|app|gg|xyz|info|online|site|link|ly|vip|club|tv|win|cc|top|live|pro|fun|games|casino|biz';

// Ponto normal, " . " com espaços dos dois lados, "[.]" ou "(.)".
const PONTO = String.raw`(?:\.|\s+\.\s+|\s*\[\.\]\s*|\s*\(\.\)\s*)`;

const RE_URL = /\b(?:https?:\/\/|www\.)\S+/giu;
const RE_ENCURTADOR = /\b(?:t|wa)\s*\.\s*me\b(?:\/\S*)?/giu;
const RE_DOMINIO = new RegExp(
  String.raw`(?:[\w.+-]+@)?\b[a-z0-9-]+(?:${PONTO}[a-z0-9-]+)*${PONTO}(?:${TLDS})\b(?:[/?#]\S*)?`,
  'giu',
);

// ---------- Dinheiro ----------

const NUM = String.raw`\d[\d.,]*`;
const MOEDA_PALAVRA = String.raw`(?:reais|real|conto|contos|pila|pilas|d[oó]lar|d[oó]lares|euros?|bitcoins?|btc|usdt)`;
const ESCALA = String.raw`(?:\s*(?:mil|k|mi|milh[aã]o|milh[õo]es|bi))?`;
const NUM_EXTENSO = String.raw`(?:um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa|cem|cento|duzentos|trezentos|quatrocentos|quinhentos|seiscentos|setecentos|oitocentos|novecentos|mil|milh[aã]o)`;

const RE_DINHEIRO = [
  // R$ 50 · R$50,00 · US$ 10 · $100 · € 20 · R$ 2 mil
  new RegExp(String.raw`(?:R\$|US\$|U\$|\$|€|£)\s*${NUM}${ESCALA}`, 'giu'),
  // 50 reais · 1.000 contos · 2 mil reais · 10k reais
  new RegExp(String.raw`\b${NUM}${ESCALA}\s*(?:de\s+)?${MOEDA_PALAVRA}\b`, 'giu'),
  // cem reais · duzentos conto · dois mil reais
  new RegExp(String.raw`\b${NUM_EXTENSO}(?:\s+(?:e\s+)?${NUM_EXTENSO})*\s+${MOEDA_PALAVRA}\b`, 'giu'),
  // 1.000,00 · 250,90 com separador de milhar (formato de valor)
  new RegExp(String.raw`\b\d{1,3}(?:\.\d{3})+,\d{2}\b`, 'gu'),
  // perdi 10k · ganhei 2,5k
  new RegExp(String.raw`\b\d+(?:[.,]\d+)?\s?k\b`, 'giu'),
  // pix de 100 · pix 50
  new RegExp(String.raw`\bpix\s*(?:de\s*)?${NUM}`, 'giu'),
];

// ---------- Função principal ----------

export function moderar(entrada: string): ResultadoModeracao {
  // NFKC transforma letras "estilizadas" (ｂｅｔ, 𝐛𝐞𝐭) em letras comuns; tira caracteres invisíveis.
  let texto = entrada.normalize('NFKC').replace(/[​-‍⁠﻿­]/g, '');
  let moderada = false;

  const trocar = (re: RegExp, permitir?: (trecho: string) => boolean) => {
    texto = texto.replace(re, (trecho) => {
      if (permitir?.(trecho)) return trecho;
      moderada = true;
      return REMOVIDO;
    });
  };

  // Links primeiro: um endereço pode conter números ou o nome de uma casa.
  trocar(RE_URL);
  trocar(RE_ENCURTADOR);
  trocar(RE_DOMINIO);
  trocar(RE_CASAS);
  trocar(RE_BET_GENERICO, (t) => PALAVRAS_PERMITIDAS.has(t.toLowerCase()));
  for (const re of RE_DINHEIRO) trocar(re);

  if (moderada) {
    // "[removido] [removido]" vira um só.
    const marca = escapar(REMOVIDO);
    texto = texto.replace(new RegExp(`${marca}(?:\\s*${marca})+`, 'g'), REMOVIDO);
  }

  const resto = texto.split(REMOVIDO).join('').replace(/[\s\p{P}\p{S}]/gu, '');
  return { texto, moderada, vazia: moderada && resto.length === 0 };
}
