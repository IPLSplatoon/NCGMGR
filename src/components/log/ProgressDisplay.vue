<template>
    <ipl-progress-bar
        :value="progress"
        :color="progressBarColor"
        background-color="light"
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
                if (actionState.value != null && actionState.value !== ActionState.INCOMPLETE) {
                    return 100
                }

                const entry = logStore.progressEntries[props.logKey]
                return !entry ? 0 : (entry.step / entry.max_step) * 100
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
