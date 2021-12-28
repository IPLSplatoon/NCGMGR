import BundleManager from '@/components/bundleManager.vue'
import { createNodecgStore } from '@/__mocks__/store'
import { config, mount } from '@vue/test-utils'
import { nodecgStoreKey } from '@/store/nodecg'

describe('BundleManager', () => {
    config.global.stubs = {
        IplButton: true
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

    it('handles refreshing', () => {
        const nodecgStore = createNodecgStore()
        jest.spyOn(nodecgStore, 'dispatch')
        const wrapper = mount(BundleManager, {
            global: {
                plugins: [[nodecgStore, nodecgStoreKey]]
            }
        })

        wrapper.getComponent('[data-test="refresh-button"]').vm.$emit('click')

        expect(nodecgStore.dispatch).toHaveBeenCalledTimes(1)
        expect(nodecgStore.dispatch).toHaveBeenCalledWith('getBundleList')
    })
})
