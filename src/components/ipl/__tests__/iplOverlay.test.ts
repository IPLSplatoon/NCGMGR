import IplOverlay from '@/components/ipl/iplOverlay.vue'
import { mount } from '@vue/test-utils'

describe('IplOverlay', () => {
    it('matches snapshot when visible', () => {
        const wrapper = mount(IplOverlay, {
            props: {
                visible: true
            }
        })

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot when hidden', () => {
        const wrapper = mount(IplOverlay, {
            props: {
                visible: false
            }
        })

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('closes itself on background click', () => {
        const wrapper = mount(IplOverlay, {
            props: {
                visible: true
            }
        })

        wrapper.get('.ipl-overlay__wrapper').trigger('click')

        const emitted = wrapper.emitted('update:visible')
        expect(emitted?.length).toEqual(1)
        expect(emitted?.[0]).toEqual([false])
    })
})
