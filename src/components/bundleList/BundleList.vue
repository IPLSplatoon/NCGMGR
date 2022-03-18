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
            <div class="max-width" />
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
                        small
                        icon="cog"
                        :color="visibleBundleConfigs[bundle.name] ? themeColors.backgroundTertiary : 'blue'"
                        data-test="configure-button"
                        @click="toggleConfiguration(bundle.name)"
                    />
                    <ipl-button
                        color="red"
                        icon="trash-alt"
                        small
                        tooltip="Uninstall"
                        class="uninstall-button m-l-8"
                        data-test="uninstall-button"
                        @click="initiateUninstall(bundle.name)"
                    />
                </div>
                <bundle-config v-if="visibleBundleConfigs[bundle.name]" :bundle="bundle" style="grid-area: settings" />
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
import IplOverlay from '@/components/mgr/MgrOverlay.vue'
import { computed, reactive } from 'vue'
import { invoke } from '@tauri-apps/api/tauri'
import { useConfigStore } from '@/store/config'
import { useNodecgStore } from '@/store/nodecg'
import { themeColors } from '@/styles/colors'
import BundleConfig from '@/components/bundleList/BundleConfig.vue'

export default defineComponent({
    name: 'BundleList',

    components: { BundleConfig, IplButton, IplOverlay },

    setup () {
        const configStore = useConfigStore()
        const nodecgStore = useNodecgStore()

        const uninstallOverlayProps = reactive({
            visible: false,
            bundleName: ''
        })
        const visibleBundleConfigs = reactive<Record<string, boolean>>({})

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
            },
            visibleBundleConfigs,
            toggleConfiguration: (name: string) => {
                visibleBundleConfigs[name] = !visibleBundleConfigs[name] ?? true
            },
            themeColors
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
    grid-template-columns: 4fr 1fr 0.75fr;
    gap: 4px;
    margin: 4px 0;
}

.bundle-settings__item {
    display: grid;
    align-items: center;
    gap: 0 4px;
    grid-template-columns: 4fr 1fr 0.75fr;
    grid-template-areas: 'name version buttons'
                         'settings settings settings';
    padding: 4px 0;
    border-top: 1px solid $input-color;

    &:last-child {
        padding-bottom: 0;
    }
}
</style>
