import { createPinia, setActivePinia } from 'pinia'
import { useDependencyStore } from '@/store/dependencyStore'
import { getNodejsVersion } from '@/service/dependencyService'
import Mock = jest.Mock

jest.mock('@/service/dependencyService')

describe('dependencyStore', () => {
    const store = useDependencyStore()

    beforeEach(() => {
        setActivePinia(createPinia())
    })

    describe('hasNodejs', () => {
        it('is true if node.js version is set', () => {
            store.nodejs.version = '12.13.4'

            expect(store.hasNodejs).toEqual(true)
        })

        it('is false if node.js version is null', () => {
            store.$state.nodejs.version = null

            expect(store.hasNodejs).toEqual(false)
        })
    })

    describe('checkVersions', () => {
        it('gets node.js version', async () => {
            (getNodejsVersion as Mock).mockResolvedValue('156.53.3')

            await store.checkVersions()

            expect(getNodejsVersion).toHaveBeenCalled()
            expect(store.nodejs.version).toEqual('156.53.3')
            expect(store.isLoading).toEqual(false)
        })
    })
})
