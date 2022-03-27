<template>
    <ipl-expanding-space title="Dependency check" :expanded="!dependencyStore.hasNodejs">
        <status-row :color="nodejsStatusColor" class="m-t-4">
            {{ nodejsStatusText }}
        </status-row>
    </ipl-expanding-space>
</template>

<script lang="ts">
import { defineComponent } from '@vue/runtime-core'
import { IplExpandingSpace } from '@iplsplatoon/vue-components'
import { useDependencyStore } from '@/store/dependencyStore'
import { computed, onMounted } from 'vue'
import StatusRow from '@/components/StatusRow.vue'

export default defineComponent({
    name: 'DependencyChecker',

    components: { StatusRow, IplExpandingSpace },

    setup () {
        const dependencyStore = useDependencyStore()

        onMounted(() => {
            dependencyStore.checkVersions()
        })

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
