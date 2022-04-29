import ProgressDisplay from '@/components/log/ProgressDisplay.vue'
import { createTestingPinia, TestingPinia } from '@pinia/testing'
import { config, mount } from '@vue/test-utils'
import { useLogStore } from '@/store/logStore'
import { ActionState } from '../../../types/log'

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
        logStore.actionStates = { 'log-key-2': ActionState.COMPLETED_SUCCESS }
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
        logStore.actionStates = { 'log-key-2': ActionState.COMPLETED_ERROR }
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

    it('matches snapshot when given key is completed successfully', () => {
        const logStore = useLogStore()
        logStore.actionStates = { 'log-key-1': ActionState.COMPLETED_SUCCESS }
        logStore.progressEntries = {}

        const wrapper = mount(ProgressDisplay, {
            props: {
                logKey: 'log-key-1'
            }
        })

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot when given key is completed with error', () => {
        const logStore = useLogStore()
        logStore.actionStates = { 'log-key-1': ActionState.COMPLETED_ERROR }
        logStore.progressEntries = {}

        const wrapper = mount(ProgressDisplay, {
            props: {
                logKey: 'log-key-1'
            }
        })

        expect(wrapper.html()).toMatchSnapshot()
    })
})
