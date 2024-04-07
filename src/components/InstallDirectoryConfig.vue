<template>
    <ipl-expanding-space
        title="NodeCG install folder"
        color="secondary"
    >
        <ipl-label>Current install folder</ipl-label>
        <div class="text-overflow-anywhere">
            {{ configStore.userConfig.nodecgInstallDir ?? 'N/A' }}
        </div>
        <div class="layout horizontal m-t-8">
            <ipl-button
                v-if="configStore.userConfig.nodecgInstallDir != null"
                color="red"
                label="Change install folder"
                @click="unsetInstallDir"
            />
        </div>
    </ipl-expanding-space>
</template>

<script setup lang="ts">
import { IplButton, IplExpandingSpace, IplLabel } from '@iplsplatoon/vue-components'
import { useConfigStore } from '@/store/configStore'
import { useNodecgStore } from '@/store/nodecgStore'

const emit = defineEmits<{
    close: []
}>()

const configStore = useConfigStore()
const nodecgStore = useNodecgStore()

async function unsetInstallDir() {
    await configStore.patch({
        nodecgInstallDir: null
    })
    await nodecgStore.checkNodecgStatus()
    emit('close')
}
</script>
