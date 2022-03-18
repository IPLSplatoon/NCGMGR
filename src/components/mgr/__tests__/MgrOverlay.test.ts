import MgrOverlay from '@/components/mgr/MgrOverlay.vue'
import { mount } from '@vue/test-utils'

describe('MgrOverlay', () => {
    it('matches snapshot when visible', () => {
        const wrapper = mount(MgrOverlay, {
            props: {
                visible: true
            }
        })

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot when visible and max width', () => {
        const wrapper = mount(MgrOverlay, {
            props: {
                visible: true,
                maxWidth: true
            }
        })

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot when hidden', () => {
        const wrapper = mount(MgrOverlay, {
            props: {
                visible: false
            }
        })

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('closes itself on background click if noBackgroundClose is false', () => {
        const wrapper = mount(MgrOverlay, {
            props: {
                visible: true,
                noBackgroundClose: false
            }
        })

        wrapper.get('.mgr-overlay__wrapper').trigger('click')

        const emitted = wrapper.emitted('update:visible')
        expect(emitted?.length).toEqual(1)
        expect(emitted?.[0]).toEqual([false])
    })

    it('does nothing on background click if noBackgroundClose is true', () => {
        const wrapper = mount(MgrOverlay, {
            props: {
                visible: true,
                noBackgroundClose: true
            }
        })

        wrapper.get('.mgr-overlay__wrapper').trigger('click')

        expect(wrapper.emitted('update:visible')).toBeFalsy()
    })
})
