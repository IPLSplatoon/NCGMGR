import { readDir, readTextFile } from '@tauri-apps/api/fs'
import { PackageSchema } from '@/types/package'
import isEmpty from 'lodash/isEmpty'
import { InstallStatus } from '@/store/nodecg'

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

    const dir = await readDir(directory + '/bundles', { recursive: true })
    return Promise.all(
        dir
            .filter(entry => entry.children?.some(child => child.name === 'package.json'))
            .map(async (bundle) => {
                const packageFile = bundle.children?.find(child => child.name === 'package.json')?.path
                if (!packageFile) {
                    throw new Error('Missing package.json')
                }

                const packageJson = JSON.parse(await readTextFile(packageFile)) as PackageSchema

                return {
                    name: packageJson.name,
                    version: packageJson.version
                }
            }))
}