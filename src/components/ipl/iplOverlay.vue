<template>
    <transition name="overlay">
        <div v-if="visible" @click.self="close" class="ipl-overlay__wrapper layout horizontal center-horizontal center-vertical">
            <div class="ipl-overlay__content">
                <slot />
            </div>
        </div>
    </transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    name: 'IplOverlay',

    emits: ['update:visible'],

    props: {
        visible: {
            type: Boolean,
            required: true
        }
    },

    setup (props, { emit }) {
        return {
            close () {
                emit('update:visible', false)
            }
        }
    }
})
</script>

<style lang="scss" scoped>
@import '../../styles/layout';

.overlay-leave-active {
    transition: opacity 100ms ease-in;
}

.overlay-enter-active, {
    transition: opacity 100ms ease-out;
}

.overlay-enter-from,
.overlay-leave-to {
    opacity: 0;
}

.ipl-overlay__wrapper {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;

    z-index: 1000;

    background-color: rgba(0, 0, 0, 0.25);

    .ipl-overlay__content {
        max-width: 90%;
        max-height: 80%;
        background-color: white;
        outline: 1px solid #222;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 8px;
        display: block;
        position: relative;
    }
}
</style>
