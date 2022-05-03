<template>
    <ipl-space class="error-list">
        <div class="m-y-8 m-x-8 text-center">
            <div class="m-b-8">
                Errors that have occurred in this application will be listed here.<br>
                It is most useful to developers for diagnosing issues.
            </div>
            <ipl-button
                :disabled="!errorsPresent"
                label="Clear"
                @click="errorHandlerStore.clear()"
            />
        </div>

        <ipl-expanding-space-group v-if="errorsPresent">
            <ipl-expanding-space
                v-for="(error, key) in errorHandlerStore.recentErrors"
                :key="key"
                :title="addDots(String(error.err))"
                class="error-list-item"
            >
                <ipl-data-row label="Info" :value="error.info" />
                <template v-if="error.component">
                    <ipl-data-row label="Source component" :value="error.component.$.type.name" />
                </template>
                <ipl-data-row label="Full error" :value="String(error.err)" />
            </ipl-expanding-space>
        </ipl-expanding-space-group>
        <div v-else class="m-l-8 m-y-8 text-center">No errors yet!</div>
    </ipl-space>
</template>

<script lang="ts">
import { defineComponent } from '@vue/runtime-core'
import { useErrorHandlerStore } from '@/store/errorHandlerStore'
import { IplButton, IplDataRow, IplExpandingSpace, IplExpandingSpaceGroup, IplSpace } from '@iplsplatoon/vue-components'
import { computed } from 'vue'
import { addDots } from '@/util/stringUtil'

export default defineComponent({
    name: 'ErrorList',

    components: { IplSpace, IplDataRow, IplButton, IplExpandingSpaceGroup, IplExpandingSpace },

    setup () {
        const errorHandlerStore = useErrorHandlerStore()

        return {
            errorHandlerStore,
            errorsPresent: computed(() => Object.keys(errorHandlerStore.recentErrors).length > 0),
            addDots
        }
    }
})
</script>

<style lang="scss" scoped>
.error-list {
    padding: 0;
}

.error-list-item {
    border-radius: 0;
    border: 0;
    border-top: 1px solid var(--space-border);
}
</style>
