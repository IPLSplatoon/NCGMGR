import { createTestingPinia, TestingPinia } from '@pinia/testing'
import { config, flushPromises, mount } from '@vue/test-utils'
import { getBundleVersions, configFileExists, openConfigFile, createConfigFile } from '@/service/nodecgService'
import BundleConfig from '../BundleConfig.vue'
import Mock = jest.Mock
import type { IplSelect, IplButton } from '@iplsplatoon/vue-components'
import { useLogStore } from '@/store/logStore'
import { mockTauri, mockTauriOs, mockTauriShell } from '@/__mocks__/tauri'
import { useConfigStore } from '@/store/configStore'
import LogOverlay from '@/components/log/LogOverlay.vue'

jest.mock('@/service/nodecgService')

describe('BundleConfig', () => {
    let pinia: TestingPinia
    config.global.stubs = {
        IplButton: true,
        IplSelect: true,
        FontAwesomeIcon: true,
        LogOverlay: true
    }

    beforeEach(() => {
        pinia = createTestingPinia()
        config.global.plugins = [pinia];

        (getBundleVersions as Mock).mockResolvedValue(['1.0.0', '0.0.1']);
        (configFileExists as Mock).mockResolvedValue(true)
        mockTauriOs.type.mockResolvedValue('')
    })

    it('matches snapshot', () => {
        const wrapper = mount(BundleConfig, {
            props: {
                bundle: {
                    name: 'bundle-name',
                    version: '0.0.1'
                }
            }
        })

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot after bundle versions are loaded', async () => {
        const wrapper = mount(BundleConfig, {
            props: {
                bundle: {
                    name: 'bundle-name',
                    version: '0.0.1'
                }
            }
        })
        await flushPromises()

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot when no bundle versions are found', async () => {
        (getBundleVersions as Mock).mockResolvedValue([])
        const wrapper = mount(BundleConfig, {
            props: {
                bundle: {
                    name: 'bundle-name',
                    version: '0.0.1'
                }
            }
        })
        await flushPromises()

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot when config file exists', async () => {
        (configFileExists as Mock).mockResolvedValue(true)
        const wrapper = mount(BundleConfig, {
            props: {
                bundle: {
                    name: 'bundle-name',
                    version: '0.0.1'
                }
            }
        })
        await flushPromises()

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot when config file is missing', async () => {
        (configFileExists as Mock).mockResolvedValue(false)
        const wrapper = mount(BundleConfig, {
            props: {
                bundle: {
                    name: 'bundle-name',
                    version: '0.0.1'
                }
            }
        })
        await flushPromises()

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot when getting bundle versions fails', async () => {
        (getBundleVersions as Mock).mockRejectedValue(new Error('Error!'))
        const wrapper = mount(BundleConfig, {
            props: {
                bundle: {
                    name: 'bundle-name',
                    version: '0.0.1'
                }
            }
        })
        await flushPromises()

        expect(wrapper.html()).toMatchSnapshot()
    })

    it('adds expected version options when loading', () => {
        const wrapper = mount(BundleConfig, {
            props: {
                bundle: {
                    name: 'bundle-name',
                    version: '0.0.1'
                }
            }
        })

        expect(wrapper.getComponent<typeof IplSelect>('[data-test="version-selector"]').vm.$props.options)
            .toEqual([{
                name: 'Loading...',
                value: ''
            }])
    })

    it('adds expected version options when no versions are present', async () => {
        (getBundleVersions as Mock).mockResolvedValue([])
        const wrapper = mount(BundleConfig, {
            props: {
                bundle: {
                    name: 'bundle-name',
                    version: '0.0.1'
                }
            }
        })
        await flushPromises()

        expect(wrapper.getComponent<typeof IplSelect>('[data-test="version-selector"]').vm.$props.options)
            .toEqual([{
                name: 'No versions found',
                value: ''
            }])
    })

    it('adds expected version options when version list is present', async () => {
        const wrapper = mount(BundleConfig, {
            props: {
                bundle: {
                    name: 'bundle-name',
                    version: '0.0.1'
                }
            }
        })
        await flushPromises()

        expect(wrapper.getComponent<typeof IplSelect>('[data-test="version-selector"]').vm.$props.options)
            .toEqual([
                {
                    name: '1.0.0',
                    value: '1.0.0'
                },
                {
                    name: '0.0.1',
                    value: '0.0.1'
                }
            ])
    })

    it('handles setting version', async () => {
        mockTauri.invoke.mockResolvedValue({})
        useConfigStore().installPath = 'nodecg/path'
        const logStore = useLogStore()
        logStore.reset = jest.fn()
        logStore.listen = jest.fn()
        logStore.logPromiseResult = jest.fn()
        const wrapper = mount(BundleConfig, {
            props: {
                bundle: {
                    name: 'bundle-name',
                    version: '0.0.1'
                }
            }
        })
        await flushPromises()

        wrapper.getComponent<typeof IplSelect>('[data-test="version-selector"]').vm.$emit('update:modelValue', '2.0.1')
        wrapper.getComponent<typeof IplButton>('[data-test="set-version-button"]').vm.$emit('click')
        await flushPromises()

        expect(logStore.reset).toHaveBeenCalledWith('change-bundle-version')
        expect(logStore.listen).toHaveBeenCalledWith('change-bundle-version', true)
        expect(mockTauri.invoke).toHaveBeenCalledWith('set_bundle_version', {
            bundleName: 'bundle-name',
            version: '2.0.1',
            nodecgPath: 'nodecg/path'
        })
        expect(logStore.logPromiseResult).toHaveBeenCalledWith({
            promise: expect.anything(),
            key: 'change-bundle-version'
        })
        expect(wrapper.getComponent<typeof LogOverlay>('[data-test="bundle-log-overlay"]').vm.$props.visible)
            .toEqual(true)
    })

    it('handles opening bundle folder', () => {
        useConfigStore().installPath = 'nodecg/path'
        const wrapper = mount(BundleConfig, {
            props: {
                bundle: {
                    name: 'bundle-name',
                    version: '0.0.1'
                }
            }
        })

        wrapper.getComponent<typeof IplButton>('[data-test="open-folder-button"]').vm.$emit('click')

        expect(mockTauriShell.open).toHaveBeenCalledWith('nodecg/path/bundles/bundle-name')
    })

    it('disables opening bundle in terminal if system is linux', async () => {
        mockTauriOs.type.mockResolvedValue('linux')
        const wrapper = mount(BundleConfig, {
            props: {
                bundle: {
                    name: 'bundle-name',
                    version: '0.0.1'
                }
            }
        })
        await flushPromises()

        expect(wrapper.getComponent<typeof IplButton>('[data-test="open-in-terminal-button"]').vm.$props.disabled).toEqual(true)
    })

    it.each(['windows', 'macos'])('enables opening bundle in terminal if system is %s', async (type) => {
        mockTauriOs.type.mockResolvedValue(type)
        const wrapper = mount(BundleConfig, {
            props: {
                bundle: {
                    name: 'bundle-name',
                    version: '0.0.1'
                }
            }
        })
        await flushPromises()

        expect(wrapper.getComponent<typeof IplButton>('[data-test="open-in-terminal-button"]').vm.$props.disabled).toEqual(false)
    })

    it('handles opening bundle in terminal', () => {
        useConfigStore().installPath = '/nodecg/install/path'
        const wrapper = mount(BundleConfig, {
            props: {
                bundle: {
                    name: 'cool-bundle',
                    version: '0.0.1'
                }
            }
        })

        wrapper.getComponent<typeof IplButton>('[data-test="open-in-terminal-button"]').vm.$emit('click')

        expect(mockTauri.invoke).toHaveBeenCalledWith(
            'open_path_in_terminal',
            { path: '/nodecg/install/path/bundles/cool-bundle' })
    })

    it('disables opening config file if config file is missing', async () => {
        (configFileExists as Mock).mockResolvedValue(false)
        useConfigStore().installPath = '/nodecg/install/path'
        const wrapper = await mount(BundleConfig, {
            props: {
                bundle: {
                    name: 'cool-bundle',
                    version: '0.0.1'
                }
            }
        })

        expect(configFileExists).toHaveBeenCalledWith('cool-bundle', '/nodecg/install/path')
        expect(wrapper.getComponent<typeof IplButton>('[data-test="open-config-file-button"]').vm.$props.disabled).toEqual(true)
    })

    it('disables opening config file if checking for config file presence fails', async () => {
        (configFileExists as Mock).mockRejectedValue(new Error('Error!'))
        useConfigStore().installPath = '/nodecg/install/path'
        const wrapper = await mount(BundleConfig, {
            props: {
                bundle: {
                    name: 'cool-bundle',
                    version: '0.0.1'
                }
            }
        })

        expect(configFileExists).toHaveBeenCalledWith('cool-bundle', '/nodecg/install/path')
        expect(wrapper.getComponent<typeof IplButton>('[data-test="open-config-file-button"]').vm.$props.disabled).toEqual(true)
    })

    it('enables opening config file if config file exists', async () => {
        (configFileExists as Mock).mockResolvedValue(true)
        useConfigStore().installPath = '/nodecg/install'
        const wrapper = mount(BundleConfig, {
            props: {
                bundle: {
                    name: 'rad-bundle',
                    version: '0.0.1'
                }
            }
        })
        await flushPromises()

        expect(configFileExists).toHaveBeenCalledWith('rad-bundle', '/nodecg/install')
        expect(wrapper.getComponent<typeof IplButton>('[data-test="open-config-file-button"]').vm.$props.disabled).toEqual(false)
    })

    it('handles opening config file if it exists', async () => {
        (configFileExists as Mock).mockResolvedValue(true)
        useConfigStore().installPath = '/nodecg/install'
        const wrapper = await mount(BundleConfig, {
            props: {
                bundle: {
                    name: 'rad-bundle',
                    version: '0.0.1'
                }
            }
        })

        wrapper.getComponent<typeof IplButton>('[data-test="open-config-file-button"]').vm.$emit('click')

        expect(configFileExists).toHaveBeenCalledWith('rad-bundle', '/nodecg/install')
        expect(openConfigFile).toHaveBeenCalledWith('rad-bundle', '/nodecg/install')
    })

    it('handles creating config file if it is missing', async () => {
        (configFileExists as Mock).mockResolvedValue(false);
        (createConfigFile as Mock).mockResolvedValue({})
        useConfigStore().installPath = '/nodecg/path'
        const wrapper = await mount(BundleConfig, {
            props: {
                bundle: {
                    name: 'rad-bundle',
                    version: '0.0.1'
                }
            }
        })

        await wrapper.getComponent<typeof IplButton>('[data-test="open-config-file-button"]').vm.$emit('click')
        await flushPromises()

        expect(configFileExists).toHaveBeenCalledTimes(2)
        expect(configFileExists).toHaveBeenCalledWith('rad-bundle', '/nodecg/path')
        expect(createConfigFile).toHaveBeenCalledWith('rad-bundle', '/nodecg/path')
        expect(openConfigFile).toHaveBeenCalledWith('rad-bundle', '/nodecg/path')
    })
})
