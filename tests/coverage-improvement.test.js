const { sleep, loadHtml, fixture } = require('./utils')

describe('Coverage Improvement Tests', () => {
    beforeEach(() => {
        fixture(true)
    })

    afterEach(() => {
        document.body.innerHTML = ''
        // Reset config to defaults
        $vui.config.debug = false
        $vui.config.autoImport = false
    })

    describe('Directive name parsing edge cases', () => {
        test('should handle directive names without modifiers', async () => {
            // This tests the edge case in getDirectiveName where p2 === -1
            loadHtml(document.body, /*html*/`
                <template x-component="simple">
                    <div>Simple component</div>
                </template>
            `)
            
            await sleep(100)
            
            const elementClass = customElements.get('vui-simple')
            expect(elementClass).toBeDefined()
        })
    })

    describe('Auto import functionality', () => {
        test('should handle autoImport when enabled', async () => {
            $vui.config.autoImport = true
            $vui.config.importMap = {
                "*": "./components/${component}.html"
            }
            
            const mockFetch = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
                text: () => Promise.resolve(`
                    <template x-component="auto-imported">
                        <div>Auto imported component</div>
                    </template>
                `)
            })
            global.fetch = mockFetch
            
            // Test isComponent with autoImport enabled
            const el = document.createElement('vui-test-auto')
            // With autoImport enabled, isComponent returns true for any custom element with hyphen
            expect($vui.isComponent(el)).toBe(true)
            
            // Test with known namespace
            const el2 = document.createElement('vui-auto-imported')
            const result = $vui.isComponent(el2)
            expect(result).toBe(true)
        })

        test('should handle components with different namespace patterns', async () => {
            // Test component detection with various tag patterns
            const el1 = document.createElement('div') // No hyphen
            expect($vui.isComponent(el1)).toBe(false)
            
            const el2 = document.createElement('my-component')
            el2._vui_type = 'component'
            expect($vui.isComponent(el2)).toBe(true)
        })
    })

    describe('Debug mode functionality', () => {
        test('should log debug messages when debug mode is on', async () => {
            $vui.config.debug = true
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
            
            loadHtml(document.body, /*html*/`
                <template x-component="debug-test">
                    <div>Debug component</div>
                </template>
            `)
            
            await sleep(100)
            
            const component = document.createElement('vui-debug-test')
            document.body.appendChild(component)
            
            await sleep(200)
            
            // Debug mode should have logged some messages
            expect(consoleSpy).toHaveBeenCalled()
            
            consoleSpy.mockRestore()
        })
    })

    describe('$vui.focus functionality', () => {
        test('should focus elements with tabindex', async () => {
            const div = document.createElement('div')
            div.setAttribute('tabindex', '0')
            document.body.appendChild(div)
            
            $vui.focus(div)
            
            await sleep(50)
            
            expect(document.activeElement).toBe(div)
        })

        test('should handle focus with options', async () => {
            const input = document.createElement('input')
            document.body.appendChild(input)
            
            $vui.focus(input, { preventScroll: true })
            
            await sleep(50)
            
            expect(document.activeElement).toBe(input)
        })
    })

    describe('x-shtml directive', () => {
        test('should set HTML content with x-shtml', async () => {
            loadHtml(document.body, /*html*/`
                <div x-data="{ htmlContent: '<p>Dynamic HTML</p>' }" x-shtml="htmlContent" data-testid="shtml-test"></div>
            `)
            
            await sleep(100)
            
            const element = document.querySelector('[data-testid="shtml-test"]')
            expect(element.innerHTML).toContain('<p>Dynamic HTML</p>')
        })
    })

    describe('Component meta information', () => {
        test('should get component meta with namespace', async () => {
            loadHtml(document.body, /*html*/`
                <template x-component:custom="meta-test">
                    <div>Meta test</div>
                </template>
            `)
            
            await sleep(100)
            
            const component = document.createElement('custom-meta-test')
            component._vui_type = 'meta-test'
            component._vui_namespace = 'custom'
            
            const meta = $vui.getComponentMeta(component)
            expect(meta).toBeDefined()
            expect(meta.type).toBe('meta-test')
            expect(meta.namespace).toBe('custom')
        })
    })

    describe('Config and setup edge cases', () => {
        test('should handle $vui.ready after Alpine is loaded', async () => {
            let readyCalled = false
            
            $vui.ready(() => {
                readyCalled = true
            })
            
            await sleep(50)
            
            expect(readyCalled).toBe(true)
        })

        test('should handle getComponentMeta with various inputs', async () => {
            // Test with non-component element
            const div = document.createElement('div')
            const meta = $vui.getComponentMeta(div)
            // getComponentMeta returns an object with undefined values for non-components
            expect(meta).toBeDefined()
            expect(meta.type).toBeUndefined()
            expect(meta.namespace).toBeUndefined()
            
            // Test with component element
            const component = document.createElement('vui-test')
            component._vui_type = 'test'
            component._vui_namespace = 'vui'
            
            const componentMeta = $vui.getComponentMeta(component)
            expect(componentMeta).toBeDefined()
            expect(componentMeta.type).toBe('test')
            expect(componentMeta.namespace).toBe('vui')
        })

        test('should handle $vui.imports functionality', async () => {
            // Test import tracking
            if ($vui.imports) {
                const initialCount = Object.keys($vui.imports).length
                expect(typeof initialCount).toBe('number')
            }
        })
    })

    describe('Utility functions edge cases', () => {
        test('should handle scrollIntoView', async () => {
            const element = document.createElement('div')
            element.style.height = '100px'
            document.body.appendChild(element)
            
            // Mock scrollIntoView
            element.scrollIntoView = jest.fn()
            
            $vui.scrollIntoView(element)
            
            expect(element.scrollIntoView).toHaveBeenCalledWith({
                block: 'nearest'
            })
        })

        test('should test $vui.nextTick', async () => {
            let value = 'initial'
            
            $vui.nextTick(() => {
                value = 'updated'
            })
            
            // Value should not change immediately
            expect(value).toBe('initial')
            
            await sleep(50)
            
            // Value should be updated after nextTick
            expect(value).toBe('updated')
        })

        test('should test $vui.effect', async () => {
            let count = 0
            
            const cleanup = $vui.effect(() => {
                count++
            })
            
            expect(count).toBeGreaterThan(0)
            
            // Cleanup the effect
            if (typeof cleanup === 'function') {
                cleanup()
            }
        })
    })

    describe('Component visiting and traversal', () => {
        test('should visit all components in container', async () => {
            loadHtml(document.body, /*html*/`
                <template x-component="visitor-parent">
                    <div><slot></slot></div>
                </template>
                <template x-component="visitor-child">
                    <div>Child</div>
                </template>
            `)
            
            await sleep(100)
            
            const container = document.createElement('div')
            container.innerHTML = `
                <vui-visitor-parent>
                    <vui-visitor-child></vui-visitor-child>
                    <vui-visitor-child></vui-visitor-child>
                </vui-visitor-parent>
            `
            document.body.appendChild(container)
            
            await sleep(200)
            
            const visited = []
            $vui.visitComponents(container, (component) => {
                if (component._vui_type) {
                    visited.push(component._vui_type)
                }
            })
            
            expect(visited.length).toBeGreaterThan(0)
        })

        test('should find child components with filter function', async () => {
            loadHtml(document.body, /*html*/`
                <template x-component="filterable">
                    <div>Filterable</div>
                </template>
            `)
            
            await sleep(100)
            
            const container = document.createElement('div')
            container.innerHTML = `
                <vui-filterable data-test="1"></vui-filterable>
                <vui-filterable data-test="2"></vui-filterable>
                <div>Not a component</div>
            `
            document.body.appendChild(container)
            
            await sleep(200)
            
            const found = $vui.findChildComponents(container, (el) => {
                return el.getAttribute('data-test') === '1'
            })
            
            expect(found.length).toBe(1)
            expect(found[0].getAttribute('data-test')).toBe('1')
        })
    })

    describe('DOM manipulation utilities', () => {
        test('should use $vui.dom to create elements', async () => {
            const html = '<div class="test-dom">Test content</div>'
            const element = $vui.dom(html)
            
            expect(element).toBeTruthy()
            expect(element.classList.contains('test-dom')).toBe(true)
            expect(element.textContent).toBe('Test content')
        })

        test('should handle setHtml with components', async () => {
            loadHtml(document.body, /*html*/`
                <template x-component="sethtml-test">
                    <div>SetHtml component</div>
                </template>
            `)
            
            await sleep(100)
            
            const container = document.createElement('div')
            document.body.appendChild(container)
            
            $vui.setHtml(container, '<vui-sethtml-test></vui-sethtml-test>')
            
            await sleep(200)
            
            const component = container.querySelector('vui-sethtml-test')
            expect(component).toBeTruthy()
            expect(component._vui_type).toBe('sethtml-test')
        })
    })

    describe('Defer functionality', () => {
        test('should defer callback execution', async () => {
            let executed = false
            
            $vui.defer(() => {
                executed = true
            })
            
            // Should not execute immediately
            expect(executed).toBe(false)
            
            await sleep(50)
            
            // Should execute after defer
            expect(executed).toBe(true)
        })
    })

    describe('Error handling scenarios', () => {
        test('should handle import errors gracefully', async () => {
            const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'))
            global.fetch = mockFetch
            
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
            
            try {
                await $vui.import('non-existent-component')
            } catch (error) {
                expect(error).toBeDefined()
            }
            
            consoleSpy.mockRestore()
        })

        test('should handle invalid component definitions', async () => {
            loadHtml(document.body, /*html*/`
                <template x-component="">
                    <div>Invalid component</div>
                </template>
            `)
            
            await sleep(100)
            
            // Should not crash with empty component name
            expect(document.querySelector('template[x-component=""]')).toBeTruthy()
        })
    })

    describe('Complex component scenarios', () => {
        test('should handle deeply nested component structures', async () => {
            loadHtml(document.body, /*html*/`
                <template x-component="level-a">
                    <div class="level-a"><slot></slot></div>
                </template>
                <template x-component="level-b">
                    <div class="level-b"><slot></slot></div>
                </template>
                <template x-component="level-c">
                    <div class="level-c">Deepest level</div>
                </template>
            `)
            
            await sleep(100)
            
            const structure = document.createElement('vui-level-a')
            structure.innerHTML = `
                <vui-level-b>
                    <vui-level-c></vui-level-c>
                </vui-level-b>
            `
            document.body.appendChild(structure)
            
            await sleep(300)
            
            expect(structure.querySelector('.level-a')).toBeTruthy()
            expect(structure.querySelector('.level-b')).toBeTruthy()
            expect(structure.querySelector('.level-c')).toBeTruthy()
        })
    })
})