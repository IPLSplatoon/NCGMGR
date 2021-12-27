import { readDir, readTextFile } from '@tauri-apps/api/fs'
import { PackageSchema, PackageStatus } from '@/types/package'
import isEmpty from 'lodash/isEmpty'

export async function getNodecgStatus (directory: string): Promise<{ status: PackageStatus, message: string }> {
    if (isEmpty(directory?.trim())) {
        return {
            status: PackageStatus.UNABLE_TO_INSTALL,
            message: 'Please select an installation directory.'
        }
    }

    const dir = await readDir(directory)
    if (dir.length < 1) {
        return {
            status: PackageStatus.READY_TO_INSTALL,
            message: 'Directory is empty. Ready to install...'
        }
    } else {
        const packageFile = dir.find(entry => entry.name === 'package.json')
        if (packageFile) {
            const packageJson: PackageSchema = JSON.parse(await readTextFile(packageFile.path))
            if (packageJson.name === 'nodecg') {
                return {
                    status: PackageStatus.INSTALLED,
                    message: `Found NodeCG v${packageJson.version}`
                }
            } else {
                return {
                    status: PackageStatus.UNABLE_TO_INSTALL,
                    message: `Found unknown package "${packageJson.name}".`
                }
            }
        } else {
            return {
                status: PackageStatus.UNABLE_TO_INSTALL,
                message: 'Could not find package.json.'
            }
        }
    }
}
