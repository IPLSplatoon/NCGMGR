<template>
    <ipl-space class="layout vertical">
        <div>Installation folder: {{ installFolder }}</div>
        <status-row :color="nodecgStatusColor" class="m-t-8">
            {{ nodecgStatusMessage }}
        </status-row>
        <div class="layout horizontal m-t-8">
            <ipl-button label="Select folder" @click="selectDirectory" data-test="install-directory-select-button" />
            <ipl-button label="Install" :disabled="nodecgStatus !== PackageStatus.READY_TO_INSTALL" data-test="install-button" @click="doInstall" class="m-l-8" color="green" />
        </div>
    </ipl-space>
    <log-overlay title="Installing..." v-model:visible="showLog" />
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
import { PackageStatus } from '@/types/package'
import { useStatusStore } from '@/store/status'

export default defineComponent({
    name: 'Installer',

    components: { StatusRow, IplSpace, IplButton, LogOverlay },

    setup () {
        const config = useConfigStore()
        const logStore = useLogStore()
        const statusStore = useStatusStore()

        const showLog = ref(false)

        const installFolder = computed({
            get: () => config.state.installPath,
            set: (newValue: string) => config.commit('setInstallPath', newValue)
        })

        const nodecgStatus = computed<PackageStatus>(() => statusStore.state.nodecg.status)

        onMounted(() => {
            statusStore.dispatch('checkNodecgStatus')
        })

        return {
            installDisabled: computed(() => isEmpty(installFolder.value)),
            installFolder,
            showLog,
            nodecgStatus: nodecgStatus,
            PackageStatus,
            nodecgStatusColor: computed(() => {
                switch (nodecgStatus.value) {
                    case PackageStatus.READY_TO_INSTALL:
                        return 'yellow'
                    case PackageStatus.INSTALLED:
                        return 'green'
                    case PackageStatus.UNABLE_TO_INSTALL:
                        return 'red'
                    default:
                        return 'gray'
                }
            }),
            nodecgStatusMessage: computed(() => statusStore.state.nodecg.message),
            async selectDirectory () {
                const path = await open({ directory: true })

                if (!path) return

                if (Array.isArray(path)) {
                    installFolder.value = path[0]
                } else {
                    installFolder.value = path
                }
                config.dispatch('persist')
                statusStore.dispatch('checkNodecgStatus')
            },
            async doInstall () {
                logStore.commit('reset')
                showLog.value = true
                const invocation = invoke('install_nodecg', { path: installFolder.value })
                logStore.dispatch('logPromiseResult', invocation)
                await invocation
                statusStore.dispatch('checkNodecgStatus')
            }
        }
    }
})
</script>

<style lang="scss">
@import 'src/styles/window';
@import 'src/styles/layout';
</style>
