<template>
    <div>
        <ipl-space>
            <div class="header layout horizontal center-vertical">
                <div class="bold grow">Bundles</div>
                <ipl-button
                    no-background
                    icon="sync"
                    small
                    tooltip="Refresh"
                    class="button"
                    @click="refreshBundles"
                    async
                    data-test="refresh-button"
                />
                <ipl-button no-background icon="plus-circle" small tooltip="Install new bundle" class="button" disabled />
            </div>
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
                                    no-background
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
import { computed, defineComponent, reactive } from 'vue'
import IplSpace from '@/components/ipl/iplSpace.vue'
import { useNodecgStore } from '@/store/nodecg'
import IplButton from '@/components/ipl/iplButton.vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faSync } from '@fortawesome/free-solid-svg-icons/faSync'
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons/faPlusCircle'
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons/faTrashAlt'
import IplOverlay from '@/components/ipl/iplOverlay.vue'
import { invoke } from '@tauri-apps/api/tauri'
import { useConfigStore } from '@/store/config'

library.add(faSync, faPlusCircle, faTrashAlt)

export default defineComponent({
    name: 'BundleManager',

    components: { IplOverlay, IplButton, IplSpace },

    setup () {
        const nodecgStore = useNodecgStore()
        const configStore = useConfigStore()

        const uninstallOverlayProps = reactive({
            visible: false,
            bundleName: ''
        })

        return {
            loading: computed(() => nodecgStore.state.status.bundlesLoading),
            bundles: computed(() => nodecgStore.state.bundles),
            async refreshBundles () {
                return nodecgStore.dispatch('getBundleList')
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
                    nodecgPath: configStore.state.installPath
                }).then(() => {
                    uninstallOverlayProps.visible = false
                }).finally(() => {
                    nodecgStore.dispatch('getBundleList')
                })
            }
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
</style>
