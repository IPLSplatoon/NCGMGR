<template>
    <ipl-space class="layout vertical">
        <div>Installation folder: "{{ installFolder }}"</div>
        <div class="layout horizontal m-t-8">
            <ipl-button label="Select folder" @click="selectDirectory" data-test="install-directory-select-button" />
            <ipl-button label="Install" :disabled="installDisabled" data-test="install-button" @click="doInstall" class="m-l-8" />
        </div>
    </ipl-space>
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
import IplButton from '@/components/ipl/iplButton.vue'
import IplSpace from '@/components/ipl/iplSpace.vue'

export default defineComponent({
    name: 'App',

    components: { IplSpace, IplButton, LogOverlay },

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
@import 'src/styles/layout';
</style>
