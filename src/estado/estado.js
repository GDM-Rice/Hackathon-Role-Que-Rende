// Módulo 02 · forma do estado, carregar/salvar/apagar, migrar.
// O 02 é dono deste contrato: mudança aqui passa pelo integrador.
// O planeta NUNCA é salvo: é calculado em regras/regras.js.

export const CHAVE = 'terraformar:v1'
export const VERSAO = 1

export const TELAS = [
  'boasVindas', 'inicio', 'mare', 'tempestade', 'missao', 'dividas',
  'tripulacao', 'visaoFamiliar', 'ajuda', 'ajustes', 'fontes', 'luneta',
  'entrar', 'cadastro', 'recuperarSenha', 'conta',
]

export function estadoInicial(hoje) {
  return {
    versao: VERSAO,
    dono: null, // id da conta dona destes dados ('demo' na demonstração)
    atualizadoEm: null, // última mudança feita pela pessoa (usado no backup)
    tela: 'boasVindas',
    perfil: { apelido: '', motivo: '', gastoSemanal: null, inicio: null },
    recomeco: { tempestades: [] },
    mares: [],
    mapa: {
      essenciais: [],
      dividas: [],
      barreiras: { autoexclusao: false, limitePix: false, bloqueador: false, combinarComAlguem: false },
    },
    tripulacao: [],
    acessibilidade: { texto: 'M', altoContraste: false, daltonismo: false, animacoes: 'seguir', som: true, legendas: true },
    hoje: { data: hoje, tempestade: false },
    metasVistas: [],
  }
}

/** Completa campos que faltam (estado salvo de versão antiga) sem perder nada. */
export function migrar(salvo, hoje) {
  const base = estadoInicial(hoje)
  if (!salvo || typeof salvo !== 'object') return base
  const estado = {
    ...base,
    ...salvo,
    perfil: { ...base.perfil, ...salvo.perfil },
    recomeco: { ...base.recomeco, ...salvo.recomeco },
    mapa: {
      ...base.mapa,
      ...salvo.mapa,
      barreiras: { ...base.mapa.barreiras, ...salvo.mapa?.barreiras },
    },
    acessibilidade: { ...base.acessibilidade, ...salvo.acessibilidade },
    versao: VERSAO,
  }
  // "hoje" sempre vem do relógio de quem chama, nunca do que estava salvo.
  estado.hoje = { data: hoje, tempestade: estado.recomeco.tempestades.includes(hoje) }
  if (!TELAS.includes(estado.tela)) estado.tela = 'inicio'
  if (!estado.perfil.inicio) estado.tela = 'boasVindas'
  return estado
}

export function carregar(hoje, armazenamento = globalThis.localStorage) {
  try {
    const texto = armazenamento?.getItem(CHAVE)
    return migrar(texto ? JSON.parse(texto) : null, hoje)
  } catch {
    return estadoInicial(hoje)
  }
}

export function salvar(estado, armazenamento = globalThis.localStorage) {
  try {
    armazenamento?.setItem(CHAVE, JSON.stringify(estado))
  } catch {
    // Sem espaço ou modo privado: o app segue funcionando só na memória.
  }
}

export function apagar(armazenamento = globalThis.localStorage) {
  try {
    armazenamento?.removeItem(CHAVE)
  } catch {
    // ignorado
  }
}
