<template>
    <ipl-space
        class="m-b-8"
        color="secondary"
    >
        <div class="bold m-b-6">
            NodeCG status
        </div>
        <nodecg-status @close="$emit('close')" />
    </ipl-space>
    <ipl-space
        class="m-b-8"
        color="secondary"
    >
        <div class="bold m-b-6">
            Dependency status
        </div>
        <dependency-checker />
    </ipl-space>
    <ipl-space color="secondary">
        <ipl-small-toggle
            :model-value="configStore.userConfig.enableErrorLog"
            :disabled="errorLogToggleDisabled"
            @update:model-value="onErrorLogToggleChange"
        >
            Enable error log<br>
            <ipl-label>The error log is useful for diagnosing technical issues.</ipl-label>
        </ipl-small-toggle>
    </ipl-space>
    <div class="version-string m-t-8">
        {{ versionString }}
    </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { IplLabel, IplSmallToggle, IplSpace } from '@iplsplatoon/vue-components'
import { useConfigStore } from '@/store/configStore'
import DependencyChecker from '@/components/DependencyChecker.vue'
import NodecgStatus from '@/components/NodecgStatus.vue'
import { getName, getTauriVersion, getVersion } from '@tauri-apps/api/app'

export default defineComponent({
    name: 'ConfigWindow',

    components: { NodecgStatus, DependencyChecker, IplLabel, IplSmallToggle, IplSpace },

    emits: ['close'],

    setup () {
        const configStore = useConfigStore()
        const errorLogToggleDisabled = ref(false)
        const versionString = ref<string | null>(null)

        Promise.all([getName(), getVersion(), getTauriVersion()]).then(versionInfo => {
            versionString.value = `${versionInfo[0]} version ${versionInfo[1]} (Running on Tauri ${versionInfo[2]})`
        })

        return {
            versionString,
            configStore,
            errorLogToggleDisabled,
            async onErrorLogToggleChange(newValue: boolean) {
                errorLogToggleDisabled.value = true
                try {
                    await configStore.patch({
                        enableErrorLog: newValue
                    })
                } finally {
                    errorLogToggleDisabled.value = false
                }
            }
        }
    }
})
</script>

<style lang="scss" scoped>
.version-string {
    text-align: center;
    color: var(--ipl-input-color);
    font-size: 0.75em;
}
</style>
