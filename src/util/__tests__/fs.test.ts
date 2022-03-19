import { mockTauriFs } from '@/__mocks__/tauri'
import { fileExists, folderExists } from '@/util/fs'

describe('folderExists', () => {
    it('is true if directory is read successfully', async () => {
        mockTauriFs.readDir.mockResolvedValue({})

        const result = await folderExists('/path/path')

        expect(mockTauriFs.readDir).toHaveBeenCalledWith('/path/path')
        expect(result).toEqual(true)
    })

    it('returns false when reading directory throws not found error', async () => {
        mockTauriFs.readDir.mockRejectedValue('path: /path: No such file or directory (os error 2)')

        const result = await folderExists('/path')

        expect(mockTauriFs.readDir).toHaveBeenCalledWith('/path')
        expect(result).toEqual(false)
    })

    it('throws on other errors', async () => {
        mockTauriFs.readDir.mockRejectedValue('path: /path (non recursive): File exists (os error 17)')

        await expect(folderExists('/cool/path')).rejects.toEqual('path: /path (non recursive): File exists (os error 17)')
        expect(mockTauriFs.readDir).toHaveBeenCalledWith('/cool/path')
    })
})

describe('fileExists', () => {
    it('is true if directory is read successfully', async () => {
        mockTauriFs.readTextFile.mockResolvedValue({})

        const result = await fileExists('/path/path')

        expect(mockTauriFs.readTextFile).toHaveBeenCalledWith('/path/path')
        expect(result).toEqual(true)
    })

    it('returns false when reading directory throws not found error', async () => {
        mockTauriFs.readTextFile.mockRejectedValue('path: /path: No such file or directory (os error 2)')

        const result = await fileExists('/path')

        expect(mockTauriFs.readTextFile).toHaveBeenCalledWith('/path')
        expect(result).toEqual(false)
    })

    it('throws on other errors', async () => {
        mockTauriFs.readTextFile.mockRejectedValue('path: /path (non recursive): File exists (os error 17)')

        await expect(fileExists('/cool/path')).rejects.toEqual('path: /path (non recursive): File exists (os error 17)')
        expect(mockTauriFs.readTextFile).toHaveBeenCalledWith('/cool/path')
    })
})
