import { LogEvent } from '@/types/log'
import { Event, listen, UnlistenFn } from '@tauri-apps/api/event'
import { defineStore } from 'pinia'

export interface LogStore {
    lines: Record<string, LogEvent[]>
    completed: Record<string, boolean>
}

const unlistenFns: Record<string, UnlistenFn> = {}

export const useLogStore = defineStore('log', {
    state: () => ({
        lines: {},
        completed: {}
    } as LogStore),
    actions: {
        insertLine ({ line, key }: { line: LogEvent, key: string }) {
            if (!this.lines[key]) {
                this.lines[key] = []
            }
            this.lines[key].push(line)
        },
        reset (key: string) {
            this.lines[key] = []
            this.completed[key] = false
        },
        setCompleted ({ key, completed }: { key: string, completed: boolean }) {
            this.completed[key] = completed
        },
        listen (key: string) {
            if (unlistenFns[key]) {
                return
            }
            return listen(`log:${key}`, (event: Event<LogEvent>) => {
                this.insertLine({ line: event.payload, key })
            }).then(unlisten => {
                unlistenFns[key] = unlisten
            })
        },
        unlisten (key: string) {
            if (unlistenFns[key]) {
                unlistenFns[key]()
                delete unlistenFns[key]
            }
        },
        logPromiseResult ({ promise, key, noLogOnSuccess = false }: { promise: Promise<unknown>, key: string, noLogOnSuccess?: boolean }) {
            promise.then(() => {
                if (!noLogOnSuccess) {
                    this.insertLine({
                        line: {
                            message: 'Success!',
                            type: 'success'
                        },
                        key
                    })
                }
            }).catch(e => {
                this.insertLine({
                    line: {
                        message: String(e),
                        type: 'error'
                    },
                    key
                })
            }).finally(() => {
                this.setCompleted({ key, completed: true })
            })
        }
    }
})
