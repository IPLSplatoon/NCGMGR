import { invoke } from '@tauri-apps/api/tauri'

export async function getNodejsVersion (): Promise<string | null> {
    return invoke('get_nodejs_version')
}
