<template>
    <div v-if="loading" class="text-center">
        Loading...
    </div>
    <div v-else-if="bundles.length < 1" class="text-center">
        No bundles installed.
    </div>
    <div v-else class="bundle-settings__wrapper">
        <div class="bundle-settings__header">
            <div class="bold">Name</div>
            <div class="bold">Version</div>
            <div />
        </div>
        <div class="layout vertical">
            <div
                v-for="bundle in bundles"
                :key="`bundle_${bundle.name}`"
                :data-test="`bundle_${bundle.name}`"
                class="bundle-settings__item max-width"
            >
                <div>{{ bundle.name }}</div>
                <div>{{ bundle.version }}</div>
                <div class="layout horizontal end-horizontal">
                    <ipl-button
                        color="red"
                        icon="trash-alt"
                        small
                        tooltip="Uninstall"
                        class="uninstall-button"
                        data-test="uninstall-button"
                        @click="initiateUninstall(bundle.name)"
                    />
                </div>
            </div>
        </div>
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
import { defineComponent } from '@vue/runtime-core'
import { IplButton } from '@iplsplatoon/vue-components'
import IplOverlay from '@/components/ipl/iplOverlay.vue'
import { computed, reactive } from 'vue'
import { invoke } from '@tauri-apps/api/tauri'
import { useConfigStore } from '@/store/config'
import { useNodecgStore } from '@/store/nodecg'

export default defineComponent({
    name: 'BundleList',

    components: { IplButton, IplOverlay },

    setup () {
        const configStore = useConfigStore()
        const nodecgStore = useNodecgStore()

        const uninstallOverlayProps = reactive({
            visible: false,
            bundleName: ''
        })

        return {
            loading: computed(() => nodecgStore.status.bundlesLoading),
            bundles: computed(() => nodecgStore.bundles),

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
            }
        }
    }
})
</script>

<style lang="scss">
@import 'src/styles/text';
@import 'src/styles/colors';

.bundle-settings__header {
    display: grid;
    align-items: center;
    grid-template-columns: 4fr 1fr 0.25fr;
    gap: 12px;
    margin: 4px 0;
}

.bundle-settings__item {
    display: grid;
    align-items: center;
    gap: 4px;
    grid-template-columns: 4fr 1fr 0.25fr;
    padding: 4px 0;
    border-top: 1px solid $input-color;

    &:last-child {
        padding-bottom: 0;
    }
}
</style>
