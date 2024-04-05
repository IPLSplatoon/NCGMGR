<template>
    <status-bar class="m-b-8" />
    <ipl-message
        v-if="!dependencyStore.hasNodejs"
        type="error"
        data-test="missing-nodejs-message"
    >
        Please install Node.js to continue.
    </ipl-message>
    <install-manager v-if="dependencyStore.hasNodejs" />
    <bundle-manager
        v-if="nodecgInstalled && dependencyStore.hasNodejs"
        class="m-t-8"
    />
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import InstallManager from '@/components/InstallManager.vue'
import BundleManager from '@/components/BundleManager.vue'
import { InstallStatus, useNodecgStore } from '@/store/nodecgStore'
import { useConfigStore } from '@/store/configStore'
import { useDependencyStore } from '@/store/dependencyStore'
import StatusBar from '@/components/statusBar/StatusBar.vue'
import { IplMessage } from '@iplsplatoon/vue-components'

export default defineComponent({
    name: 'App',

    components: { IplMessage, StatusBar, BundleManager, InstallManager },

    setup () {
        const nodecgStore = useNodecgStore()
        const dependencyStore = useDependencyStore()

        dependencyStore.checkVersions()

        return {
            nodecgInstalled: computed(() => nodecgStore.status.installStatus === InstallStatus.INSTALLED),
            dependencyStore
        }
    }
})
</script>
