import { readDir, readTextFile } from '@tauri-apps/api/fs'

export async function folderExists (path: string): Promise<boolean> {
    try {
        await readDir(path)
        return true
    } catch (e) {
        if (String(e).includes('os error 2')) {
            return false
        } else throw e
    }
}

export async function fileExists (path: string): Promise<boolean> {
    try {
        await readTextFile(path)
        return true
    } catch (e) {
        if (String(e).includes('os error 2')) {
            return false
        } else throw e
    }
}
