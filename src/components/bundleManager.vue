<template>
    <ipl-space>
        <template v-if="loading">
            Loading...
        </template>
        <template v-else>
            {{ bundles }}
        </template>
    </ipl-space>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import IplSpace from '@/components/ipl/iplSpace.vue'
import { useNodecgStore } from '@/store/nodecg'

export default defineComponent({
    name: 'BundleManager',

    components: { IplSpace },

    setup () {
        const nodecgStore = useNodecgStore()

        return {
            loading: computed(() => nodecgStore.state.status.bundlesLoading),
            bundles: computed(() => nodecgStore.state.bundles.reduce((existingValue, bundle) => {
                existingValue += `${bundle.name} (${bundle.version}), `
                return existingValue
            }, ''))
        }
    }
})
</script>
