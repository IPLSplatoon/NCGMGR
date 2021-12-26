import LogOverlay from '@/components/logOverlay.vue'
import { logStoreKey } from '@/store/log'
import { mount } from '@vue/test-utils'
import { createLogStore } from '@/__mocks__/store'

describe('LogOverlay', () => {
    it('matches snapshot', () => {
        const store = createLogStore()
        store.state.lines = [{ message: 'LINE A' }, { message: 'LINE ERROR!!!', type: 'error' }]
        const wrapper = mount(LogOverlay, {
            global: {
                plugins: [
                    [store, logStoreKey]
                ]
            },
            props: {
                visible: true,
                title: 'Log Overlay'
            }
        })

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('disables close button if log state is not completed', () => {
        const store = createLogStore()
        store.state.completed = false
        const wrapper = mount(LogOverlay, {
            global: {
                plugins: [
                    [store, logStoreKey]
                ]
            },
            props: {
                visible: true,
                title: 'Log Overlay'
            }
        })

        expect((wrapper.get('[data-test="close-button"]').element as HTMLButtonElement).disabled).toEqual(true)
    })

    it('enables close button if log state is completed', () => {
        const store = createLogStore()
        store.state.completed = true
        const wrapper = mount(LogOverlay, {
            global: {
                plugins: [
                    [store, logStoreKey]
                ]
            },
            props: {
                visible: true,
                title: 'Log Overlay'
            }
        })

        expect((wrapper.get('[data-test="close-button"]').element as HTMLButtonElement).disabled).toEqual(false)
    })

    it('closes overlay on close button click', () => {
        const store = createLogStore()
        store.state.completed = true
        const wrapper = mount(LogOverlay, {
            global: {
                plugins: [
                    [store, logStoreKey]
                ]
            },
            props: {
                visible: true,
                title: 'Log Overlay'
            }
        })

        wrapper.get('[data-test="close-button"]').trigger('click')

        const emitted = wrapper.emitted('update:visible')
        expect(emitted?.length).toEqual(1)
        expect(emitted?.[0]).toEqual([false])
    })
})
