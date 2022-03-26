import { mockTauri } from '@/__mocks__/tauri'
import { getNodejsVersion } from '@/service/dependencyService'

describe('dependencyService', () => {
    describe('getNodejsVersion', () => {
        it('invokes tauri method', async () => {
            mockTauri.invoke.mockResolvedValue('12.13.1')

            const result = await getNodejsVersion()

            expect(mockTauri.invoke).toHaveBeenCalledWith('get_nodejs_version')
            expect(result).toEqual('12.13.1')
        })
    })
})
