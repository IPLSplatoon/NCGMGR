<template>
    <installer />
    <bundle-manager v-if="nodecgInstalled" class="m-t-8" />
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import Installer from '@/components/installer.vue'
import BundleManager from '@/components/bundleManager.vue'
import { NodecgStatus, useStatusStore } from '@/store/status'

export default defineComponent({
    name: 'App',

    components: { BundleManager, Installer },

    setup () {
        const statusStore = useStatusStore()

        return {
            nodecgInstalled: computed(() => statusStore.state.nodecg.status === NodecgStatus.INSTALLED)
        }
    }
})
</script>
