import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { EstadoProvider } from './estado/EstadoContext.jsx'
import { estadoDoRafael, querDemo } from './demo/demo.js'
import { hojeISO } from './util/datas.js'

// ?demo=1 abre direto com o Rafael no dia 21 (dados sintéticos).
const inicial = querDemo() ? estadoDoRafael(hojeISO()) : undefined

createRoot(document.getElementById('app')).render(
  <StrictMode>
    <EstadoProvider inicial={inicial}>
      <App />
    </EstadoProvider>
  </StrictMode>,
)
