import { LogEvent } from '@/types/log'
import { createStore, Store, useStore } from 'vuex'
import { InjectionKey } from 'vue'
import { Event, listen } from '@tauri-apps/api/event'

export interface LogStore {
    lines: LogEvent[]
    completed: boolean
}

export const logStore = createStore<LogStore>({
    state: {
        lines: [],
        completed: false
    },
    mutations: {
        insertLine (state, line: LogEvent) {
            state.lines.push(line)
        },
        reset (state) {
            state.lines = []
            state.completed = false
        },
        setCompleted (state, completed: boolean) {
            state.completed = completed
        }
    },
    actions: {
        listen (store) {
            listen('log', (event: Event<LogEvent>) => {
                store.state.lines.push(event.payload)
            })
        }
    }
})

export const logStoreKey: InjectionKey<Store<LogStore>> = Symbol()

export function useLogStore (): Store<LogStore> {
    return useStore(logStoreKey)
}
