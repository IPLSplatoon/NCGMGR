import { LOCAL_STORAGE_CONFIG_KEY, useConfigStore } from '@/store/configStore'
import { createPinia, setActivePinia } from 'pinia'

describe('configStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    describe('load', () => {
        it('loads data from local storage', () => {
            const store = useConfigStore()
            localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify({ installPath: '/path/to/nodecg' }))

            store.load()

            expect(store.installPath).toEqual('/path/to/nodecg')
        })
    })

    describe('persist', () => {
        it('saves data to local storage', () => {
            const store = useConfigStore()
            store.installPath = '/path/to/nodecg'

            store.persist()

            expect(localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY)).toEqual('{"installPath":"/path/to/nodecg","enableErrorLog":false}')
        })
    })
})
