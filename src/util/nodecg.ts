import npa from 'npm-package-arg'
import * as HostedGitInfo from 'hosted-git-info'

export function normalizeBundlePath (path: string): { isValid: boolean, bundleName?: string, bundleUrl?: string } {
    try {
        const parsedPath = npa(path)
        if (!parsedPath.hosted) {
            return { isValid: false }
        }

        const gitUrl = (parsedPath.hosted as unknown as HostedGitInfo).https()
        if (!gitUrl) {
            return { isValid: false }
        }

        const temp = gitUrl.split('/').pop()

        return {
            isValid: true,
            bundleName: temp?.substr(0, temp.length - 4),
            bundleUrl: gitUrl
        }
    } catch (e) {
        return { isValid: false }
    }
}
