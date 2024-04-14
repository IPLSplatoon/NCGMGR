import { Bundle, getBundles, getNodecgStatus } from '@/service/nodecgService'
import { useConfigStore } from '@/store/configStore'
import { defineStore } from 'pinia'
import { listen } from '@tauri-apps/api/event'
import { useLogStore } from '@/store/logStore'

export enum InstallStatus {
    UNKNOWN,
    READY_TO_INSTALL,
    INSTALLED,
    UNABLE_TO_INSTALL,
    MISSING_INSTALL_DIRECTORY,
    BAD_INSTALL_DIRECTORY
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

            try {
                const { status, message } = await getNodecgStatus(configStore.userConfig.nodecgInstallDir)
                this.status.message = message
                this.status.installStatus = status
                if (status === InstallStatus.INSTALLED) {
                    this.getBundleList()
                } else {
                    this.bundles = []
                }
            } catch (e) {
                this.status.message = String(e)
                this.status.installStatus = InstallStatus.UNABLE_TO_INSTALL
                this.bundles = []
            }
        },
        async getBundleList () {
            const configStore = useConfigStore()
            this.status.bundlesLoading = true
            try {
                this.bundles = await getBundles(configStore.userConfig.nodecgInstallDir)
            } finally {
                this.status.bundlesLoading = false
            }
        },
        async listenForRunStatus () {
            const logStore = useLogStore()
            return listen<'NotRunning' | 'Running'>('nodecg-status-change', event => {
                const isRunning = event.payload === 'Running'
                if (isRunning) {
                    logStore.reset('run-nodecg')
                }
                this.status.runStatus = isRunning ? RunStatus.RUNNING : RunStatus.STOPPED
            })
        }
    }
})
