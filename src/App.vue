<template>
    <status-bar class="m-b-8" />
    <ipl-message
        v-if="!dependencyStore.hasNodejs"
        type="error"
    >
        Please install Node.js to continue.
    </ipl-message>
    <initial-install-directory-setup
        v-else-if="installDirectoryConfigRequired"
        @installing="showInstallLog = true"
    />
    <template v-else>
        <nodecg-starter />
        <bundle-manager class="m-t-8" />
    </template>
    <log-overlay
        v-model:visible="showInstallLog"
        title="Installing..."
        log-key="install-nodecg"
    />
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import NodecgStarter from '@/components/NodecgStarter.vue'
import BundleManager from '@/components/BundleManager.vue'
import { InstallStatus, useNodecgStore } from '@/store/nodecgStore'
import { useDependencyStore } from '@/store/dependencyStore'
import StatusBar from '@/components/statusBar/StatusBar.vue'
import { IplMessage } from '@iplsplatoon/vue-components'
import InitialInstallDirectorySetup from '@/components/InitialInstallDirectorySetup.vue'
import LogOverlay from '@/components/log/LogOverlay.vue'

export default defineComponent({
    name: 'App',

    components: { LogOverlay, InitialInstallDirectorySetup, IplMessage, StatusBar, BundleManager, NodecgStarter },

    setup () {
        const nodecgStore = useNodecgStore()
        const dependencyStore = useDependencyStore()
        const showInstallLog = ref(false)

        return {
            installDirectoryConfigRequired: computed(() =>
                nodecgStore.status.installStatus === InstallStatus.UNABLE_TO_INSTALL
                || nodecgStore.status.installStatus === InstallStatus.MISSING_INSTALL_DIRECTORY
                || nodecgStore.status.installStatus === InstallStatus.BAD_INSTALL_DIRECTORY
            ),
            showInstallLog,
            dependencyStore,
            nodecgStore,
            InstallStatus
        }
    }
})
</script>
