<template>
    <div class="layout vertical">
        <div>Installation folder: "{{ installFolder }}"</div>
        <button @click="selectDirectory" data-test="install-directory-select-button">Select folder</button>
        <button @click="doInstall" :disabled="installDisabled" data-test="install-button">Install</button>
    </div>
    <log-overlay title="Installing..." v-model:visible="showLog" />
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import isEmpty from 'lodash/isEmpty'
import { invoke } from '@tauri-apps/api/tauri'
import { useConfigStore } from '@/store/config'
import { open } from '@tauri-apps/api/dialog'
import LogOverlay from '@/components/logOverlay.vue'
import { logPromiseResult } from '@/util/log'
import { useLogStore } from '@/store/log'

export default defineComponent({
    name: 'App',

    components: { LogOverlay },

    setup () {
        const config = useConfigStore()
        const logStore = useLogStore()
        config.dispatch('load')

        const showLog = ref(false)

        const installFolder = computed({
            get: () => config.state.installPath,
            set: (newValue: string) => config.commit('setInstallPath', newValue)
        })

        return {
            installDisabled: computed(() => isEmpty(installFolder.value)),
            installFolder,
            showLog,
            async selectDirectory () {
                const path = await open({ directory: true })

                if (!path) return

                if (Array.isArray(path)) {
                    installFolder.value = path[0]
                } else {
                    installFolder.value = path
                }
                config.dispatch('persist')
            },
            async doInstall () {
                logStore.commit('reset')
                showLog.value = true
                const invocation = invoke('install_nodecg', { path: installFolder.value })
                logPromiseResult(invocation)
                await invocation
            }
        }
    }
})
</script>

<style lang="scss">
@import 'src/styles/window';
</style>
