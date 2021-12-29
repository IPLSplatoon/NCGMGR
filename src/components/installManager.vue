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
                disabled
                label="Launch"
                class="m-l-8"
                color="green"
                data-test="launch-button"
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
        </div>
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
import IplButton from '@/components/ipl/iplButton.vue'
import IplSpace from '@/components/ipl/iplSpace.vue'
import StatusRow from '@/components/statusRow.vue'
import { InstallStatus, useNodecgStore } from '@/store/nodecg'

export default defineComponent({
    name: 'InstallManager',

    components: { StatusRow, IplSpace, IplButton, LogOverlay },

    setup () {
        const config = useConfigStore()
        const logStore = useLogStore()
        const nodecgStore = useNodecgStore()

        const showLog = ref(false)

        const installFolder = computed({
            get: () => config.state.installPath,
            set: (newValue: string) => config.commit('setInstallPath', newValue)
        })

        const nodecgStatus = computed<InstallStatus>(() => nodecgStore.state.status.installStatus)

        onMounted(() => {
            nodecgStore.dispatch('checkNodecgStatus')
        })

        return {
            installDisabled: computed(() => isEmpty(installFolder.value)),
            installFolder,
            showLog,
            nodecgStatus: nodecgStatus,
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
            nodecgStatusMessage: computed(() => nodecgStore.state.status.message),
            async selectDirectory () {
                const path = await open({ directory: true })

                if (!path) return

                if (Array.isArray(path)) {
                    installFolder.value = path[0]
                } else {
                    installFolder.value = path
                }
                config.dispatch('persist')
                nodecgStore.dispatch('checkNodecgStatus')
            },
            async doInstall () {
                logStore.commit('reset', 'install-nodecg')
                showLog.value = true
                const invocation = invoke('install_nodecg', { path: installFolder.value })
                logStore.dispatch('logPromiseResult', { promise: invocation, key: 'install-nodecg' })
                await invocation
                nodecgStore.dispatch('checkNodecgStatus')
            }
        }
    }
})
</script>

<style lang="scss">
@import 'src/styles/window';
@import 'src/styles/layout';
</style>
