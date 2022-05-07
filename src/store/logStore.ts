import { ActionState, LogEvent, ProgressEvent } from '@/types/log'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { defineStore } from 'pinia'
import { listenForProcessExit } from '@/service/messagingService'

export interface LogStore {
    lines: Record<string, LogEvent[]>
    progressEntries: Record<string, ProgressEvent>
    actionStates: Record<string, ActionState>
}

const unlistenFns: Record<string, UnlistenFn[]> = {}

export const useLogStore = defineStore('log', {
    state: () => ({
        lines: {},
        progressEntries: {},
        actionStates: {}
    } as LogStore),
    actions: {
        insertLine ({ line, key }: { line: LogEvent, key: string }) {
            if (!this.lines[key]) {
                this.lines[key] = []
            }
            this.lines[key].push(line)
        },
        setProgress (key: string, progress: ProgressEvent) {
            this.progressEntries[key] = progress
        },
        reset (key: string) {
            delete this.progressEntries[key]
            this.lines[key] = []
            this.actionStates[key] = ActionState.INCOMPLETE
        },
        setActionState ({ key, state }: { key: string, state: ActionState }) {
            this.actionStates[key] = state
        },
        listen (key: string, listenForProgress = false) {
            if (unlistenFns[key]) {
                return
            }

            const listenPromises: Array<Promise<UnlistenFn>> = []

            listenPromises.push(listen<LogEvent>(`log:${key}`, event => {
                this.insertLine({ line: event.payload, key })
            }))

            if (listenForProgress) {
                listenPromises.push(listen<ProgressEvent>(`progress:${key}`, event => {
                    this.setProgress(key, event.payload)
                }))
            }

            return Promise.all(listenPromises).then(result => {
                unlistenFns[key] = result
            })
        },
        unlisten (key: string) {
            if (unlistenFns[key]) {
                unlistenFns[key].forEach(fn => fn())
                delete unlistenFns[key]
            }
        },
        logPromiseResult ({ promise, key }: { promise: Promise<unknown>, key: string }) {
            promise.catch(e => {
                this.insertLine({
                    line: {
                        message: String(e),
                        type: 'error'
                    },
                    key
                })
                this.setActionState({ key, state: ActionState.COMPLETED_ERROR })
            })
        },
        async listenForProcessExit ({ key, callback }: { key: string, callback?: () => void }): Promise<void> {
            const unlisten = await listenForProcessExit(key, event => {
                this.setActionState({
                    key,
                    state: event.payload.success ? ActionState.COMPLETED_SUCCESS : ActionState.COMPLETED_ERROR
                })
                unlisten()
                if (callback) {
                    callback()
                }
            })
        }
    }
})
