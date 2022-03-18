<template>
    <ipl-space color="light">
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
            :disabled="!bundlePathValidator.isValid"
            data-test="install-button"
            @click="doInstall"
        />
        <log-overlay
            v-model:visible="showInstallLog"
            title="Installing..."
            data-test="bundle-log-overlay"
            log-key="install-bundle"
            no-background-close
        />
    </ipl-space>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { IplButton, IplInput, IplSpace, provideValidators, notBlank, validator } from '@iplsplatoon/vue-components'
import { invoke } from '@tauri-apps/api/tauri'
import { useLogStore } from '@/store/log'
import { useNodecgStore } from '@/store/nodecg'
import { useConfigStore } from '@/store/config'
import LogOverlay from '@/components/logOverlay.vue'
import { normalizeBundlePath } from '@/util/nodecg'
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
        const configStore = useConfigStore()

        let bundleUrl = ''
        let bundleName = ''
        const showInstallLog = ref(false)
        const bundlePath = ref('')
        const bundlePathValidator = validator(bundlePath, false, notBlank, (value: string) => {
            const parsedPath = normalizeBundlePath(value)

            if (parsedPath.isValid) {
                bundleUrl = parsedPath.bundleUrl ?? ''
                bundleName = parsedPath.bundleName ?? ''
            }

            return {
                message: 'Must be a valid git repository URL or GitHub username/repo pair.',
                isValid: parsedPath.isValid
            }
        })

        provideValidators({
            bundleName: bundlePathValidator
        })

        return {
            showInstallLog,
            bundlePath,
            bundlePathValidator,
            doInstall: async () => {
                const logKey = 'install-bundle'
                logStore.reset(logKey)
                showInstallLog.value = true
                await logStore.listen(logKey)
                const invocation = invoke('install_bundle', { bundleName, bundleUrl, nodecgPath: configStore.installPath })
                logStore.logPromiseResult({ promise: invocation, key: logKey })
                logStore.listenForProcessExit({ key: logKey, callback: () => nodecgStore.getBundleList() })
            }
        }
    }
})
</script>
