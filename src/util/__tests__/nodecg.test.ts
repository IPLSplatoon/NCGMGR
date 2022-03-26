import npa from 'npm-package-arg'
import Mock = jest.Mock
import { normalizeBundlePath } from '@/util/nodecg'

jest.mock('npm-package-arg')

describe('util/nodecg', () => {
    describe('normalizeBundlePath', () => {
        it('returns invalid result if bundle is missing hosted property', () => {
            (npa as unknown as Mock).mockReturnValue({})

            expect(normalizeBundlePath('/path')).toEqual({ isValid: false })
        })

        it('returns invalid result if git url of bundle cannot be found', () => {
            (npa as unknown as Mock).mockReturnValue({ hosted: { https: () => undefined } })

            expect(normalizeBundlePath('/path')).toEqual({ isValid: false })
        })

        it('returns invalid result if npa throws an error', () => {
            (npa as unknown as Mock).mockImplementation(() => {
                throw new Error()
            })

            expect(normalizeBundlePath('/path')).toEqual({ isValid: false })
        })

        it('returns valid result if valid git url is found', () => {
            (npa as unknown as Mock).mockReturnValue({ hosted: { https: () => 'ssh://bundle-name.git' } })

            expect(normalizeBundlePath('/path')).toEqual({ isValid: true, bundleName: 'bundle-name', bundleUrl: 'ssh://bundle-name.git' })
        })
    })
})
