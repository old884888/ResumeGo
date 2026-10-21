import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useResumeStore } from '@/stores/resumes'
import { usePrefsStore } from '@/stores/prefs'
import './styles/tokens.css'
import './styles/base.css'
import './styles/paper.css'
import './print.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

/* 挂载前完成本地数据初始化，避免首帧闪烁 */
useResumeStore().init()
usePrefsStore().initSystemListener()

app.use(router)
app.mount('#app')
