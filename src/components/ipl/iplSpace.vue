<template>
    <div
        class="ipl-space"
        :class="`color-${color}`"
    >
        <slot />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

export default defineComponent({
    name: 'IplSpace',

    props: {
        color: {
            type: String as PropType<'dark' | 'light'>,
            default: 'dark',
            validator: (value: string): boolean => {
                return ['dark', 'light'].includes(value)
            }
        }
    }
})
</script>

<style lang="scss" scoped>
@import 'src/styles/colors';
@import 'src/styles/constants';

.ipl-space {
    border-radius: $border-radius-outer;
    padding: 8px;

    &.color-light {
        background-color: var(--background-secondary);
    }

    &.color-dark {
        background-color: var(--background-primary);
    }
}
</style>
