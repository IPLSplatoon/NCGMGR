<template>
    <div>
        <ipl-space>
            <div class="header layout horizontal center-vertical">
                <div class="bold grow m-l-4">Bundles</div>
                <ipl-button
                    icon="sync"
                    small
                    tooltip="Refresh"
                    class="button"
                    @click="refreshBundles"
                    async
                    data-test="refresh-button"
                />
                <ipl-button
                    icon="plus-circle"
                    color="green"
                    small
                    tooltip="Install new bundle"
                    class="button m-l-6"
                    data-test="install-new-bundle-button"
                    :class="{ active: installingBundle }"
                    @click="installingBundle = !installingBundle"
                />
            </div>
            <bundle-installer v-show="installingBundle" class="m-b-8" />
            <div v-if="loading" class="text-center">
                Loading...
            </div>
            <div v-else-if="bundles.length < 1" class="text-center">
                No bundles installed.
            </div>
            <template v-else>
                <table class="max-width">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Version</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="bundle in bundles"
                            :key="`bundle_${bundle.name}`"
                            :data-test="`bundle_${bundle.name}`"
                        >
                            <td>{{ bundle.name }}</td>
                            <td>{{ bundle.version }}</td>
                            <td class="layout horizontal w-max-content">
                                <ipl-button
                                    color="red"
                                    icon="trash-alt"
                                    small
                                    tooltip="Uninstall"
                                    class="button"
                                    data-test="uninstall-button"
                                    @click="initiateUninstall(bundle.name)"
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </template>
        </ipl-space>
        <ipl-overlay v-model:visible="uninstallOverlayProps.visible" data-test="uninstall-overlay">
            <div class="text-center">
                Are you sure you want to uninstall <span class="bold">{{ uninstallOverlayProps.bundleName }}</span>?
            </div>
            <div class="layout horizontal m-t-8">
                <ipl-button
                    label="Uninstall"
                    color="red"
                    async
                    data-test="confirm-uninstall-button"
                    @click="doUninstall"
                />
                <ipl-button label="Cancel" class="m-l-8" @click="cancelUninstall" data-test="cancel-uninstall-button" />
            </div>
        </ipl-overlay>
    </div>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref } from 'vue'
import { IplButton, IplSpace } from '@iplsplatoon/vue-components'
import { useNodecgStore } from '@/store/nodecg'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faSync } from '@fortawesome/free-solid-svg-icons/faSync'
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons/faPlusCircle'
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons/faTrashAlt'
import IplOverlay from '@/components/ipl/iplOverlay.vue'
import { invoke } from '@tauri-apps/api/tauri'
import { useConfigStore } from '@/store/config'
import BundleInstaller from '@/components/bundleInstaller.vue'

library.add(faSync, faPlusCircle, faTrashAlt)

export default defineComponent({
    name: 'BundleManager',

    components: { BundleInstaller, IplOverlay, IplButton, IplSpace },

    setup () {
        const nodecgStore = useNodecgStore()
        const configStore = useConfigStore()

        const uninstallOverlayProps = reactive({
            visible: false,
            bundleName: ''
        })

        const installingBundle = ref(false)

        return {
            loading: computed(() => nodecgStore.status.bundlesLoading),
            bundles: computed(() => nodecgStore.bundles),
            async refreshBundles () {
                return nodecgStore.getBundleList()
            },

            uninstallOverlayProps,
            initiateUninstall (bundleName: string) {
                uninstallOverlayProps.visible = true
                uninstallOverlayProps.bundleName = bundleName
            },
            cancelUninstall: () => {
                uninstallOverlayProps.visible = false
                uninstallOverlayProps.bundleName = ''
            },
            doUninstall: () => {
                return invoke('uninstall_bundle', {
                    bundleName: uninstallOverlayProps.bundleName,
                    nodecgPath: configStore.installPath
                }).then(() => {
                    uninstallOverlayProps.visible = false
                }).finally(() => {
                    nodecgStore.getBundleList()
                })
            },

            installingBundle
        }
    }
})
</script>

<style lang="scss" scoped>
@import 'src/styles/text';
@import 'src/styles/colors';
@import 'src/styles/table';

.header {
    padding-bottom: 6px;
}

.button.active {
    background-color: var(--background-tertiary) !important;
    color: var(--text-color) !important;
}
</style>
