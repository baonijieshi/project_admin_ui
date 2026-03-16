import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

import App from './App.vue';
import router from './router';
import store from './store';

import '@/styles/index.scss';
import '@/permission';

const app = createApp(App);

// 注册所有图标
Object.keys(ElementPlusIconsVue).forEach((key) => {
  app.component(key, ElementPlusIconsVue[key]);
});

// 初始化主题
const savedThemeColor = localStorage.getItem('themeColor');
const savedThemeTitleColor = localStorage.getItem('themeTitleColor');
if (savedThemeColor) {
  document.documentElement.style.setProperty('--sidebar-bg-color', savedThemeColor);
}
if (savedThemeTitleColor) {
  document.documentElement.style.setProperty('--sidebar-title-bg-color', savedThemeTitleColor);
}

app.use(store)
  .use(router)
  .use(ElementPlus, { locale: zhCn })
  .mount('#app');
