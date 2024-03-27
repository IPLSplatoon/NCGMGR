<template>
    <mgr-overlay
        v-model:visible="modelVisible"
        class="log-overlay"
        :no-background-close="!completed"
        :max-width="moreDetailsShown"
    >
        <div>
            <ipl-dialog-title
                :title="title"
                class="m-b-8"
                :closing-disabled="!completed"
                @close="modelVisible = false"
            />
            <ipl-space>
                <div class="m-b-8">
                    {{ progressMessage }}
                </div>
                <progress-display :log-key="logKey" />
            </ipl-space>
            <ipl-expanding-space
                v-model:expanded="moreDetailsShown"
                title="More details"
                class="m-t-8 max-width"
            >
                <log-display
                    :log-key="logKey"
                    class="m-t-8"
                />
            </ipl-expanding-space>
        </div>
    </mgr-overlay>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import MgrOverlay from '@/components/mgr/MgrOverlay.vue'
import { IplDialogTitle, IplExpandingSpace, IplSpace } from '@iplsplatoon/vue-components'
import { useLogStore } from '@/store/logStore'
import LogDisplay from '@/components/log/LogDisplay.vue'
import ProgressDisplay from '@/components/log/ProgressDisplay.vue'
import { ActionState } from '@/types/log'

export default defineComponent({
    name: 'LogOverlay',

    components: { IplSpace, IplDialogTitle, IplExpandingSpace, ProgressDisplay, LogDisplay, MgrOverlay },

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
        }
    },

    emits: ['update:visible'],

    setup (props, { emit }) {
        const logStore = useLogStore()

        const modelVisible = computed({
            get () {
                return props.visible
            },
            set (newValue: boolean) {
                emit('update:visible', newValue)
            }
        })
        const completed = computed(() => logStore.actionStates[props.logKey] !== ActionState.INCOMPLETE)

        return {
            progressMessage: computed(() => {
                switch (logStore.actionStates[props.logKey]) {
                    case ActionState.COMPLETED_ERROR:
                        return 'An error has occurred.'
                    case ActionState.COMPLETED_SUCCESS:
                        return 'Done!'
                    default:
                        return 'Please wait...'
                }
            }),
            moreDetailsShown: ref(false),
            completed,
            modelVisible
        }
    }
})
</script>
