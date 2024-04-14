<template>
    <ipl-progress-bar
        v-if="progress != null"
        :value="progress"
        :color="progressBarColor"
        background-color="primary"
    />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useLogStore } from '@/store/logStore'
import { computed } from 'vue'
import { IplProgressBar } from '@iplsplatoon/vue-components'
import { ActionState } from '@/types/log'
import { themeColors } from '@/styles/colors'

export default defineComponent({
    name: 'ProgressDisplay',

    components: { IplProgressBar },

    props: {
        logKey: {
            type: String,
            required: true
        }
    },

    setup (props) {
        const logStore = useLogStore()
        const actionState = computed(() => logStore.actionStates[props.logKey])

        return {
            progress: computed(() => {
                const entry = logStore.progressEntries[props.logKey]
                if (entry?.maxStep == null) {
                    return null
                }

                if (actionState.value != null && actionState.value !== ActionState.INCOMPLETE) {
                    return 100
                }

                return !entry ? 0 : ((entry.step ?? 0) / entry.maxStep) * 100
            }),
            progressBarColor: computed(() => {
                switch (actionState.value) {
                    case ActionState.COMPLETED_ERROR:
                        return themeColors.red
                    case ActionState.COMPLETED_SUCCESS:
                        return themeColors.green
                    default:
                        return themeColors.blue
                }
            })
        }
    }
})
</script>
