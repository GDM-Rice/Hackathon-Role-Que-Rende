// Módulo 06 · TODOS os textos do app moram aqui, nunca espalhados pelas telas.
// Toda afirmação de saúde, finanças ou lei leva fonte (ver FONTES).
// Link com status A_CONFERIR vira botão desligado até alguém da equipe abrir e confirmar.

export const A_CONFERIR = 'A_CONFERIR'
export const CONFERIDO = 'CONFERIDO'

export const FRASES = {
  assinatura: 'Você voltou. Isso conta.',
  nadaPerdido: 'Nada do que você recuperou foi perdido.',
  privacidade: 'Seu progresso fica guardado na sua conta. Só você tem acesso.',
  apostei: 'Apostei hoje · conte sem medo',
  naoSubstitui: 'O Terraformar é um apoio e não substitui um profissional.',
}

export const NOMES_REGIOES = {
  sul: 'Sul',
  sudeste: 'Sudeste',
  centroOeste: 'Centro-Oeste',
  nordeste: 'Nordeste',
  norte: 'Norte',
}

export const TEXTOS = {
  boasVindas: {
    titulo: 'As apostas secaram a terra. Você pode recuperá-la.',
    apoio: 'Cada dia sem apostar devolve vida a uma parte do Brasil. Nada do que você recuperar vai ser perdido.',
    rotuloApelido: 'Como quer ser chamado?',
    rotuloMotivo: 'Seu motivo para recomeçar',
    rotuloGasto: 'Quanto apostava por semana, mais ou menos? (opcional)',
    prefiroNaoDizer: 'Prefiro não dizer',
    botao: 'Começar a missão',
  },
  inicio: {
    marca: 'Terraformar',
    mareChamada: 'A vontade apareceu?',
    mareBotao: 'Respirar com a Maré',
    atalhos: { missao: 'Missão', dividas: 'Dívidas', tripulacao: 'Tripulação', ajuda: 'Ajuda' },
  },
  mare: {
    titulo: 'Maré',
    apoio: 'A vontade costuma subir, atingir um pico e diminuir. Respire com o mar enquanto ela passa.',
    inspire: 'Inspire',
    expire: 'Expire',
    parar: 'Parar',
    // [decidir lista com 06]
    gatilhos: ['jogo na TV', 'propaganda', 'tédio', 'ansiedade', 'dinheiro na conta', 'conversa com amigos'],
  },
  tempestade: {
    registrado: 'Dia de tempestade registrado',
    apoio: 'As nuvens passam. Nada do que você recuperou foi perdido.',
    eAgora: 'E agora?',
    opcoes: {
      mare: 'Fazer uma Maré',
      avisar: 'Avisar a', // + nome da tripulação
      profissional: 'Falar com um profissional',
      quieto: 'Só quero ficar quieto um pouco',
    },
  },
  missao: { titulo: 'Sua missão', apoio: 'Metas fixas, iguais para todos. Nada se perde.' },
  dividas: { titulo: 'Suas dívidas' },
  tripulacao: { titulo: 'Sua tripulação', botao: 'Preciso de você' },
  visaoFamiliar: { titulo: 'Como minha tripulação me vê' },
  ajuda: { titulo: 'Ajuda' },
  ajustes: { titulo: 'Ajustes', privacidade: 'Seu progresso tem backup na sua conta. Só você tem acesso.' },
  fontes: { titulo: 'Sobre as informações' },
  luneta: {
    titulo: 'Luneta',
    atalho: 'Luneta · conversar com outros planetas',
    apoio: 'Planetas anônimos que estão recomeçando, como você. Ninguém vê seu nome.',
    todas: 'Todas',
    filtro: 'Constelações',
    escrever: 'Escrever na Luneta',
    rotuloConstelacao: 'Constelação',
    rotuloTexto: 'O que você quer contar?',
    mostrarDias: (dias) => `Mostrar meus ${dias} dias de recomeço`,
    publicar: 'Publicar',
    publicando: 'Publicando...',
    publicado: 'Publicado. Obrigado por dividir.',
    regras: 'Sem links, valores, telefones ou nomes de plataformas.',
    vazio: 'Ainda não há nada nesta constelação. Que tal começar?',
    carregando: 'Procurando outros planetas...',
    semConexao: 'A Luneta precisa de internet. O resto do Terraformar funciona sem ela.',
    tentarDeNovo: 'Tentar de novo',
    planeta: (nome) => `Planeta ${nome}`,
    dias: (n) => `${n} ${n === 1 ? 'dia' : 'dias'}`,
    voce: 'Você',
    meIdentifico: 'Me identifico',
    identificado: 'Você se identificou',
    identificacoes: (n) => (n === 1 ? '1 pessoa se identificou' : `${n} pessoas se identificaram`),
    responder: 'Responder',
    rotuloResposta: 'Sua resposta',
    enviarResposta: 'Enviar resposta',
    denunciar: 'Denunciar',
    porqueDenunciar: 'O que tem de errado?',
    motivosDenuncia: { link: 'Link ou propaganda', golpe: 'Golpe', ofensivo: 'Ofensivo', risco: 'Alguém em risco', outro: 'Outro motivo' },
    denunciaRecebida: 'Denúncia recebida. Obrigado por cuidar da Luneta.',
    cancelar: 'Cancelar',
    riscoNaoPublicado: 'Esse texto não foi publicado. Ele fica só com você.',
  },
  conta: {
    entrar: {
      titulo: 'Entrar',
      apoio: 'Seu planeta fica guardado na sua conta.',
      botao: 'Entrar',
      enviando: 'Entrando...',
      esqueci: 'Esqueci minha senha',
      criar: 'Ainda não tenho conta',
    },
    cadastro: {
      titulo: 'Criar conta',
      apoio: 'Com a conta, seu progresso tem backup e você pode trocar de celular sem perder nada.',
      botao: 'Criar conta',
      enviando: 'Criando...',
      jaTenho: 'Já tenho conta',
      confirmar: (email) => `Enviamos um link para ${email}. Abra para confirmar a conta e depois entre.`,
    },
    recuperar: {
      titulo: 'Recuperar senha',
      apoio: 'Digite o e-mail da sua conta. Enviamos um link para você criar uma senha nova.',
      botao: 'Enviar link',
      enviando: 'Enviando...',
      enviado: 'Se existir uma conta com esse e-mail, o link chega em alguns minutos. Confira também a caixa de spam.',
      voltar: '‹ Entrar',
    },
    novaSenha: {
      titulo: 'Criar senha nova',
      apoio: 'Escolha uma senha nova para a sua conta.',
      botao: 'Salvar senha',
      enviando: 'Salvando...',
    },
    minhaConta: {
      titulo: 'Minha conta',
      dados: 'Seus dados',
      salvarApelido: 'Salvar apelido',
      apelidoSalvo: 'Apelido salvo.',
      trocarEmail: 'Trocar e-mail',
      emailEnviado: (email) => `Enviamos um link para ${email}. A troca vale depois que você abrir o link.`,
      trocarSenha: 'Trocar senha',
      senhaAlterada: 'Senha alterada.',
      sair: 'Sair da conta',
      saindo: 'Saindo...',
      sairApoio: 'Seu progresso fica guardado na conta. Ao sair, ele é apagado deste celular.',
      apagar: 'Apagar minha conta',
      confirmarApagar: 'Isso apaga sua conta e o backup do seu planeta no servidor. Não dá para desfazer.',
      simApagar: 'Sim, apagar minha conta',
      cancelar: 'Cancelar',
      acesso: 'Minha conta',
    },
    rotulos: {
      email: 'E-mail',
      senha: 'Senha',
      novaSenha: 'Senha nova',
      repetirSenha: 'Repita a senha',
      apelido: 'Como quer ser chamado?',
      mostrarSenha: 'Mostrar senha',
    },
    dicaSenha: 'Pelo menos 8 caracteres.',
    privacidade: 'Só você tem acesso ao seu progresso. O celular da sua tripulação nunca sai deste aparelho.',
    carregando: 'Abrindo seu planeta...',
    semConexao: 'Não foi possível buscar seu progresso. Confira a internet e tente de novo.',
    tentarDeNovo: 'Tentar de novo',
    voltarEntrar: '‹ Entrar',
    erros: {
      credenciais: 'E-mail ou senha não conferem.',
      jaExiste: 'Já existe uma conta com esse e-mail. Tente entrar.',
      senhaFraca: 'Escolha uma senha mais forte, com pelo menos 8 caracteres.',
      senhaCurta: 'A senha precisa ter pelo menos 8 caracteres.',
      senhasDiferentes: 'As duas senhas não são iguais.',
      mesmaSenha: 'A senha nova precisa ser diferente da atual.',
      naoConfirmado: 'Falta confirmar o e-mail. Abra o link que enviamos.',
      emailInvalido: 'Confira o e-mail digitado.',
      muitosEmails: 'Muitos e-mails em pouco tempo. Espere alguns minutos e tente de novo.',
      muitasTentativas: 'Muitas tentativas seguidas. Respire e tente de novo em instantes.',
      linkExpirado: 'O link expirou. Peça um novo em "Esqueci minha senha".',
      semConexao: 'Sem conexão. Confira a internet e tente de novo.',
      naoConfigurado: 'As contas ainda não foram configuradas: faltam as chaves do Supabase no .env.local.',
      desconhecido: 'Algo saiu do esperado. Tente de novo.',
    },
  },
  risco: { mensagem: 'Se estiver difícil agora, tem gente pronta para ouvir você.' },
  comum: { voltar: '‹ Início', mare: 'Maré', ajuda: 'Ajuda', ajustes: 'Ajustes', emConstrucao: 'Em construção' },
}

