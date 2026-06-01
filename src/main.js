import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.js'
import './assets/main.css'

const app = createApp(App)
const redirect = sessionStorage.getItem('redirect')
app.use(createPinia())
app.use(router)
app.mount('#app')

if (redirect) {
  sessionStorage.removeItem('redirect')
  router.isReady().then(() => router.replace(redirect))
}