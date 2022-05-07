import { EventCallback, listen, UnlistenFn } from '@tauri-apps/api/event'

export interface ProcessTerminationMessage {
    code: number
    success: boolean
}

export async function listenForProcessExit (key: string, callback: EventCallback<ProcessTerminationMessage>): Promise<UnlistenFn> {
    return listen<ProcessTerminationMessage>(`process-exit:${key}`, callback)
}
