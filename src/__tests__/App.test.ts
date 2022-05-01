import App from '@/App.vue'
import { shallowMount } from '@vue/test-utils'
import { InstallStatus, useNodecgStore } from '@/store/nodecgStore'
import { createTestingPinia, TestingPinia } from '@pinia/testing'
import { useDependencyStore } from '@/store/dependencyStore'

describe('App', () => {
    let pinia: TestingPinia

    beforeEach(() => {
        pinia = createTestingPinia()
    })

    it('hides bundle and install managers if nodejs is not installed', () => {
        const dependencyStore = useDependencyStore()
        dependencyStore.nodejs.version = null
        dependencyStore.checkVersions = jest.fn()

        const wrapper = shallowMount(App, { global: { plugins: [pinia] } })

        expect(wrapper.find('bundle-manager-stub').exists()).toEqual(false)
        expect(wrapper.find('install-manager-stub').exists()).toEqual(false)
        expect(dependencyStore.checkVersions).toHaveBeenCalled()
    })

    it('shows bundle manager if nodecg and nodejs are installed', () => {
        const dependencyStore = useDependencyStore()
        dependencyStore.nodejs.version = '12.45.2'
        dependencyStore.checkVersions = jest.fn()
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
        const dependencyStore = useDependencyStore()
        dependencyStore.nodejs.version = '12.45.35'
        dependencyStore.checkVersions = jest.fn()
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
        const dependencyStore = useDependencyStore()
        dependencyStore.nodejs.version = '12.44.2'
        dependencyStore.checkVersions = jest.fn()
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
        const dependencyStore = useDependencyStore()
        dependencyStore.nodejs.version = '13.45.2'
        dependencyStore.checkVersions = jest.fn()
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
