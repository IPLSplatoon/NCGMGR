<template>
    <div class="log-display">
        <span
            v-for="(line, i) in log"
            :class="`type-${line.type ?? 'unknown'}`"
            :key="`log-line_${i}`"
            v-html="line.message"
        />
    </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, watch } from 'vue'
import { useLogStore } from '@/store/log'
import Anser from 'anser'

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
        })

        onMounted(() => {
            logStore.dispatch('listen', props.logKey)
        })

        onUnmounted(() => {
            logStore.dispatch('unlisten', props.logKey)
        })

        return {
            log: computed(() => {
                const log = logStore.state.lines[props.logKey] ?? []
                return log.map(line => ({ ...line, message: Anser.ansiToHtml(line.message) }))
            })
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
    width: calc(100vw - 60px);
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

        .foo {
            color: red;
        }
    }
}
</style>
