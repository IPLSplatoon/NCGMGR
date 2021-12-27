import { mockTauri, mockTauriDialog } from '@/__mocks__/tauri'
import App from '../App.vue'
import { config, flushPromises, shallowMount } from '@vue/test-utils'
import { configStoreKey } from '@/store/config'
import { createConfigStore, createLogStore } from '@/__mocks__/store'
import { logStoreKey } from '@/store/log'

describe('App', () => {
    config.global.stubs = {
        IplSpace: false
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

        wrapper.getComponent('[data-test="install-directory-select-button"]').vm.$emit('click')
        await flushPromises()

        expect(mockTauriDialog.open).toHaveBeenCalledWith({ directory: true })
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

        wrapper.getComponent('[data-test="install-directory-select-button"]').vm.$emit('click')
        await flushPromises()

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

        expect(wrapper.getComponent('[data-test="install-button"]').attributes().disabled).toEqual('true')
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

        expect(wrapper.getComponent('[data-test="install-button"]').attributes().disabled).toEqual('false')
    })

    it('handles installation', () => {
        const configStore = createConfigStore()
        configStore.state.installPath = '/install/path'
        const logStore = createLogStore()
        jest.spyOn(logStore, 'commit')
        mockTauri.invoke.mockResolvedValue({})
        const wrapper = shallowMount(App, {
            global: {
                plugins: [
                    [configStore, configStoreKey],
                    [logStore, logStoreKey]
                ]
            }
        })

        wrapper.getComponent('[data-test="install-button"]').vm.$emit('click')

        expect(logStore.commit).toHaveBeenCalledWith('reset')
        expect(mockTauri.invoke).toHaveBeenCalledWith('install_nodecg', { path: '/install/path' })
    })
})
