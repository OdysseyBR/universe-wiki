import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Em dev, o Vite só serve o frontend — as rotas /api/* (incluindo a troca
    // OAuth do Focus Account) vivem no servidor Express (server/index.js),
    // que precisa estar rodando em paralelo (ex: porta 4000). Sem esse proxy,
    // `fetch('/api/...')` no navegador bateria no próprio Vite e cairia no
    // catch-all do React Router, devolvendo HTML em vez de JSON.
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_PROXY_TARGET || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: process.env.PORT || 4173,
    host: true,
    allowedHosts: ['focusuniversewiki.up.railway.app']
  }
})
