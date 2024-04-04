import { invoke } from '@tauri-apps/api/core'

export async function getNodejsVersion (): Promise<string | null> {
    return invoke('get_nodejs_version')
}
