import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  // Configuración para GitHub Pages
  base: process.env.NODE_ENV === 'production' 
    ? '/gestor-proyectos-front/' 
    : '/',
  optimizeDeps: {
    include: ['axios'], // ✅ Fuerza la inclusión de axios para evitar el error de resolución
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      external: [], // ✅ Asegura que axios no se trata como dependencia externa
    }
  }
})
