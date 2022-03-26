export const mockTauriEvent = {
    listen: jest.fn()
}

jest.mock('@tauri-apps/api/event', () => mockTauriEvent)

export const mockTauri = {
    invoke: jest.fn()
}

jest.mock('@tauri-apps/api/tauri', () => mockTauri)

export const mockTauriDialog = {
    open: jest.fn()
}

jest.mock('@tauri-apps/api/dialog', () => mockTauriDialog)

export const mockTauriFs = {
    readDir: jest.fn(),
    readTextFile: jest.fn(),
    removeDir: jest.fn(),
    removeFile: jest.fn(),
    createDir: jest.fn(),
    writeFile: jest.fn()
}

jest.mock('@tauri-apps/api/fs', () => mockTauriFs)

export const mockTauriOs = {
    type: jest.fn()
}

jest.mock('@tauri-apps/api/os', () => mockTauriOs)

export const mockTauriShell = {
    open: jest.fn()
}

jest.mock('@tauri-apps/api/shell', () => mockTauriShell)
