// Backend do Terraformar · configurações em um só lugar.
//
// Tudo tem um valor padrão que funciona no palco. Para mudar sem mexer no
// código, use variáveis de ambiente (ex.: PORT=4000 npm run backend).

export const config = {
  // Porta do servidor. O Vite (npm run dev) encaminha /api para cá.
  porta: Number(process.env.PORT) || 3001,

  // Origem do app que pode chamar a API (CORS). Em dev é o Vite.
  origemPermitida: process.env.CORS_ORIGEM ?? 'http://localhost:5173',

  // Corpo máximo de uma requisição (bytes). Textos da Luneta são curtos.
  limiteCorpoBytes: 10_000,

  // Escritas (publicar, responder, identificar, denunciar) por minuto.
  // O limite por IP é 5x esse valor (quem troca de token não escapa).
  limiteEscritaPorMinuto: 20,

  // Quantas denúncias de pessoas DIFERENTES escondem um post até revisão humana.
  denunciasParaOcultar: 3,

  // Teto de posts na memória. Passou disso, o mais antigo (que não é de
  // demonstração) sai. Evita estourar a memória do servidor.
  maxPosts: 500,

  // Teto de respostas por post.
  maxRespostas: 50,

  // Posts exibidos por consulta.
  postsPorPagina: 50,

  // Termos EXTRAS barrados pela moderação, separados por vírgula
  // (ex.: nomes de casas de apostas). Ficam fora do código de propósito:
  // o edital proíbe usar marcas de casas de apostas no projeto.
  termosExtras: (process.env.MODERACAO_TERMOS_EXTRAS ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean),

  // Começa com posts fictícios na Luneta (útil na demo). SEMEAR=0 desliga.
  semear: process.env.SEMEAR !== '0',
}
