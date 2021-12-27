import { readDir, readTextFile } from '@tauri-apps/api/fs'
import { PackageSchema } from '@/types/package'
import isEmpty from 'lodash/isEmpty'
import { NodecgStatus } from '@/store/status'

export async function getNodecgStatus (directory: string): Promise<{ status: NodecgStatus, message: string }> {
    if (isEmpty(directory?.trim())) {
        return {
            status: NodecgStatus.UNABLE_TO_INSTALL,
            message: 'Please select an installation directory.'
        }
    }

    const dir = await readDir(directory)
    if (dir.length < 1) {
        return {
            status: NodecgStatus.READY_TO_INSTALL,
            message: 'Directory is empty. Ready to install...'
        }
    } else {
        const packageFile = dir.find(entry => entry.name === 'package.json')
        if (packageFile) {
            const packageJson: PackageSchema = JSON.parse(await readTextFile(packageFile.path))
            if (packageJson.name === 'nodecg') {
                return {
                    status: NodecgStatus.INSTALLED,
                    message: `Found NodeCG v${packageJson.version}.`
                }
            } else {
                return {
                    status: NodecgStatus.UNABLE_TO_INSTALL,
                    message: `Found unknown package "${packageJson.name}".`
                }
            }
        } else {
            return {
                status: NodecgStatus.UNABLE_TO_INSTALL,
                message: 'Could not find package.json.'
            }
        }
    }
}
