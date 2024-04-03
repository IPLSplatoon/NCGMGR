import '@iplsplatoon/vue-components/style.css'
import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import { setUpErrorHandler } from '@/store/errorHandlerStore'

(async () => {
    const lightModePreference = window.matchMedia('(prefers-color-scheme: light)')
    lightModePreference.addEventListener('change', e => {
        if (e.matches) {
            document.documentElement.classList.add('light')
        } else {
            document.documentElement.classList.remove('light')
        }
    })

    const app = createApp(App)
        .use(createPinia())

    setUpErrorHandler(app)

    app.mount('#app')
})()
