export default {
    rootDir: './tests',
    testEnvironment: 'jsdom',
    collectCoverage: true,
    collectCoverageFrom: [
        '../dist/vui.dev.js'
    ],
    coverageDirectory: '../coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    coverageThreshold: {
        global: {
            branches: 75,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },
    setupFilesAfterEnv: ['<rootDir>/setup.js']
}
