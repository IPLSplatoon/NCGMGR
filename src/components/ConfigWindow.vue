<template>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { IplLabel, IplSmallToggle, IplSpace } from '@iplsplatoon/vue-components'
import { computed } from 'vue'
import { useConfigStore } from '@/store/configStore'
import DependencyChecker from '@/components/DependencyChecker.vue'

export default defineComponent({
    name: 'ConfigWindow',

    components: { DependencyChecker, IplLabel, IplSmallToggle, IplSpace },

    setup () {
        const configStore = useConfigStore()
        const errorLogToggleDisabled = ref(false)

        return {
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
