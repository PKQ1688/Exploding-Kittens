import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    cors: true,
    allowedHosts: 'all',
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true
      }
    },
    hmr: {
      clientPort: 5173
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 5173
  }
})
