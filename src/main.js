import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/el-infinite-scroll.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import infiniteScroll from 'element-plus'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus)
app.use(infiniteScroll)
app.mount('#app')