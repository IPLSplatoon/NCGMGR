import LogDisplay from '@/components/logDisplay.vue'
import { createLogStore } from '@/__mocks__/store'
import { mount } from '@vue/test-utils'
import { logStoreKey } from '@/store/log'

describe('LogDisplay', () => {
    it('matches snapshot', () => {
        const store = createLogStore()
        store.state.lines = {
            log1: [
                { message: '\x1b[31mLINE A' },
                { message: 'LINE ERROR!!!', type: 'error' }
            ],
            log2: []
        }
        const wrapper = mount(LogDisplay, {
            global: {
                plugins: [
                    [store, logStoreKey]
                ]
            },
            props: {
                logKey: 'log1'
            }
        })

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('listens for log events', () => {
        const store = createLogStore()
        jest.spyOn(store, 'dispatch')
        mount(LogDisplay, {
            global: {
                plugins: [[store, logStoreKey]]
            },
            props: { logKey: 'cool-log' }
        })

        expect(store.dispatch).toHaveBeenCalledWith('listen', 'cool-log')
    })

    it('listens for log events when log key is changed', async () => {
        const store = createLogStore()
        jest.spyOn(store, 'dispatch')
        const wrapper = mount(LogDisplay, {
            global: {
                plugins: [[store, logStoreKey]]
            },
            props: { logKey: 'cool-log' }
        })
        expect(store.dispatch).toHaveBeenCalledWith('listen', 'cool-log')

        await wrapper.setProps({ logKey: 'cooler-log' })

        expect(store.dispatch).toHaveBeenCalledWith('unlisten', 'cool-log')
        expect(store.dispatch).toHaveBeenCalledWith('listen', 'cooler-log')
        expect(store.dispatch).toHaveBeenCalledTimes(3)
    })
})
