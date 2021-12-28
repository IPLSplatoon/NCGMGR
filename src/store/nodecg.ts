import { createStore, Store, useStore } from 'vuex'
import { Bundle, getBundles, getNodecgStatus } from '@/service/nodecg'
import { configStore } from '@/store/config'
import { InjectionKey } from 'vue'

export enum NodecgStatus {
    UNKNOWN,
    READY_TO_INSTALL,
    INSTALLED,
    UNABLE_TO_INSTALL
}

export interface NodecgStore {
    status: {
        status: NodecgStatus
        message: string
        bundlesLoading: boolean
    },
    bundles: Bundle[]
}

export const nodecgStore: Store<NodecgStore> = createStore<NodecgStore>({
    state: {
        status: {
            status: NodecgStatus.UNKNOWN,
            message: '',
            bundlesLoading: false
        },
        bundles: []
    },
    actions: {
        async checkNodecgStatus (store) {
            store.state.status.status = NodecgStatus.UNKNOWN
            store.state.status.message = 'Checking status...'

            try {
                const { status, message } = await getNodecgStatus(configStore.state.installPath)
                store.state.status.message = message
                store.state.status.status = status
                if (status === NodecgStatus.INSTALLED) {
                    store.dispatch('getBundleList')
                } else {
                    store.state.bundles = []
                }
            } catch (e) {
                store.state.status.message = e.toString()
                store.state.status.status = NodecgStatus.UNABLE_TO_INSTALL
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