/** Ordem fixa da tela Ajuda. */
export const SERVICOS_AJUDA = [
  { id: 'samu', nome: 'SAMU 192', oQueE: 'Emergência médica.', acao: { tipo: 'tel', valor: '192' }, fonte: 'samu' },
  { id: 'cvv', nome: 'CVV 188', oQueE: 'Apoio emocional, 24 horas, gratuito.', acao: { tipo: 'tel', valor: '188' }, fonte: 'cvv' },
  { id: 'caps', nome: 'CAPS e CAPS AD', oQueE: 'Atendimento em saúde mental pelo SUS. Informações pelo Disque Saúde 136.', acao: { tipo: 'tel', valor: '136' }, fonte: 'caps' },
  { id: 'meuSus', nome: 'Teleatendimento do SUS', oQueE: 'Pelo aplicativo Meu SUS Digital.', acao: { tipo: 'link', valor: 'https://www.gov.br/saude/pt-br/composicao/seidigi/meu-sus-digital', status: A_CONFERIR }, fonte: 'meuSus' },
  { id: 'ja', nome: 'Jogadores Anônimos', oQueE: 'Grupos de apoio entre pessoas que querem parar de apostar.', acao: { tipo: 'link', valor: '', status: A_CONFERIR }, fonte: 'ja' },
  { id: 'autoexclusao', nome: 'Autoexclusão', oQueE: 'Pedir para ser bloqueado nas plataformas de apostas.', acao: { tipo: 'link', valor: '', status: A_CONFERIR }, fonte: 'autoexclusao' },
]

