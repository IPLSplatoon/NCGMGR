<template>
    <ipl-overlay v-model:visible="modelVisible" class="log-overlay">
        <div class="layout vertical center-horizontal">
            <h2 class="m-b-8">{{title}}</h2>
            <log-display :log-key="logKey" class="m-b-8" />
            <ipl-button @click="modelVisible = false" :disabled="!completed" data-test="close-button" label="Close" />
        </div>
    </ipl-overlay>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import IplOverlay from '@/components/ipl/iplOverlay.vue'
import { IplButton } from '@iplsplatoon/vue-components'
import { useLogStore } from '@/store/log'
import LogDisplay from '@/components/logDisplay.vue'

export default defineComponent({
    name: 'LogOverlay',

    emits: ['update:visible'],

    components: { LogDisplay, IplOverlay, IplButton },

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

    setup (props, { emit }) {
        const logStore = useLogStore()

        return {
            completed: computed(() => logStore.state.completed[props.logKey]),
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
