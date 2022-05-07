import DependencyChecker from '@/components/DependencyChecker.vue'
import { config, mount } from '@vue/test-utils'
import { createTestingPinia, TestingPinia } from '@pinia/testing'
import { useDependencyStore } from '@/store/dependencyStore'

describe('DependencyChecker', () => {
    config.global.stubs = {
        IplButton: true,
        FontAwesomeIcon: true,
        StatusRow: true
    }

    let pinia: TestingPinia

    beforeEach(() => {
        pinia = createTestingPinia()
        config.global.plugins = [pinia]
    })

    it('matches snapshot when dependencies are loading', () => {
        useDependencyStore().isLoading = true

        expect(mount(DependencyChecker).html()).toMatchSnapshot()
    })

    it('matches snapshot when node.js is missing', () => {
        const dependencyStore = useDependencyStore()
        dependencyStore.isLoading = false
        dependencyStore.nodejs.version = null

        expect(mount(DependencyChecker).html()).toMatchSnapshot()
    })

    it('matches snapshot when dependencies are present', () => {
        const dependencyStore = useDependencyStore()
        dependencyStore.isLoading = false
        dependencyStore.nodejs.version = '12.3.4'

        expect(mount(DependencyChecker).html()).toMatchSnapshot()
    })
})
