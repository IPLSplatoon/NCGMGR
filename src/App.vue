<template>
    <installer />
    <bundle-manager class="m-t-8" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Installer from '@/components/installer.vue'
import BundleManager from '@/components/bundleManager.vue'

export default defineComponent({
    name: 'App',

    components: { BundleManager, Installer }
})
</script>
