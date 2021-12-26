<template>
    <button @click="selectDirectory" data-test="install-directory-select-button">Select folder</button>
    <br>
    Installation folder: "{{ installFolder }}"
    <br>
    <button @click="doInstall" :disabled="installDisabled" data-test="install-button">Install</button>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import isEmpty from 'lodash/isEmpty'
import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'
import { useConfigStore } from '@/store/config'
import { open } from '@tauri-apps/api/dialog'

export default defineComponent({
    name: 'App',

    setup () {
        const config = useConfigStore()
        config.dispatch('load')

        const installFolder = computed({
            get: () => config.state.installPath,
            set: (newValue: string) => config.commit('setInstallPath', newValue)
        })

        listen('log', e => {
            console.log((e.payload as { message: string }).message)
        })

        return {
            installDisabled: computed(() => isEmpty(installFolder.value)),
            installFolder,
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
                await invoke('install_nodecg', { path: installFolder.value })
            }
        }
    }
})
</script>

<style lang="scss">
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}
</style>
