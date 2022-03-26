import { useNodecgStore } from '@/store/nodecg'
import { config, flushPromises, mount } from '@vue/test-utils'
import BundleSettings from '@/components/bundleList/BundleList.vue'
import { createTestingPinia, TestingPinia } from '@pinia/testing'
import { useConfigStore } from '@/store/config'
import { mockTauri } from '@/__mocks__/tauri'
import { IplButton } from '@iplsplatoon/vue-components'
import { removeBundle } from '@/service/nodecg'
import Mock = jest.Mock

jest.mock('@/service/nodecg')

describe('BundleSettings', () => {
    let pinia: TestingPinia
    config.global.stubs = {
        IplButton: true
    }

    beforeEach(() => {
        pinia = createTestingPinia()
        config.global.plugins = [pinia]
    })

    it('matches snapshot when bundles are loading', () => {
        const nodecgStore = useNodecgStore()
        nodecgStore.status.bundlesLoading = true
        const wrapper = mount(BundleSettings)

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot when no bundles are present', () => {
        const nodecgStore = useNodecgStore()
        nodecgStore.bundles = []
        const wrapper = mount(BundleSettings)

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('handles uninstalling a bundle', async () => {
        const configStore = useConfigStore()
        configStore.installPath = '/nodecg/path'
        const nodecgStore = useNodecgStore()
        nodecgStore.bundles = [
            { name: 'Bundle One', version: '1.2.3' },
            { name: 'Bundle Two', version: '5.0' }
        ]
        nodecgStore.getBundleList = jest.fn()
        const wrapper = mount(BundleSettings);
        (removeBundle as Mock).mockResolvedValue({})
        const bundleRow = wrapper.get('[data-test="bundle_Bundle One"]')

        bundleRow.getComponent<typeof IplButton>('[data-test="uninstall-button"]').vm.$emit('click')
        await flushPromises()

        expect(wrapper.findComponent('[data-test="uninstall-overlay"]').exists()).toEqual(true)
        expect(mockTauri.invoke).not.toHaveBeenCalled()

        wrapper.getComponent<typeof IplButton>('[data-test="confirm-uninstall-button"]').vm.$emit('click')
        await flushPromises()

        expect(wrapper.findComponent('[data-test="uninstall-overlay"]').exists()).toEqual(false)
        expect(removeBundle).toHaveBeenCalledWith('Bundle One', '/nodecg/path')
        expect(nodecgStore.getBundleList).toHaveBeenCalled()
    })

    it('handles bundle uninstallation being cancelled', async () => {
        const nodecgStore = useNodecgStore()
        nodecgStore.bundles = [
            { name: 'Bundle One', version: '1.2.3' },
            { name: 'Bundle Two', version: '5.0' }
        ]
        const wrapper = mount(BundleSettings)
        mockTauri.invoke.mockResolvedValue({})
        const bundleRow = wrapper.get('[data-test="bundle_Bundle One"]')

        bundleRow.getComponent<typeof IplButton>('[data-test="uninstall-button"]').vm.$emit('click')
        await flushPromises()

        expect(wrapper.findComponent('[data-test="uninstall-overlay"]').exists()).toEqual(true)

        wrapper.getComponent<typeof IplButton>('[data-test="cancel-uninstall-button"]').vm.$emit('click')
        await flushPromises()

        expect(wrapper.findComponent('[data-test="uninstall-overlay"]').exists()).toEqual(false)
        expect(mockTauri.invoke).not.toHaveBeenCalled()
    })
})
