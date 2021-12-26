import { mockTauri, mockTauriDialog } from '@/__mocks__/tauri'
import App from '../App.vue'
import { shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { configStoreKey, Configuration } from '@/store/config'

describe('App', () => {
    function createConfigStore () {
        return createStore<Configuration>({
            state: {
                installPath: '/install/path'
            },
            actions: {
                load: jest.fn(),
                persist: jest.fn()
            },
            mutations: {
                setInstallPath: jest.fn()
            }
        })
    }

    it('matches snapshot', () => {
        const wrapper = shallowMount(App, {
            global: {
                plugins: [
                    [createConfigStore(), configStoreKey]
                ]
            }
        })

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('handles directory selection', async () => {
        const store = createConfigStore()
        jest.spyOn(store, 'dispatch')
        jest.spyOn(store, 'commit')
        const wrapper = shallowMount(App, {
            global: {
                plugins: [
                    [store, configStoreKey]
                ]
            }
        })
        mockTauriDialog.open.mockResolvedValue('/new/path')

        await wrapper.get('[data-test="install-directory-select-button"]').trigger('click')

        expect(store.commit).toHaveBeenCalledWith('setInstallPath', '/new/path')
        expect(store.dispatch).toHaveBeenCalledWith('persist')
        expect(store.dispatch).toHaveBeenCalledTimes(2)
    })

    it('handles directory selection getting cancelled', async () => {
        const store = createConfigStore()
        jest.spyOn(store, 'dispatch')
        jest.spyOn(store, 'commit')
        const wrapper = shallowMount(App, {
            global: {
                plugins: [
                    [store, configStoreKey]
                ]
            }
        })
        mockTauriDialog.open.mockResolvedValue(null)

        await wrapper.get('[data-test="install-directory-select-button"]').trigger('click')

        expect(store.commit).not.toHaveBeenCalled()
        expect(store.dispatch).toHaveBeenCalledTimes(1)
    })

    it('disables installation if no install directory is selected', () => {
        const store = createConfigStore()
        store.state.installPath = ''
        const wrapper = shallowMount(App, {
            global: {
                plugins: [
                    [store, configStoreKey]
                ]
            }
        })

        expect((wrapper.get('[data-test="install-button"]').element as HTMLButtonElement).disabled).toEqual(true)
    })

    it('enables installation if install directory is selected', () => {
        const store = createConfigStore()
        store.state.installPath = '/install/path'
        const wrapper = shallowMount(App, {
            global: {
                plugins: [
                    [store, configStoreKey]
                ]
            }
        })

        expect((wrapper.get('[data-test="install-button"]').element as HTMLButtonElement).disabled).toEqual(false)
    })

    it('handles installation', () => {
        const store = createConfigStore()
        store.state.installPath = '/install/path'
        const wrapper = shallowMount(App, {
            global: {
                plugins: [
                    [store, configStoreKey]
                ]
            }
        })

        wrapper.get('[data-test="install-button"]').trigger('click')

        expect(mockTauri.invoke).toHaveBeenCalledWith('install_nodecg', { path: '/install/path' })
    })
})
