import { config, mount } from '@vue/test-utils'
import { createTestingPinia, TestingPinia } from '@pinia/testing'
import { useErrorHandlerStore } from '@/store/errorHandlerStore'
import ErrorList from '@/components/ErrorList.vue'

describe('ErrorList', () => {
    config.global.stubs = {
        IplButton: true,
        IplDataRow: true,
        FontAwesomeIcon: true
    }

    let pinia: TestingPinia

    beforeEach(() => {
        pinia = createTestingPinia()
        config.global.plugins = [pinia]
    })

    it('matches snapshot', () => {
        const errorHandlerStore = useErrorHandlerStore()
        errorHandlerStore.recentErrors = {
            err1: {
                err: new Error('Error!'),
                info: 'error information',
                component: {
                    // @ts-ignore
                    $: {
                        type: {
                            name: 'ComponentName'
                        }
                    }
                }
            },
            err2: {
                err: new Error('Error 2!'),
                info: 'info',
                component: null
            }
        }
        const wrapper = mount(ErrorList)

        expect(wrapper.html()).toMatchSnapshot()
    })
})
