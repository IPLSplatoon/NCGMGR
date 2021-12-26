import { createApp } from 'vue'
import App from './App.vue'
import { configStore, configStoreKey } from './store/config'

createApp(App)
    .use(configStore, configStoreKey)
    .mount('#app')
