import { createStore, Store, useStore } from 'vuex'
import { Bundle, getBundles, getNodecgStatus } from '@/service/nodecg'
import { configStore } from '@/store/config'
import { InjectionKey } from 'vue'

export enum InstallStatus {
    UNKNOWN,
    READY_TO_INSTALL,
    INSTALLED,
    UNABLE_TO_INSTALL
}

export enum RunStatus {
    NOT_STARTED,
    RUNNING,
    STOPPED
}

export interface NodecgStore {
    status: {
        installStatus: InstallStatus
        runStatus: RunStatus
        message: string
        bundlesLoading: boolean
    },
    bundles: Bundle[]
}

export const nodecgStore: Store<NodecgStore> = createStore<NodecgStore>({
    state: {
        status: {
            installStatus: InstallStatus.UNKNOWN,
            runStatus: RunStatus.NOT_STARTED,
            message: '',
            bundlesLoading: false
        },
        bundles: []
    },
    mutations: {
        setRunStatus (state, runStatus: RunStatus) {
            state.status.runStatus = runStatus
        }
    },
    actions: {
        async checkNodecgStatus (store) {
            store.state.status.installStatus = InstallStatus.UNKNOWN
            store.state.status.message = 'Checking status...'

            try {
                const { status, message } = await getNodecgStatus(configStore.state.installPath)
                store.state.status.message = message
                store.state.status.installStatus = status
                if (status === InstallStatus.INSTALLED) {
                    store.dispatch('getBundleList')
                } else {
                    store.state.bundles = []
                }
            } catch (e) {
                store.state.status.message = e.toString()
                store.state.status.installStatus = InstallStatus.UNABLE_TO_INSTALL
                store.state.bundles = []
            }
        },
        async getBundleList (store) {
            store.state.status.bundlesLoading = true
            store.state.bundles = await getBundles(configStore.state.installPath)
            store.state.status.bundlesLoading = false
        }
    }
})

export const nodecgStoreKey: InjectionKey<Store<NodecgStore>> = Symbol()

export function useNodecgStore (): Store<NodecgStore> {
    return useStore(nodecgStoreKey)
}
