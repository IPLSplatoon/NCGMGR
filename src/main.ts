import { createApp } from 'vue'
import App from './App.vue'
import { configStore, configStoreKey } from './store/config'
import { logStore, logStoreKey } from '@/store/log'

logStore.dispatch('listen')

createApp(App)
    .use(configStore, configStoreKey)
    .use(logStore, logStoreKey)
    .mount('#app')
