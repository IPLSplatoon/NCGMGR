import StatusRow from '@/components/StatusRow.vue'
import { shallowMount } from '@vue/test-utils'

describe('StatusRow', () => {
    it('matches snapshot', () => {
        const wrapper = shallowMount(StatusRow, {
            props: {
                color: 'yellow'
            }
        })

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('applies color class to status light', () => {
        const wrapper = shallowMount(StatusRow, {
            props: {
                color: 'red'
            }
        })

        expect(wrapper.get('.status-row__status-light').classes()).toContain('color-red')
    })

    describe('validator: color', () => {
        const validator = StatusRow.props.color.validator

        it('returns true for known colors', () => {
            expect(validator('red')).toEqual(true)
            expect(validator('yellow')).toEqual(true)
            expect(validator('green')).toEqual(true)
            expect(validator('gray')).toEqual(true)
        })

        it('returns false for unknown colors', () => {
            expect(validator('pink')).toEqual(false)
            expect(validator(undefined)).toEqual(false)
            expect(validator(null)).toEqual(false)
            expect(validator('')).toEqual(false)
        })
    })
})
