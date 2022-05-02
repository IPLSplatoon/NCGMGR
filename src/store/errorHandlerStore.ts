import { App, ComponentPublicInstance } from 'vue'
import { defineStore } from 'pinia'
import { generateId } from '@/util/generateId'

interface ErrorEntry {
    err: unknown
    info: string
    component: ComponentPublicInstance | null
}

interface ErrorHandlerStore {
    recentErrors: Record<string, ErrorEntry>
}

export const useErrorHandlerStore = defineStore('errorHandler', {
    state: () => ({
        recentErrors: {}
    } as ErrorHandlerStore),
    actions: {
        removeRecentError ({ key }: { key: string }): void {
            delete this.recentErrors[key]
        },
        handleError (data: { err: unknown, info: string, component: ComponentPublicInstance | null }): void {
            console.error(`Got error from '${data.info}': \n`, data.err)
            console.log(data.component)

            const id = generateId()
            this.recentErrors[id] = data
        },
        clear (): void {
            this.recentErrors = {}
        }
    }
})

export function setUpErrorHandler (app: App<unknown>): void {
    const store = useErrorHandlerStore()
    app.config.errorHandler = (err, component, info) => {
        store.handleError({ err, info, component })
    }
}
