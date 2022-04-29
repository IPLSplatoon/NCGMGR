<template>
    <mgr-overlay v-model:visible="modelVisible" class="log-overlay" :no-background-close="noBackgroundClose" max-width>
        <div class="layout vertical center-horizontal">
            <h2 class="m-b-8">{{title}}</h2>
            <progress-display
                v-if="withProgress"
                :log-key="logKey"
                class="m-b-8 max-width"
            />
            <log-display :log-key="logKey" class="m-b-8" />
            <ipl-button @click="modelVisible = false" :disabled="!completed" data-test="close-button" label="Close" />
        </div>
    </mgr-overlay>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import MgrOverlay from '@/components/mgr/MgrOverlay.vue'
import { IplButton } from '@iplsplatoon/vue-components'
import { useLogStore } from '@/store/logStore'
import LogDisplay from '@/components/log/LogDisplay.vue'
import ProgressDisplay from '@/components/log/ProgressDisplay.vue'
import { ActionState } from '@/types/log'

export default defineComponent({
    name: 'LogOverlay',

    emits: ['update:visible'],

    components: { ProgressDisplay, LogDisplay, MgrOverlay, IplButton },

    props: {
        title: {
            type: String,
            required: true
        },
        visible: {
            type: Boolean,
            required: true
        },
        logKey: {
            type: String,
            required: true
        },
        noBackgroundClose: {
            type: Boolean,
            default: false
        },
        withProgress: {
            type: Boolean,
            default: false
        }
    },

    setup (props, { emit }) {
        const logStore = useLogStore()

        return {
            completed: computed(() => logStore.actionStates[props.logKey] !== ActionState.INCOMPLETE),
            modelVisible: computed({
                get () {
                    return props.visible
                },
                set (newValue: boolean) {
                    emit('update:visible', newValue)
                }
            })
        }
    }
})
</script>
