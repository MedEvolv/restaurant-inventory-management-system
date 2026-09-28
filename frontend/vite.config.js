import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/prep/test-setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
  },
  server: {
    port: 3016,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8086',
        changeOrigin: true,
      }
    }
  }
})
