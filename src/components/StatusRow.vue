<template>
    <div class="status-row layout horizontal center-vertical">
        <div
            class="status-row__status-light"
            :class="`color-${color}`"
        />
        <slot />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

export type StatusRowColor = 'red' | 'yellow' | 'green' | 'gray'

export default defineComponent({
    name: 'StatusRow',

    props: {
        color: {
            type: String as PropType<StatusRowColor>,
            required: true,
            validator: (value: string) => {
                return ['red', 'yellow', 'green', 'gray'].includes(value)
            }
        }
    }
})
</script>

<style lang="scss" scoped>
@import 'src/styles/colors';

@mixin status-light-color($color) {
    background-color: $color;
    filter: drop-shadow(0 0 3px $color);
}

.status-row {
    overflow-wrap: anywhere;

    .status-row__status-light {
        min-width: 12px;
        height: 12px;
        border-radius: 50%;
        margin: 0 8px 0 4px;

        &.color-red {
            @include status-light-color($red)
        }

        &.color-yellow {
            @include status-light-color($yellow)
        }

        &.color-green {
            @include status-light-color($green)
        }

        &.color-gray {
            @include status-light-color($input-color)
        }
    }
}
</style>
