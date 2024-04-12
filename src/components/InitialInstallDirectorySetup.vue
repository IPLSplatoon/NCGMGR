<template>
    <h2 class="text-center">
        Welcome to NCGMGR
    </h2>
    <div class="section-separator">
        Choose one of the following options to continue.
    </div>

    <div
        v-if="checkingDefaultDirectory"
        class="text-center"
    >
        <ipl-spinner
            width="24px"
            size="2px"
            color="var(--ipl-body-text-color)"
        /> Loading...
    </div>
    <div
        v-else-if="existingInstallInDefaultDirectory"
        class="layout horizontal"
    >
        <ipl-space
            v-if="existingInstallInDefaultDirectory"
            color="secondary"
            class="max-width h-max-content m-r-8"
        >
            <div class="bold text-center">
                Use previous installation
            </div>
            <p class="m-y-8">
                NCGMGR found that it has installed NodeCG before on this machine. Select this option to keep using it.
            </p>
            <ipl-button
                color="green"
                label="Continue"
                async
                @click="setDefaultInstallDirectory"
            />
        </ipl-space>
        <ipl-space
            color="secondary"
            class="max-width h-max-content"
        >
            <div class="bold text-center">
                Reinstall NodeCG
            </div>
            <p class="m-y-8">
                Select this option to remove the existing NodeCG installation created by NCGMGR and create a new one
                from scratch. Doing so will remove your existing bundles and configuration!
            </p>
            <ipl-button
                color="red"
                label="Reinstall"
                @click="installToDefaultDirectory"
            />
        </ipl-space>
    </div>
    <ipl-space
        v-else
        color="secondary"
    >
        <div
            class="bold text-center"
            style="font-size: 1.25em"
        >
            Install a new instance of NodeCG
        </div>
        <p class="m-y-8">
            Select this option if you are using NodeCG for the first time on this machine.
        </p>
        <ipl-button
            color="green"
            label="Install"
            @click="installToDefaultDirectory"
        />
    </ipl-space>
    <div class="section-separator m-t-16">
        Advanced Options
    </div>
    <ipl-message
        v-if="advancedOptionError != null"
        type="error"
        class="m-b-8"
        closeable
        @close="advancedOptionError = null"
    >
        {{ advancedOptionError }}
    </ipl-message>
    <div class="layout horizontal">
        <ipl-space
            color="secondary"
            class="max-width h-max-content"
        >
            <div class="bold text-center">
                Use an existing installation of NodeCG
            </div>
            <p class="m-y-8">
                Select this option if NodeCG is already installed on this machine.
            </p>
            <ipl-button
                label="Select directory"
                @click="chooseExistingInstall"
            />
        </ipl-space>
        <ipl-space
            color="secondary"
            class="m-l-8 max-width h-max-content"
        >
            <div class="bold text-center">
                Install NodeCG to a custom directory
            </div>
            <p class="m-y-8">
                Select this option to install NodeCG to a specific directory.
            </p>
            <ipl-button
                label="Select directory"
                @click="useCustomDirectory"
            />
        </ipl-space>
    </div>
</template>

<script setup lang="ts">
import { useConfigStore } from '@/store/configStore'
import { InstallStatus, useNodecgStore } from '@/store/nodecgStore'
import { IplButton, IplMessage, IplSpace, IplSpinner } from '@iplsplatoon/vue-components'
import { open as openDialog } from '@tauri-apps/plugin-dialog'
import { getDefaultInstallDir, getNodecgStatus } from '@/service/nodecgService'
import { onMounted, ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { useLogStore } from '@/store/logStore'
import { exists } from '@tauri-apps/plugin-fs'

const emit = defineEmits<{
    installing: []
}>()

const configStore = useConfigStore()
const nodecgStore = useNodecgStore()
const logStore = useLogStore()

let defaultInstallDir: string
const checkingDefaultDirectory = ref(true)
const existingInstallInDefaultDirectory = ref(false)
onMounted(async () => {
    try {
        defaultInstallDir = await getDefaultInstallDir()
        if (await exists(defaultInstallDir)) {
            const defaultInstallDirStatus = await getNodecgStatus(defaultInstallDir)
            existingInstallInDefaultDirectory.value = defaultInstallDirStatus.status === InstallStatus.INSTALLED
        }
    } finally {
        checkingDefaultDirectory.value = false
    }
})

const advancedOptionError = ref<string | null>(null)

async function setDefaultInstallDirectory() {
    await configStore.patch({
        nodecgInstallDir: defaultInstallDir
    })
    await nodecgStore.checkNodecgStatus()
}

async function installToDefaultDirectory() {
    await installNodecg(true)
}

async function chooseExistingInstall() {
    const dir = await openDialog({ directory: true })

    if (!dir) return

    const status = await getNodecgStatus(dir)
    if (status.status === InstallStatus.INSTALLED) {
        await configStore.patch({
            nodecgInstallDir: dir
        })
        await nodecgStore.checkNodecgStatus()
    } else {
        switch (status.status) {
            case InstallStatus.READY_TO_INSTALL:
                advancedOptionError.value = 'The selected directory is empty.'
                break
            default:
                advancedOptionError.value = status.message
        }
    }
}

async function useCustomDirectory() {
    const dir = await openDialog({ directory: true })

    if (!dir) return

    const status = await getNodecgStatus(dir)
    if (status.status === InstallStatus.READY_TO_INSTALL) {
        await configStore.patch({
            nodecgInstallDir: dir
        })
        await installNodecg(false)
    } else {
        switch (status.status) {
            case InstallStatus.INSTALLED:
                advancedOptionError.value = 'NodeCG is already installed in this directory!'
                break
            default:
                advancedOptionError.value = status.message
        }
    }
}

async function installNodecg(useDefaultDirectory: boolean) {
    const logKey = 'install-nodecg'
    logStore.reset(logKey)
    await logStore.listen(logKey, true)
    emit('installing')
    const invocation = invoke('install_nodecg', { useDefaultDirectory })
    logStore.logPromiseResult({ promise: invocation, key: logKey })
    logStore.listenForProcessExit({
        key: logKey,
        callback: () => {
            nodecgStore.checkNodecgStatus()
        }
    })
}
</script>

<style lang="scss" scoped>
.section-separator {
    font-weight: 500;
    text-align: center;
    margin-bottom: 8px;
    border-bottom: 1px solid var(--ipl-input-color);
    padding-bottom: 4px;
}
</style>
