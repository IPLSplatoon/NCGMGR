<template>
    <ipl-expanding-space title="Dependency check" :expanded="!dependencyStore.hasNodejs">
        <status-row :color="nodejsStatusColor" class="m-t-6">
            {{ nodejsStatusText }}
        </status-row>
        <ipl-button class="m-t-8" label="Check again" @click="runDependencyCheck" />
    </ipl-expanding-space>
</template>

<script lang="ts">
import { defineComponent } from '@vue/runtime-core'
import { IplButton, IplExpandingSpace } from '@iplsplatoon/vue-components'
import { useDependencyStore } from '@/store/dependencyStore'
import { computed, onMounted } from 'vue'
import StatusRow from '@/components/statusRow.vue'

export default defineComponent({
    name: 'DependencyChecker',

    components: { IplButton, StatusRow, IplExpandingSpace },

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
                else return 'Node.js not found.'
            }),
            runDependencyCheck () {
                dependencyStore.checkVersions()
            }
        }
    }
})
</script>
