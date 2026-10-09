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
