import { ActionState, LogEvent, ProgressEvent } from '@/types/log'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { defineStore } from 'pinia'

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
        setProgress (key: string, event: ProgressEvent) {
            const existingEntry = this.progressEntries[key]
            if (existingEntry == null) {
                this.progressEntries[key] = event
                this.logProgressEvent(key, event)
            } else {
                existingEntry.message = event.message
                if (event.maxStep != null) {
                    existingEntry.maxStep = event.maxStep
                }
                if (event.step != null) {
                    existingEntry.step = event.step

                    if (event.step === event.maxStep) {
                        this.setActionState({ key, state: ActionState.COMPLETED_SUCCESS })
                    }
                }

                this.logProgressEvent(key, {
                    message: event.message,
                    step: event.step,
                    maxStep: existingEntry.maxStep
                })
            }
        },
        logProgressEvent(key: string, event: ProgressEvent) {
            if (event.step != null) {
                this.insertLine({
                    line: {
                        message: `[${event.step}/${event.maxStep}] ${event.message}`,
                        type: 'info'
                    },
                    key
                })
            } else {
                this.insertLine({
                    line: {
                        message: event.message,
                        type: 'info'
                    },
                    key
                })
            }
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
        }
    }
})
