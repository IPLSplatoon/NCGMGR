<template>
    <ipl-space
        class="layout vertical"
        color="secondary"
    >
        <div class="layout horizontal">
            <ipl-button
                v-if="nodecgStatus === NodecgStatus.INSTALLED"
                :label="runStatus === RunStatus.RUNNING ? 'Stop NodeCG' : 'Start NodeCG'"
                :color="runStatus === RunStatus.RUNNING ? 'red' : 'green'"
                @click="toggleStartStop"
            />
            <ipl-button
                v-else
                label="Install"
                :disabled="nodecgStatus !== NodecgStatus.READY_TO_INSTALL"
                class="m-l-8"
                color="green"
                @click="doInstall"
            />
            <ipl-button
                label="Open dashboard"
                :disabled="runStatus !== RunStatus.RUNNING"
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
import { invoke } from '@tauri-apps/api/core'
import { useConfigStore } from '@/store/configStore'
import LogOverlay from '@/components/log/LogOverlay.vue'
import { useLogStore } from '@/store/logStore'
import { IplButton, IplExpandingSpace, IplSpace } from '@iplsplatoon/vue-components'
import { InstallStatus, RunStatus, useNodecgStore } from '@/store/nodecgStore'
import LogDisplay from '@/components/log/LogDisplay.vue'
import { openDashboard } from '@/service/nodecgService'

export default defineComponent({
    name: 'InstallManager',

    components: { IplExpandingSpace, LogDisplay, IplSpace, IplButton, LogOverlay },

    setup () {
        const config = useConfigStore()
        const logStore = useLogStore()
        const nodecgStore = useNodecgStore()

        const showLog = ref(false)
        const installFolder = computed(() => config.userConfig.nodecgInstallDir)
        const nodecgStatus = computed<InstallStatus>(() => nodecgStore.status.installStatus)

        onMounted(() => {
            nodecgStore.checkNodecgStatus()
        })

        return {
            installDisabled: computed(() => installFolder.value == null),
            installFolder,
            showLog,
            nodecgStatus,
            NodecgStatus: InstallStatus,
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
                if (installFolder.value != null) {
                    openDashboard(installFolder.value)
                }
            }
        }
    }
})
</script>

<style lang="scss">
@import 'src/styles/window';
@import 'src/styles/layout';
</style>
