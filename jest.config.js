module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    testEnvironmentOptions: {
        customExportConditions: ['node', 'node-addons']
    },
    transformIgnorePatterns: ['/node_modules/(?!@tauri-apps)'],
    transform: {
        '^.+\\.(ts|tsx)?$': 'ts-jest',
        '.*\\.(vue)$': '@vue/vue3-jest'
    },
    moduleNameMapper: {
        '@/(.*)$': '<rootDir>/src/$1'
    },
    resetMocks: true,
    setupFilesAfterEnv: ['./src/__mocks__/tauri.ts'],
    reporters: [['github-actions', { silent: false }], 'summary']
}
