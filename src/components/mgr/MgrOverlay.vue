<template>
    <dialog
        ref="dialog"
        @close="onClose"
        @cancel.prevent="onCancel"
        @click.self="onClick"
    >
        <div class="content">
            <slot />
        </div>
    </dialog>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, watch } from 'vue'

async function animationsComplete(element: HTMLElement): Promise<unknown> {
    return Promise.allSettled(element.getAnimations().map(animation => animation.finished))
}

export default defineComponent({
    name: 'MgrOverlay',

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

    emits: ['update:visible'],

    setup (props, { emit }) {
        const dialog = ref<HTMLDialogElement | null>(null)

        async function onClose() {
            if (!dialog.value) return
            dialog.value.setAttribute('inert', '')
            await animationsComplete(dialog.value)
            dialog.value.close()
        }

        onMounted(() => {
            if (!props.visible) {
                dialog.value?.setAttribute('inert', '')
            } else {
                dialog.value?.showModal()
            }

            watch(() => props.visible, newValue => {
                if (newValue) {
                    dialog.value?.removeAttribute('inert')
                    dialog.value?.showModal()
                } else {
                    onClose()
                }
            })
        })

        return {
            dialog,
            onClose() {
                emit('update:visible', false)
            },
            onCancel() {
                if (!props.noBackgroundClose) {
                    onClose()
                }
            },
            onClick() {
                if (!props.noBackgroundClose) {
                    onClose()
                }
            }
        }
    }
})
</script>

<style lang="scss" scoped>
@use '../../styles/constants';

dialog {
    border: none;
    background-color: var(--ipl-bg-primary);
    color: var(--ipl-body-text-color);
    width: 85%;
    max-height: 80%;
    height: max-content;
    box-sizing: border-box;
    //margin: 0;
    padding: 0;
    inset: 0;
    display: block;
    position: fixed;
    // Unfortunately, if you want animation, you'll have to put up with this.
    z-index: 999999;
    transform: scale(0.9);
    opacity: 0;
    border-radius: constants.$border-radius-outer;

    &:not([open]) {
        pointer-events: none;
    }

    &[open] {
        animation: enter constants.$transition-duration-low ease-out forwards;

        &::backdrop {
            animation: backdrop-in constants.$transition-duration-low ease-out forwards;
        }

        &[inert] {
            animation: exit constants.$transition-duration-low ease-in forwards;

            &::backdrop {
                animation: backdrop-out constants.$transition-duration-low ease-out forwards;
            }
        }
    }

    &::backdrop {
        background: var(--ipl-page-overlay-color);
    }

    > .content {
        padding: 8px;
        box-sizing: border-box;
    }

    &:focus-visible {
        outline: var(--ipl-focus-outline-color) solid var(--ipl-focus-outline-width);
    }
}

@keyframes enter {
    to {
        transform: scale(1);
        opacity: 1;
    }
}

@keyframes exit {
    0% {
        transform: scale(1);
        opacity: 1;
    }

    100% {
        transform: scale(0.9);
        opacity: 0;
    }
}

@keyframes backdrop-in {
    0% {
        opacity: 0;
    }

    100% {
        opacity: 1;
    }
}

@keyframes backdrop-out {
    0% {
        opacity: 1;
    }

    100% {
        opacity: 0;
    }
}
</style>
