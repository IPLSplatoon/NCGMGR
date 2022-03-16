<template>
    <ipl-space class="layout horizontal m-t-8 m-b-8" color="light">
        <ipl-space class="max-width h-max-content">
            <ipl-message
                type="error"
                v-if="versionsError"
                class="m-b-8"
            >
                {{ versionsError }}
            </ipl-message>
            <ipl-select
                v-model="selectedVersion"
                :disabled="disableVersionChange"
                :options="versionOptions"
                label="Version"
                data-test="version-selector"
            />
            <ipl-button
                label="Change version"
                :disabled="disableVersionChange || bundle.version === selectedVersion"
                class="m-t-8"
                data-test="set-version-button"
                @click="setVersion"
            />
            <log-overlay
                v-model:visible="showInstallLog"
                title="Installing..."
                data-test="bundle-log-overlay"
                log-key="change-bundle-version"
                no-background-close
            />
        </ipl-space>
        <ipl-space class="max-width m-l-8 h-max-content">
            <ipl-button
                label="Open folder"
                data-test="open-folder-button"
                @click="openBundleFolder"
            />
            <ipl-button
                label="Open in terminal"
                :disabled="!enableOpenTerminal"
                class="m-t-8"
                data-test="open-in-terminal-button"
                @click="openBundleInTerminal"
            />
            <ipl-button
                label="Open config file"
                :disabled="!hasConfigFile"
                class="m-t-8"
                data-test="open-config-file-button"
                @click="openConfigFile"
            />
        </ipl-space>
    </ipl-space>
</template>

<script lang="ts">
import { defineComponent } from '@vue/runtime-core'
import { computed, PropType, ref, watch } from 'vue'
import { Bundle, configFileExists, getBundleVersions } from '@/service/nodecg'
import { IplButton, IplMessage, IplSelect, IplSpace } from '@iplsplatoon/vue-components'
import { useConfigStore } from '@/store/config'
import LogOverlay from '@/components/logOverlay.vue'
import { useLogStore } from '@/store/log'
import { invoke } from '@tauri-apps/api/tauri'
import { useNodecgStore } from '@/store/nodecg'
import { open } from '@tauri-apps/api/shell'
import { type } from '@tauri-apps/api/os'

export default defineComponent({
    name: 'BundleConfig',

    components: { IplMessage, IplButton, IplSelect, IplSpace, LogOverlay },

    props: {
        bundle: {
            type: Object as PropType<Bundle>,
            required: true
        }
    },

    setup (props) {
        const logStore = useLogStore()
        const configStore = useConfigStore()
        const nodecgStore = useNodecgStore()

        const versions = ref<string[]>([])
        const versionsError = ref<string | null>(null)
        const versionsLoading = ref(true)
        const selectedVersion = ref('')
        const showInstallLog = ref(false)
        const hasConfigFile = ref(false)
        const enableOpenTerminal = ref(false)

        type().then(type => {
            enableOpenTerminal.value = type === 'Darwin' || type === 'Windows_NT'
        })

        watch(showInstallLog, newValue => {
            if (!newValue) {
                nodecgStore.getBundleList()
            }
        })

        watch(() => props.bundle.name, newValue => {
            getBundleVersions(newValue, configStore.installPath).then(result => {
                versions.value = result
                if (result.length > 0) {
                    selectedVersion.value = props.bundle.version
                }
            }).catch(e => {
                versionsError.value = String(e)
            }).finally(() => {
                versionsLoading.value = false
            })

            hasConfigFile.value = false
            configFileExists(newValue, useConfigStore().installPath).then(result => {
                hasConfigFile.value = result
            }).catch(e => {
                hasConfigFile.value = false
                console.error(e)
            })
        }, { immediate: true })

        function getBundlePath () {
            return `${useConfigStore().installPath}/bundles/${props.bundle.name}`
        }

        return {
            enableOpenTerminal,
            hasConfigFile,
            showInstallLog,
            selectedVersion,
            versionsLoading,
            versionsError,
            versions,
            disableVersionChange: computed(() => versionsLoading.value || !!versionsError.value || versions.value.length <= 0),
            versionOptions: computed(() => {
                if (versionsLoading.value) {
                    return [{ name: 'Loading...', value: '' }]
                } else if (versions.value.length <= 0) {
                    return [{ name: 'No versions found', value: '' }]
                } else {
                    return versions.value.map(version => ({ name: version, value: version }))
                }
            }),
            async setVersion () {
                logStore.reset('change-bundle-version')
                await logStore.listen('change-bundle-version')
                showInstallLog.value = true
                const invocation = invoke('set_bundle_version', {
                    bundleName: props.bundle.name,
                    version: selectedVersion.value,
                    nodecgPath: configStore.installPath
                })
                logStore.logPromiseResult({ promise: invocation, key: 'change-bundle-version' })
                await invocation
            },
            async openBundleFolder () {
                await open(getBundlePath())
            },
            async openConfigFile () {
                await open(`${useConfigStore().installPath}/cfg/${props.bundle.name}.json`)
            },
            async openBundleInTerminal () {
                await invoke('open_path_in_terminal', { path: getBundlePath() })
            }
        }
    }
})
</script>
