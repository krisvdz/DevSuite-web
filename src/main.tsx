// ─── Ponto de entrada da aplicação React ─────────────────────────────────────
// Este arquivo é o primeiro a ser executado pelo Vite

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
// Importa o CSS do Tailwind (gerado pelo PostCSS)
import './styles/global.css'

// 📚 CONCEITO: StrictMode
// React.StrictMode não afeta o build de produção, mas em desenvolvimento:
// - Detecta efeitos colaterais imprevistos (renderiza componentes 2x)
// - Avisa sobre APIs depreciadas
// - Útil para encontrar bugs cedo
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
