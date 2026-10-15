import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// When a FastAPI backend is available, set VITE_API_BASE (e.g. http://localhost:8000)
// or rely on the /api proxy below during development.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.NFR_BACKEND ?? 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
