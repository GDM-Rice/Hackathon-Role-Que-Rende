// Módulo 06/02 · dados sintéticos do Rafael (persona da demo).
// [decidir gatilho] do painel Demo: hoje basta abrir com ?demo=1.

import { estadoInicial } from '../estado/estado.js'
import { somarDias } from '../util/datas.js'

/** Rafael no "dia 21": 22 dias desde o início com 1 dia de tempestade. */
export function estadoDoRafael(hoje) {
  const e = estadoInicial(hoje)
  e.tela = 'inicio'
  e.dono = 'demo' // nunca vira backup de uma conta de verdade
  e.perfil = { apelido: 'Rafael', motivo: 'Para voltar a dormir em paz', gastoSemanal: 120, inicio: somarDias(hoje, -22) }
  e.recomeco.tempestades = [somarDias(hoje, -7)]
  e.mares = Array.from({ length: 9 }, (_, i) => ({
    data: somarDias(hoje, -20 + i * 2),
    antes: 7,
    depois: 4,
    gatilhos: ['jogo na TV'],
  }))
  e.mapa.essenciais = [
    { nome: 'Aluguel', valor: 900 },
    { nome: 'Luz', valor: 120 },
    { nome: 'Água', valor: 60 },
    { nome: 'Comida', valor: 600 },
  ]
  e.mapa.dividas = [
    { id: 'cartao', nome: 'Cartão de crédito', saldo: 2800, jurosMes: 12, passo: 1, renegociada: false },
    { id: 'cheque', nome: 'Cheque especial', saldo: 900, jurosMes: 8, passo: 0, renegociada: false },
    { id: 'irma', nome: 'Empréstimo da irmã', saldo: 500, jurosMes: 0, passo: 0, renegociada: false },
  ]
  // O celular vem do painel Demo e nunca aparece na tela.
  e.tripulacao = [{ id: 'ana', nome: 'Ana', relacao: 'irmã', celular: '' }]
  e.metasVistas = ['sul', 'sudeste']
  return e
}

export function querDemo(url = globalThis.location?.href ?? '') {
  try {
    return new URL(url).searchParams.get('demo') === '1'
  } catch {
    return false
  }
}
