<template>
    <ipl-overlay v-model:visible="modelVisible" class="log-overlay">
        <div class="layout vertical center-horizontal">
            <h2 class="m-b-8">{{title}}</h2>
            <div class="log-display m-b-8">
                <span :class="`type-${line.type ?? 'unknown'}`" v-for="(line, i) in log" :key="`log-line_${i}`">{{ line.message }}</span>
            </div>
            <ipl-button @click="modelVisible = false" :disabled="!completed" data-test="close-button" label="Close" />
        </div>
    </ipl-overlay>
</template>

<script lang="ts">
import { computed, defineComponent, onUnmounted, watch } from 'vue'
import IplOverlay from '@/components/ipl/iplOverlay.vue'
import IplButton from '@/components/ipl/iplButton.vue'
import { useLogStore } from '@/store/log'

export default defineComponent({
    name: 'LogOverlay',

    emits: ['update:visible'],

    components: { IplOverlay, IplButton },

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

        watch(() => props.logKey, (newValue, oldValue) => {
            logStore.dispatch('unlisten', oldValue)
            logStore.dispatch('listen', newValue)
        }, { immediate: true })

        onUnmounted(() => {
            logStore.dispatch('unlisten', props.logKey)
        })

        return {
            log: computed(() => logStore.state.lines[props.logKey] ?? []),
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

<style lang="scss" scoped>
@import 'src/styles/layout';
@import 'src/styles/text';
@import 'src/styles/colors';

.log-overlay {
    .log-display {
        font-family: monospace;
        width: calc(100vw - 65px);
        max-height: 350px;
        text-align: left;
        border: 1px solid $input-color;
        padding: 4px 2px;
        min-height: 64px;
        overflow: scroll;
        color: var(--text-color);
        background-color: var(--background-secondary);

        span {
            margin-left: 6px;
            display: block;
            white-space: nowrap;

            &.type-error {
                color: $error-color;
            }
        }
    }
}
</style>
