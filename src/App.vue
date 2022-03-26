<template>
    <dependency-checker class="m-b-8" />
    <install-manager v-if="dependencyStore.hasNodejs" />
    <bundle-manager v-if="nodecgInstalled && dependencyStore.hasNodejs" class="m-t-8" />
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import InstallManager from '@/components/installManager.vue'
import BundleManager from '@/components/bundleManager.vue'
import { InstallStatus, useNodecgStore } from '@/store/nodecg'
import { useConfigStore } from '@/store/config'
import DependencyChecker from '@/components/DependencyChecker.vue'
import { useDependencyStore } from '@/store/dependencyStore'

export default defineComponent({
    name: 'App',

    components: { DependencyChecker, BundleManager, InstallManager },

    setup () {
        const nodecgStore = useNodecgStore()
        const configStore = useConfigStore()
        const dependencyStore = useDependencyStore()

        configStore.load()

        return {
            nodecgInstalled: computed(() => nodecgStore.status.installStatus === InstallStatus.INSTALLED),
            dependencyStore
        }
    }
})
</script>
