import LogOverlay from '@/components/logOverlay.vue'
import { useLogStore } from '@/store/log'
import { config, mount } from '@vue/test-utils'
import { IplButton } from '@iplsplatoon/vue-components'
import { createTestingPinia, TestingPinia } from '@pinia/testing'

describe('LogOverlay', () => {
    let pinia: TestingPinia

    beforeEach(() => {
        pinia = createTestingPinia()
        config.global.plugins = [pinia]
        const logStore = useLogStore()
        logStore.listen = jest.fn()
        logStore.unlisten = jest.fn()
    })

    config.global.stubs = {
        IplButton: true
    }

    it('matches snapshot', () => {
        const wrapper = mount(LogOverlay, {
            props: {
                visible: true,
                title: 'Log Overlay',
                logKey: 'log1'
            }
        })

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('disables close button if log state is not completed', () => {
        const store = useLogStore()
        store.completed.logKey = false
        const wrapper = mount(LogOverlay, {
            props: {
                visible: true,
                title: 'Log Overlay',
                logKey: 'logKey'
            }
        })

        expect(wrapper.getComponent('[data-test="close-button"]').attributes().disabled).toEqual('true')
    })

    it('enables close button if log state is completed', () => {
        const store = useLogStore()
        store.completed['log-key'] = true
        const wrapper = mount(LogOverlay, {
            props: {
                visible: true,
                title: 'Log Overlay',
                logKey: 'log-key'
            }
        })

        expect(wrapper.getComponent('[data-test="close-button"]').attributes().disabled).toEqual('false')
    })

    it('closes overlay on close button click', () => {
        const store = useLogStore()
        store.completed['key-1'] = true
        const wrapper = mount(LogOverlay, {
            props: {
                visible: true,
                title: 'Log Overlay',
                logKey: 'key-1'
            }
        })

        wrapper.getComponent<typeof IplButton>('[data-test="close-button"]').vm.$emit('click')

        const emitted = wrapper.emitted('update:visible')
        expect(emitted?.length).toEqual(1)
        expect(emitted?.[0]).toEqual([false])
    })
})
