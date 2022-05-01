<template>
    <div>
        <status-row :color="nodejsStatusColor">
            {{ nodejsStatusText }}
        </status-row>
    </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/runtime-core'
import { useDependencyStore } from '@/store/dependencyStore'
import { computed } from 'vue'
import StatusRow from '@/components/StatusRow.vue'

export default defineComponent({
    name: 'DependencyChecker',

    components: { StatusRow },

    setup () {
        const dependencyStore = useDependencyStore()

        return {
            dependencyStore,
            nodejsStatusColor: computed(() => {
                if (dependencyStore.isLoading) return 'yellow'
                else if (dependencyStore.hasNodejs) return 'green'
                else return 'red'
            }),
            nodejsStatusText: computed(() => {
                if (dependencyStore.isLoading) return 'Loading...'
                else if (dependencyStore.hasNodejs) return `Found Node.js ${dependencyStore.nodejs.version}.`
                else return 'Node.js not found. Install Node.js and relaunch to continue.'
            })
        }
    }
})
</script>
