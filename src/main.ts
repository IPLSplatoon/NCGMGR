import '@iplsplatoon/vue-components/style.css'
import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import { setUpErrorHandler } from '@/store/errorHandlerStore'
import { useConfigStore } from '@/store/configStore'
import { useDependencyStore } from '@/store/dependencyStore'
import { useNodecgStore } from '@/store/nodecgStore'

function setColorTheme(useLightMode: boolean) {
    if (useLightMode) {
        document.documentElement.classList.add('light')
    } else {
        document.documentElement.classList.remove('light')
    }
}

(async () => {
    const lightModePreference = window.matchMedia('(prefers-color-scheme: light)')
    setColorTheme(lightModePreference.matches)
    lightModePreference.addEventListener('change', e => {
        setColorTheme(e.matches)
    })

    const app = createApp(App)
        .use(createPinia())

    const configStore = useConfigStore()
    await configStore.init()
    const dependencyStore = useDependencyStore()
    await dependencyStore.checkVersions()
    const nodecgStore = useNodecgStore()
    await nodecgStore.checkNodecgStatus()

    setUpErrorHandler(app)

    app.mount('#app')
})()
