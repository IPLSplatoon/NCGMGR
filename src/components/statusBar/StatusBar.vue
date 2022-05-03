<template>
    <ipl-space class="status-bar">
        <template
            v-for="(item, key) in items"
            :key="key"
        >
            <div
                class="status-bar-item"
                :class="{ highlighted: item.highlighted.value }"
                @click="item.overlayVisible.value = true"
                :id="`status-bar-item_${key}`"
            >
                <font-awesome-icon :icon="item.icon" class="icon" />
                <span class="text">{{ item.label }}</span>
            </div>
            <mgr-overlay v-model:visible="item.overlayVisible.value" :id="`status-item-dialog_${key}`">
                <ipl-dialog-title
                    :title="item.label"
                    @close="item.overlayVisible.value = false"
                />
                <div class="m-t-8">
                    <component :is="item.component" />
                </div>
            </mgr-overlay>
        </template>
    </ipl-space>
</template>

<script lang="ts">
import { computed, ref } from 'vue'
import { defineComponent } from '@vue/runtime-core'
import { IplDialogTitle, IplSpace } from '@iplsplatoon/vue-components'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faWrench } from '@fortawesome/free-solid-svg-icons/faWrench'
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons/faExclamationCircle'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import MgrOverlay from '@/components/mgr/MgrOverlay.vue'
import ErrorList from '@/components/ErrorList.vue'
import ConfigWindow from '@/components/ConfigWindow.vue'
import { useDependencyStore } from '@/store/dependencyStore'
import { useErrorHandlerStore } from '@/store/errorHandlerStore'
import { useConfigStore } from '@/store/configStore'
import pick from 'lodash/pick'

library.add(faWrench, faExclamationCircle)

export default defineComponent({
    name: 'StatusBar',

    components: { ConfigWindow, IplDialogTitle, MgrOverlay, IplSpace, FontAwesomeIcon, ErrorList },

    setup () {
        const dependencyStore = useDependencyStore()
        const errorHandlerStore = useErrorHandlerStore()
        const configStore = useConfigStore()

        const items = {
            dependencyCheck: {
                icon: 'wrench',
                label: 'Settings',
                overlayVisible: ref(false),
                highlighted: computed(() => !dependencyStore.isLoading && !dependencyStore.hasNodejs),
                component: 'ConfigWindow'
            },
            errorLog: {
                icon: 'exclamation-circle',
                label: 'Error log',
                overlayVisible: ref(false),
                highlighted: computed(() => Object.keys(errorHandlerStore.recentErrors).length > 0),
                component: 'ErrorList'
            }
        }

        return {
            items: computed(() => pick(items, [
                'dependencyCheck',
                ...(configStore.enableErrorLog ? ['errorLog'] : [])
            ]))
        }
    }
})
</script>

<style lang="scss" scoped>
@import 'src/styles/colors';

@keyframes highlight {
    0%  { color: var(--text-color) }
    49% { color: var(--text-color) }
    50% { color: $red }
    100% { color: $red }
}

.status-bar {
    display: flex;

    > .status-bar-item {
        padding: 2px 4px;
        cursor: pointer;
        color: var(--text-color);
        display: flex;
        align-items: center;

        > .icon {
            font-size: 1.2em;
        }

        > .text {
            display: none;
            margin-left: 4px;
        }

        &:hover > .text {
            display: unset;
        }

        &.highlighted > .icon {
            animation: highlight 2s infinite;
        }
    }
}
</style>
