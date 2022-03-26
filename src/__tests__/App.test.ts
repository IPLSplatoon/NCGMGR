import App from '@/App.vue'
import { shallowMount } from '@vue/test-utils'
import { InstallStatus, useNodecgStore } from '@/store/nodecg'
import { createTestingPinia, TestingPinia } from '@pinia/testing'
import { useDependencyStore } from '@/store/dependencyStore'

describe('App', () => {
    let pinia: TestingPinia

    beforeEach(() => {
        pinia = createTestingPinia()
    })

    it('hides bundle and install managers if nodejs is not installed', () => {
        useDependencyStore().nodejs.version = null
        const wrapper = shallowMount(App, { global: { plugins: [pinia] } })

        const dependencyChecker = wrapper.find('dependency-checker-stub')
        expect(dependencyChecker.exists()).toEqual(true)
        expect(dependencyChecker.isVisible()).toEqual(true)
        expect(wrapper.find('bundle-manager-stub').exists()).toEqual(false)
        expect(wrapper.find('install-manager-stub').exists()).toEqual(false)
    })

    it('shows bundle manager if nodecg and nodejs are installed', () => {
        useDependencyStore().nodejs.version = '12.45.2'
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
        useDependencyStore().nodejs.version = '12.45.35'
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
        useDependencyStore().nodejs.version = '12.44.2'
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
        useDependencyStore().nodejs.version = '13.45.2'
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
