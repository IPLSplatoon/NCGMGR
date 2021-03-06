import { defineStore } from 'pinia'

export const LOCAL_STORAGE_CONFIG_KEY = 'config'

export interface Configuration {
    installPath: string
    enableErrorLog: boolean
}

export const useConfigStore = defineStore('config', {
    state: () => ({
        installPath: '',
        enableErrorLog: false
    } as Configuration),
    actions: {
        load () {
            const config = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY) ?? '{}')
            this.$patch(config)
        },
        persist () {
            localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(this.$state))
        }
    }
})
