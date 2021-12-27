import { createApp } from 'vue'
import App from './App.vue'
import { configStore, configStoreKey } from './store/config'
import { logStore, logStoreKey } from '@/store/log'
import { statusStore, statusStoreKey } from '@/store/status'

logStore.dispatch('listen')
configStore.dispatch('load')

createApp(App)
    .use(configStore, configStoreKey)
    .use(logStore, logStoreKey)
    .use(statusStore, statusStoreKey)
    .mount('#app')
