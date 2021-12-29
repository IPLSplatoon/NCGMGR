<template>
    <div class="log-display">
        <span :class="`type-${line.type ?? 'unknown'}`" v-for="(line, i) in log" :key="`log-line_${i}`">{{ line.message }}</span>
    </div>
</template>

<script lang="ts">
import { computed, defineComponent, onUnmounted, watch } from 'vue'
import { useLogStore } from '@/store/log'

export default defineComponent({
    name: 'LogDisplay',

    props: {
        logKey: {
            type: String,
            required: true
        }
    },

    setup (props) {
        const logStore = useLogStore()

        watch(() => props.logKey, (newValue, oldValue) => {
            if (oldValue) {
                logStore.dispatch('unlisten', oldValue)
            }
            logStore.dispatch('listen', newValue)
        }, { immediate: true })

        onUnmounted(() => {
            logStore.dispatch('unlisten', props.logKey)
        })

        return {
            log: computed(() => logStore.state.lines[props.logKey] ?? [])
        }
    }
})
</script>

<style lang="scss" scoped>
@import 'src/styles/layout';
@import 'src/styles/text';
@import 'src/styles/colors';

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
</style>
