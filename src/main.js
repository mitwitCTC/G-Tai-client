import './assets/main.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhTw from 'element-plus/es/locale/lang/zh-tw'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'bootstrap/dist/js/bootstrap.bundle.js'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhTw })

window.addEventListener('storage', function (e) {
  if (sessionStorage.getItem(e.key) !== null) {
    this.sessionStorage.setItem(e.key, e.oldValue)
  }
})

app.mount('#app')
