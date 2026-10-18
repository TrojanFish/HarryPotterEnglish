import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './index.css'

// Global uncaught error & promise rejection diagnostics
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('[Global Error]:', event.error || event.message)
  })
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Global Unhandled Rejection]:', event.reason)
  })
}

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')

// Register Service Worker in production with auto-update and cache purging
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const baseUrl = import.meta.env.BASE_URL || './'
    const swUrl = baseUrl.endsWith('/') ? `${baseUrl}sw.js` : `${baseUrl}/sw.js`
    navigator.serviceWorker
      .register(swUrl)
      .then((reg) => {
        reg.update().catch(() => {})
      })
      .catch((err) => {
        console.warn('[SW Registration failed]:', err)
      })
  })
}
