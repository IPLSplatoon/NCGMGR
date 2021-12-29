import LogOverlay from '@/components/logOverlay.vue'
import { logStoreKey } from '@/store/log'
import { config, mount } from '@vue/test-utils'
import { createLogStore } from '@/__mocks__/store'

describe('LogOverlay', () => {
    config.global.stubs = {
        IplButton: true
    }

    it('matches snapshot', () => {
        const store = createLogStore()
        store.state.lines = {
            log1: [
                { message: 'LINE A' },
                { message: 'LINE ERROR!!!', type: 'error' }
            ],
            log2: []
        }
        const wrapper = mount(LogOverlay, {
            global: {
                plugins: [
                    [store, logStoreKey]
                ]
            },
            props: {
                visible: true,
                title: 'Log Overlay',
                logKey: 'log1'
            }
        })

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('disables close button if log state is not completed', () => {
        const store = createLogStore()
        store.state.completed.logKey = false
        const wrapper = mount(LogOverlay, {
            global: {
                plugins: [
                    [store, logStoreKey]
                ]
            },
            props: {
                visible: true,
                title: 'Log Overlay',
                logKey: 'logKey'
            }
        })

        expect(wrapper.getComponent('[data-test="close-button"]').attributes().disabled).toEqual('true')
    })

    it('enables close button if log state is completed', () => {
        const store = createLogStore()
        store.state.completed['log-key'] = true
        const wrapper = mount(LogOverlay, {
            global: {
                plugins: [
                    [store, logStoreKey]
                ]
            },
            props: {
                visible: true,
                title: 'Log Overlay',
                logKey: 'log-key'
            }
        })

        expect(wrapper.getComponent('[data-test="close-button"]').attributes().disabled).toEqual('false')
    })

    it('closes overlay on close button click', () => {
        const store = createLogStore()
        store.state.completed['key-1'] = true
        const wrapper = mount(LogOverlay, {
            global: {
                plugins: [
                    [store, logStoreKey]
                ]
            },
            props: {
                visible: true,
                title: 'Log Overlay',
                logKey: 'key-1'
            }
        })

        wrapper.getComponent('[data-test="close-button"]').vm.$emit('click')

        const emitted = wrapper.emitted('update:visible')
        expect(emitted?.length).toEqual(1)
        expect(emitted?.[0]).toEqual([false])
    })
})
