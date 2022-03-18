import { readDir, readTextFile, removeDir, removeFile } from '@tauri-apps/api/fs'
import { PackageSchema } from '@/types/package'
import isEmpty from 'lodash/isEmpty'
import { InstallStatus } from '@/store/nodecg'
import { invoke } from '@tauri-apps/api/tauri'

export async function getNodecgStatus (directory: string): Promise<{ status: InstallStatus, message: string }> {
    if (isEmpty(directory?.trim())) {
        return {
            status: InstallStatus.UNABLE_TO_INSTALL,
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
            const packageJson: PackageSchema = JSON.parse(await readTextFile(packageFile.path))
            if (packageJson.name === 'nodecg') {
                return {
                    status: InstallStatus.INSTALLED,
                    message: `Found NodeCG v${packageJson.version}.`
                }
            } else {
                return {
                    status: InstallStatus.UNABLE_TO_INSTALL,
                    message: `Found unknown package "${packageJson.name}".`
                }
            }
        } else {
            return {
                status: InstallStatus.UNABLE_TO_INSTALL,
                message: 'Could not find package.json.'
            }
        }
    }
}

export interface Bundle {
    name: string
    version: string
}

export async function getBundles (directory: string): Promise<Bundle[]> {
    if (isEmpty(directory.trim())) {
        throw new Error('No bundle directory provided.')
    }

    const bundlesDir = await readDir(directory + '/bundles', { recursive: true })
    return Promise.all(
        bundlesDir
            .filter(entry => entry.children?.some(child => child.name === 'package.json'))
            .map(async (dir) => {
                const packageFile = dir.children?.find(child => child.name === 'package.json')?.path
                if (!packageFile) {
                    throw new Error(`Missing package.json in directory ${dir.name}`)
                }

                const packageJson = JSON.parse(await readTextFile(packageFile)) as PackageSchema

                return {
                    name: packageJson.name,
                    version: packageJson.version
                }
            }))
}

export async function getBundleVersions (bundleName: string, nodecgPath: string): Promise<string[]> {
    return invoke('fetch_bundle_versions', { bundleName, nodecgPath })
}

export async function configFileExists (bundleName: string, nodecgPath: string): Promise<boolean> {
    const configDir = await readDir(`${nodecgPath}/cfg`)
    return configDir.some(item => item.name === `${bundleName}.json`)
}

export async function removeBundle (bundleName: string, nodecgPath: string): Promise<[void, void]> {
    return Promise.all([
        removeDir(`${nodecgPath}/bundles/${bundleName}`, { recursive: true }),
        (async () => {
            if (await configFileExists(bundleName, nodecgPath)) {
                return removeFile(`${nodecgPath}/cfg/${bundleName}.json`)
            }
        })()
    ])
}
