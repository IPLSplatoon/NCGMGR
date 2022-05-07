<template>
    <transition name="overlay">
        <div
            v-if="visible"
            @click.self="close"
            class="mgr-overlay__wrapper layout horizontal center-horizontal center-vertical"
        >
            <div class="mgr-overlay__content" :class="{ 'max-width': maxWidth }">
                <slot />
            </div>
        </div>
    </transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    name: 'MgrOverlay',

    emits: ['update:visible'],

    props: {
        visible: {
            type: Boolean,
            required: true
        },
        noBackgroundClose: {
            type: Boolean,
            default: false
        },
        maxWidth: {
            type: Boolean,
            default: false
        }
    },

    setup (props, { emit }) {
        return {
            close () {
                if (!props.noBackgroundClose) {
                    emit('update:visible', false)
                }
            }
        }
    }
})
</script>

<style lang="scss" scoped>
@import '../../styles/layout';
@import '../../styles/colors';
@import '../../styles/constants';

.overlay-leave-active {
    transition: opacity $transition-duration-low ease-in;
}

.overlay-enter-active, {
    transition: opacity $transition-duration-low ease-out;
}

.overlay-enter-from,
.overlay-leave-to {
    opacity: 0;
}

.mgr-overlay__wrapper {
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;

    z-index: 1000;

    background-color: rgba(0, 0, 0, 0.5);

    .mgr-overlay__content {
        max-width: 90%;
        max-height: 80%;
        min-width: 400px;
        background-color: var(--background-primary);
        overflow-y: auto;
        overflow-x: hidden;
        padding: 8px;
        display: block;
        position: relative;
        border-radius: $border-radius-outer;
        filter: drop-shadow(2px 2px 3px rgba(0, 0, 0, 0.5));
    }
}
</style>
