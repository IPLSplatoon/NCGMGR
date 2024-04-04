<template>
    <ipl-space
        class="layout vertical"
        color="secondary"
    >
        <div>Installation folder: {{ installFolder }}</div>
        <status-row
            :color="nodecgStatusColor"
            class="m-t-8"
        >
            {{ nodecgStatusMessage }}
        </status-row>
        <div class="layout horizontal m-t-8">
            <ipl-button
                label="Select folder"
                data-test="install-directory-select-button"
                @click="selectDirectory"
            />
            <ipl-button
                v-if="nodecgStatus === NodecgStatus.INSTALLED"
                :label="runStatus === RunStatus.RUNNING ? 'Stop' : 'Start'"
                class="m-l-8"
                :color="runStatus === RunStatus.RUNNING ? 'red' : 'green'"
                data-test="start-stop-toggle-button"
                @click="toggleStartStop"
            />
            <ipl-button
                v-else
                label="Install"
                :disabled="nodecgStatus !== NodecgStatus.READY_TO_INSTALL"
                data-test="install-button"
                class="m-l-8"
                color="green"
                @click="doInstall"
            />
            <ipl-button
                label="Open dashboard"
                :disabled="runStatus !== RunStatus.RUNNING"
                data-test="open-dashboard-button"
                class="m-l-8"
                color="green"
                @click="openDashboard"
            />
        </div>
    </ipl-space>
    <ipl-expanding-space
        v-show="runStatus !== RunStatus.NOT_STARTED"
        class="m-t-8"
        expanded
        color="secondary"
        data-test="nodecg-log-space"
    >
        <template #title>
            NodeCG log
            <span
                class="badge"
                :class="runStatus === RunStatus.RUNNING ? 'badge-green' : 'badge-red'"
            >
                {{ runStatus === RunStatus.RUNNING ? 'Running' : 'Stopped' }}
            </span>
        </template>
        <template #default>
            <div class="layout vertical center-horizontal">
                <log-display
                    log-key="run-nodecg"
                    class="m-t-4"
                />
            </div>
        </template>
    </ipl-expanding-space>
    <log-overlay
        v-model:visible="showLog"
        title="Installing..."
        log-key="install-nodecg"
    />
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue'
import isEmpty from 'lodash/isEmpty'
import { invoke } from '@tauri-apps/api/core'
import { useConfigStore } from '@/store/configStore'
import { open } from '@tauri-apps/plugin-dialog'
import LogOverlay from '@/components/log/LogOverlay.vue'
import { useLogStore } from '@/store/logStore'
import { IplButton, IplExpandingSpace, IplSpace } from '@iplsplatoon/vue-components'
import StatusRow from '@/components/StatusRow.vue'
import { InstallStatus, RunStatus, useNodecgStore } from '@/store/nodecgStore'
import LogDisplay from '@/components/log/LogDisplay.vue'
import { openDashboard } from '@/service/nodecgService'

export default defineComponent({
    name: 'InstallManager',

    components: { IplExpandingSpace, LogDisplay, StatusRow, IplSpace, IplButton, LogOverlay },

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
                await logStore.listen(logKey, true)
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
            async toggleStartStop () {
                if (nodecgStore.status.runStatus === RunStatus.RUNNING) {
                    await invoke('stop_nodecg')
                } else {
                    logStore.reset('run-nodecg')
                    const invocation = invoke('start_nodecg', { path: installFolder.value })
                    logStore.logPromiseResult({ promise: invocation, key: 'run-nodecg' })
                    await invocation
                    nodecgStore.status.runStatus = RunStatus.RUNNING
                }
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
