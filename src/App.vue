<template>
    <install-manager />
    <bundle-manager v-if="nodecgInstalled" class="m-t-8" />
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import InstallManager from '@/components/installManager.vue'
import BundleManager from '@/components/bundleManager.vue'
import { InstallStatus, useNodecgStore } from '@/store/nodecg'
import { useConfigStore } from '@/store/config'

export default defineComponent({
    name: 'App',

    components: { BundleManager, InstallManager },

    setup () {
        const nodecgStore = useNodecgStore()
        const configStore = useConfigStore()

        configStore.load()

        return {
            nodecgInstalled: computed(() => nodecgStore.status.installStatus === InstallStatus.INSTALLED)
        }
    }
})
</script>
