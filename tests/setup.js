// Global test setup

// Suppress console warnings during tests unless in debug mode
const originalWarn = console.warn
const originalError = console.error

console.warn = (...args) => {
    // Allow certain warnings to pass through for debugging
    if (process.env.DEBUG_TESTS) {
        originalWarn(...args)
    } else {
        // Suppress Alpine.js expression warnings during tests
        const message = args[0]
        if (typeof message === 'string' && (
            message.includes('Alpine Expression Error') ||
            message.includes('ReferenceError')
        )) {
            return
        }
        originalWarn(...args)
    }
}

console.error = (...args) => {
    if (process.env.DEBUG_TESTS) {
        originalError(...args)
    } else {
        const message = args[0]
        if (typeof message === 'string' && (
            message.includes('Alpine Expression Error') ||
            message.includes('ReferenceError') ||
            message.includes('Uncaught [ReferenceError') ||
            message.includes('Uncaught [TypeError')
        )) {
            return
        }
        // Suppress JSDOM errors that don't affect test results
        if (message instanceof Error && (
            message.message.includes('_x_refs') ||
            message.message.includes('Cannot read properties of undefined')
        )) {
            return
        }
        originalError(...args)
    }
}

// Global test timeout
jest.setTimeout(15000)

// Mock global functions that might not be available in jsdom
global.scrollTo = jest.fn()
global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}))

// Mock performance.now for testing
if (!global.performance) {
    global.performance = {
        now: jest.fn(() => Date.now())
    }
}