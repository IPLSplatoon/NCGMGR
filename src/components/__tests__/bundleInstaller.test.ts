import { mockTauri } from '@/__mocks__/tauri'
import BundleInstaller from '@/components/bundleInstaller.vue'
import { config, flushPromises, mount } from '@vue/test-utils'
import { normalizeBundlePath } from '@/util/nodecg'
import Mock = jest.Mock
import { createConfigStore, createLogStore, createNodecgStore } from '@/__mocks__/store'
import { logStoreKey } from '@/store/log'
import { nodecgStoreKey } from '@/store/nodecg'
import { configStoreKey } from '@/store/config'
import { IplButton, IplInput } from '@iplsplatoon/vue-components'

jest.mock('@/util/nodecg')

describe('BundleInstaller', () => {
    config.global.stubs = {
        IplInput: true,
        IplButton: true,
        LogOverlay: true
    }

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
        const logStore = createLogStore()
        jest.spyOn(logStore, 'commit')
        jest.spyOn(logStore, 'dispatch')
        const configStore = createConfigStore()
        configStore.state.installPath = '/install/path'
        const nodecgStore = createNodecgStore()
        jest.spyOn(nodecgStore, 'dispatch')
        mockTauri.invoke.mockResolvedValue({})
        const wrapper = mount(BundleInstaller, {
            global: {
                plugins: [
                    [logStore, logStoreKey],
                    [nodecgStore, nodecgStoreKey],
                    [configStore, configStoreKey]
                ]
            }
        })

        wrapper.getComponent<typeof IplInput>('[data-test="bundle-path-input"]').vm.$emit('update:modelValue', 'git://new-path')
        await flushPromises()
        wrapper.getComponent<typeof IplButton>('[data-test="install-button"]').vm.$emit('click')
        await flushPromises()

        expect(logStore.commit).toHaveBeenCalledWith('reset', 'install-bundle')
        expect(mockTauri.invoke).toHaveBeenCalledWith('install_bundle', { bundleName: 'Cool Bundle', bundleUrl: 'git://bundle', nodecgPath: '/install/path' })
        expect(logStore.dispatch).toHaveBeenCalledWith('logPromiseResult', expect.anything())
        expect(nodecgStore.dispatch).toHaveBeenCalledWith('getBundleList')
        expect(wrapper.findComponent('[data-test="bundle-log-overlay"]').exists()).toEqual(true)
    })
})
