<template>
    <ipl-space>
        {{ bundles }}
    </ipl-space>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import IplSpace from '@/components/ipl/iplSpace.vue'

export default defineComponent({
    name: 'BundleManager',

    components: { IplSpace },

    setup () {
        return {
            bundles: ref('Bundle manager placeholder')
        }
    }
})
</script>
