const { sleep, loadHtml, fixture } = require('./utils')

describe('x-component basic tests', () => {
    beforeEach(() => {
        fixture(true)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    test('should register custom element from template', async () => {
        loadHtml(document.body, /*html*/`
            <template x-component="test-component">
                <div>Test content</div>
            </template>
        `)

        await sleep(200)

        // Check if custom element is registered
        const elementClass = customElements.get('vui-test-component')
        expect(elementClass).toBeDefined()
        expect(typeof elementClass).toBe('function')
        
        // Test creating the component
        const component = document.createElement('vui-test-component')
        document.body.appendChild(component)
        
        await sleep(200)
        
        expect(component._vui_type).toBe('test-component')
        expect(component.querySelector('div')).toBeTruthy()
    })

    test('should handle component creation and slot replacement', async () => {
        loadHtml(document.body, /*html*/`
            <template x-component="slot-component">
                <div class="wrapper">
                    <slot></slot>
                </div>
            </template>
        `)

        await sleep(100)

        // Create component element
        const component = document.createElement('vui-slot-component')
        component.innerHTML = '<span>Slot content</span>'
        document.body.appendChild(component)

        await sleep(100)

        // Check if component was processed
        const wrapper = component.querySelector('.wrapper')
        expect(wrapper).toBeTruthy()
        expect(wrapper.textContent.trim()).toBe('Slot content')
    })

    test('should handle component attributes', async () => {
        loadHtml(document.body, /*html*/`
            <template x-component="attr-component">
                <div class="base-class">Content</div>
            </template>
        `)

        await sleep(100)

        // Create component with attributes
        const component = document.createElement('vui-attr-component')
        component.className = 'custom-class'
        component.setAttribute('data-test', 'test-value')
        document.body.appendChild(component)

        await sleep(100)

        // Check if attributes were preserved
        expect(component.className).toContain('custom-class')
        expect(component.getAttribute('data-test')).toBe('test-value')
    })

    test('should handle component with script setup', async () => {
        loadHtml(document.body, /*html*/`
            <template x-component="script-component">
                <div>
                    <span data-testid="script-value">Script content</span>
                </div>
                <script>
                    return {
                        testValue: 'Script works'
                    }
                </script>
            </template>
        `)

        await sleep(100)

        // Create component
        const component = document.createElement('vui-script-component')
        document.body.appendChild(component)

        await sleep(200)

        // Check if component was processed and script API is available
        expect(component._vui_type).toBe('script-component')
        expect(component._vui_api).toBeDefined()
        expect(component._vui_api.testValue).toBe('Script works')
        
        // Check DOM structure
        const span = component.querySelector('[data-testid="script-value"]')
        expect(span).toBeTruthy()
        expect(span.textContent).toBe('Script content')
    })

    test('should handle named slots', async () => {
        loadHtml(document.body, /*html*/`
            <template x-component="named-slot-component">
                <div>
                    <header>
                        <slot name="header">Default header</slot>
                    </header>
                    <main>
                        <slot>Default content</slot>
                    </main>
                </div>
            </template>
        `)

        await sleep(100)

        // Create component with named slots
        const component = document.createElement('vui-named-slot-component')
        component.innerHTML = `
            <template slot="header">Custom header</template>
            <span>Custom content</span>
        `
        document.body.appendChild(component)

        await sleep(100)

        const header = component.querySelector('header')
        const main = component.querySelector('main')
        
        expect(header.textContent.trim()).toBe('Custom header')
        expect(main.textContent.trim()).toBe('Custom content')
    })

    test('should handle component lifecycle onMounted', async () => {
        let mountedCalled = false
        window.testMount = () => { mountedCalled = true }

        loadHtml(document.body, /*html*/`
            <template x-component="lifecycle-component">
                <div>Lifecycle test</div>
                <script>
                    return {
                        onMounted() {
                            window.testMount()
                        }
                    }
                </script>
            </template>
        `)

        await sleep(100)

        // Create component
        const component = document.createElement('vui-lifecycle-component')
        document.body.appendChild(component)

        await sleep(100)

        expect(mountedCalled).toBe(true)
    })

    test('should handle component lifecycle onUnmounted', async () => {
        let unmountedCalled = false
        window.testUnmount = () => { unmountedCalled = true }

        loadHtml(document.body, /*html*/`
            <template x-component="unmount-component">
                <div>Unmount test</div>
                <script>
                    return {
                        onUnmounted() {
                            window.testUnmount()
                        }
                    }
                </script>
            </template>
        `)

        await sleep(100)

        // Create and mount component
        const component = document.createElement('vui-unmount-component')
        document.body.appendChild(component)

        await sleep(100)

        // Remove component
        component.remove()
        await sleep(100)

        expect(unmountedCalled).toBe(true)
    })

    test('should warn when x-component is used on non-template element', async () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

        loadHtml(document.body, /*html*/`
            <div x-component="invalid-component">
                This should warn
            </div>
        `)

        await sleep(100)

        expect(consoleSpy).toHaveBeenCalledWith(
            'x-component can only be used on a <template> tag',
            expect.any(HTMLElement)
        )

        consoleSpy.mockRestore()
    })

    test('should handle unwrap modifier', async () => {
        loadHtml(document.body, /*html*/`
            <template x-component.unwrap="unwrap-component">
                <div class="inner-div">
                    <slot></slot>
                </div>
            </template>
        `)

        await sleep(100)

        // Create component
        const component = document.createElement('vui-unwrap-component')
        component.className = 'outer-class'
        component.innerHTML = '<span>Content</span>'
        document.body.appendChild(component)

        await sleep(100)

        // The component should be replaced by the inner div
        const innerDiv = document.querySelector('.inner-div')
        expect(innerDiv).toBeTruthy()
        expect(innerDiv.className).toContain('outer-class')
        expect(innerDiv.textContent.trim()).toBe('Content')

        // The original component should not exist
        const originalComponent = document.querySelector('vui-unwrap-component')
        expect(originalComponent).toBeFalsy()
    })
})