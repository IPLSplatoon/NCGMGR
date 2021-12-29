<template>
    <ipl-space color="light">
        <ipl-input
            v-model="bundlePath"
            name="bundleName"
            label="Bundle Repository Path"
            data-test="bundle-path-input"
            :validator="bundlePathValidator"
        />
        <ipl-button
            class="m-t-8"
            label="Install"
            color="green"
            :disabled="!bundlePathValidator.isValid"
            data-test="install-button"
            @click="doInstall"
        />
        <log-overlay title="Installing..." v-model:visible="showInstallLog" data-test="bundle-log-overlay" />
    </ipl-space>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import IplSpace from '@/components/ipl/iplSpace.vue'
import IplInput from '@/components/ipl/iplInput.vue'
import IplButton from '@/components/ipl/iplButton.vue'
import { validator } from '@/util/validation/validator'
import { notBlank } from '@/util/validation/stringValidators'
import { invoke } from '@tauri-apps/api/tauri'
import { useLogStore } from '@/store/log'
import { useNodecgStore } from '@/store/nodecg'
import { useConfigStore } from '@/store/config'
import LogOverlay from '@/components/logOverlay.vue'
import { normalizeBundlePath } from '@/util/nodecg'

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

        return {
            showInstallLog,
            bundlePath,
            bundlePathValidator,
            doInstall: async () => {
                logStore.commit('reset')
                showInstallLog.value = true
                const invocation = invoke('install_bundle', { bundleName, bundleUrl, nodecgPath: configStore.state.installPath })
                logStore.dispatch('logPromiseResult', invocation)
                await invocation
                nodecgStore.dispatch('getBundleList')
            }
        }
    }
})
</script>
