import { mockTauri } from '@/__mocks__/tauri'
import BundleInstaller from '@/components/bundleInstaller.vue'
import { config, flushPromises, mount } from '@vue/test-utils'
import { normalizeBundlePath } from '@/util/nodecg'
import Mock = jest.Mock
import { IplButton, IplInput } from '@iplsplatoon/vue-components'
import { createTestingPinia, TestingPinia } from '@pinia/testing'
import { useConfigStore } from '@/store/config'
import { useLogStore } from '@/store/log'
import { useNodecgStore } from '@/store/nodecg'

jest.mock('@/util/nodecg')

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

    it('disables install button if bundle path is invalid', async () => {
        (normalizeBundlePath as Mock).mockReturnValue({ isValid: false })
        const wrapper = mount(BundleInstaller)

        wrapper.getComponent<typeof IplInput>('[data-test="bundle-path-input"]').vm.$emit('update:modelValue', 'git://new-path')
        await flushPromises()

        expect(wrapper.getComponent('[data-test="install-button"]').attributes().disabled).toEqual('true')
        expect(normalizeBundlePath).toHaveBeenCalledTimes(1)
    })

    it('enables install button if bundle path is invalid', async () => {
        (normalizeBundlePath as Mock).mockReturnValue({ isValid: true })
        const wrapper = mount(BundleInstaller)

        wrapper.getComponent<typeof IplInput>('[data-test="bundle-path-input"]').vm.$emit('update:modelValue', 'git://new-path')
        await flushPromises()

        expect(wrapper.getComponent('[data-test="install-button"]').attributes().disabled).toEqual('false')
        expect(normalizeBundlePath).toHaveBeenCalledTimes(1)
    })

    it('handles installation', async () => {
        (normalizeBundlePath as Mock).mockReturnValue({ isValid: true, bundleUrl: 'git://bundle', bundleName: 'Cool Bundle' })
        const logStore = useLogStore()
        logStore.reset = jest.fn()
        logStore.logPromiseResult = jest.fn()
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
        expect(logStore.listen).toHaveBeenCalledWith('install-bundle')
        expect(mockTauri.invoke).toHaveBeenCalledWith('install_bundle', { bundleName: 'Cool Bundle', bundleUrl: 'git://bundle', nodecgPath: '/install/path' })
        expect(logStore.logPromiseResult).toHaveBeenCalledWith(expect.anything())
        expect(nodecgStore.getBundleList).toHaveBeenCalled()
        expect(wrapper.findComponent('[data-test="bundle-log-overlay"]').exists()).toEqual(true)
    })
})
