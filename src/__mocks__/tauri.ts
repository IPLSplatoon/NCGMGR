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
