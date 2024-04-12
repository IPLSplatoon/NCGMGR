import { defineStore } from 'pinia'
import { appConfigDir } from '@tauri-apps/api/path'
import { Store } from '@tauri-apps/plugin-store'
import { readonly, ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { type } from '@tauri-apps/plugin-os'

const STORE_CONFIG_KEY = 'config'

export interface Configuration {
    nodecgInstallDir: string | null
    enableErrorLog: boolean
}

export const useConfigStore = defineStore('config', () => {
    const userConfig = ref<Configuration>({
        nodecgInstallDir: null,
        enableErrorLog: false
    })
    const allowOpenInTerminal = ref(false)
    let store: Store

    async function init() {
        const configDir = await appConfigDir()
        store = new Store(`${configDir}/config.json`)
        const config = await store.get<Configuration>(STORE_CONFIG_KEY)

        if (config != null) {
            userConfig.value = config
        }

        await store.onKeyChange<Configuration>('config', newValue => {
            if (newValue != null) {
                userConfig.value = newValue
            }
        })

        await type().then(type => {
            allowOpenInTerminal.value = type === 'macos' || type === 'windows'
        })
    }

    async function patch(values: Partial<Configuration>) {
        const newConfig = {
            ...userConfig.value,
            ...values
        }

        return invoke('update_config', {
            config: newConfig
        }).then(() => {
            userConfig.value = newConfig
        })
    }

    return {
        userConfig: readonly(userConfig),
        allowOpenInTerminal: readonly(allowOpenInTerminal),
        init,
        patch
    }
})
