import App from '@/App.vue'
import { shallowMount } from '@vue/test-utils'
import { InstallStatus, useNodecgStore } from '@/store/nodecg'
import { createTestingPinia, TestingPinia } from '@pinia/testing'

describe('App', () => {
    let pinia: TestingPinia

    beforeEach(() => {
        pinia = createTestingPinia()
    })

    it('shows bundle manager if nodecg is installed', () => {
        const nodecgStore = useNodecgStore()
        nodecgStore.status.installStatus = InstallStatus.INSTALLED
        const wrapper = shallowMount(App, {
            global: {
                plugins: [pinia]
            }
        })

        const bundleManager = wrapper.find('bundle-manager-stub')
        expect(bundleManager.exists()).toEqual(true)
        expect(bundleManager.isVisible()).toEqual(true)
    })

    it('hides bundle manager if nodecg is not installed but can be', () => {
        const nodecgStore = useNodecgStore()
        nodecgStore.status.installStatus = InstallStatus.READY_TO_INSTALL
        const wrapper = shallowMount(App, {
            global: {
                plugins: [pinia]
            }
        })

        const bundleManager = wrapper.find('bundle-manager-stub')
        expect(bundleManager.exists()).toEqual(false)
    })

    it('hides bundle manager if nodecg is not installed and cannot be installed', () => {
        const nodecgStore = useNodecgStore()
        nodecgStore.status.installStatus = InstallStatus.UNABLE_TO_INSTALL
        const wrapper = shallowMount(App, {
            global: {
                plugins: [pinia]
            }
        })

        const bundleManager = wrapper.find('bundle-manager-stub')
        expect(bundleManager.exists()).toEqual(false)
    })

    it('hides bundle manager if nodecg status is unknown', () => {
        const nodecgStore = useNodecgStore()
        nodecgStore.status.installStatus = InstallStatus.UNKNOWN
        const wrapper = shallowMount(App, {
            global: {
                plugins: [pinia]
            }
        })

        const bundleManager = wrapper.find('bundle-manager-stub')
        expect(bundleManager.exists()).toEqual(false)
    })
})
