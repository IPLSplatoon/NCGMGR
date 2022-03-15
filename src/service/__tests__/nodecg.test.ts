import { mockTauri, mockTauriFs } from '@/__mocks__/tauri'
import { getBundles, getBundleVersions, getNodecgStatus } from '@/service/nodecg'
import { InstallStatus } from '@/store/nodecg'

describe('getNodecgStatus', () => {
    it('returns ready to install response when directory is empty', async () => {
        mockTauriFs.readDir.mockResolvedValue([])

        const result = await getNodecgStatus('/dir/')

        expect(result).toEqual({
            status: InstallStatus.READY_TO_INSTALL,
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
            status: InstallStatus.INSTALLED,
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
            status: InstallStatus.UNABLE_TO_INSTALL,
            message: 'Found unknown package "other_pkg".'
        })
        expect(mockTauriFs.readDir).toHaveBeenCalledWith('/directory/')
        expect(mockTauriFs.readTextFile).toHaveBeenCalledWith('/directory/package.json')
    })

    it('returns error response if directory does not contain package.json', async () => {
        mockTauriFs.readDir.mockResolvedValue([{ name: 'file.png' }, { name: 'file.rar' }])

        const result = await getNodecgStatus('/directory/')

        expect(result).toEqual({
            status: InstallStatus.UNABLE_TO_INSTALL,
            message: 'Could not find package.json.'
        })
        expect(mockTauriFs.readDir).toHaveBeenCalledWith('/directory/')
        expect(mockTauriFs.readTextFile).not.toHaveBeenCalled()
    })

    it('returns error response if directory is empty string', async () => {
        const result = await getNodecgStatus('   ')

        expect(result).toEqual({
            status: InstallStatus.UNABLE_TO_INSTALL,
            message: 'Please select an installation directory.'
        })
        expect(mockTauriFs.readDir).not.toHaveBeenCalled()
        expect(mockTauriFs.readTextFile).not.toHaveBeenCalled()
    })
})

describe('getBundles', () => {
    it('throws error when no bundle directory is given', async () => {
        await expect(getBundles('   ')).rejects.toThrow('No bundle directory provided.')
    })

    it('reads bundles directory and parses package.json files', async () => {
        mockTauriFs.readTextFile
            .mockResolvedValueOnce(JSON.stringify({ name: 'bundle-one', version: '1.0.0' }))
            .mockResolvedValueOnce(JSON.stringify({ name: 'bundle-two', version: '1.0.1' }))
        mockTauriFs.readDir.mockResolvedValue([
            { children: null },
            { children: [{ name: 'file.txt' }] },
            { children: [{ name: 'package.json', path: 'package-json-path-1' }] },
            { children: [{ name: 'other-file' }, { name: 'package.json', path: 'package-json-path-2' }] }
        ])

        const result = await getBundles('nodecg/dir')

        expect(mockTauriFs.readDir).toHaveBeenCalledWith('nodecg/dir/bundles', { recursive: true })
        expect(mockTauriFs.readTextFile).toHaveBeenCalledWith('package-json-path-1')
        expect(mockTauriFs.readTextFile).toHaveBeenCalledWith('package-json-path-2')
        expect(result).toEqual([
            { name: 'bundle-one', version: '1.0.0' },
            { name: 'bundle-two', version: '1.0.1' }
        ])
    })
})

describe('getBundleVersions', () => {
    it('invokes tauri method', async () => {
        mockTauri.invoke.mockResolvedValue(['1.0.0', '2.0.0'])

        const result = await getBundleVersions('bundle-name', 'nodecg/path')

        expect(mockTauri.invoke).toHaveBeenCalledWith(
            'fetch_bundle_versions', { bundleName: 'bundle-name', nodecgPath: 'nodecg/path' })
        expect(result).toEqual(['1.0.0', '2.0.0'])
    })
})
