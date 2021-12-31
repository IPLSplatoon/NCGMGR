import { mockTauriEvent } from '@/__mocks__/tauri'
import { logStore } from '@/store/log'
import { flushPromises } from '@vue/test-utils'

describe('logStore', () => {
    beforeEach(() => {
        logStore.replaceState({
            lines: {},
            completed: {}
        })
    })

    describe('insertLine', () => {
        it('adds line to state', () => {
            logStore.commit('insertLine', { line: { message: 'MESSAGE 1' }, key: 'key1' })
            logStore.commit('insertLine', { line: { message: 'MESSAGE 2' }, key: 'key2' })

            expect(logStore.state.lines).toEqual({
                key1: [{ message: 'MESSAGE 1' }],
                key2: [{ message: 'MESSAGE 2' }]
            })
        })
    })

    describe('reset', () => {
        it('clears lines and sets completed to false', () => {
            logStore.state.lines = {
                key1: [{ message: 'MESSAGE 1' }],
                key2: [{ message: 'MESSAGE 2' }]
            }
            logStore.state.completed = { key1: true, key2: true }
            logStore.commit('reset', 'key1')

            expect(logStore.state.lines).toEqual({
                key1: [],
                key2: [{ message: 'MESSAGE 2' }]
            }
            )
            expect(logStore.state.completed).toEqual({ key1: false, key2: true })
        })
    })

    describe('setCompleted', () => {
        it('sets completed state', () => {
            logStore.state.completed = { key1: true, key2: true }

            logStore.commit('setCompleted', { key: 'key2', completed: false })

            expect(logStore.state.completed).toEqual({ key1: true, key2: false })
        })
    })

    describe('listen', () => {
        it('listens for log events and adds received events to store', () => {
            mockTauriEvent.listen.mockResolvedValue(jest.fn())

            logStore.dispatch('listen', 'key1')

            expect(mockTauriEvent.listen).toHaveBeenCalledTimes(1)
            expect(mockTauriEvent.listen).toHaveBeenCalledWith('log:key1', expect.any(Function))

            const listenCallback = mockTauriEvent.listen.mock.calls[0][1]
            listenCallback({
                payload: { message: 'MESSAGE!' }
            })

            expect(logStore.state.lines).toEqual({ key1: [{ message: 'MESSAGE!' }] })
        })
    })

    describe('unlisten', () => {
        it('calls unlisten function returned by tauri listeners', async () => {
            const unlisten = jest.fn()
            mockTauriEvent.listen.mockResolvedValue(unlisten)
            await logStore.dispatch('listen', 'cool-key')

            logStore.dispatch('unlisten', 'cool-key')

            expect(unlisten).toHaveBeenCalledTimes(1)
        })
    })

    describe('logPromiseResult', () => {
        it('inserts successful result into store', async () => {
            logStore.dispatch('logPromiseResult', { promise: Promise.resolve(), key: 'key3' })
            await flushPromises()

            expect(logStore.state.lines).toEqual({
                key3: [{
                    message: 'Success!',
                    type: 'success'
                }]
            })
            expect(logStore.state.completed).toEqual({ key3: true })
        })

        it('does not insert successful result into store if noLogOnSuccess is true', async () => {
            logStore.dispatch('logPromiseResult', { promise: Promise.resolve(), key: 'key3', noLogOnSuccess: true })
            await flushPromises()

            expect(logStore.state.lines).toEqual({})
            expect(logStore.state.completed).toEqual({ key3: true })
        })

        it('inserts unsuccessful result into store', async () => {
            logStore.dispatch('logPromiseResult', { promise: Promise.reject(new Error('Failed!')), key: 'key2' })
            await flushPromises()

            expect(logStore.state.lines).toEqual({
                key2: [{
                    message: 'Error: Failed!',
                    type: 'error'
                }]
            })
            expect(logStore.state.completed).toEqual({ key2: true })
        })
    })
})
