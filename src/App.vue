<template>
    <installer />
    <bundle-manager v-if="nodecgInstalled" class="m-t-8" />
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import Installer from '@/components/installer.vue'
import BundleManager from '@/components/bundleManager.vue'
import { NodecgStatus, useNodecgStore } from '@/store/nodecg'

export default defineComponent({
    name: 'App',

    components: { BundleManager, Installer },

    setup () {
        const nodecgStore = useNodecgStore()

        return {
            nodecgInstalled: computed(() => nodecgStore.state.status.status === NodecgStatus.INSTALLED)
        }
    }
})
</script>
