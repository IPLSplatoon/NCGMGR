import { listenForProcessExit } from '@/service/messagingService'
import { mockTauriEvent } from '@/__mocks__/tauri'

describe('listenForProcessExit', () => {
    it('listens for exit event', async () => {
        const callback = jest.fn()
        const unlisten = jest.fn()
        mockTauriEvent.listen.mockResolvedValue(unlisten)

        const result = await listenForProcessExit('key', callback)

        expect(result).toEqual(unlisten)
        expect(mockTauriEvent.listen).toHaveBeenCalledWith('process-exit:key', callback)
    })
})
