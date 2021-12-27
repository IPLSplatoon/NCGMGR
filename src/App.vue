<template>
    <installer />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Installer from '@/components/installer.vue'

export default defineComponent({
    name: 'App',

    components: { Installer }
})
</script>
