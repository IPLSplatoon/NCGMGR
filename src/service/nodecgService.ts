import { mkdir, readDir, readTextFile, remove, writeFile } from '@tauri-apps/plugin-fs'
import { PackageSchema } from '@/types/package'
import isEmpty from 'lodash/isEmpty'
import { InstallStatus } from '@/store/nodecgStore'
import { invoke } from '@tauri-apps/api/core'
import { fileExists, folderExists } from '@/util/fs'
import { open } from '@tauri-apps/plugin-shell'
import { NodecgConfiguration } from '@/types/nodecg'
import { appLocalDataDir } from '@tauri-apps/api/path'

export async function getDefaultInstallDir (): Promise<string> {
    return `${await appLocalDataDir()}/nodecg`
}

export async function getNodecgStatus (directory: string | null): Promise<{ status: InstallStatus, message: string }> {
    if (directory == null || isEmpty(directory?.trim())) {
        return {
            status: InstallStatus.MISSING_INSTALL_DIRECTORY,
            message: 'Please select an installation directory.'
        }
    }

    const dir = await readDir(directory)
    if (dir.length < 1) {
        return {
            status: InstallStatus.READY_TO_INSTALL,
            message: 'Directory is empty. Ready to install...'
        }
    } else {
        const packageFile = dir.find(entry => entry.name === 'package.json')
        if (packageFile) {
            const packageJson: PackageSchema = JSON.parse(await readTextFile(`${directory}/package.json`))
            if (packageJson.name === 'nodecg') {
                return {
                    status: InstallStatus.INSTALLED,
                    message: `Found NodeCG v${packageJson.version}.`
                }
            } else {
                return {
                    status: InstallStatus.BAD_INSTALL_DIRECTORY,
                    message: `Found unknown package "${packageJson.name}".`
                }
            }
        } else {
            return {
                status: InstallStatus.BAD_INSTALL_DIRECTORY,
                message: 'Selected install directory is not empty, but NodeCG is not installed here.'
            }
        }
    }
}

export interface Bundle {
    name: string
    version?: string
}

export async function getBundles (directory: string | null): Promise<Bundle[]> {
    if (directory == null || isEmpty(directory.trim())) {
        throw new Error('No bundle directory provided.')
    }

    const bundlesDir = await readDir(directory + '/bundles')
    return Promise.all(
        bundlesDir
            .filter(entry => entry.isDirectory)
            .map(async (dir): Promise<Bundle | null> => {
                try {
                    const packageJson = JSON.parse(await readTextFile(`${directory}/bundles/${dir.name}/package.json`)) as PackageSchema
                    return {
                        name: packageJson.name,
                        version: packageJson.version == null || packageJson.version.trim() === '0.0.0'
                            ? await getBundleGitTag(packageJson.name)
                            : packageJson.version
                    }
                } catch (e) {
                    console.error('Failed to read package.json in bundle directory', e)
                    return null
                }
            }))
        .then((bundles) => bundles.filter(bundle => bundle != null) as Bundle[])
}

export async function getBundleVersions (bundleName: string): Promise<string[]> {
    return invoke('fetch_bundle_versions', { bundleName })
}

export async function configFileExists (bundleName: string, nodecgPath: string | null): Promise<boolean> {
    if (nodecgPath == null) {
        return false
    }
    return fileExists(`${nodecgPath}/cfg/${bundleName}.json`)
}

export async function removeBundle (bundleName: string, nodecgPath: string | null): Promise<[string, void]> {
    return Promise.all([
        invoke<string>('uninstall_bundle', { bundleName }),
        (async () => {
            if (await configFileExists(bundleName, nodecgPath)) {
                return remove(`${nodecgPath}/cfg/${bundleName}.json`)
            }
        })()
    ])
}

export async function openConfigFile (bundleName: string, nodecgPath: string | null): Promise<void> {
    if (nodecgPath == null) {
        return
    }

    return open(`${nodecgPath}/cfg/${bundleName}.json`)
}

export async function createConfigFile (bundleName: string, nodecgPath: string | null): Promise<void> {
    if (nodecgPath == null) {
        return
    }

    if (!await folderExists(`${nodecgPath}/cfg`)) {
        await mkdir(`${nodecgPath}/cfg`)
    }

    const encoder = new TextEncoder()
    return writeFile(`${nodecgPath}/cfg/${bundleName}.json`, encoder.encode('{\n\n}'))
}

export async function getNodecgConfig (nodecgPath: string): Promise<NodecgConfiguration | null> {
    if (!await folderExists(`${nodecgPath}/cfg`) || !await fileExists(`${nodecgPath}/cfg/nodecg.json`)) {
        return null
    }

    return JSON.parse(await readTextFile(`${nodecgPath}/cfg/nodecg.json`))
}

export async function openDashboard (nodecgPath: string): Promise<void> {
    const config = await getNodecgConfig(nodecgPath)
    return open(`http://localhost:${config?.port ?? '9090'}/dashboard`)
}

export async function getBundleGitTag (bundleName: string): Promise<string> {
    return invoke('get_bundle_git_tag', { bundleName })
}
