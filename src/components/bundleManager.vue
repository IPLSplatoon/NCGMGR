<template>
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
                    <tr v-for="bundle in bundles" :key="`bundle_${bundle.name}`">
                        <td>{{ bundle.name }}</td>
                        <td>{{ bundle.version }}</td>
                        <td class="layout horizontal" style="width: max-content">
                            <ipl-button no-background icon="trash-alt" small tooltip="Uninstall" class="button" disabled />
                        </td>
                    </tr>
                </tbody>
            </table>
        </template>
    </ipl-space>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import IplSpace from '@/components/ipl/iplSpace.vue'
import { useNodecgStore } from '@/store/nodecg'
import IplButton from '@/components/ipl/iplButton.vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faSync } from '@fortawesome/free-solid-svg-icons/faSync'
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons/faPlusCircle'
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons/faTrashAlt'

library.add(faSync, faPlusCircle, faTrashAlt)

export default defineComponent({
    name: 'BundleManager',

    components: { IplButton, IplSpace },

    setup () {
        const nodecgStore = useNodecgStore()

        return {
            loading: computed(() => nodecgStore.state.status.bundlesLoading),
            bundles: computed(() => nodecgStore.state.bundles),
            async refreshBundles () {
                return nodecgStore.dispatch('getBundleList')
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
