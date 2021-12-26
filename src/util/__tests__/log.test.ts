import { createLogStore } from '@/__mocks__/store'
import { flushPromises } from '@vue/test-utils'

describe('log', () => {
    const mockLogStore = createLogStore()

    jest.mock('../../store/log', () => ({
        __esModule: true,
        logStore: mockLogStore
    }))

    const { logPromiseResult } = require('@/util/log')

    describe('logPromiseResult', () => {
        it('inserts successful result into store', async () => {
            jest.spyOn(mockLogStore, 'commit')

            logPromiseResult(Promise.resolve())
            await flushPromises()

            expect(mockLogStore.commit).toHaveBeenCalledTimes(2)
            expect(mockLogStore.commit).toHaveBeenCalledWith('insertLine', {
                message: 'Success!',
                type: 'success'
            })
            expect(mockLogStore.commit).toHaveBeenCalledWith('setCompleted', true)
        })

        it('inserts unsuccessful result into store', async () => {
            jest.spyOn(mockLogStore, 'commit')

            logPromiseResult(Promise.reject(new Error('Failed!')))
            await flushPromises()

            expect(mockLogStore.commit).toHaveBeenCalledTimes(2)
            expect(mockLogStore.commit).toHaveBeenCalledWith('insertLine', {
                message: 'Error: Failed!',
                type: 'error'
            })
            expect(mockLogStore.commit).toHaveBeenCalledWith('setCompleted', true)
        })
    })
})
