import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  // Pas de StrictMode pour éviter les doubles connexions Socket.io en dev
  <App />
)
