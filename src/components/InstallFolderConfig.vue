<template>
    <div>Installation folder: {{ configStore.userConfig.nodecgInstallDir }}</div>
    <status-row
        :color="statusColor"
        class="m-t-6"
    >
        {{ nodecgStore.status.message }}
    </status-row>
    <ipl-button
        class="m-t-8"
        color="blue"
        label="Change folder"
        @click="changeInstallFolder"
    />
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
            @click="openInstallFolderInTerminal"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { InstallStatus, useNodecgStore } from '@/store/nodecgStore'
import { useConfigStore } from '@/store/configStore'
import StatusRow from '@/components/StatusRow.vue'
import { IplButton } from '@iplsplatoon/vue-components'
import { invoke } from '@tauri-apps/api/core'
import { open as openDialog } from '@tauri-apps/plugin-dialog'
import { open as openShell } from '@tauri-apps/plugin-shell'

const configStore = useConfigStore()
const nodecgStore = useNodecgStore()

onMounted(() => {
    nodecgStore.checkNodecgStatus()
})

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

async function changeInstallFolder() {
    const path = await openDialog({ directory: true })

    if (!path) return

    const newInstallFolder = Array.isArray(path) ? path[0] : path
    await configStore.patch({
        nodecgInstallDir: newInstallFolder
    })
    await nodecgStore.checkNodecgStatus()
}

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
</script>
