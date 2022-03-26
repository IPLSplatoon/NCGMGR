<template>
    <ipl-space class="layout vertical">
        <div>Installation folder: {{ installFolder }}</div>
        <status-row :color="nodecgStatusColor" class="m-t-8">
            {{ nodecgStatusMessage }}
        </status-row>
        <div class="layout horizontal m-t-8">
            <ipl-button label="Select folder" @click="selectDirectory" data-test="install-directory-select-button" />
            <ipl-button
                v-if="nodecgStatus === NodecgStatus.INSTALLED"
                :disabled="runStatus === RunStatus.RUNNING"
                label="Launch"
                class="m-l-8"
                color="green"
                data-test="launch-button"
                @click="doLaunch"
            />
            <ipl-button
                v-else
                label="Install"
                :disabled="nodecgStatus !== NodecgStatus.READY_TO_INSTALL"
                data-test="install-button"
                @click="doInstall"
                class="m-l-8"
                color="green"
            />
            <ipl-button
                label="Open dashboard"
                :disabled="runStatus !== RunStatus.RUNNING"
                data-test="open-dashboard-button"
                @click="openDashboard"
                class="m-l-8"
                color="green"
            />
        </div>
    </ipl-space>
    <ipl-space class="m-t-8 layout vertical center-horizontal" v-show="runStatus !== RunStatus.NOT_STARTED">
        <div class="max-width m-l-6">
            Log
        </div>
        <log-display log-key="run-nodecg" class="m-t-4" />
        <ipl-button
            label="Stop"
            color="red"
            class="m-t-8"
            data-test="stop-button"
            :disabled="runStatus !== RunStatus.RUNNING"
            @click="doStop"
        />
    </ipl-space>
    <log-overlay title="Installing..." v-model:visible="showLog" log-key="install-nodecg" />
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue'
import isEmpty from 'lodash/isEmpty'
import { invoke } from '@tauri-apps/api/tauri'
import { useConfigStore } from '@/store/config'
import { open } from '@tauri-apps/api/dialog'
import LogOverlay from '@/components/logOverlay.vue'
import { useLogStore } from '@/store/log'
import { IplButton, IplSpace } from '@iplsplatoon/vue-components'
import StatusRow from '@/components/statusRow.vue'
import { InstallStatus, RunStatus, useNodecgStore } from '@/store/nodecg'
import LogDisplay from '@/components/logDisplay.vue'
import { openDashboard } from '@/service/nodecg'

export default defineComponent({
    name: 'InstallManager',

    components: { LogDisplay, StatusRow, IplSpace, IplButton, LogOverlay },

    setup () {
        const config = useConfigStore()
        const logStore = useLogStore()
        const nodecgStore = useNodecgStore()

        const showLog = ref(false)

        const installFolder = computed({
            get: () => config.installPath,
            set: (newValue: string) => {
                config.installPath = newValue
            }
        })

        const nodecgStatus = computed<InstallStatus>(() => nodecgStore.status.installStatus)

        onMounted(() => {
            nodecgStore.checkNodecgStatus()
        })

        return {
            installDisabled: computed(() => isEmpty(installFolder.value)),
            installFolder,
            showLog,
            nodecgStatus,
            NodecgStatus: InstallStatus,
            nodecgStatusColor: computed(() => {
                switch (nodecgStatus.value) {
                    case InstallStatus.READY_TO_INSTALL:
                        return 'yellow'
                    case InstallStatus.INSTALLED:
                        return 'green'
                    case InstallStatus.UNABLE_TO_INSTALL:
                        return 'red'
                    default:
                        return 'gray'
                }
            }),
            nodecgStatusMessage: computed(() => nodecgStore.status.message),
            async selectDirectory () {
                const path = await open({ directory: true })

                if (!path) return

                if (Array.isArray(path)) {
                    installFolder.value = path[0]
                } else {
                    installFolder.value = path
                }
                config.persist()
                nodecgStore.checkNodecgStatus()
            },
            async doInstall () {
                const logKey = 'install-nodecg'
                logStore.reset(logKey)
                await logStore.listen(logKey)
                showLog.value = true
                const invocation = invoke('install_nodecg', { path: installFolder.value })
                logStore.logPromiseResult({ promise: invocation, key: logKey })
                logStore.listenForProcessExit({
                    key: logKey,
                    callback: () => {
                        nodecgStore.checkNodecgStatus()
                    }
                })
            },

            runStatus: computed(() => nodecgStore.status.runStatus),
            RunStatus,
            async doLaunch () {
                logStore.reset('run-nodecg')
                const invocation = invoke('start_nodecg', { path: installFolder.value })
                logStore.logPromiseResult({ promise: invocation, key: 'run-nodecg' })
                await invocation
                nodecgStore.status.runStatus = RunStatus.RUNNING
            },
            async doStop () {
                await invoke('stop_nodecg')
            },
            openDashboard () {
                openDashboard(installFolder.value)
            }
        }
    }
})
</script>

<style lang="scss">
@import 'src/styles/window';
@import 'src/styles/layout';
</style>
