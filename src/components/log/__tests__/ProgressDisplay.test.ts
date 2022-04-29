import ProgressDisplay from '@/components/log/ProgressDisplay.vue'
import { createTestingPinia, TestingPinia } from '@pinia/testing'
import { config, mount } from '@vue/test-utils'
import { useLogStore } from '@/store/logStore'

describe('ProgressDisplay', () => {
    config.global.stubs = {
        IplProgressBar: true
    }

    let pinia: TestingPinia

    beforeEach(() => {
        pinia = createTestingPinia()
        config.global.plugins = [pinia]
    })

    it('matches snapshot when no progress entry is present for given key', () => {
        const logStore = useLogStore()
        logStore.completed = { 'log-key-2': false }
        logStore.progressEntries = { 'log-key-2': { step: 9, max_step: 10 } }

        const wrapper = mount(ProgressDisplay, {
            props: {
                logKey: 'log-key-1'
            }
        })

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot when given key has progress', () => {
        const logStore = useLogStore()
        logStore.completed = { 'log-key-2': false }
        logStore.progressEntries = {
            'log-key-1': { step: 4, max_step: 9 },
            'log-key-2': { step: 9, max_step: 10 }
        }

        const wrapper = mount(ProgressDisplay, {
            props: {
                logKey: 'log-key-1'
            }
        })

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot when given key is completed', () => {
        const logStore = useLogStore()
        logStore.completed = { 'log-key-1': true }
        logStore.progressEntries = {}

        const wrapper = mount(ProgressDisplay, {
            props: {
                logKey: 'log-key-1'
            }
        })

        expect(wrapper.html()).toMatchSnapshot()
    })
})
