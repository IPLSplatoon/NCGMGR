import { mockTauriEvent } from '@/__mocks__/tauri'
import { useLogStore } from '@/store/log'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { listenForProcessExit } from '@/service/messaging'
import Mock = jest.Mock

jest.mock('@/service/messaging')

describe('logStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    describe('insertLine', () => {
        it('adds line to state', () => {
            const store = useLogStore()

            store.insertLine({
                line: { message: 'MESSAGE 1' },
                key: 'key1'
            })
            store.insertLine({
                line: { message: 'MESSAGE 2' },
                key: 'key2'
            })

            expect(store.lines).toEqual({
                key1: [{ message: 'MESSAGE 1' }],
                key2: [{ message: 'MESSAGE 2' }]
            })
        })
    })

    describe('reset', () => {
        it('clears lines and sets completed to false', () => {
            const logStore = useLogStore()
            logStore.lines = {
                key1: [{ message: 'MESSAGE 1' }],
                key2: [{ message: 'MESSAGE 2' }]
            }
            logStore.completed = {
                key1: true,
                key2: true
            }

            logStore.reset('key1')

            expect(logStore.lines).toEqual({
                key1: [],
                key2: [{ message: 'MESSAGE 2' }]
            }
            )
            expect(logStore.completed).toEqual({
                key1: false,
                key2: true
            })
        })
    })

    describe('setCompleted', () => {
        it('sets completed state', () => {
            const logStore = useLogStore()
            logStore.completed = {
                key1: true,
                key2: true
            }

            logStore.setCompleted({
                key: 'key2',
                completed: false
            })

            expect(logStore.completed).toEqual({
                key1: true,
                key2: false
            })
        })
    })

    describe('listen', () => {
        it('listens for log events and adds received events to store', () => {
            const logStore = useLogStore()
            mockTauriEvent.listen.mockResolvedValue(jest.fn())

            logStore.listen('key1')

            expect(mockTauriEvent.listen).toHaveBeenCalledTimes(1)
            expect(mockTauriEvent.listen).toHaveBeenCalledWith('log:key1', expect.any(Function))

            const listenCallback = mockTauriEvent.listen.mock.calls[0][1]
            listenCallback({
                payload: { message: 'MESSAGE!' }
            })

            expect(logStore.lines).toEqual({ key1: [{ message: 'MESSAGE!' }] })
        })
    })

    describe('unlisten', () => {
        it('calls unlisten function returned by tauri listeners', async () => {
            const logStore = useLogStore()
            const unlisten = jest.fn()
            mockTauriEvent.listen.mockResolvedValue(unlisten)
            await logStore.listen('cool-key')

            logStore.unlisten('cool-key')

            expect(unlisten).toHaveBeenCalledTimes(1)
        })
    })

    describe('logPromiseResult', () => {
        it('logs error to store', async () => {
            const logStore = useLogStore()

            logStore.logPromiseResult({
                promise: Promise.reject(new Error('Failed!')),
                key: 'key2'
            })
            await flushPromises()

            expect(logStore.lines).toEqual({
                key2: [{
                    message: 'Error: Failed!',
                    type: 'error'
                }]
            })
            expect(logStore.completed).toEqual({ key2: true })
        })
    })

    describe('listenForProcessExit', () => {
        it('listens for process exit and sets completed on exit event', async () => {
            const unlisten = jest.fn()
            const callback = jest.fn();
            (listenForProcessExit as Mock).mockResolvedValue(unlisten)
            const logStore = useLogStore()
            logStore.setCompleted = jest.fn()

            await logStore.listenForProcessExit({ key: 'log-key', callback })

            expect(callback).not.toHaveBeenCalled()
            expect(unlisten).not.toHaveBeenCalled()
            expect(logStore.setCompleted).not.toHaveBeenCalled();

            (listenForProcessExit as Mock).mock.calls[0][1]()

            expect(callback).toHaveBeenCalled()
            expect(unlisten).toHaveBeenCalled()
            expect(logStore.setCompleted).toHaveBeenCalledWith({ key: 'log-key', completed: true })
        })
    })
})
