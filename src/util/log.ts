import { logStore } from '@/store/log'

export function logPromiseResult (promise: Promise<unknown>): void {
    promise.then(() => {
        logStore.commit('insertLine', {
            message: 'Success!',
            type: 'success'
        })
    }).catch(e => {
        logStore.commit('insertLine', {
            message: String(e),
            type: 'error'
        })
    }).finally(() => {
        logStore.commit('setCompleted', true)
    })
}
