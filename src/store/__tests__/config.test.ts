import { configStore, LOCAL_STORAGE_CONFIG_KEY } from '@/store/config'

describe('configStore', () => {
    beforeEach(() => {
        configStore.replaceState({ installPath: '' })
    })

    describe('setInstallPath', () => {
        it('updates install path', () => {
            configStore.commit('setInstallPath', '/path/')

            expect(configStore.state.installPath).toEqual('/path/')
        })
    })

    describe('load', () => {
        it('loads data from local storage', () => {
            localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify({ installPath: '/path/to/nodecg' }))

            configStore.dispatch('load')

            expect(configStore.state.installPath).toEqual('/path/to/nodecg')
        })
    })

    describe('persist', () => {
        it('saves data to local storage', () => {
            configStore.state.installPath = '/path/to/nodecg'

            configStore.dispatch('persist')

            expect(localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY)).toEqual('{"installPath":"/path/to/nodecg"}')
        })
    })
})
