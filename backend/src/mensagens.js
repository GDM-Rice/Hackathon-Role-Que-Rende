// Backend do Terraformar · textos que a API devolve.
//
// [06 revisar] O CLAUDE.md manda os textos do app ficarem em conteudo.js.
// Estes são só os textos de ERRO e MODERAÇÃO da API, que não existiam lá.
// Tom: calmo, sem culpar, sem bronca.

export const MENSAGENS = {
  // Resposta quando a moderação barra um texto.
  conteudoNaoPermitido:
    'Não foi possível publicar. Para proteger todo mundo, a Luneta não aceita links, valores, telefones ou nomes de plataformas. Tire esse trecho e tente de novo.',
  tokenInvalido:
    'Falta o identificador anônimo deste aparelho (cabeçalho x-planeta-token, de 16 a 64 letras, números, _ ou -).',
  naoEncontrado: 'Não encontramos isso.',
  rotaNaoEncontrada: 'Rota não encontrada.',
  metodoNaoPermitido: 'Esse método não vale para esta rota.',
  jsonInvalido: 'O corpo da requisição precisa ser um JSON válido (um objeto).',
  corpoGrande: 'O texto enviado é grande demais.',
  muitasRequisicoes: 'Muitas ações em pouco tempo. Respire um instante e tente de novo.',
  erroInterno: 'Algo saiu do esperado do nosso lado. Tente de novo em instantes.',
  constelacaoInvalida: 'Essa constelação não existe.',
  diasInvalidos: 'Os dias de recomeço precisam ser um número inteiro entre 0 e 3650.',
  dataInvalida: 'Use a data no formato AAAA-MM-DD.',
  limiteRespostas: 'Este post já tem o máximo de respostas.',
}

// Explicação de cada motivo de bloqueio (o front pode mostrar a lista).
export const MOTIVOS = {
  vazio: 'Escreva um pouco antes de publicar.',
  longo: 'O texto passou de 500 caracteres. Tente resumir.',
  link: 'Tire os links ou endereços de sites.',
  valor: 'Tire os valores em dinheiro.',
  contato: 'Tire telefones, e-mails e @usuários.',
  termo: 'Tire nomes de plataformas ou ofertas de apostas.',
}
