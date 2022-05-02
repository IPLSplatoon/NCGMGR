<template>
    <div>
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
                    <ipl-space class="m-t-8 dialog-component-wrapper">
                        <component :is="item.component" />
                    </ipl-space>
                </mgr-overlay>
            </template>
        </ipl-space>
    </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/runtime-core'
import { IplDialogTitle, IplSpace } from '@iplsplatoon/vue-components'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faWrench } from '@fortawesome/free-solid-svg-icons/faWrench'
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons/faExclamationCircle'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import MgrOverlay from '@/components/mgr/MgrOverlay.vue'
import { computed, ref } from 'vue'
import DependencyChecker from '@/components/DependencyChecker.vue'
import { useDependencyStore } from '@/store/dependencyStore'
import ErrorList from '@/components/ErrorList.vue'
import { useErrorHandlerStore } from '@/store/errorHandlerStore'

library.add(faWrench, faExclamationCircle)

export default defineComponent({
    name: 'StatusBar',

    components: { DependencyChecker, IplDialogTitle, MgrOverlay, IplSpace, FontAwesomeIcon, ErrorList },

    setup () {
        const dependencyStore = useDependencyStore()
        const errorHandlerStore = useErrorHandlerStore()

        const items = {
            dependencyCheck: {
                icon: 'wrench',
                label: 'Dependency check',
                overlayVisible: ref(false),
                highlighted: computed(() => !dependencyStore.isLoading && !dependencyStore.hasNodejs),
                component: 'DependencyChecker'
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
            items
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

#status-item-dialog_errorLog .dialog-component-wrapper {
    padding: 0;
    overflow: hidden;
}
</style>
