module.exports = {
    preset: '@vue/cli-plugin-unit-jest/presets/typescript-and-babel',
    transformIgnorePatterns: ['/node_modules/(?!@tauri-apps)'],
    transform: {
        '^.+\\.vue$': 'vue-jest'
    },
    moduleNameMapper: {
        '@/(.*)$': '<rootDir>/src/$1'
    },
    resetMocks: true,
    setupFilesAfterEnv: ['./src/__mocks__/tauri.ts']
}
