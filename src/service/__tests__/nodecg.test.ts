import { mockTauriFs } from '@/__mocks__/tauri'
import { getNodecgStatus } from '@/service/nodecg'
import { NodecgStatus } from '@/store/nodecg'

describe('getNodecgStatus', () => {
    it('returns ready to install response when directory is empty', async () => {
        mockTauriFs.readDir.mockResolvedValue([])

        const result = await getNodecgStatus('/dir/')

        expect(result).toEqual({
            status: NodecgStatus.READY_TO_INSTALL,
            message: 'Directory is empty. Ready to install...'
        })
        expect(mockTauriFs.readDir).toHaveBeenCalledWith('/dir/')
        expect(mockTauriFs.readTextFile).not.toHaveBeenCalled()
    })

    it('returns installed response if nodecg package.json is found', async () => {
        mockTauriFs.readDir.mockResolvedValue([{ name: 'file.png' }, { name: 'package.json', path: '/dir/package.json' }])
        mockTauriFs.readTextFile.mockResolvedValue('{"name": "nodecg", "version": "1.2.3"}')

        const result = await getNodecgStatus('/dir/')

        expect(result).toEqual({
            status: NodecgStatus.INSTALLED,
            message: 'Found NodeCG v1.2.3.'
        })
        expect(mockTauriFs.readDir).toHaveBeenCalledWith('/dir/')
        expect(mockTauriFs.readTextFile).toHaveBeenCalledWith('/dir/package.json')
    })

    it('returns error response if unknown package.json is found', async () => {
        mockTauriFs.readDir.mockResolvedValue([{ name: 'file.png' }, { name: 'package.json', path: '/directory/package.json' }])
        mockTauriFs.readTextFile.mockResolvedValue('{"name": "other_pkg", "version": "1.2.3"}')

        const result = await getNodecgStatus('/directory/')

        expect(result).toEqual({
            status: NodecgStatus.UNABLE_TO_INSTALL,
            message: 'Found unknown package "other_pkg".'
        })
        expect(mockTauriFs.readDir).toHaveBeenCalledWith('/directory/')
        expect(mockTauriFs.readTextFile).toHaveBeenCalledWith('/directory/package.json')
    })

    it('returns error response if directory does not contain package.json', async () => {
        mockTauriFs.readDir.mockResolvedValue([{ name: 'file.png' }, { name: 'file.rar' }])

        const result = await getNodecgStatus('/directory/')

        expect(result).toEqual({
            status: NodecgStatus.UNABLE_TO_INSTALL,
            message: 'Could not find package.json.'
        })
        expect(mockTauriFs.readDir).toHaveBeenCalledWith('/directory/')
        expect(mockTauriFs.readTextFile).not.toHaveBeenCalled()
    })

    it('returns error response if directory is empty string', async () => {
        const result = await getNodecgStatus('   ')

        expect(result).toEqual({
            status: NodecgStatus.UNABLE_TO_INSTALL,
            message: 'Please select an installation directory.'
        })
        expect(mockTauriFs.readDir).not.toHaveBeenCalled()
        expect(mockTauriFs.readTextFile).not.toHaveBeenCalled()
    })
})
