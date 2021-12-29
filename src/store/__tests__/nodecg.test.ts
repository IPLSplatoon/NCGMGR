import { InstallStatus, nodecgStore } from '@/store/nodecg'
import { getNodecgStatus, getBundles } from '@/service/nodecg'
import Mock = jest.Mock
import { configStore } from '@/store/config'

jest.mock('@/service/nodecg')

describe('nodecgStore', () => {
    beforeEach(() => {
        nodecgStore.replaceState({
            status: {
                installStatus: InstallStatus.INSTALLED,
                message: 'Message!',
                bundlesLoading: false
            },
            bundles: []
        })
    })

    describe('checkNodecgStatus', () => {
        it('sets status to unknown before status is found', () => {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            (getNodecgStatus as Mock).mockImplementation(() => new Promise(() => {}))

            nodecgStore.dispatch('checkNodecgStatus')

            expect(nodecgStore.state.status.installStatus).toEqual(InstallStatus.UNKNOWN)
            expect(nodecgStore.state.status.message).toEqual('Checking status...')
        })

        it('sets status', async () => {
            (getNodecgStatus as Mock).mockResolvedValue({
                status: InstallStatus.READY_TO_INSTALL,
                message: 'Message!'
            })

            await nodecgStore.dispatch('checkNodecgStatus')

            expect(nodecgStore.state.status.installStatus).toEqual(InstallStatus.READY_TO_INSTALL)
            expect(nodecgStore.state.status.message).toEqual('Message!')
        })

        it('handles status check throwing error', async () => {
            (getNodecgStatus as Mock).mockRejectedValue(new Error('Failure!'))

            await nodecgStore.dispatch('checkNodecgStatus')

            expect(nodecgStore.state.status.installStatus).toEqual(InstallStatus.UNABLE_TO_INSTALL)
            expect(nodecgStore.state.status.message).toEqual('Error: Failure!')
        })

        it('gets bundles if nodecg is installed', async () => {
            (getNodecgStatus as Mock).mockResolvedValue({
                status: InstallStatus.INSTALLED,
                message: 'Found!'
            })

            await nodecgStore.dispatch('checkNodecgStatus')

            expect(nodecgStore.state.status.installStatus).toEqual(InstallStatus.INSTALLED)
            expect(nodecgStore.state.status.message).toEqual('Found!')
            expect(getBundles).toHaveBeenCalled()
        })
    })

    describe('getBundleList', () => {
        it('sets bundlesLoading to true before reading bundle data', () => {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            (getBundles as Mock).mockImplementation(() => new Promise(() => {}))

            nodecgStore.dispatch('getBundleList')

            expect(nodecgStore.state.status.bundlesLoading).toEqual(true)
            expect(getBundles).toHaveBeenCalled()
        })

        it('reads bundle data', async () => {
            configStore.state.installPath = '/install/path';
            (getBundles as Mock).mockResolvedValue([{ name: 'Cool Bundle' }])

            await nodecgStore.dispatch('getBundleList')

            expect(nodecgStore.state.bundles).toEqual([{ name: 'Cool Bundle' }])
            expect(getBundles).toHaveBeenCalledWith('/install/path')
        })
    })
})
