import { Bundle, getBundles, getNodecgStatus } from '@/service/nodecgService'
import { useConfigStore } from '@/store/configStore'
import { defineStore } from 'pinia'
import { listenForProcessExit } from '@/service/messagingService'

export enum InstallStatus {
    UNKNOWN,
    READY_TO_INSTALL,
    INSTALLED,
    UNABLE_TO_INSTALL
}

export enum RunStatus {
    NOT_STARTED = 'NOT_STARTED',
    RUNNING = 'RUNNING',
    STOPPED = 'STOPPED'
}

export interface NodecgStore {
    status: {
        installStatus: InstallStatus
        runStatus: RunStatus
        message: string
        bundlesLoading: boolean
    },
    bundles: Bundle[]
}

export const useNodecgStore = defineStore('nodecg', {
    state: () => ({
        status: {
            installStatus: InstallStatus.UNKNOWN,
            runStatus: RunStatus.NOT_STARTED,
            message: '',
            bundlesLoading: false
        },
        bundles: []
    } as NodecgStore),
    actions: {
        async checkNodecgStatus () {
            const configStore = useConfigStore()
            this.status.installStatus = InstallStatus.UNKNOWN
            this.status.message = 'Checking status...'

            try {
                const { status, message } = await getNodecgStatus(configStore.installPath)
                this.status.message = message
                this.status.installStatus = status
                if (status === InstallStatus.INSTALLED) {
                    this.getBundleList()
                } else {
                    this.bundles = []
                }
            } catch (e) {
                this.status.message = e.toString()
                this.status.installStatus = InstallStatus.UNABLE_TO_INSTALL
                this.bundles = []
            }
        },
        async getBundleList () {
            const configStore = useConfigStore()
            this.status.bundlesLoading = true
            this.bundles = await getBundles(configStore.installPath)
            this.status.bundlesLoading = false
        }
    }
})

listenForProcessExit('run-nodecg', () => {
    useNodecgStore().$state.status.runStatus = RunStatus.STOPPED
})
