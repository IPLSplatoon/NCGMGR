<template>
    <ipl-space class="no-padding">
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
                :color="installingBundle ? themeColors.backgroundTertiary : 'green'"
                small
                tooltip="Install new bundle"
                class="button m-l-4"
                data-test="install-new-bundle-button"
                @click="installingBundle = !installingBundle"
            />
        </div>
        <bundle-installer v-show="installingBundle" class="m-b-8 m-x-8" />
        <bundle-list class="max-width" />
    </ipl-space>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { IplButton, IplSpace } from '@iplsplatoon/vue-components'
import { useNodecgStore } from '@/store/nodecgStore'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faSync } from '@fortawesome/free-solid-svg-icons/faSync'
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons/faPlusCircle'
import BundleInstaller from '@/components/BundleInstaller.vue'
import BundleList from '@/components/bundleList/BundleList.vue'
import { themeColors } from '@/styles/colors'

library.add(faSync, faPlusCircle)

export default defineComponent({
    name: 'BundleManager',

    components: { BundleList, BundleInstaller, IplButton, IplSpace },

    setup () {
        const nodecgStore = useNodecgStore()

        const installingBundle = ref(false)

        return {
            async refreshBundles () {
                return nodecgStore.getBundleList()
            },

            installingBundle,

            themeColors
        }
    }
})
</script>

<style lang="scss" scoped>
@import 'src/styles/text';
@import 'src/styles/colors';
@import 'src/styles/table';

.header {
    padding: 8px;
}
</style>
