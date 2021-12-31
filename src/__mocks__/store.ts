import { createStore, Store } from 'vuex'
import { Configuration } from '@/store/config'
import { LogStore } from '@/store/log'
import { InstallStatus, NodecgStore, RunStatus } from '@/store/nodecg'

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
            lines: {},
            completed: {}
        },
        mutations: {
            reset: jest.fn(),
            insertLine: jest.fn(),
            setCompleted: jest.fn()
        },
        actions: {
            logPromiseResult: jest.fn(),
            listen: jest.fn(),
            unlisten: jest.fn()
        }
    })
}

export function createNodecgStore (): Store<NodecgStore> {
    return createStore<NodecgStore>({
        state: {
            status: {
                installStatus: InstallStatus.UNKNOWN,
                runStatus: RunStatus.NOT_STARTED,
                message: '',
                bundlesLoading: false
            },
            bundles: []
        },
        mutations: {
            setRunStatus: jest.fn()
        },
        actions: {
            checkNodecgStatus: jest.fn(),
            getBundleList: jest.fn()
        }
    })
}
