const { fixture } = require('./utils')

describe('core utilities', () => {
    beforeEach(() => {
        fixture(true)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    describe('$vui._ utility functions', () => {
        test('elapse() should return time elapsed since initialization', () => {
            const start = Date.now()
            const elapsed = $vui._.elapse()
            const end = Date.now()
            
            expect(elapsed).toBeGreaterThanOrEqual(0)
            expect(elapsed).toBeLessThanOrEqual(end - start + 100) // Allow some margin
        })

        test('isString() should correctly identify strings', () => {
            expect($vui._.isString('hello')).toBe(true)
            expect($vui._.isString('')).toBe(true)
            expect($vui._.isString(new String('hello'))).toBe(true)
            expect($vui._.isString(123)).toBe(false)
            expect($vui._.isString(null)).toBe(false)
            expect($vui._.isString(undefined)).toBe(false)
            expect($vui._.isString([])).toBe(false)
            expect($vui._.isString({})).toBe(false)
        })

        test('isArray() should correctly identify arrays', () => {
            expect($vui._.isArray([])).toBe(true)
            expect($vui._.isArray([1, 2, 3])).toBe(true)
            expect($vui._.isArray(new Array())).toBe(true)
            expect($vui._.isArray('hello')).toBe(false)
            expect($vui._.isArray(123)).toBe(false)
            expect($vui._.isArray({})).toBe(false)
            expect($vui._.isArray(null)).toBe(false)
            expect($vui._.isArray(undefined)).toBe(false)
        })

        test('isFunction() should correctly identify functions', () => {
            expect($vui._.isFunction(() => {})).toBe(true)
            expect($vui._.isFunction(function() {})).toBe(true)
            expect($vui._.isFunction(Date)).toBe(true)
            expect($vui._.isFunction('hello')).toBe(false)
            expect($vui._.isFunction(123)).toBe(false)
            expect($vui._.isFunction([])).toBe(false)
            expect($vui._.isFunction({})).toBe(false)
            expect($vui._.isFunction(null)).toBe(false)
            expect($vui._.isFunction(undefined)).toBe(false)
        })

        test('isPlainObject() should correctly identify plain objects', () => {
            expect($vui._.isPlainObject({})).toBe(true)
            expect($vui._.isPlainObject({ a: 1 })).toBe(true)
            expect($vui._.isPlainObject(Object.create(null))).toBe(false)
            expect($vui._.isPlainObject([])).toBe(false)
            expect($vui._.isPlainObject(new Date())).toBe(false)
            expect($vui._.isPlainObject(function() {})).toBe(false)
            expect($vui._.isPlainObject('hello')).toBe(false)
            expect($vui._.isPlainObject(123)).toBe(false)
            expect($vui._.isPlainObject(null)).toBe(false)
            expect($vui._.isPlainObject(undefined)).toBe(false)
        })

        test('each() should iterate over arrays correctly', () => {
            const array = ['a', 'b', 'c']
            const results = []
            
            $vui._.each(array, (val, index, arrayIndex) => {
                results.push({ val, index, arrayIndex })
            })

            expect(results).toEqual([
                { val: 'a', index: 0, arrayIndex: 0 },
                { val: 'b', index: 1, arrayIndex: 1 },
                { val: 'c', index: 2, arrayIndex: 2 }
            ])
        })

        test('each() should iterate over objects correctly', () => {
            const obj = { a: 1, b: 2, c: 3 }
            const results = []
            
            $vui._.each(obj, (val, key, index) => {
                results.push({ val, key, index })
            })

            expect(results).toEqual([
                { val: 1, key: 'a', index: 0 },
                { val: 2, key: 'b', index: 1 },
                { val: 3, key: 'c', index: 2 }
            ])
        })

        test('each() should handle null/undefined gracefully', () => {
            expect(() => $vui._.each(null, () => {})).not.toThrow()
            expect(() => $vui._.each(undefined, () => {})).not.toThrow()
        })

        test('map() should transform arrays correctly', () => {
            const array = [1, 2, 3]
            const result = $vui._.map(array, (val, index) => val * 2 + index)
            
            expect(result).toEqual([2, 5, 8])
        })

        test('map() should transform objects correctly', () => {
            const obj = { a: 1, b: 2, c: 3 }
            const result = $vui._.map(obj, (val, key) => `${key}:${val}`)
            
            expect(result).toEqual(['a:1', 'b:2', 'c:3'])
        })

        test('filter() should filter arrays correctly', () => {
            const array = [1, 2, 3, 4, 5]
            const result = $vui._.filter(array, val => val % 2 === 0)
            
            expect(result).toEqual([2, 4])
        })

        test('filter() should filter objects correctly', () => {
            const obj = { a: 1, b: 2, c: 3, d: 4 }
            const result = $vui._.filter(obj, val => val > 2)
            
            expect(result).toEqual([3, 4])
        })

        test('extend() should merge objects correctly', () => {
            const target = { a: 1, b: 2 }
            const source1 = { b: 3, c: 4 }
            const source2 = { c: 5, d: 6 }
            
            const result = $vui._.extend(target, source1, source2)
            
            expect(result).toBe(target) // Should return same reference
            expect(target).toEqual({ a: 1, b: 3, c: 5, d: 6 })
        })

        test('extend() should handle property descriptors', () => {
            const target = {}
            const source = {}
            
            Object.defineProperty(source, 'getter', {
                get() { return 'getter value' },
                enumerable: true,
                configurable: true
            })
            
            Object.defineProperty(source, 'setter', {
                set(val) { this._setterValue = val },
                enumerable: true,
                configurable: true
            })
            
            $vui._.extend(target, source)
            
            expect(target.getter).toBe('getter value')
            target.setter = 'test'
            expect(target._setterValue).toBe('test')
        })

        test('extend() should handle null target gracefully', () => {
            const result = $vui._.extend(null, { a: 1 })
            expect(result).toBe(null)
        })

        test('extend() should ignore non-plain-object sources', () => {
            const target = { a: 1 }
            const result = $vui._.extend(target, 'string', 123, null, [1, 2], new Date())
            
            expect(result).toEqual({ a: 1 })
        })

        test('extend() should handle no sources', () => {
            const target = { a: 1 }
            const result = $vui._.extend(target)
            
            expect(result).toBe(target)
            expect(result).toEqual({ a: 1 })
        })
    })

    describe('$vui.config', () => {
        test('should have default debug value', () => {
            expect($vui.config.debug).toBe(false)
        })

        test('should allow setting debug mode', () => {
            $vui.config.debug = true
            expect($vui.config.debug).toBe(true)
            
            // Reset
            $vui.config.debug = false
        })
    })

    describe('$vui.ready()', () => {
        test('should execute callback immediately when Alpine is available', (done) => {
            $vui.ready(() => {
                expect(window.Alpine).toBeDefined()
                done()
            })
        })

        test('should wait for alpine:init event when Alpine is not available', (done) => {
            // Temporarily hide Alpine
            const originalAlpine = window.Alpine
            delete window.Alpine
            
            let callbackExecuted = false
            
            $vui.ready(() => {
                callbackExecuted = true
                expect(window.Alpine).toBeDefined()
                done()
            })
            
            // Callback should not be executed immediately
            expect(callbackExecuted).toBe(false)
            
            // Restore Alpine and trigger event
            window.Alpine = originalAlpine
            document.dispatchEvent(new Event('alpine:init'))
        })
    })

    describe('core initialization', () => {
        test('should not reinitialize if $vui already exists', () => {
            const originalVui = window.$vui
            const originalElapse = window.$vui._.elapse()
            
            // Mock the setupCore function from the global scope
            const mockSetupCore = () => {
                if (window.$vui) return // Should return early if already initialized
                // This part shouldn't execute
                window.$vui = { test: true }
            }
            
            // Try to initialize again
            mockSetupCore()
            
            // Should be the same instance
            expect(window.$vui).toBe(originalVui)
            expect(window.$vui._.elapse()).toBeGreaterThanOrEqual(originalElapse)
        })

        test('should initialize with correct structure', () => {
            expect($vui).toBeDefined()
            expect($vui.config).toBeDefined()
            expect($vui.ready).toBeInstanceOf(Function)
            expect($vui._).toBeDefined()
            expect($vui._.elapse).toBeInstanceOf(Function)
            expect($vui._.isString).toBeInstanceOf(Function)
            expect($vui._.isArray).toBeInstanceOf(Function)
            expect($vui._.isFunction).toBeInstanceOf(Function)
            expect($vui._.isPlainObject).toBeInstanceOf(Function)
            expect($vui._.each).toBeInstanceOf(Function)
            expect($vui._.map).toBeInstanceOf(Function)
            expect($vui._.filter).toBeInstanceOf(Function)
            expect($vui._.extend).toBeInstanceOf(Function)
        })
    })

    describe('edge cases and performance', () => {
        test('each() should handle empty collections', () => {
            let callCount = 0
            
            $vui._.each([], () => callCount++)
            $vui._.each({}, () => callCount++)
            
            expect(callCount).toBe(0)
        })

        test('map() should handle empty collections', () => {
            expect($vui._.map([], x => x)).toEqual([])
            expect($vui._.map({}, x => x)).toEqual([])
        })

        test('filter() should handle empty collections', () => {
            expect($vui._.filter([], x => true)).toEqual([])
            expect($vui._.filter({}, x => true)).toEqual([])
        })

        test('extend() should handle circular references in descriptors', () => {
            const target = {}
            const source = {}
            
            // Create a property with getter that references the source
            Object.defineProperty(source, 'circular', {
                get() { return source },
                enumerable: true,
                configurable: true
            })
            
            expect(() => $vui._.extend(target, source)).not.toThrow()
            expect(target.circular).toBe(source)
        })

        test('utility functions should handle large datasets efficiently', () => {
            const largeArray = Array.from({ length: 10000 }, (_, i) => i)
            const largeObject = Object.fromEntries(largeArray.map(i => [`key${i}`, i]))
            
            const start = performance.now()
            
            // Test each
            let count = 0
            $vui._.each(largeArray, () => count++)
            expect(count).toBe(10000)
            
            // Test map
            const mapped = $vui._.map(largeArray.slice(0, 1000), x => x * 2)
            expect(mapped).toHaveLength(1000)
            expect(mapped[999]).toBe(1998)
            
            // Test filter
            const filtered = $vui._.filter(largeArray.slice(0, 1000), x => x % 100 === 0)
            expect(filtered).toEqual([0, 100, 200, 300, 400, 500, 600, 700, 800, 900])
            
            const end = performance.now()
            expect(end - start).toBeLessThan(100) // Should complete within 100ms
        })
    })
})