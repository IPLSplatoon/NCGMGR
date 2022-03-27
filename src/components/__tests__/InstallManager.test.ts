import { mockTauri, mockTauriDialog } from '@/__mocks__/tauri'
import { config, flushPromises, shallowMount } from '@vue/test-utils'
import InstallManager from '../InstallManager.vue'
import { InstallStatus, useNodecgStore, RunStatus } from '@/store/nodecgStore'
import { IplButton } from '@iplsplatoon/vue-components'
import { createTestingPinia, TestingPinia } from '@pinia/testing'
import { useConfigStore } from '@/store/configStore'
import { useLogStore } from '@/store/logStore'
import { openDashboard } from '@/service/nodecgService'

jest.mock('@/service/nodecgService')

describe('Installer', () => {
    config.global.stubs = {
        IplSpace: false,
        IplExpandingSpace: false
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

    it.each(Object.values(RunStatus))('matches snapshot when nodecg status is %s', (status: RunStatus) => {
        useNodecgStore().status.runStatus = status

        expect(shallowMount(InstallManager).html()).toMatchSnapshot()
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

    it('shows start/stop button if nodecg is installed', async () => {
        const nodecgStore = useNodecgStore()
        nodecgStore.checkNodecgStatus = jest.fn()
        nodecgStore.status.installStatus = InstallStatus.INSTALLED
        const wrapper = await shallowMount(InstallManager)

        expect(wrapper.findComponent('[data-test="install-button"]').exists()).toEqual(false)
        expect(wrapper.findComponent('[data-test="start-stop-toggle-button"]').exists()).toEqual(true)
    })

    it('disables installation if installation status is unknown', async () => {
        const nodecgStore = useNodecgStore()
        nodecgStore.status.installStatus = InstallStatus.UNKNOWN
        const wrapper = await shallowMount(InstallManager)
        await flushPromises()

        expect(wrapper.getComponent('[data-test="install-button"]').attributes().disabled).toEqual('true')
        expect(wrapper.findComponent('[data-test="launch-button"]').exists()).toEqual(false)
    })

    it('handles installation', async () => {
        const configStore = useConfigStore()
        configStore.installPath = '/install/path'
        const logStore = useLogStore()
        logStore.reset = jest.fn()
        logStore.listen = jest.fn()
        logStore.logPromiseResult = jest.fn()
        logStore.listenForProcessExit = jest.fn()
        const nodecgStore = useNodecgStore()
        nodecgStore.status.installStatus = InstallStatus.READY_TO_INSTALL
        mockTauri.invoke.mockResolvedValue({})
        const wrapper = shallowMount(InstallManager)

        await wrapper.getComponent<typeof IplButton>('[data-test="install-button"]').vm.$emit('click')

        expect(logStore.reset).toHaveBeenCalledWith('install-nodecg')
        expect(logStore.listen).toHaveBeenCalledWith('install-nodecg')
        expect(mockTauri.invoke).toHaveBeenCalledWith('install_nodecg', { path: '/install/path' })
        expect(logStore.logPromiseResult).toHaveBeenCalledWith({ promise: expect.anything(), key: 'install-nodecg' })
        expect(logStore.listenForProcessExit).toHaveBeenCalledWith({ key: 'install-nodecg', callback: expect.anything() })
    })

    it.each([RunStatus.NOT_STARTED, RunStatus.STOPPED])('handles launching when nodecg status is %s', async (status) => {
        const configStore = useConfigStore()
        configStore.installPath = '/install/path'
        const logStore = useLogStore()
        logStore.reset = jest.fn()
        logStore.logPromiseResult = jest.fn()
        const nodecgStore = useNodecgStore()
        nodecgStore.status.installStatus = InstallStatus.INSTALLED
        nodecgStore.status.runStatus = status
        mockTauri.invoke.mockResolvedValue({})
        const wrapper = shallowMount(InstallManager)

        wrapper.getComponent<typeof IplButton>('[data-test="start-stop-toggle-button"]').vm.$emit('click')
        await flushPromises()

        expect(logStore.reset).toHaveBeenCalledWith('run-nodecg')
        expect(mockTauri.invoke).toHaveBeenCalledWith('start_nodecg', { path: '/install/path' })
        expect(logStore.logPromiseResult).toHaveBeenCalledWith({ promise: expect.anything(), key: 'run-nodecg' })
        expect(nodecgStore.status.runStatus).toEqual(RunStatus.RUNNING)
    })

    it('handles stopping nodecg', async () => {
        const nodecgStore = useNodecgStore()
        nodecgStore.status.installStatus = InstallStatus.INSTALLED
        nodecgStore.status.runStatus = RunStatus.RUNNING
        mockTauri.invoke.mockResolvedValue({})
        const wrapper = shallowMount(InstallManager)

        await wrapper.getComponent<typeof IplButton>('[data-test="start-stop-toggle-button"]').vm.$emit('click')

        expect(mockTauri.invoke).toHaveBeenCalledWith('stop_nodecg')
    })

    it('handles opening the dashboard', () => {
        useConfigStore().installPath = '/nodecg/install/path'
        const wrapper = shallowMount(InstallManager)

        wrapper.getComponent<typeof IplButton>('[data-test="open-dashboard-button"]').vm.$emit('click')

        expect(openDashboard).toHaveBeenCalledWith('/nodecg/install/path')
    })
})
