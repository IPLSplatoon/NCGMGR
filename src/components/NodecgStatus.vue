<template>
    <ipl-label>Current install folder</ipl-label>
    <div>{{ configStore.userConfig.nodecgInstallDir ?? 'N/A' }}</div>
    <status-row
        :color="statusColor"
        class="m-t-6"
    >
        {{ nodecgStore.status.message }}
    </status-row>
    <template v-if="configStore.userConfig.nodecgInstallDir != null">
        <div class="layout horizontal m-t-8">
            <ipl-button
                color="blue"
                label="Open folder"
                @click="openInstallFolder"
            />
            <ipl-button
                class="m-l-8"
                color="blue"
                label="Open in Terminal"
                :disabled="!configStore.allowOpenInTerminal"
                @click="openInstallFolderInTerminal"
            />
        </div>
        <ipl-button
            color="red"
            class="m-t-8"
            label="Reset install folder"
            @click="unsetInstallDir"
        />
    </template>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { InstallStatus, useNodecgStore } from '@/store/nodecgStore'
import { useConfigStore } from '@/store/configStore'
import StatusRow from '@/components/StatusRow.vue'
import { IplButton, IplLabel } from '@iplsplatoon/vue-components'
import { invoke } from '@tauri-apps/api/core'
import { open as openShell } from '@tauri-apps/plugin-shell'

const emit = defineEmits<{
    close: []
}>()

const configStore = useConfigStore()
const nodecgStore = useNodecgStore()

const statusColor = computed(() => {
    switch (nodecgStore.status.installStatus) {
        case InstallStatus.READY_TO_INSTALL:
            return 'yellow'
        case InstallStatus.INSTALLED:
            return 'green'
        case InstallStatus.UNABLE_TO_INSTALL:
            return 'red'
        default:
            return 'gray'
    }
})

function openInstallFolder() {
    if (configStore.userConfig.nodecgInstallDir != null) {
        openShell(configStore.userConfig.nodecgInstallDir)
    }
}

async function openInstallFolderInTerminal() {
    if (configStore.userConfig.nodecgInstallDir != null) {
        await invoke('open_path_in_terminal', { path: configStore.userConfig.nodecgInstallDir })
    }
}

async function unsetInstallDir() {
    await configStore.patch({
        nodecgInstallDir: null
    })
    await nodecgStore.checkNodecgStatus()
    emit('close')
}
</script>
