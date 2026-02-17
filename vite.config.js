// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  // Замените 'chinese-cars-catalog' на имя вашего репозитория GitHub
  base: '/chinese-cars-catalog/',
  server: {
    proxy: {
      '/cbr-api': {
        target: 'https://www.cbr.ru',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cbr-api/, '')
      }
    }
  }
})