<template>
    <ipl-progress-bar
        :value="progress"
        :color="isCompleted ? 'yellow' : 'blue'"
        background-color="light"
    />
</template>

<script lang="ts">
import { defineComponent } from '@vue/runtime-core'
import { useLogStore } from '@/store/logStore'
import { computed } from 'vue'
import { IplProgressBar } from '@iplsplatoon/vue-components'

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
        const isCompleted = computed(() => logStore.completed[props.logKey] ?? false)

        return {
            isCompleted,
            progress: computed(() => {
                if (isCompleted.value) {
                    return 100
                }

                const entry = logStore.progressEntries[props.logKey]
                return !entry ? 0 : (entry.step / entry.max_step) * 100
            })
        }
    }
})
</script>
