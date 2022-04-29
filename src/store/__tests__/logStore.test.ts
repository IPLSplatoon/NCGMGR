import { mockTauriEvent } from '@/__mocks__/tauri'
import { useLogStore } from '@/store/logStore'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { listenForProcessExit } from '@/service/messagingService'
import { ActionState } from '@/types/log'
import Mock = jest.Mock

jest.mock('@/service/messagingService')

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

    describe('setProgress', () => {
        it('sets progress in state', () => {
            const store = useLogStore()
            store.progressEntries = { key2: { max_step: 4, step: 2 } }

            store.setProgress('key1', { max_step: 5, step: 3 })

            expect(store.progressEntries).toEqual({ key2: { max_step: 4, step: 2 }, key1: { max_step: 5, step: 3 } })
        })
    })

    describe('reset', () => {
        it('clears messages and progress', () => {
            const logStore = useLogStore()
            logStore.lines = {
                key1: [{ message: 'MESSAGE 1' }],
                key2: [{ message: 'MESSAGE 2' }]
            }
            logStore.actionStates = {
                key1: ActionState.COMPLETED_SUCCESS,
                key2: ActionState.COMPLETED_SUCCESS
            }
            logStore.progressEntries = {
                key1: { max_step: 5, step: 4 },
                key2: { max_step: 5, step: 3 }
            }

            logStore.reset('key1')

            expect(logStore.lines).toEqual({
                key1: [],
                key2: [{ message: 'MESSAGE 2' }]
            })
            expect(logStore.actionStates).toEqual({
                key1: ActionState.INCOMPLETE,
                key2: ActionState.COMPLETED_SUCCESS
            })
            expect(logStore.progressEntries).toEqual({
                key2: { max_step: 5, step: 3 }
            })
        })
    })

    describe('setActionState', () => {
        it('sets completed state', () => {
            const logStore = useLogStore()
            logStore.actionStates = {
                key1: ActionState.COMPLETED_SUCCESS,
                key2: ActionState.INCOMPLETE
            }

            logStore.setActionState({
                key: 'key2',
                state: ActionState.COMPLETED_ERROR
            })

            expect(logStore.actionStates).toEqual({
                key1: ActionState.COMPLETED_SUCCESS,
                key2: ActionState.COMPLETED_ERROR
            })
        })
    })

    describe('listen', () => {
        it('listens for log events and adds received events to store', async () => {
            const logStore = useLogStore()
            mockTauriEvent.listen.mockResolvedValue(jest.fn())

            await logStore.listen('key1')

            expect(mockTauriEvent.listen).toHaveBeenCalledTimes(1)
            expect(mockTauriEvent.listen).toHaveBeenCalledWith('log:key1', expect.any(Function))

            const listenCallback = mockTauriEvent.listen.mock.calls[0][1]
            listenCallback({
                payload: { message: 'MESSAGE!' }
            })

            expect(logStore.lines).toEqual({ key1: [{ message: 'MESSAGE!' }] })
        })

        it('listens for progress events when required', async () => {
            const logStore = useLogStore()
            mockTauriEvent.listen.mockResolvedValue(jest.fn())

            await logStore.listen('key2', true)

            expect(mockTauriEvent.listen).toHaveBeenCalledTimes(2)
            expect(mockTauriEvent.listen).toHaveBeenCalledWith('log:key2', expect.any(Function))
            expect(mockTauriEvent.listen).toHaveBeenCalledWith('progress:key2', expect.any(Function))

            const messageCallback = mockTauriEvent.listen.mock.calls[0][1]
            messageCallback({
                payload: { message: 'MESSAGE!' }
            })

            expect(logStore.lines).toEqual({ key2: [{ message: 'MESSAGE!' }] })

            const progressCallback = mockTauriEvent.listen.mock.calls[1][1]
            progressCallback({
                payload: { max_step: 5, step: 3 }
            })

            expect(logStore.progressEntries).toEqual({ key2: { max_step: 5, step: 3 } })
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

        it('unlistens as expected when listening for progress events', async () => {
            const logStore = useLogStore()
            const unlisten = jest.fn()
            mockTauriEvent.listen.mockResolvedValue(unlisten)
            await logStore.listen('cool-key', true)

            logStore.unlisten('cool-key')

            expect(unlisten).toHaveBeenCalledTimes(2)
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
            expect(logStore.actionStates).toEqual({ key2: ActionState.COMPLETED_ERROR })
        })
    })

    describe('listenForProcessExit', () => {
        it.each([
            [ActionState.COMPLETED_SUCCESS, true],
            [ActionState.COMPLETED_ERROR, false]
        ])('sets action state to %p if process exit success value is %p', async (state, success) => {
            const unlisten = jest.fn()
            const callback = jest.fn();
            (listenForProcessExit as Mock).mockResolvedValue(unlisten)
            const logStore = useLogStore()
            logStore.setActionState = jest.fn()

            await logStore.listenForProcessExit({ key: 'log-key', callback })

            expect(callback).not.toHaveBeenCalled()
            expect(unlisten).not.toHaveBeenCalled()
            expect(logStore.setActionState).not.toHaveBeenCalled();

            (listenForProcessExit as Mock).mock.calls[0][1]({ payload: { success } })

            expect(callback).toHaveBeenCalled()
            expect(unlisten).toHaveBeenCalled()
            expect(logStore.setActionState).toHaveBeenCalledWith({ key: 'log-key', state })
        })
    })
})
