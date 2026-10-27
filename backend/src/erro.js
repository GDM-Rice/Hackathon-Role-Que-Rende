// Backend do Terraformar · erro padrão da API.
//
// Qualquer regra que precise responder com um status HTTP "de propósito"
// (400, 404, 422, 429...) lança um ErroApi. O servidor (app.js) captura e
// transforma em JSON: { erro: { codigo, mensagem, ...extra } }.
// Qualquer OUTRO erro vira 500 genérico, sem vazar detalhes.

export class ErroApi extends Error {
  /**
   * @param {number} status   código HTTP (ex.: 400)
   * @param {string} codigo   texto curto e estável para o front tratar (ex.: 'token_invalido')
   * @param {string} mensagem frase legível, no tom do app (calma, sem culpar)
   * @param {object} extra    campos extras que vão junto no JSON (ex.: { motivos: [...] })
   */
  constructor(status, codigo, mensagem, extra = {}) {
    super(mensagem)
    this.name = 'ErroApi'
    this.status = status
    this.codigo = codigo
    this.extra = extra
  }
}
