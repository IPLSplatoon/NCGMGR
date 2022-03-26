import { mockTauri, mockTauriFs, mockTauriShell } from '@/__mocks__/tauri'
import {
    configFileExists, createConfigFile,
    getBundles,
    getBundleVersions, getNodecgConfig,
    getNodecgStatus,
    openConfigFile,
    removeBundle
} from '@/service/nodecg'
import { InstallStatus } from '@/store/nodecg'
import { fileExists, folderExists } from '@/util/fs'
import Mock = jest.Mock
import { readTextFile } from '@tauri-apps/api/fs'

jest.mock('@/util/fs')

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

describe('configFileExists', () => {
    it('returns true when config file is found', async () => {
        (fileExists as Mock).mockResolvedValue(true)

        const result = await configFileExists('bundle-two', '/nodecg/path')

        expect(fileExists).toHaveBeenCalledWith('/nodecg/path/cfg/bundle-two.json')
        expect(result).toEqual(true)
    })

    it('returns false when config file is not found', async () => {
        (fileExists as Mock).mockResolvedValue(false)

        const result = await configFileExists('bundle-two', '/nodecg/path')

        expect(fileExists).toHaveBeenCalledWith('/nodecg/path/cfg/bundle-two.json')
        expect(result).toEqual(false)
    })
})

describe('removeBundle', () => {
    it('removes bundle directory and config file', async () => {
        mockTauri.invoke.mockResolvedValue({});
        (fileExists as Mock).mockResolvedValue(true)
        mockTauriFs.removeFile.mockResolvedValue({})

        await removeBundle('bundle-name', '/nodecg/path')

        expect(mockTauri.invoke).toHaveBeenCalledWith('uninstall_bundle', { nodecgPath: '/nodecg/path', bundleName: 'bundle-name' })
        expect(fileExists).toHaveBeenCalledWith('/nodecg/path/cfg/bundle-name.json')
        expect(mockTauriFs.removeFile).toHaveBeenCalledWith('/nodecg/path/cfg/bundle-name.json')
    })

    it('does not remove config file if it is missing', async () => {
        mockTauri.invoke.mockResolvedValue({});
        (fileExists as Mock).mockResolvedValue(false)
        mockTauriFs.removeFile.mockResolvedValue({})

        await removeBundle('bundle-name', '/nodecg/path')

        expect(mockTauri.invoke).toHaveBeenCalledWith('uninstall_bundle', { nodecgPath: '/nodecg/path', bundleName: 'bundle-name' })
        expect(fileExists).toHaveBeenCalledWith('/nodecg/path/cfg/bundle-name.json')
        expect(mockTauriFs.removeFile).not.toHaveBeenCalled()
    })
})

describe('openConfigFile', () => {
    it('opens file at expected path', () => {
        openConfigFile('bundle-name', '/nodecg/path')

        expect(mockTauriShell.open).toHaveBeenCalledWith('/nodecg/path/cfg/bundle-name.json')
    })
})

describe('createConfigFile', () => {
    it('creates config folder if required and writes new file', async () => {
        (folderExists as Mock).mockResolvedValue(false)
        mockTauriFs.createDir.mockResolvedValue({ })

        await createConfigFile('bundleName', '/nodecg/path')

        expect(folderExists).toHaveBeenCalledWith('/nodecg/path/cfg')
        expect(mockTauriFs.createDir).toHaveBeenCalledWith('/nodecg/path/cfg')
        expect(mockTauriFs.writeFile).toHaveBeenCalledWith({ path: '/nodecg/path/cfg/bundleName.json', contents: '{\n\n}' })
    })

    it('does not create config folder if it already exists and writes new file', async () => {
        (folderExists as Mock).mockResolvedValue(true)

        await createConfigFile('bundle-name', '/nodecg/path')

        expect(folderExists).toHaveBeenCalledWith('/nodecg/path/cfg')
        expect(mockTauriFs.createDir).not.toHaveBeenCalled()
        expect(mockTauriFs.writeFile).toHaveBeenCalledWith({ path: '/nodecg/path/cfg/bundle-name.json', contents: '{\n\n}' })
    })
})

describe('getNodecgConfig', () => {
    it('returns null if config folder is not present', async () => {
        (folderExists as Mock).mockResolvedValue(false)

        const result = await getNodecgConfig('/path')

        expect(folderExists).toHaveBeenCalledWith('/path/cfg')
        expect(fileExists).not.toHaveBeenCalled()
        expect(readTextFile).not.toHaveBeenCalled()
        expect(result).toEqual(null)
    })

    it('returns null if config file is not present', async () => {
        (folderExists as Mock).mockResolvedValue(true);
        (fileExists as Mock).mockResolvedValue(false)

        const result = await getNodecgConfig('/path')

        expect(folderExists).toHaveBeenCalledWith('/path/cfg')
        expect(fileExists).toHaveBeenCalledWith('/path/cfg/nodecg.json')
        expect(readTextFile).not.toHaveBeenCalled()
        expect(result).toEqual(null)
    })

    it('returns nodecg config file as object', async () => {
        (folderExists as Mock).mockResolvedValue(true);
        (fileExists as Mock).mockResolvedValue(true);
        (readTextFile as Mock).mockResolvedValue(JSON.stringify({ port: 8090 }))

        const result = await getNodecgConfig('/nodecg/path')

        expect(folderExists).toHaveBeenCalledWith('/nodecg/path/cfg')
        expect(fileExists).toHaveBeenCalledWith('/nodecg/path/cfg/nodecg.json')
        expect(readTextFile).toHaveBeenCalledWith('/nodecg/path/cfg/nodecg.json')
        expect(result).toEqual({ port: 8090 })
    })
})
