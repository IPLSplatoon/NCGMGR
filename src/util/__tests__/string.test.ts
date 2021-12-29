import { pluralize } from '@/util/string'

describe('util/string', () => {
    describe('pluralize', () => {
        it('gives singular form if required', () => {
            expect(pluralize('knife', 1, 'knives')).toEqual('1 knife')
            expect(pluralize('user', 1)).toEqual('1 user')
        })

        it('formats given amount', () => {
            expect(pluralize('knife', 1000, 'knives')).toEqual('1,000 knives')
            expect(pluralize('user', 999999)).toEqual('999,999 users')
        })

        it('gives plural form if required', () => {
            expect(pluralize('knife', 2, 'knives')).toEqual('2 knives')
            expect(pluralize('user', 0)).toEqual('0 users')
        })
    })
})
