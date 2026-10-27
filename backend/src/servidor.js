// Backend do Terraformar · ponto de entrada (abre a porta).
// Rodar: npm run backend   (ou: PORT=4000 npm run backend)

import { criarApp } from './app.js'
import { config } from './config.js'

const { servidor } = criarApp()

servidor.listen(config.porta, () => {
  console.log(`Terraformar backend em http://localhost:${config.porta}  (GET /api/saude)`)
})
