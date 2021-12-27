import { createStore, Store, useStore } from 'vuex'
import { getNodecgStatus } from '@/service/nodecg'
import { configStore } from '@/store/config'
import { InjectionKey } from 'vue'

export enum NodecgStatus {
    UNKNOWN,
    READY_TO_INSTALL,
    INSTALLED,
    UNABLE_TO_INSTALL
}

export interface StatusStore {
    nodecg: {
        status: NodecgStatus
        message: string
    }
}

export const statusStore: Store<StatusStore> = createStore<StatusStore>({
    state: {
        nodecg: {
            status: NodecgStatus.UNKNOWN,
            message: ''
        }
    },
    actions: {
        async checkNodecgStatus (store) {
            store.state.nodecg.status = NodecgStatus.UNKNOWN
            store.state.nodecg.message = 'Checking status...'

            try {
                const { status, message } = await getNodecgStatus(configStore.state.installPath)
                store.state.nodecg.message = message
                store.state.nodecg.status = status
            } catch (e) {
                store.state.nodecg.message = e.toString()
                store.state.nodecg.status = NodecgStatus.UNABLE_TO_INSTALL
            }
        }
    }
})

export const statusStoreKey: InjectionKey<Store<StatusStore>> = Symbol()

export function useStatusStore (): Store<StatusStore> {
    return useStore(statusStoreKey)
}
