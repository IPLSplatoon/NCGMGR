import App from '@/App.vue'
import { createNodecgStore } from '@/__mocks__/store'
import { shallowMount } from '@vue/test-utils'
import { InstallStatus, nodecgStoreKey } from '@/store/nodecg'

describe('App', () => {
    it('shows bundle manager if nodecg is installed', () => {
        const nodecgStore = createNodecgStore()
        nodecgStore.state.status.installStatus = InstallStatus.INSTALLED
        const wrapper = shallowMount(App, {
            global: {
                plugins: [[nodecgStore, nodecgStoreKey]]
            }
        })

        const bundleManager = wrapper.find('bundle-manager-stub')
        expect(bundleManager.exists()).toEqual(true)
        expect(bundleManager.isVisible()).toEqual(true)
    })

    it('hides bundle manager if nodecg is not installed but can be', () => {
        const nodecgStore = createNodecgStore()
        nodecgStore.state.status.installStatus = InstallStatus.READY_TO_INSTALL
        const wrapper = shallowMount(App, {
            global: {
                plugins: [[nodecgStore, nodecgStoreKey]]
            }
        })

        const bundleManager = wrapper.find('bundle-manager-stub')
        expect(bundleManager.exists()).toEqual(false)
    })

    it('hides bundle manager if nodecg is not installed and cannot be installed', () => {
        const nodecgStore = createNodecgStore()
        nodecgStore.state.status.installStatus = InstallStatus.UNABLE_TO_INSTALL
        const wrapper = shallowMount(App, {
            global: {
                plugins: [[nodecgStore, nodecgStoreKey]]
            }
        })

        const bundleManager = wrapper.find('bundle-manager-stub')
        expect(bundleManager.exists()).toEqual(false)
    })

    it('hides bundle manager if nodecg status is unknown', () => {
        const nodecgStore = createNodecgStore()
        nodecgStore.state.status.installStatus = InstallStatus.UNKNOWN
        const wrapper = shallowMount(App, {
            global: {
                plugins: [[nodecgStore, nodecgStoreKey]]
            }
        })

        const bundleManager = wrapper.find('bundle-manager-stub')
        expect(bundleManager.exists()).toEqual(false)
    })
})
