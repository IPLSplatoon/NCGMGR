import { mockTauriEvent } from '@/__mocks__/tauri'
import { logStore } from '@/store/log'
import { flushPromises } from '@vue/test-utils'

describe('logStore', () => {
    beforeEach(() => {
        logStore.replaceState({
            lines: [],
            completed: false
        })
    })

    describe('insertLine', () => {
        it('adds line to state', () => {
            logStore.commit('insertLine', { message: 'MESSAGE 1' })
            logStore.commit('insertLine', { message: 'MESSAGE 2' })

            expect(logStore.state.lines).toEqual([
                { message: 'MESSAGE 1' },
                { message: 'MESSAGE 2' }
            ])
        })
    })

    describe('reset', () => {
        it('clears lines and sets completed to false', () => {
            logStore.state.lines = [{ message: 'MESSAGE' }]
            logStore.state.completed = true

            logStore.commit('reset')

            expect(logStore.state.lines).toEqual([])
            expect(logStore.state.completed).toEqual(false)
        })
    })

    describe('setCompleted', () => {
        it('sets completed state', () => {
            logStore.state.completed = true

            logStore.commit('setCompleted', false)

            expect(logStore.state.completed).toEqual(false)
        })
    })

    describe('listen', () => {
        it('listens for log events and adds received events to store', () => {
            logStore.dispatch('listen')

            expect(mockTauriEvent.listen).toHaveBeenCalledTimes(1)
            expect(mockTauriEvent.listen).toHaveBeenCalledWith('log', expect.any(Function))

            const listenCallback = mockTauriEvent.listen.mock.calls[0][1]
            listenCallback({
                payload: { message: 'MESSAGE!' }
            })

            expect(logStore.state.lines).toEqual([{ message: 'MESSAGE!' }])
        })
    })

    describe('logPromiseResult', () => {
        it('inserts successful result into store', async () => {
            logStore.dispatch('logPromiseResult', Promise.resolve())
            await flushPromises()

            expect(logStore.state.lines).toEqual([{
                message: 'Success!',
                type: 'success'
            }])
            expect(logStore.state.completed).toEqual(true)
        })

        it('inserts unsuccessful result into store', async () => {
            logStore.dispatch('logPromiseResult', Promise.reject(new Error('Failed!')))
            await flushPromises()

            expect(logStore.state.lines).toEqual([{
                message: 'Error: Failed!',
                type: 'error'
            }])
            expect(logStore.state.completed).toEqual(true)
        })
    })
})
