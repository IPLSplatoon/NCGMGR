import { createTestingPinia, TestingPinia } from '@pinia/testing'
import { config, mount } from '@vue/test-utils'
import ConfigWindow from '@/components/ConfigWindow.vue'

describe('ConfigWindow', () => {
    let pinia: TestingPinia

    beforeEach(() => {
        pinia = createTestingPinia()
        config.global.plugins = [pinia]
    })

    config.global.stubs = {
        IplSmallToggle: true,
        DependencyChecker: true
    }

    it('matches snapshot', () => {
        const wrapper = mount(ConfigWindow)

        expect(wrapper.html()).toMatchSnapshot()
    })
})
