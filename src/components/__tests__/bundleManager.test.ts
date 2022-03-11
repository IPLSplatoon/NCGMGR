import BundleManager from '@/components/bundleManager.vue'
import { config, mount } from '@vue/test-utils'
import { IplButton } from '@iplsplatoon/vue-components'
import { createTestingPinia, TestingPinia } from '@pinia/testing'
import { useNodecgStore } from '@/store/nodecg'

describe('BundleManager', () => {
    config.global.stubs = {
        IplButton: true,
        BundleInstaller: true,
        BundleSettings: true
    }

    let pinia: TestingPinia

    beforeEach(() => {
        pinia = createTestingPinia()
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
