import { PackageStatus } from '@/types/package'
import { createStore, Store, useStore } from 'vuex'
import { getNodecgStatus } from '@/service/nodecg'
import { configStore } from '@/store/config'
import { InjectionKey } from 'vue'

export interface StatusStore {
    nodecg: {
        status: PackageStatus
        message: string
    }
}

export const statusStore: Store<StatusStore> = createStore<StatusStore>({
    state: {
        nodecg: {
            status: PackageStatus.UNKNOWN,
            message: ''
        }
    },
    actions: {
        async checkNodecgStatus (store) {
            store.state.nodecg.status = PackageStatus.UNKNOWN
            store.state.nodecg.message = 'Checking status...'

            try {
                const { status, message } = await getNodecgStatus(configStore.state.installPath)
                store.state.nodecg.message = message
                store.state.nodecg.status = status
            } catch (e) {
                store.state.nodecg.message = e.toString()
                store.state.nodecg.status = PackageStatus.UNABLE_TO_INSTALL
            }
        }
    }
})

export const statusStoreKey: InjectionKey<Store<StatusStore>> = Symbol()

export function useStatusStore (): Store<StatusStore> {
    return useStore(statusStoreKey)
}
