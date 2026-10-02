import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In dev, Vite proxies the API to the Flask backend so the browser sees a
// single origin and the session cookie just works.
// Backend lives in ../backend (python app.py -> http://127.0.0.1:5000).
const API = process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:5000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: API, changeOrigin: true },
      '/uploads': { target: API, changeOrigin: true }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
