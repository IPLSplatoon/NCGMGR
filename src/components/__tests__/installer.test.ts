import { mockTauri, mockTauriDialog } from '@/__mocks__/tauri'
import { config, flushPromises, shallowMount } from '@vue/test-utils'
import { configStoreKey } from '@/store/config'
import { createConfigStore, createLogStore, createNodecgStore } from '@/__mocks__/store'
import { logStoreKey } from '@/store/log'
import Installer from '../Installer.vue'
import { NodecgStatus, nodecgStoreKey } from '@/store/nodecg'

describe('Installer', () => {
    config.global.stubs = {
        IplSpace: false
    }

    it('matches snapshot', () => {
        const wrapper = shallowMount(Installer, {
            global: {
                plugins: [
                    [createConfigStore(), configStoreKey],
                    [createNodecgStore(), nodecgStoreKey]
                ]
            }
        })

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('handles directory selection', async () => {
        const store = createConfigStore()
        jest.spyOn(store, 'dispatch')
        jest.spyOn(store, 'commit')
        const wrapper = shallowMount(Installer, {
            global: {
                plugins: [
                    [store, configStoreKey],
                    [createNodecgStore(), nodecgStoreKey]
                ]
            }
        })
        mockTauriDialog.open.mockResolvedValue('/new/path')

        wrapper.getComponent('[data-test="install-directory-select-button"]').vm.$emit('click')
        await flushPromises()

        expect(mockTauriDialog.open).toHaveBeenCalledWith({ directory: true })
        expect(store.commit).toHaveBeenCalledWith('setInstallPath', '/new/path')
        expect(store.dispatch).toHaveBeenCalledWith('persist')
        expect(store.dispatch).toHaveBeenCalledTimes(1)
    })

    it('handles directory selection getting cancelled', async () => {
        const store = createConfigStore()
        jest.spyOn(store, 'dispatch')
        jest.spyOn(store, 'commit')
        const wrapper = shallowMount(Installer, {
            global: {
                plugins: [
                    [store, configStoreKey],
                    [createNodecgStore(), nodecgStoreKey]
                ]
            }
        })
        mockTauriDialog.open.mockResolvedValue(null)

        wrapper.getComponent('[data-test="install-directory-select-button"]').vm.$emit('click')
        await flushPromises()

        expect(store.commit).not.toHaveBeenCalled()
        expect(store.dispatch).not.toHaveBeenCalled()
    })

    it('disables installation if installation is not possible', async () => {
        const nodecgStore = createNodecgStore()
        nodecgStore.state.status.status = NodecgStatus.UNABLE_TO_INSTALL
        const store = createConfigStore()
        const wrapper = await shallowMount(Installer, {
            global: {
                plugins: [
                    [store, configStoreKey],
                    [nodecgStore, nodecgStoreKey]
                ]
            }
        })
        await flushPromises()

        expect(wrapper.getComponent('[data-test="install-button"]').attributes().disabled).toEqual('true')
    })

    it('enables installation if installation is possible', async () => {
        const nodecgStore = createNodecgStore()
        nodecgStore.state.status.status = NodecgStatus.READY_TO_INSTALL
        const store = createConfigStore()
        const wrapper = await shallowMount(Installer, {
            global: {
                plugins: [
                    [store, configStoreKey],
                    [nodecgStore, nodecgStoreKey]
                ]
            }
        })
        await flushPromises()

        expect(wrapper.getComponent('[data-test="install-button"]').attributes().disabled).toEqual('false')
    })

    it('disables installation if installation is completed', async () => {
        const nodecgStore = createNodecgStore()
        nodecgStore.state.status.status = NodecgStatus.INSTALLED
        const store = createConfigStore()
        const wrapper = await shallowMount(Installer, {
            global: {
                plugins: [
                    [store, configStoreKey],
                    [nodecgStore, nodecgStoreKey]
                ]
            }
        })
        await flushPromises()

        expect(wrapper.getComponent('[data-test="install-button"]').attributes().disabled).toEqual('true')
    })

    it('disables installation if installation status is unknown', async () => {
        const nodecgStore = createNodecgStore()
        nodecgStore.state.status.status = NodecgStatus.UNKNOWN
        const store = createConfigStore()
        const wrapper = await shallowMount(Installer, {
            global: {
                plugins: [
                    [store, configStoreKey],
                    [nodecgStore, nodecgStoreKey]
                ]
            }
        })
        await flushPromises()

        expect(wrapper.getComponent('[data-test="install-button"]').attributes().disabled).toEqual('true')
    })

    it('handles installation', () => {
        const configStore = createConfigStore()
        configStore.state.installPath = '/install/path'
        const logStore = createLogStore()
        jest.spyOn(logStore, 'commit')
        mockTauri.invoke.mockResolvedValue({})
        const wrapper = shallowMount(Installer, {
            global: {
                plugins: [
                    [configStore, configStoreKey],
                    [logStore, logStoreKey],
                    [createNodecgStore(), nodecgStoreKey]
                ]
            }
        })

        wrapper.getComponent('[data-test="install-button"]').vm.$emit('click')

        expect(logStore.commit).toHaveBeenCalledWith('reset')
        expect(mockTauri.invoke).toHaveBeenCalledWith('install_nodecg', { path: '/install/path' })
    })
})
