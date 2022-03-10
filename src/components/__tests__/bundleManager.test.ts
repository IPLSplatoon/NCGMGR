import { mockTauri } from '@/__mocks__/tauri'
import BundleManager from '@/components/bundleManager.vue'
import { createConfigStore, createNodecgStore } from '@/__mocks__/store'
import { config, flushPromises, mount } from '@vue/test-utils'
import { nodecgStoreKey } from '@/store/nodecg'
import { configStoreKey } from '@/store/config'
import { IplButton } from '@iplsplatoon/vue-components'

describe('BundleManager', () => {
    config.global.stubs = {
        IplButton: true,
        BundleInstaller: true
    }

    it('matches snapshot when bundles are loading', () => {
        const nodecgStore = createNodecgStore()
        nodecgStore.state.status.bundlesLoading = true
        const wrapper = mount(BundleManager, {
            global: {
                plugins: [[nodecgStore, nodecgStoreKey]]
            }
        })

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot when no bundles are present', () => {
        const nodecgStore = createNodecgStore()
        nodecgStore.state.bundles = []
        const wrapper = mount(BundleManager, {
            global: {
                plugins: [[nodecgStore, nodecgStoreKey]]
            }
        })

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot when installing a bundle', () => {
        const nodecgStore = createNodecgStore()
        nodecgStore.state.bundles = []
        const wrapper = mount(BundleManager, {
            global: {
                plugins: [[nodecgStore, nodecgStoreKey]]
            }
        })

        wrapper.getComponent<typeof IplButton>('[data-test="install-new-bundle-button"]').vm.$emit('click')

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot with bundle data', () => {
        const nodecgStore = createNodecgStore()
        nodecgStore.state.bundles = [
            { name: 'Bundle One', version: '1.2.3' },
            { name: 'Bundle Two', version: '5.0' }
        ]
        const wrapper = mount(BundleManager, {
            global: {
                plugins: [[nodecgStore, nodecgStoreKey]]
            }
        })

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('handles uninstalling a bundle', async () => {
        const configStore = createConfigStore()
        configStore.state.installPath = '/nodecg/path'
        const nodecgStore = createNodecgStore()
        nodecgStore.state.bundles = [
            { name: 'Bundle One', version: '1.2.3' },
            { name: 'Bundle Two', version: '5.0' }
        ]
        jest.spyOn(nodecgStore, 'dispatch')
        const wrapper = mount(BundleManager, {
            global: {
                plugins: [
                    [nodecgStore, nodecgStoreKey],
                    [configStore, configStoreKey]
                ]
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
        expect(nodecgStore.dispatch).toHaveBeenCalledWith('getBundleList')
    })

    it('handles bundle uninstallation being cancelled', async () => {
        const nodecgStore = createNodecgStore()
        nodecgStore.state.bundles = [
            { name: 'Bundle One', version: '1.2.3' },
            { name: 'Bundle Two', version: '5.0' }
        ]
        const wrapper = mount(BundleManager, {
            global: {
                plugins: [
                    [nodecgStore, nodecgStoreKey]
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
        const nodecgStore = createNodecgStore()
        jest.spyOn(nodecgStore, 'dispatch')
        const wrapper = mount(BundleManager, {
            global: {
                plugins: [[nodecgStore, nodecgStoreKey]]
            }
        })

        wrapper.getComponent<typeof IplButton>('[data-test="refresh-button"]').vm.$emit('click')

        expect(nodecgStore.dispatch).toHaveBeenCalledTimes(1)
        expect(nodecgStore.dispatch).toHaveBeenCalledWith('getBundleList')
    })
})
