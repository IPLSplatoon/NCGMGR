<template>
    <ipl-space
        class="no-padding"
        color="secondary"
    >
        <div class="header layout horizontal center-vertical">
            <div class="bold grow m-l-4">
                Bundles
            </div>
            <ipl-button
                icon="sync"
                small
                tooltip="Refresh"
                class="button"
                async
                @click="refreshBundles"
            />
            <ipl-button
                :color="installingBundle ? themeColors.backgroundTertiary : 'green'"
                small
                inline
                class="add-bundle-button m-l-4"
                @click="installingBundle = !installingBundle"
            >
                Add Bundle
                <font-awesome-icon
                    icon="plus-circle"
                    class="icon"
                />
            </ipl-button>
        </div>
        <bundle-installer
            v-show="installingBundle"
            class="m-b-8 m-x-8"
        />
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
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faSync, faPlusCircle)

export default defineComponent({
    name: 'BundleManager',

    components: { BundleList, BundleInstaller, IplButton, IplSpace, FontAwesomeIcon },

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

.add-bundle-button {
    padding: .4em .6em;
    height: 2.4em;

    :deep(.label) {
        font-size: 1.25em;
    }
}
</style>
