<template>
    <div
        class="layout horizontal"
        style="padding: 8px 0;"
    >
        <ipl-space class="max-width h-max-content">
            <ipl-message
                v-if="versionsError"
                type="error"
                class="m-b-8"
            >
                {{ versionsError }}
            </ipl-message>
            <ipl-select
                v-model="selectedVersion"
                :disabled="disableVersionChange"
                :options="versionOptions"
                label="Version"
            />
            <ipl-button
                label="Change version"
                :disabled="disableVersionChange || bundle.version === selectedVersion"
                class="m-t-8"
                @click="setVersion"
            />
            <log-overlay
                v-model:visible="showInstallLog"
                title="Installing..."
                log-key="change-bundle-version"
            />
        </ipl-space>
        <ipl-space class="max-width m-l-8 h-max-content">
            <ipl-button
                label="Open folder"
                @click="openBundleFolder"
            />
            <ipl-button
                label="Open in terminal"
                :disabled="!configStore.allowOpenInTerminal"
                class="m-t-8"
                @click="openBundleInTerminal"
            />
            <ipl-button
                :label="hasConfigFile ? 'Open config file' : 'Create config file'"
                :color="hasConfigFile ? 'blue' : 'green'"
                :disabled="configFileLoading"
                class="m-t-8"
                @click="openOrCreateConfigFile"
            />
        </ipl-space>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { computed, PropType, ref, watch } from 'vue'
import { Bundle, configFileExists, createConfigFile, getBundleVersions, openConfigFile } from '@/service/nodecgService'
import { IplButton, IplMessage, IplSelect, IplSpace } from '@iplsplatoon/vue-components'
import { useConfigStore } from '@/store/configStore'
import LogOverlay from '@/components/log/LogOverlay.vue'
import { useLogStore } from '@/store/logStore'
import { invoke } from '@tauri-apps/api/core'
import { useNodecgStore } from '@/store/nodecgStore'
import { open } from '@tauri-apps/plugin-shell'

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
        const selectedVersion = ref<string | undefined>('')
        const showInstallLog = ref(false)
        const hasConfigFile = ref(false)
        const configFileLoading = ref(true)

        watch(showInstallLog, newValue => {
            if (!newValue) {
                nodecgStore.getBundleList()
            }
        })

        watch(() => props.bundle.name, newValue => {
            getBundleVersions(newValue).then(result => {
                versions.value = result
                if (result.length > 0) {
                    selectedVersion.value = props.bundle.version
                }
            }).catch(e => {
                versionsError.value = String(e)
            }).finally(() => {
                versionsLoading.value = false
            })

            checkConfigFile(newValue)
        }, { immediate: true })

        async function checkConfigFile (bundleName: string): Promise<void> {
            configFileLoading.value = true
            hasConfigFile.value = false
            configFileExists(bundleName, configStore.userConfig.nodecgInstallDir).then(result => {
                hasConfigFile.value = result
            }).catch(e => {
                hasConfigFile.value = false
                console.error(e)
            }).finally(() => {
                configFileLoading.value = false
            })
        }

        function getBundlePath () {
            return `${configStore.userConfig.nodecgInstallDir}/bundles/${props.bundle.name}`
        }

        return {
            configStore,
            hasConfigFile,
            configFileLoading,
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
                const logKey = 'change-bundle-version'
                logStore.reset(logKey)
                await logStore.listen(logKey, true)
                showInstallLog.value = true
                const invocation = invoke('set_bundle_version', {
                    bundleName: props.bundle.name,
                    version: selectedVersion.value
                })
                logStore.logPromiseResult({ promise: invocation, key: logKey })
                logStore.listenForProcessExit({ key: logKey })
            },
            async openBundleFolder () {
                await open(getBundlePath())
            },
            async openOrCreateConfigFile () {
                if (!hasConfigFile.value) {
                    await createConfigFile(props.bundle.name, configStore.userConfig.nodecgInstallDir)
                    checkConfigFile(props.bundle.name)
                }

                await openConfigFile(props.bundle.name, configStore.userConfig.nodecgInstallDir)
            },
            async openBundleInTerminal () {
                await invoke('open_path_in_terminal', { path: getBundlePath() })
            }
        }
    }
})
</script>
