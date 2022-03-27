import LogDisplay from '@/components/log/LogDisplay.vue'
import { config, mount } from '@vue/test-utils'
import { useLogStore } from '@/store/logStore'
import { createTestingPinia, TestingPinia } from '@pinia/testing'

describe('LogDisplay', () => {
    let pinia: TestingPinia

    beforeEach(() => {
        pinia = createTestingPinia()
        config.global.plugins = [pinia]
    })

    it('matches snapshot', () => {
        const store = useLogStore()
        store.listen = jest.fn()
        store.unlisten = jest.fn()
        store.lines = {
            log1: [
                { message: '\x1b[31mLINE A' },
                { message: 'LINE ERROR!!!', type: 'error' }
            ],
            log2: []
        }
        const wrapper = mount(LogDisplay, {
            props: {
                logKey: 'log1'
            }
        })

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('listens for log events', () => {
        const store = useLogStore()
        store.listen = jest.fn()
        mount(LogDisplay, {
            props: { logKey: 'cool-log' }
        })

        expect(store.listen).toHaveBeenCalledWith('cool-log')
    })

    it('listens for log events when log key is changed', async () => {
        const store = useLogStore()
        store.listen = jest.fn()
        store.unlisten = jest.fn()
        const wrapper = mount(LogDisplay, {
            props: { logKey: 'cool-log' }
        })
        expect(store.listen).toHaveBeenCalledWith('cool-log')

        await wrapper.setProps({ logKey: 'cooler-log' })

        expect(store.unlisten).toHaveBeenCalledWith('cool-log')
        expect(store.listen).toHaveBeenCalledWith('cooler-log')
    })
})
