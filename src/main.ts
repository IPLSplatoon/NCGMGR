import { createApp } from 'vue'
import App from './App.vue'
import { configStore, configStoreKey } from './store/config'
import { logStore, logStoreKey } from '@/store/log'
import { nodecgStore, nodecgStoreKey } from '@/store/nodecg'

configStore.dispatch('load')

createApp(App)
    .use(configStore, configStoreKey)
    .use(logStore, logStoreKey)
    .use(nodecgStore, nodecgStoreKey)
    .mount('#app')
