<template>
    <ipl-space color="primary">
        <ipl-input
            v-model="bundlePath"
            name="bundleName"
            label="Bundle Repository Path"
            data-test="bundle-path-input"
        />
        <ipl-button
            class="m-t-8"
            label="Install"
            color="green"
            data-test="install-button"
            @click="doInstall"
        />
        <log-overlay
            v-model:visible="showInstallLog"
            title="Installing..."
            data-test="bundle-log-overlay"
            log-key="install-bundle"
        />
    </ipl-space>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { IplButton, IplInput, IplSpace } from '@iplsplatoon/vue-components'
import { invoke } from '@tauri-apps/api/core'
import { useLogStore } from '@/store/logStore'
import { useNodecgStore } from '@/store/nodecgStore'
import LogOverlay from '@/components/log/LogOverlay.vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons/faTrashAlt'
import { faCog } from '@fortawesome/free-solid-svg-icons/faCog'

library.add(faTrashAlt, faCog)

export default defineComponent({
    name: 'BundleInstaller',

    components: { IplSpace, IplInput, IplButton, LogOverlay },

    setup () {
        const logStore = useLogStore()
        const nodecgStore = useNodecgStore()

        const showInstallLog = ref(false)
        const bundlePath = ref('')

        return {
            showInstallLog,
            bundlePath,
            doInstall: async () => {
                const logKey = 'install-bundle'
                logStore.reset(logKey)
                await logStore.listen(logKey, true)
                showInstallLog.value = true
                const invocation = invoke('install_bundle', { bundleUrl: bundlePath.value })
                logStore.logPromiseResult({ promise: invocation, key: logKey })
                logStore.listenForProcessExit({ key: logKey, callback: () => nodecgStore.getBundleList() })
            }
        }
    }
})
</script>
