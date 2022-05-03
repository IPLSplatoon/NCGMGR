import { createTestingPinia, TestingPinia } from '@pinia/testing'
import { config, mount } from '@vue/test-utils'
import StatusBar from '@/components/statusBar/StatusBar.vue'
import { useDependencyStore } from '@/store/dependencyStore'
import MgrOverlay from '@/components/mgr/MgrOverlay.vue'
import { IplDialogTitle } from '@iplsplatoon/vue-components'
import { useConfigStore } from '@/store/configStore'
import { useErrorHandlerStore } from '@/store/errorHandlerStore'

describe('StatusBar', () => {
    let pinia: TestingPinia

    beforeEach(() => {
        pinia = createTestingPinia()
        config.global.plugins = [pinia]
    })

    config.global.stubs = {
        IplDialogTitle: true,
        FontAwesomeIcon: true,
        DependencyChecker: true
    }

    it('matches snapshot when error log is enabled', () => {
        const configStore = useConfigStore()
        configStore.enableErrorLog = true

        const wrapper = mount(StatusBar)

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot when error log is disabled', () => {
        const configStore = useConfigStore()
        configStore.enableErrorLog = false

        const wrapper = mount(StatusBar)

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('highlights dependency check icon when dependencies are missing', () => {
        const dependencyStore = useDependencyStore()
        dependencyStore.isLoading = false
        dependencyStore.nodejs.version = null
        const wrapper = mount(StatusBar)

        expect(wrapper.get('#status-bar-item_dependencyCheck').classes()).toContain('highlighted')
    })

    it.each([
        [true, null],
        [true, '1.2.3'],
        [false, '1.2.4']
    ])('does not highlight dependency check when dependency loading state is %s and nodejs version is %s', (isLoading, nodeVersion) => {
        const dependencyStore = useDependencyStore()
        dependencyStore.isLoading = isLoading
        dependencyStore.nodejs.version = nodeVersion
        const wrapper = mount(StatusBar)

        expect(wrapper.get('#status-bar-item_dependencyCheck').classes()).not.toContain('highlighted')
    })

    it('highlights error log when errors are present', () => {
        const errorHandlerStore = useErrorHandlerStore()
        errorHandlerStore.recentErrors = {
            err1: { err: new Error(), info: 'info', component: null }
        }
        const configStore = useConfigStore()
        configStore.enableErrorLog = true

        const wrapper = mount(StatusBar)

        expect(wrapper.get('#status-bar-item_errorLog').classes()).toContain('highlighted')
    })

    it('does not highlight error log when no errors are logged', () => {
        const errorHandlerStore = useErrorHandlerStore()
        errorHandlerStore.recentErrors = {}
        const configStore = useConfigStore()
        configStore.enableErrorLog = true

        const wrapper = mount(StatusBar)

        expect(wrapper.get('#status-bar-item_errorLog').classes()).not.toContain('highlighted')
    })

    it('opens dialog when clicking on status bar item', async () => {
        const wrapper = mount(StatusBar)

        await wrapper.get('#status-bar-item_dependencyCheck').trigger('click')

        expect(wrapper.getComponent<typeof MgrOverlay>('#status-item-dialog_dependencyCheck').vm.visible).toEqual(true)
    })

    it('handles closing opened dialogs', async () => {
        const wrapper = mount(StatusBar)

        await wrapper.get('#status-bar-item_dependencyCheck').trigger('click')
        wrapper
            .getComponent<typeof MgrOverlay>('#status-item-dialog_dependencyCheck')
            .getComponent<typeof IplDialogTitle>('ipl-dialog-title-stub').vm.$emit('close')
        await wrapper.vm.$nextTick()

        expect(wrapper.findComponent<typeof MgrOverlay>('#status-item-dialog_dependencyCheck').exists()).toEqual(false)
    })
})
