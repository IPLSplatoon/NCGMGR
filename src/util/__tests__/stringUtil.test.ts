import { addDots } from '@/util/stringUtil'

describe('stringUtil', () => {
    describe('addDots', () => {
        it('cuts off long strings', () => {
            expect(addDots('abcdefghijklmn', 10)).toEqual('abcdefg...')
        })

        it('does not cut off short strings', () => {
            expect(addDots('A', 2)).toEqual('A')
        })
    })
})
