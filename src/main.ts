import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import { type, version } from '@tauri-apps/api/os'

(async () => {
    const useTransparentBg = await supportsTransparentBackground()
    if (!useTransparentBg) {
        document.body.classList.add('use-opaque-bg')
    }

    createApp(App)
        .use(createPinia())
        .mount('#app')
})()

async function supportsTransparentBackground () {
    const osType = await type()
    if (osType === 'Windows_NT') {
        const osVersion = await version()
        const buildNumber = Number(osVersion.split('.').pop())

        return buildNumber >= 22000
    } else return osType === 'Darwin'
}
