import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? (process.env.VITE_BASE_PATH || './') : '/',
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true
  },
  build: {
    rollupOptions: {
      output: {
        // Split vendor libraries into separate chunks for better browser caching
        manualChunks: {
          'vue-vendor': ['vue', 'pinia'],
          'lucide': ['lucide-vue-next'],
        }
      }
    },
    // Increase chunk size warning threshold slightly since we have expected large components
    chunkSizeWarningLimit: 500
  }
}))
