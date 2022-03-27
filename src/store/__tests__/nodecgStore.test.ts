import { InstallStatus, useNodecgStore } from '@/store/nodecgStore'
import { getBundles, getNodecgStatus } from '@/service/nodecgService'
import { useConfigStore } from '@/store/configStore'
import Mock = jest.Mock
import { createPinia, setActivePinia } from 'pinia'

jest.mock('@/service/nodecgService')

describe('nodecgStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    describe('checkNodecgStatus', () => {
        it('sets status to unknown before status is found', () => {
            const nodecgStore = useNodecgStore();
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            (getNodecgStatus as Mock).mockImplementation(() => new Promise(() => {}))

            nodecgStore.checkNodecgStatus()

            expect(nodecgStore.status.installStatus).toEqual(InstallStatus.UNKNOWN)
            expect(nodecgStore.status.message).toEqual('Checking status...')
        })

        it('sets status', async () => {
            const nodecgStore = useNodecgStore();
            (getNodecgStatus as Mock).mockResolvedValue({
                status: InstallStatus.READY_TO_INSTALL,
                message: 'Message!'
            })

            await nodecgStore.checkNodecgStatus()

            expect(nodecgStore.status.installStatus).toEqual(InstallStatus.READY_TO_INSTALL)
            expect(nodecgStore.status.message).toEqual('Message!')
        })

        it('handles status check throwing error', async () => {
            const nodecgStore = useNodecgStore();
            (getNodecgStatus as Mock).mockRejectedValue(new Error('Failure!'))

            await nodecgStore.checkNodecgStatus()

            expect(nodecgStore.status.installStatus).toEqual(InstallStatus.UNABLE_TO_INSTALL)
            expect(nodecgStore.status.message).toEqual('Error: Failure!')
        })

        it('gets bundles if nodecg is installed', async () => {
            const nodecgStore = useNodecgStore();
            (getNodecgStatus as Mock).mockResolvedValue({
                status: InstallStatus.INSTALLED,
                message: 'Found!'
            })

            await nodecgStore.checkNodecgStatus()

            expect(nodecgStore.status.installStatus).toEqual(InstallStatus.INSTALLED)
            expect(nodecgStore.status.message).toEqual('Found!')
            expect(getBundles).toHaveBeenCalled()
        })
    })

    describe('getBundleList', () => {
        it('sets bundlesLoading to true before reading bundle data', () => {
            const nodecgStore = useNodecgStore();
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            (getBundles as Mock).mockImplementation(() => new Promise(() => {}))

            nodecgStore.getBundleList()

            expect(nodecgStore.status.bundlesLoading).toEqual(true)
            expect(getBundles).toHaveBeenCalled()
        })

        it('reads bundle data', async () => {
            const nodecgStore = useNodecgStore()
            useConfigStore().installPath = '/install/path';
            (getBundles as Mock).mockResolvedValue([{ name: 'Cool Bundle' }])

            await nodecgStore.getBundleList()

            expect(nodecgStore.bundles).toEqual([{ name: 'Cool Bundle' }])
            expect(getBundles).toHaveBeenCalledWith('/install/path')
        })
    })
})