/** Lista da tela Fontes. Todo "saiba mais" rola até o item pelo id. */
export const FONTES = [
  { id: 'samu', titulo: 'SAMU 192', diz: 'Serviço de Atendimento Móvel de Urgência.', origem: 'Ministério da Saúde', link: '', status: A_CONFERIR },
  { id: 'cvv', titulo: 'CVV 188', diz: 'Apoio emocional gratuito, 24 h.', origem: 'Centro de Valorização da Vida', link: 'https://cvv.org.br', status: A_CONFERIR },
  { id: 'caps', titulo: 'CAPS e Disque Saúde 136', diz: 'Rede de Atenção Psicossocial do SUS.', origem: 'Ministério da Saúde', link: '', status: A_CONFERIR },
  { id: 'meuSus', titulo: 'Meu SUS Digital', diz: 'Teleatendimento do SUS.', origem: 'Ministério da Saúde', link: '', status: A_CONFERIR },
  { id: 'ja', titulo: 'Jogadores Anônimos', diz: 'Grupos de apoio mútuo.', origem: 'Jogadores Anônimos do Brasil', link: '', status: A_CONFERIR },
  { id: 'autoexclusao', titulo: 'Autoexclusão', diz: 'Bloqueio voluntário nas plataformas.', origem: '', link: '', status: A_CONFERIR },
  { id: 'mare', titulo: 'A vontade vem em ondas', diz: 'A vontade costuma subir, atingir um pico e diminuir.', origem: '', link: '', status: A_CONFERIR },
  { id: 'lei14181', titulo: 'Lei 14.181/2021', diz: 'Lei do superendividamento: prevenção e tratamento.', origem: 'Planalto', link: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14181.htm', status: A_CONFERIR },
  { id: 'consumidorGov', titulo: 'consumidor.gov.br', diz: 'Plataforma pública para negociar com empresas.', origem: 'Governo Federal', link: 'https://www.consumidor.gov.br', status: A_CONFERIR },
]

// [06 escreve] Lista inicial para não deixar o fluxo vazio: a equipe de conteúdo revisa.
export const TERMOS_DE_RISCO = [
  'me matar', 'suicidio', 'suicidar', 'tirar minha vida', 'tirar a minha vida',
  'acabar com tudo', 'nao quero mais viver', 'nao aguento mais viver', 'quero morrer', 'sumir de vez',
]

const normalizar = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/**
 * Devolve true se o texto tem sinal de risco à vida. Não bloqueia, não julga,
 * não salva o alerta: a tela só mostra o cartão calmo com CVV 188 e SAMU 192.
 */
export function detectarRisco(texto) {
  if (!texto) return false
  const t = normalizar(texto)
  return TERMOS_DE_RISCO.some((termo) => t.includes(termo))
}
