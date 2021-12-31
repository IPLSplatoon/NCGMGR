import { LogEvent } from '@/types/log'
import { createStore, Store, useStore } from 'vuex'
import { InjectionKey } from 'vue'
import { Event, listen, UnlistenFn } from '@tauri-apps/api/event'

export interface LogStore {
    lines: Record<string, LogEvent[]>
    completed: Record<string, boolean>
}

const unlistenFns: Record<string, UnlistenFn> = {}

export const logStore = createStore<LogStore>({
    state: {
        lines: {},
        completed: {}
    },
    mutations: {
        insertLine (state, { line, key }: { line: LogEvent, key: string }) {
            if (!state.lines[key]) {
                state.lines[key] = []
            }
            state.lines[key].push(line)
        },
        reset (state, key: string) {
            state.lines[key] = []
            state.completed[key] = false
        },
        setCompleted (state, { key, completed }: { key: string, completed: boolean }) {
            state.completed[key] = completed
        }
    },
    actions: {
        listen (store, key: string) {
            if (unlistenFns[key]) {
                return
            }
            return listen(`log:${key}`, (event: Event<LogEvent>) => {
                store.commit('insertLine', { line: event.payload, key })
            }).then(unlisten => {
                unlistenFns[key] = unlisten
            })
        },
        unlisten (store, key: string) {
            if (unlistenFns[key]) {
                unlistenFns[key]()
            }
        },
        logPromiseResult (store, { promise, key, noLogOnSuccess }: { promise: Promise<unknown>, key: string, noLogOnSuccess: boolean }) {
            promise.then(() => {
                if (!noLogOnSuccess) {
                    store.commit('insertLine', {
                        line: {
                            message: 'Success!',
                            type: 'success'
                        },
                        key
                    })
                }
            }).catch(e => {
                store.commit('insertLine', {
                    line: {
                        message: String(e),
                        type: 'error'
                    },
                    key
                })
            }).finally(() => {
                store.commit('setCompleted', { key, completed: true })
            })
        }
    }
})

export const logStoreKey: InjectionKey<Store<LogStore>> = Symbol()

export function useLogStore (): Store<LogStore> {
    return useStore(logStoreKey)
}
