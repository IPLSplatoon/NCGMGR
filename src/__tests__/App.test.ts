import App from '@/App.vue'
import { createStatusStore } from '@/__mocks__/store'
import { shallowMount } from '@vue/test-utils'
import { NodecgStatus, statusStoreKey } from '@/store/status'

describe('App', () => {
    it('shows bundle manager if nodecg is installed', () => {
        const statusStore = createStatusStore()
        statusStore.state.nodecg.status = NodecgStatus.INSTALLED
        const wrapper = shallowMount(App, {
            global: {
                plugins: [[statusStore, statusStoreKey]]
            }
        })

        const bundleManager = wrapper.find('bundle-manager-stub')
        expect(bundleManager.exists()).toEqual(true)
        expect(bundleManager.isVisible()).toEqual(true)
    })

    it('hides bundle manager if nodecg is not installed but can be', () => {
        const statusStore = createStatusStore()
        statusStore.state.nodecg.status = NodecgStatus.READY_TO_INSTALL
        const wrapper = shallowMount(App, {
            global: {
                plugins: [[statusStore, statusStoreKey]]
            }
        })

        const bundleManager = wrapper.find('bundle-manager-stub')
        expect(bundleManager.exists()).toEqual(false)
    })

    it('hides bundle manager if nodecg is not installed and cannot be installed', () => {
        const statusStore = createStatusStore()
        statusStore.state.nodecg.status = NodecgStatus.UNABLE_TO_INSTALL
        const wrapper = shallowMount(App, {
            global: {
                plugins: [[statusStore, statusStoreKey]]
            }
        })

        const bundleManager = wrapper.find('bundle-manager-stub')
        expect(bundleManager.exists()).toEqual(false)
    })

    it('hides bundle manager if nodecg status is unknown', () => {
        const statusStore = createStatusStore()
        statusStore.state.nodecg.status = NodecgStatus.UNKNOWN
        const wrapper = shallowMount(App, {
            global: {
                plugins: [[statusStore, statusStoreKey]]
            }
        })

        const bundleManager = wrapper.find('bundle-manager-stub')
        expect(bundleManager.exists()).toEqual(false)
    })
})
