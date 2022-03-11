import { mockTauri } from '@/__mocks__/tauri'
import BundleManager from '@/components/bundleManager.vue'
import { config, flushPromises, mount } from '@vue/test-utils'
import { IplButton } from '@iplsplatoon/vue-components'
import { createTestingPinia, TestingPinia } from '@pinia/testing'
import { useNodecgStore } from '@/store/nodecg'
import { useConfigStore } from '@/store/config'

describe('BundleManager', () => {
    config.global.stubs = {
        IplButton: true,
        BundleInstaller: true
    }

    let pinia: TestingPinia

    beforeEach(() => {
        pinia = createTestingPinia()
    })

    it('matches snapshot when bundles are loading', () => {
        const nodecgStore = useNodecgStore()
        nodecgStore.status.bundlesLoading = true
        const wrapper = mount(BundleManager, {
            global: {
                plugins: [pinia]
            }
        })

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot when no bundles are present', () => {
        const nodecgStore = useNodecgStore()
        nodecgStore.bundles = []
        const wrapper = mount(BundleManager, {
            global: {
                plugins: [pinia]
            }
        })

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot when installing a bundle', () => {
        const nodecgStore = useNodecgStore()
        nodecgStore.bundles = []
        const wrapper = mount(BundleManager, {
            global: {
                plugins: [pinia]
            }
        })

        wrapper.getComponent<typeof IplButton>('[data-test="install-new-bundle-button"]').vm.$emit('click')

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot with bundle data', () => {
        const nodecgStore = useNodecgStore()
        nodecgStore.bundles = [
            { name: 'Bundle One', version: '1.2.3' },
            { name: 'Bundle Two', version: '5.0' }
        ]
        const wrapper = mount(BundleManager, {
            global: {
                plugins: [pinia]
            }
        })

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
        const wrapper = mount(BundleManager, {
            global: {
                plugins: [pinia]
            }
        })
        mockTauri.invoke.mockResolvedValue({})
        const bundleRow = wrapper.get('[data-test="bundle_Bundle One"]')

        bundleRow.getComponent<typeof IplButton>('[data-test="uninstall-button"]').vm.$emit('click')
        await flushPromises()

        expect(wrapper.findComponent('[data-test="uninstall-overlay"]').exists()).toEqual(true)
        expect(mockTauri.invoke).not.toHaveBeenCalled()

        wrapper.getComponent<typeof IplButton>('[data-test="confirm-uninstall-button"]').vm.$emit('click')
        await flushPromises()

        expect(wrapper.findComponent('[data-test="uninstall-overlay"]').exists()).toEqual(false)
        expect(mockTauri.invoke).toHaveBeenCalledWith('uninstall_bundle', {
            bundleName: 'Bundle One',
            nodecgPath: '/nodecg/path'
        })
        expect(nodecgStore.getBundleList).toHaveBeenCalled()
    })

    it('handles bundle uninstallation being cancelled', async () => {
        const nodecgStore = useNodecgStore()
        nodecgStore.bundles = [
            { name: 'Bundle One', version: '1.2.3' },
            { name: 'Bundle Two', version: '5.0' }
        ]
        const wrapper = mount(BundleManager, {
            global: {
                plugins: [
                    pinia
                ]
            }
        })
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

    it('handles refreshing', () => {
        const nodecgStore = useNodecgStore()
        nodecgStore.getBundleList = jest.fn()
        const wrapper = mount(BundleManager, {
            global: {
                plugins: [pinia]
            }
        })

        wrapper.getComponent<typeof IplButton>('[data-test="refresh-button"]').vm.$emit('click')

        expect(nodecgStore.getBundleList).toHaveBeenCalled()
    })
})
