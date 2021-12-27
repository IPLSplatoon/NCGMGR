import { mockTauri, mockTauriDialog } from '@/__mocks__/tauri'
import { config, flushPromises, shallowMount } from '@vue/test-utils'
import { configStoreKey } from '@/store/config'
import { createConfigStore, createLogStore, createStatusStore } from '@/__mocks__/store'
import { logStoreKey } from '@/store/log'
import Installer from '../Installer.vue'
import { NodecgStatus, statusStoreKey } from '@/store/status'

describe('Installer', () => {
    config.global.stubs = {
        IplSpace: false
    }

    it('matches snapshot', () => {
        const wrapper = shallowMount(Installer, {
            global: {
                plugins: [
                    [createConfigStore(), configStoreKey],
                    [createStatusStore(), statusStoreKey]
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
                    [createStatusStore(), statusStoreKey]
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
                    [createStatusStore(), statusStoreKey]
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
        const statusStore = createStatusStore()
        statusStore.state.nodecg = {
            status: NodecgStatus.UNABLE_TO_INSTALL,
            message: 'Unable!'
        }
        const store = createConfigStore()
        const wrapper = await shallowMount(Installer, {
            global: {
                plugins: [
                    [store, configStoreKey],
                    [statusStore, statusStoreKey]
                ]
            }
        })
        await flushPromises()

        expect(wrapper.getComponent('[data-test="install-button"]').attributes().disabled).toEqual('true')
    })

    it('enables installation if installation is possible', async () => {
        const statusStore = createStatusStore()
        statusStore.state.nodecg = {
            status: NodecgStatus.READY_TO_INSTALL,
            message: 'Ready!'
        }
        const store = createConfigStore()
        const wrapper = await shallowMount(Installer, {
            global: {
                plugins: [
                    [store, configStoreKey],
                    [statusStore, statusStoreKey]
                ]
            }
        })
        await flushPromises()

        expect(wrapper.getComponent('[data-test="install-button"]').attributes().disabled).toEqual('false')
    })

    it('disables installation if installation is completed', async () => {
        const statusStore = createStatusStore()
        statusStore.state.nodecg = {
            status: NodecgStatus.INSTALLED,
            message: 'OK!'
        }
        const store = createConfigStore()
        const wrapper = await shallowMount(Installer, {
            global: {
                plugins: [
                    [store, configStoreKey],
                    [statusStore, statusStoreKey]
                ]
            }
        })
        await flushPromises()

        expect(wrapper.getComponent('[data-test="install-button"]').attributes().disabled).toEqual('true')
    })

    it('disables installation if installation status is unknown', async () => {
        const statusStore = createStatusStore()
        statusStore.state.nodecg = {
            status: NodecgStatus.UNKNOWN,
            message: '?'
        }
        const store = createConfigStore()
        const wrapper = await shallowMount(Installer, {
            global: {
                plugins: [
                    [store, configStoreKey],
                    [statusStore, statusStoreKey]
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
                    [createStatusStore(), statusStoreKey]
                ]
            }
        })

        wrapper.getComponent('[data-test="install-button"]').vm.$emit('click')

        expect(logStore.commit).toHaveBeenCalledWith('reset')
        expect(mockTauri.invoke).toHaveBeenCalledWith('install_nodecg', { path: '/install/path' })
    })
})
