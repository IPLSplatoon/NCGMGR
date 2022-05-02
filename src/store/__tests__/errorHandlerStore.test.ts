import { useErrorHandlerStore } from '../errorHandlerStore'
import * as generateId from '../../util/generateId'
import { createPinia, setActivePinia } from 'pinia'

describe('errorHandlerStore', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.restoreAllMocks()

        setActivePinia(createPinia())

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    describe('removeRecentError', () => {
        it('removes error from list', () => {
            const store = useErrorHandlerStore()
            store.recentErrors = {
                err1: { err: {}, info: 'info', component: null },
                err2: { err: {}, info: 'info', component: null }
            }

            store.removeRecentError({ key: 'err2' })

            expect(store.recentErrors).toEqual({ err1: { err: {}, info: 'info', component: null } })
        })
    })

    describe('handleError', () => {
        it('logs given error', () => {
            const store = useErrorHandlerStore()
            const error = new Error('yeehaw')

            // @ts-ignore
            store.handleError({ err: error, info: 'component event handler', component: {} })

            expect(console.error).toHaveBeenCalledWith('Got error from \'component event handler\': \n', error)
        })

        it('stores error in state', () => {
            const store = useErrorHandlerStore()
            jest.spyOn(generateId, 'generateId').mockReturnValue('1010101')
            const error = new Error('yeehaw')

            store.handleError({ err: error, info: 'component event handler', component: null })

            expect(store.recentErrors).toEqual({
                1010101: { err: error, info: 'component event handler', component: null }
            })
        })
    })
})
