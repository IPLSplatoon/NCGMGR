import { createStore, Store, useStore } from 'vuex'
import { InjectionKey } from 'vue'

export const LOCAL_STORAGE_CONFIG_KEY = 'config'

export interface Configuration {
    installPath: string
}

export const configStore = createStore<Configuration>({
    state: {
        installPath: ''
    },
    mutations: {
        setInstallPath: (state, installPath: string) => {
            state.installPath = installPath
        },
        setState: (state, config: Configuration) => {
            Object.assign(state, config)
        }
    },
    actions: {
        load: store => {
            const config = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY) ?? '{}')
            store.commit('setState', {
                ...store.state,
                ...config
            })
        },
        persist: store => {
            localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(store.state))
        }
    }
})

export const configStoreKey: InjectionKey<Store<Configuration>> = Symbol()

export function useConfigStore (): Store<Configuration> {
    return useStore(configStoreKey)
}
