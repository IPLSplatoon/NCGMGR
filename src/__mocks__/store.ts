import { createStore, Store } from 'vuex'
import { Configuration } from '@/store/config'
import { LogStore } from '@/store/log'
import { NodecgStatus, StatusStore } from '@/store/status'

export function createConfigStore (): Store<Configuration> {
    return createStore<Configuration>({
        state: {
            installPath: '/install/path'
        },
        actions: {
            load: jest.fn(),
            persist: jest.fn()
        },
        mutations: {
            setInstallPath: jest.fn()
        }
    })
}

export function createLogStore (): Store<LogStore> {
    return createStore<LogStore>({
        state: {
            lines: [],
            completed: false
        },
        mutations: {
            reset: jest.fn(),
            insertLine: jest.fn(),
            setCompleted: jest.fn()
        },
        actions: {
            logPromiseResult: jest.fn()
        }
    })
}

export function createStatusStore (): Store<StatusStore> {
    return createStore<StatusStore>({
        state: {
            nodecg: {
                status: NodecgStatus.UNKNOWN,
                message: ''
            }
        },
        actions: {
            checkNodecgStatus: jest.fn()
        }
    })
}
