<template>
    <button @click="selectDirectory">Select folder</button>
    <br>
    Installation folder: "{{ installFolder }}"
    <br>
    <button @click="doInstall" :disabled="installDisabled">Install</button>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { dialog, invoke } from '@tauri-apps/api/bundle'
import isEmpty from 'lodash/isEmpty'
import { listen } from '@tauri-apps/api/event'

export default defineComponent({
    name: 'App',

    setup () {
        const installFolder = ref('')

        listen('log:install', e => {
            console.log((e.payload as { message: string }).message)
        })

        return {
            installDisabled: computed(() => isEmpty(installFolder.value)),
            installFolder,
            async selectDirectory () {
                const path = await dialog.open({ directory: true })
                if (Array.isArray(path)) {
                    installFolder.value = path[0]
                } else {
                    installFolder.value = path
                }
            },
            async doInstall () {
                await invoke('install_nodecg', { path: installFolder.value })
            }
        }
    }
})
</script>

<style>
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}
</style>
