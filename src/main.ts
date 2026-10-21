import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useResumeStore } from '@/stores/resumes'
import { usePrefsStore } from '@/stores/prefs'
import { useBackupStore } from '@/stores/backup'
import './styles/tokens.css'
import './styles/base.css'
import './styles/paper.css'
import './print.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

usePrefsStore().initSystemListener()

/* 挂载前完成本地数据初始化（IndexedDB 加载 + 旧数据迁移），避免首帧闪烁。
   初始化任何异常都不允许白屏 —— 最多丢自动保存，不能丢整个应用。 */
async function bootstrap() {
  const store = useResumeStore(pinia)
  try {
    await store.init()
  } catch (e) {
    console.error('本地数据初始化失败：', e)
    store.ready = true
  }
  void useBackupStore(pinia).init()
  app.use(router)
  app.mount('#app')
}
void bootstrap()
