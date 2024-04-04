export const mockTauriEvent = {
    listen: jest.fn()
}

jest.mock('@tauri-apps/api/event', () => mockTauriEvent)

export const mockTauri = {
    invoke: jest.fn()
}

jest.mock('@tauri-apps/api/core', () => mockTauri)

export const mockTauriDialog = {
    open: jest.fn()
}

jest.mock('@tauri-apps/plugin-dialog', () => mockTauriDialog)

export const mockTauriFs = {
    readDir: jest.fn(),
    readTextFile: jest.fn(),
    removeDir: jest.fn(),
    remove: jest.fn(),
    mkdir: jest.fn(),
    writeFile: jest.fn()
}

jest.mock('@tauri-apps/plugin-fs', () => mockTauriFs)

export const mockTauriOs = {
    type: jest.fn()
}

jest.mock('@tauri-apps/plugin-os', () => mockTauriOs)

export const mockTauriShell = {
    open: jest.fn()
}

jest.mock('@tauri-apps/plugin-shell', () => mockTauriShell)
