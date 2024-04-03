<template>
    <div class="log-display">
        <span
            v-for="(line, i) in log"
            :key="`log-line_${i}`"
            :class="`type-${line.type ?? 'unknown'}`"
        >
            <template
                v-for="(part, j) in line.messageParts"
            >
                <template v-if="!part.was_processed">
                    {{ part.content }}
                </template>
                <span
                    v-else
                    :key="`log-line_${i}_${j}`"
                    :class="classListFromLogLine(part)"
                >
                    {{ part.content }}
                </span>
            </template>
        </span>
    </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, watch } from 'vue'
import { useLogStore } from '@/store/logStore'
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
                logStore.unlisten(oldValue)
            }
            logStore.listen(newValue)
        })

        onMounted(() => {
            logStore.listen(props.logKey)
        })

        onUnmounted(() => {
            logStore.unlisten(props.logKey)
        })

        return {
            log: computed(() => {
                const log = logStore.lines[props.logKey] ?? []
                return log.map(line => ({
                    ...line,
                    messageParts: Anser.ansiToJson(line.message, { use_classes: true })
                }))
            }),
            classListFromLogLine(line: Anser.AnserJsonEntry) {
                const result = []

                if (line.bg != null) {
                    result.push(`${line.bg}-bg`)
                }
                if (line.fg != null) {
                    result.push(`${line.fg}-fg`)
                }

                return result
            }
        }
    }
})
</script>

<style lang="scss" scoped>
@import '../../styles/layout';
@import '../../styles/text';
@import '../../styles/colors';

.log-display {
    font-family: monospace;
    width: calc(100% - 8px);
    max-height: 350px;
    text-align: left;
    border: 1px solid $input-color;
    padding: 4px 2px;
    min-height: 64px;
    overflow: scroll;
    color: var(--ipl-body-text-color);
    background-color: var(--ipl-bg-primary);

    > span {
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
