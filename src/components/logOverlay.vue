<template>
    <ipl-overlay v-model:visible="modelVisible" class="log-overlay">
        <div class="layout vertical center-horizontal">
            <h2>{{title}}</h2>
            <div class="log-display">
                <span :class="`type-${line.type ?? 'unknown'}`" v-for="(line, i) in log" :key="`log-line_${i}`">{{ line.message }}</span>
            </div>
            <button @click="modelVisible = false" class="m-t-8" :disabled="!completed" data-test="close-button">Close</button>
        </div>
    </ipl-overlay>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import IplOverlay from '@/components/ipl/iplOverlay.vue'
import { useLogStore } from '@/store/log'

export default defineComponent({
    name: 'LogOverlay',

    emits: ['update:visible'],

    components: { IplOverlay },

    props: {
        title: {
            type: String,
            required: true
        },
        visible: {
            type: Boolean,
            required: true
        }
    },

    setup (props, { emit }) {
        const logStore = useLogStore()

        return {
            log: computed(() => logStore.state.lines),
            completed: computed(() => logStore.state.completed),
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

.log-overlay {
    .log-display {
        font-family: monospace;
        width: 100%;
        max-height: 400px;
        text-align: left;
        border: 1px solid #222;
        padding: 2px;
        min-height: 64px;
        overflow: scroll;

        span {
            margin-left: 6px;
            display: block;
            white-space: nowrap;

            &.type-error {
                color: red;
            }
        }
    }
}
</style>
