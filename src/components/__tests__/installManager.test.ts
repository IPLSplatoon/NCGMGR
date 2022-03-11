import { mockTauri, mockTauriDialog } from '@/__mocks__/tauri'
import { config, flushPromises, shallowMount } from '@vue/test-utils'
import InstallManager from '../installManager.vue'
import { InstallStatus, useNodecgStore, RunStatus } from '@/store/nodecg'
import { IplButton } from '@iplsplatoon/vue-components'
import { createTestingPinia, TestingPinia } from '@pinia/testing'
import { useConfigStore } from '@/store/config'
import { useLogStore } from '@/store/log'

describe('Installer', () => {
    config.global.stubs = {
        IplSpace: false
    }

    let pinia: TestingPinia

    beforeEach(() => {
        pinia = createTestingPinia()
        config.global.plugins = [pinia]
    })

    it('matches snapshot', () => {
        useConfigStore().installPath = '/install/path'

        const wrapper = shallowMount(InstallManager)

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('handles directory selection', async () => {
        const store = useConfigStore()
        store.persist = jest.fn()
        const wrapper = shallowMount(InstallManager)
        mockTauriDialog.open.mockResolvedValue('/new/path')

        wrapper.getComponent<typeof IplButton>('[data-test="install-directory-select-button"]').vm.$emit('click')
        await flushPromises()

        expect(mockTauriDialog.open).toHaveBeenCalledWith({ directory: true })
        expect(store.installPath).toEqual('/new/path')
        expect(store.persist).toHaveBeenCalled()
    })

    it('handles directory selection getting cancelled', async () => {
        const store = useConfigStore()
        store.persist = jest.fn()
        const wrapper = shallowMount(InstallManager)
        mockTauriDialog.open.mockResolvedValue(null)

        wrapper.getComponent<typeof IplButton>('[data-test="install-directory-select-button"]').vm.$emit('click')
        await flushPromises()

        expect(store.installPath).toEqual('')
        expect(store.persist).not.toHaveBeenCalled()
    })

    it('disables installation if installation is not possible', async () => {
        const nodecgStore = useNodecgStore()
        nodecgStore.checkNodecgStatus = jest.fn()
        nodecgStore.status.installStatus = InstallStatus.UNABLE_TO_INSTALL
        const wrapper = await shallowMount(InstallManager)

        expect(wrapper.getComponent('[data-test="install-button"]').attributes().disabled).toEqual('true')
        expect(wrapper.findComponent('[data-test="launch-button"]').exists()).toEqual(false)
    })

    it('enables installation if installation is possible', async () => {
        const nodecgStore = useNodecgStore()
        nodecgStore.checkNodecgStatus = jest.fn()
        nodecgStore.status.installStatus = InstallStatus.READY_TO_INSTALL
        const wrapper = await shallowMount(InstallManager)

        expect(wrapper.getComponent('[data-test="install-button"]').attributes().disabled).toEqual('false')
        expect(wrapper.findComponent('[data-test="launch-button"]').exists()).toEqual(false)
    })

    it('shows launch button if nodecg is installed', async () => {
        const nodecgStore = useNodecgStore()
        nodecgStore.checkNodecgStatus = jest.fn()
        nodecgStore.status.installStatus = InstallStatus.INSTALLED
        const wrapper = await shallowMount(InstallManager)

        expect(wrapper.findComponent('[data-test="install-button"]').exists()).toEqual(false)
        expect(wrapper.findComponent('[data-test="launch-button"]').exists()).toEqual(true)
    })

    it('disables installation if installation status is unknown', async () => {
        const nodecgStore = useNodecgStore()
        nodecgStore.status.installStatus = InstallStatus.UNKNOWN
        const wrapper = await shallowMount(InstallManager)
        await flushPromises()

        expect(wrapper.getComponent('[data-test="install-button"]').attributes().disabled).toEqual('true')
        expect(wrapper.findComponent('[data-test="launch-button"]').exists()).toEqual(false)
    })

    it('handles installation', () => {
        const configStore = useConfigStore()
        configStore.installPath = '/install/path'
        const logStore = useLogStore()
        logStore.reset = jest.fn()
        const nodecgStore = useNodecgStore()
        nodecgStore.status.installStatus = InstallStatus.READY_TO_INSTALL
        mockTauri.invoke.mockResolvedValue({})
        const wrapper = shallowMount(InstallManager)

        wrapper.getComponent<typeof IplButton>('[data-test="install-button"]').vm.$emit('click')

        expect(logStore.reset).toHaveBeenCalledWith('install-nodecg')
        expect(mockTauri.invoke).toHaveBeenCalledWith('install_nodecg', { path: '/install/path' })
    })

    it('handles launching', async () => {
        const configStore = useConfigStore()
        configStore.installPath = '/install/path'
        const logStore = useLogStore()
        logStore.reset = jest.fn()
        logStore.logPromiseResult = jest.fn()
        const nodecgStore = useNodecgStore()
        nodecgStore.status.installStatus = InstallStatus.INSTALLED
        mockTauri.invoke.mockResolvedValue({})
        const wrapper = shallowMount(InstallManager)

        wrapper.getComponent<typeof IplButton>('[data-test="launch-button"]').vm.$emit('click')
        await flushPromises()

        expect(logStore.reset).toHaveBeenCalledWith('run-nodecg')
        expect(mockTauri.invoke).toHaveBeenCalledWith('start_nodecg', { path: '/install/path' })
        expect(logStore.logPromiseResult).toHaveBeenCalledWith({ promise: expect.anything(), key: 'run-nodecg', noLogOnSuccess: true })
        expect(nodecgStore.status.runStatus).toEqual(RunStatus.RUNNING)
    })

    it('disables stop button if nodecg is not started', () => {
        const nodecgStore = useNodecgStore()
        nodecgStore.status.runStatus = RunStatus.NOT_STARTED
        const wrapper = shallowMount(InstallManager)

        expect(wrapper.getComponent('[data-test="stop-button"]').attributes().disabled).toEqual('true')
    })

    it('disables stop button if nodecg is stopped', () => {
        const nodecgStore = useNodecgStore()
        nodecgStore.status.runStatus = RunStatus.STOPPED
        const wrapper = shallowMount(InstallManager)

        expect(wrapper.getComponent('[data-test="stop-button"]').attributes().disabled).toEqual('true')
    })

    it('enables stop button if nodecg is running', () => {
        const nodecgStore = useNodecgStore()
        nodecgStore.status.runStatus = RunStatus.RUNNING
        const wrapper = shallowMount(InstallManager)

        expect(wrapper.getComponent('[data-test="stop-button"]').attributes().disabled).toEqual('false')
    })

    it('handles nodecg stopping', async () => {
        const nodecgStore = useNodecgStore()
        nodecgStore.status.runStatus = RunStatus.RUNNING
        mockTauri.invoke.mockResolvedValue({})
        const wrapper = shallowMount(InstallManager)

        wrapper.getComponent<typeof IplButton>('[data-test="stop-button"]').vm.$emit('click')
        await flushPromises()

        expect(mockTauri.invoke).toHaveBeenCalledWith('stop_nodecg')
        expect(nodecgStore.status.runStatus).toEqual(RunStatus.STOPPED)
    })
})
