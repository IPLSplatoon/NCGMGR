import { App } from 'vue'
import { defineStore } from 'pinia'
import { generateId } from '@/util/generateId'

interface ErrorHandlerStore {
    recentErrors: Record<string, unknown>
}

export const useErrorHandlerStore = defineStore('errorHandler', {
    state: () => ({
        recentErrors: {}
    } as ErrorHandlerStore),
    actions: {
        removeRecentError ({ key }: { key: string }): void {
            delete this.recentErrors[key]
        },
        handleError ({ err, info }: { err: unknown, info: string }): void {
            console.error(`Got error from '${info}': \n`, err)

            const id = generateId()
            this.recentErrors[id] = err
        }
    }
})

export function setUpErrorHandler (app: App<unknown>): void {
    const store = useErrorHandlerStore()
    app.config.errorHandler = (err, vm, info) => {
        store.handleError({ err, info })
    }
}
