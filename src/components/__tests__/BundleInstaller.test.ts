import { mockTauri } from '@/__mocks__/tauri'
import BundleInstaller from '@/components/BundleInstaller.vue'
import { config, flushPromises, mount } from '@vue/test-utils'
import Mock = jest.Mock
import { IplButton, IplInput } from '@iplsplatoon/vue-components'
import { createTestingPinia, TestingPinia } from '@pinia/testing'
import { useConfigStore } from '@/store/configStore'
import { useLogStore } from '@/store/logStore'
import { useNodecgStore } from '@/store/nodecgStore'

describe('BundleInstaller', () => {
    config.global.stubs = {
        IplInput: true,
        IplButton: true,
        LogOverlay: true
    }

    let pinia: TestingPinia

    beforeEach(() => {
        pinia = createTestingPinia()
        config.global.plugins = [pinia]
    })

    it('matches snapshot', () => {
        const wrapper = mount(BundleInstaller)

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('handles installation', async () => {
        const logStore = useLogStore()
        logStore.reset = jest.fn()
        logStore.logPromiseResult = jest.fn()
        logStore.listenForProcessExit = jest.fn()
        logStore.listen = jest.fn()
        const configStore = useConfigStore()
        configStore.installPath = '/install/path'
        const nodecgStore = useNodecgStore()
        nodecgStore.getBundleList = jest.fn()
        mockTauri.invoke.mockResolvedValue({})
        const wrapper = mount(BundleInstaller, {
            global: {
                plugins: [pinia]
            }
        })

        wrapper.getComponent<typeof IplInput>('[data-test="bundle-path-input"]').vm.$emit('update:modelValue', 'git://new-path')
        await flushPromises()
        wrapper.getComponent<typeof IplButton>('[data-test="install-button"]').vm.$emit('click')
        await flushPromises()

        expect(logStore.reset).toHaveBeenCalledWith('install-bundle')
        expect(logStore.listen).toHaveBeenCalledWith('install-bundle', true)
        expect(mockTauri.invoke).toHaveBeenCalledWith('install_bundle', { bundleUrl: 'git://new-path', nodecgPath: '/install/path' })
        expect(logStore.logPromiseResult).toHaveBeenCalledWith({ promise: expect.anything(), key: 'install-bundle' })
        expect(logStore.listenForProcessExit).toHaveBeenCalledWith({ callback: expect.anything(), key: 'install-bundle' });
        (logStore.listenForProcessExit as Mock).mock.calls[0][0].callback()
        expect(nodecgStore.getBundleList).toHaveBeenCalled()
        expect(wrapper.findComponent('[data-test="bundle-log-overlay"]').exists()).toEqual(true)
    })
})
