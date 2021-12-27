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
import { computed, defineComponent, Ref, ref } from 'vue'
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
import { getNodecgStatus } from '@/util/package'

export default defineComponent({
    name: 'Installer',

    components: { StatusRow, IplSpace, IplButton, LogOverlay },

    setup () {
        const config = useConfigStore()
        const logStore = useLogStore()

        const showLog = ref(false)

        const installFolder = computed({
            get: () => config.state.installPath,
            set: (newValue: string) => config.commit('setInstallPath', newValue)
        })

        const nodecgStatus: Ref<PackageStatus | null> = ref(null)
        const nodecgStatusMessage = ref('Status unknown')

        const checkNodecgStatus = async () => {
            nodecgStatusMessage.value = 'Checking status...'
            nodecgStatus.value = null

            try {
                const { status, message } = await getNodecgStatus(installFolder.value)
                nodecgStatusMessage.value = message
                nodecgStatus.value = status
            } catch (e) {
                nodecgStatusMessage.value = e.toString()
                nodecgStatus.value = PackageStatus.UNABLE_TO_INSTALL
            }
        }

        checkNodecgStatus()

        return {
            installDisabled: computed(() => isEmpty(installFolder.value)),
            installFolder,
            showLog,
            nodecgStatus,
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
            nodecgStatusMessage,
            async selectDirectory () {
                const path = await open({ directory: true })

                if (!path) return

                if (Array.isArray(path)) {
                    installFolder.value = path[0]
                } else {
                    installFolder.value = path
                }
                config.dispatch('persist')
                checkNodecgStatus()
            },
            async doInstall () {
                logStore.commit('reset')
                showLog.value = true
                const invocation = invoke('install_nodecg', { path: installFolder.value })
                logStore.dispatch('logPromiseResult', invocation)
                await invocation
                checkNodecgStatus()
            }
        }
    }
})
</script>

<style lang="scss">
@import 'src/styles/window';
@import 'src/styles/layout';
</style>
