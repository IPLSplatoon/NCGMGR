import { defineStore } from 'pinia'
import { isBlank } from '@iplsplatoon/vue-components'
import { getNodejsVersion } from '@/service/dependencyService'

interface DependencyStore {
    isLoading: boolean
    nodejs: {
        version: string | null
    }
}

export const useDependencyStore = defineStore('dependency', {
    state: () => ({
        isLoading: false,
        nodejs: {
            version: null
        }
    } as DependencyStore),
    getters: {
        hasNodejs: state => !isBlank(state.nodejs.version)
    },
    actions: {
        async checkVersions () {
            this.isLoading = true
            try {
                this.nodejs.version = await getNodejsVersion()
            } finally {
                this.isLoading = false
            }
        }
    }
})
