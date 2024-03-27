import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import { setUpErrorHandler } from '@/store/errorHandlerStore'

(async () => {
    const app = createApp(App)
        .use(createPinia())

    setUpErrorHandler(app)

    app.mount('#app')
})()
