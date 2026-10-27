// Módulo 02 · regras do backup do progresso (funções puras, sem rede).
//
// Quem é o dono do estado local fica em estado.dono (id da conta).
// Assim, se outra pessoa entrar no mesmo celular, os dados não se misturam.

import { estadoInicial, migrar } from '../estado/estado.js'

/** O que vai para o servidor: sem tela atual e SEM o celular da tripulação. */
export function paraBackup(estado) {
  const copia = structuredClone(estado)
  delete copia.tela
  delete copia.ancora
  copia.tripulacao = (copia.tripulacao ?? []).map((pessoa) => {
    const semCelular = { ...pessoa }
    delete semCelular.celular
    return semCelular
  })
  return copia
}

const telaDeEntrada = (estado) => (estado.perfil?.inicio ? 'inicio' : 'boasVindas')

/** Devolve os celulares que este aparelho já conhecia (eles nunca vão ao servidor). */
function juntarCelulares(restaurado, local) {
  const celulares = new Map((local.tripulacao ?? []).map((p) => [p.id, p.celular]))
  restaurado.tripulacao = (restaurado.tripulacao ?? []).map((p) => (
    celulares.get(p.id) ? { ...p, celular: celulares.get(p.id) } : p
  ))
  return restaurado
}

/**
 * Decide qual estado usar quando a pessoa entra na conta.
 * @returns {{ estado: object, enviar: boolean }} `enviar` = mandar o resultado para o backup.
 */
export function escolherEstado({ local, remoto, usuarioId, hoje }) {
  const localDaConta = local.dono === usuarioId
  // Dados de antes de existir conta (sem dono) entram na primeira conta deste aparelho.
  // A demo usa dono 'demo' e nunca é adotada.
  const localSemDono = local.dono == null && Boolean(local.perfil?.inicio)

  if (remoto) {
    if (localDaConta && (local.atualizadoEm ?? '') > (remoto.atualizadoEm ?? '')) {
      return { estado: { ...local, tela: telaDeEntrada(local) }, enviar: true }
    }
    let restaurado = migrar({ ...remoto.estado, dono: usuarioId }, hoje)
    if (localDaConta) restaurado = juntarCelulares(restaurado, local)
    restaurado.tela = telaDeEntrada(restaurado)
    return { estado: restaurado, enviar: false }
  }

  if (localDaConta || localSemDono) {
    return { estado: { ...local, dono: usuarioId, tela: telaDeEntrada(local) }, enviar: true }
  }
  return { estado: { ...estadoInicial(hoje), dono: usuarioId }, enviar: false }
}
