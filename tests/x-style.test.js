const { sleep, loadHtml, fixture } = require('./utils')

describe('x-style', () => {
    beforeEach(() => {
        fixture(true)
    })

    afterEach(() => {
        document.body.innerHTML = ''
        // Clean up style registries
        if (window.$vui) {
            window.$vui.setTheme('default')
        }
    })

    test('should register and apply basic style', async () => {
        // Register a simple style
        $vui.setStyle('button', {
            base: 'px-4 py-2 rounded'
        })

        loadHtml(document.body, /*html*/`
            <button x-style="button" data-testid="styled-button">
                Click me
            </button>
        `)

        await sleep(100)

        const button = document.querySelector('[data-testid="styled-button"]')
        expect(button.classList.contains('px-4')).toBe(true)
        expect(button.classList.contains('py-2')).toBe(true)
        expect(button.classList.contains('rounded')).toBe(true)
    })

    test('should handle style variants', async () => {
        $vui.setStyle('button', {
            base: 'px-4 py-2 rounded',
            variants: {
                size: {
                    sm: 'px-2 py-1 text-sm',
                    lg: 'px-6 py-3 text-lg'
                },
                color: {
                    primary: 'bg-blue-500 text-white',
                    secondary: 'bg-gray-500 text-white'
                }
            }
        })

        loadHtml(document.body, /*html*/`
            <button x-style="button" data-size="sm" data-color="primary" data-testid="variant-button">
                Small Primary Button
            </button>
        `)

        await sleep(100)

        const button = document.querySelector('[data-testid="variant-button"]')
        expect(button.classList.contains('px-2')).toBe(true)
        expect(button.classList.contains('py-1')).toBe(true)
        expect(button.classList.contains('text-sm')).toBe(true)
        expect(button.classList.contains('bg-blue-500')).toBe(true)
        expect(button.classList.contains('text-white')).toBe(true)
    })

    test('should handle default variants', async () => {
        $vui.setStyle('button', {
            base: 'px-4 py-2 rounded',
            variants: {
                size: {
                    sm: 'text-sm',
                    md: 'text-base',
                    lg: 'text-lg'
                }
            },
            defaultVariants: {
                size: 'md'
            }
        })

        loadHtml(document.body, /*html*/`
            <button x-style="button" data-testid="default-button">
                Default Button
            </button>
        `)

        await sleep(100)

        const button = document.querySelector('[data-testid="default-button"]')
        expect(button.classList.contains('text-base')).toBe(true)
    })

    test('should handle compound variants with object conditions', async () => {
        $vui.setStyle('button', {
            base: 'px-4 py-2 rounded',
            variants: {
                size: {
                    sm: 'text-sm',
                    lg: 'text-lg'
                },
                color: {
                    primary: 'bg-blue-500',
                    danger: 'bg-red-500'
                }
            },
            compoundVariants: [
                {
                    conditions: { size: 'lg', color: 'primary' },
                    classes: 'shadow-lg font-bold'
                }
            ]
        })

        loadHtml(document.body, /*html*/`
            <button x-style="button" data-size="lg" data-color="primary" data-testid="compound-button">
                Large Primary Button
            </button>
        `)

        await sleep(100)

        const button = document.querySelector('[data-testid="compound-button"]')
        expect(button.classList.contains('shadow-lg')).toBe(true)
        expect(button.classList.contains('font-bold')).toBe(true)
    })

    test('should handle compound variants with array conditions', async () => {
        $vui.setStyle('button', {
            base: 'px-4 py-2 rounded',
            variants: {
                size: {
                    sm: 'text-sm',
                    md: 'text-base',
                    lg: 'text-lg'
                }
            },
            compoundVariants: [
                {
                    conditions: { size: ['sm', 'md'] },
                    classes: 'border border-gray-300'
                }
            ]
        })

        loadHtml(document.body, /*html*/`
            <button x-style="button" data-size="sm" data-testid="array-compound-button">
                Small Button
            </button>
        `)

        await sleep(100)

        const button = document.querySelector('[data-testid="array-compound-button"]')
        expect(button.classList.contains('border')).toBe(true)
        expect(button.classList.contains('border-gray-300')).toBe(true)
    })

    test('should handle compound variants with function conditions', async () => {
        $vui.setStyle('button', {
            base: 'px-4 py-2 rounded',
            variants: {
                disabled: {
                    true: 'opacity-50',
                    false: 'opacity-100'
                }
            },
            compoundVariants: [
                {
                    conditions: (variants) => variants.disabled === 'true',
                    classes: 'cursor-not-allowed'
                }
            ]
        })

        loadHtml(document.body, /*html*/`
            <button x-style="button" data-disabled="true" data-testid="function-compound-button">
                Disabled Button
            </button>
        `)

        await sleep(100)

        const button = document.querySelector('[data-testid="function-compound-button"]')
        expect(button.classList.contains('cursor-not-allowed')).toBe(true)
    })

    test('should handle style parts', async () => {
        $vui.setStyle('card', {
            base: 'border rounded-lg',
            parts: {
                header: 'px-4 py-2 border-b bg-gray-50',
                body: 'px-4 py-4',
                footer: 'px-4 py-2 border-t bg-gray-50'
            }
        })

        // Test that parts are registered in the style definition
        const cardStyle = $vui.getStyle('card')
        expect(cardStyle.parts).toBeDefined()
        expect(cardStyle.parts.header).toBe('px-4 py-2 border-b bg-gray-50')
        expect(cardStyle.parts.body).toBe('px-4 py-4')
        expect(cardStyle.parts.footer).toBe('px-4 py-2 border-t bg-gray-50')

        loadHtml(document.body, /*html*/`
            <div x-style="card" data-testid="card">
                <div x-part="header" data-testid="card-header">Header</div>
                <div x-part="body" data-testid="card-body">Body</div>
                <div x-part="footer" data-testid="card-footer">Footer</div>
            </div>
        `)

        await sleep(100)

        const card = document.querySelector('[data-testid="card"]')
        expect(card.classList.contains('border')).toBe(true)
        expect(card.classList.contains('rounded-lg')).toBe(true)
    })

    test('should handle class merging with conflicting classes', async () => {
        $vui.setStyle('box', {
            base: 'p-2 text-sm bg-blue-500',
            variants: {
                padding: {
                    large: 'p-8'
                },
                text: {
                    large: 'text-lg'
                }
            }
        })

        loadHtml(document.body, /*html*/`
            <div x-style="box" data-padding="large" data-text="large" data-testid="merged-box">
                Box with merged classes
            </div>
        `)

        await sleep(100)

        const box = document.querySelector('[data-testid="merged-box"]')
        
        // Should have the variant classes, not the base conflicting classes
        expect(box.classList.contains('p-8')).toBe(true)
        expect(box.classList.contains('p-2')).toBe(false)
        expect(box.classList.contains('text-lg')).toBe(true)
        expect(box.classList.contains('text-sm')).toBe(false)
        expect(box.classList.contains('bg-blue-500')).toBe(true)
    })

    test('should handle multi-theme support', async () => {
        // Register styles for different themes
        $vui.setStyle('default', 'button', {
            base: 'px-4 py-2 rounded bg-blue-500 text-white'
        })

        $vui.setStyle('dark', 'button', {
            base: 'px-4 py-2 rounded bg-gray-800 text-gray-100'
        })

        // Initially should use default theme
        loadHtml(document.body, /*html*/`
            <button x-style="button" data-testid="themed-button">
                Themed Button
            </button>
        `)

        await sleep(100)

        let button = document.querySelector('[data-testid="themed-button"]')
        expect(button.classList.contains('bg-blue-500')).toBe(true)

        // Switch to dark theme
        $vui.setTheme('dark')
        
        // Re-create element to test theme switch
        document.body.innerHTML = ''
        loadHtml(document.body, /*html*/`
            <button x-style="button" data-testid="dark-themed-button">
                Dark Themed Button
            </button>
        `)

        await sleep(100)

        button = document.querySelector('[data-testid="dark-themed-button"]')
        expect(button.classList.contains('bg-gray-800')).toBe(true)
    })

    test('should handle batch style loading', async () => {
        $vui.loadStyles({
            'primary-button': {
                base: 'px-4 py-2 bg-blue-500 text-white rounded'
            },
            'secondary-button': {
                base: 'px-4 py-2 bg-gray-500 text-white rounded'
            }
        })

        loadHtml(document.body, /*html*/`
            <button x-style="primary-button" data-testid="primary">Primary</button>
            <button x-style="secondary-button" data-testid="secondary">Secondary</button>
        `)

        await sleep(100)

        const primary = document.querySelector('[data-testid="primary"]')
        const secondary = document.querySelector('[data-testid="secondary"]')

        expect(primary.classList.contains('bg-blue-500')).toBe(true)
        expect(secondary.classList.contains('bg-gray-500')).toBe(true)
    })

    test('should handle batch theme loading', async () => {
        $vui.loadThemes({
            light: {
                card: {
                    base: 'bg-white text-black border'
                }
            },
            dark: {
                card: {
                    base: 'bg-gray-900 text-white border-gray-700'
                }
            }
        })

        expect($vui.getStyle('light', 'card')).toBeDefined()
        expect($vui.getStyle('dark', 'card')).toBeDefined()
    })

    test('should handle boolean variants', async () => {
        $vui.setStyle('button', {
            base: 'px-4 py-2 rounded',
            variants: {
                disabled: {
                    true: 'opacity-50 cursor-not-allowed',
                    false: 'opacity-100'
                }
            }
        })

        loadHtml(document.body, /*html*/`
            <button x-style="button" data-disabled="true" data-testid="disabled-button">
                Disabled Button
            </button>
        `)

        await sleep(100)

        const button = document.querySelector('[data-testid="disabled-button"]')
        expect(button.classList.contains('opacity-50')).toBe(true)
        expect(button.classList.contains('cursor-not-allowed')).toBe(true)
    })

    test('should handle style inheritance with parent', async () => {
        $vui.setStyle('base-button', {
            base: 'px-4 py-2 rounded'
        })

        $vui.setStyle('primary-button', {
            parent: 'base-button',
            base: 'bg-blue-500 text-white'
        })

        // Test that inheritance is set up correctly in style definitions
        const baseStyle = $vui.getStyle('base-button')
        const primaryStyle = $vui.getStyle('primary-button')
        
        expect(baseStyle.base).toBe('px-4 py-2 rounded')
        expect(primaryStyle.parent).toBe('base-button')
        expect(primaryStyle.base).toBe('bg-blue-500 text-white')

        loadHtml(document.body, /*html*/`
            <button x-style="primary-button" data-testid="inherited-button">
                Inherited Button
            </button>
        `)

        await sleep(100)

        const button = document.querySelector('[data-testid="inherited-button"]')
        expect(button.classList.contains('bg-blue-500')).toBe(true)
        expect(button.classList.contains('text-white')).toBe(true)
    })

    test('should not apply styles to template elements', async () => {
        $vui.setStyle('template-style', {
            base: 'px-4 py-2'
        })

        loadHtml(document.body, /*html*/`
            <template x-style="template-style" data-testid="template">
                <div>Template content</div>
            </template>
        `)

        await sleep(100)

        const template = document.querySelector('[data-testid="template"]')
        expect(template.classList.contains('px-4')).toBe(false)
    })

    test('should handle missing style gracefully', async () => {
        loadHtml(document.body, /*html*/`
            <div x-style="non-existent-style" data-testid="missing-style">
                Missing Style
            </div>
        `)

        await sleep(100)

        const div = document.querySelector('[data-testid="missing-style"]')
        // Should not crash, just no styles applied
        expect(div.className).toBe('')
    })

    test('should handle x-part without host element gracefully', async () => {
        loadHtml(document.body, /*html*/`
            <div x-part="orphan" data-testid="orphan-part">
                Orphan Part
            </div>
        `)

        await sleep(100)

        const div = document.querySelector('[data-testid="orphan-part"]')
        // Should not crash, just no styles applied
        expect(div.className).toBe('')
    })

    test('should update classes when variants change', async () => {
        $vui.setStyle('dynamic-button', {
            base: 'px-4 py-2 rounded',
            variants: {
                size: {
                    sm: 'text-sm',
                    lg: 'text-lg'
                }
            }
        })

        loadHtml(document.body, /*html*/`
            <div x-data="{ size: 'sm' }">
                <button x-style="dynamic-button" x-bind:data-size="size" data-testid="dynamic-button">
                    Dynamic Button
                </button>
                <button @click="size = size === 'sm' ? 'lg' : 'sm'" data-testid="toggle">
                    Toggle Size
                </button>
            </div>
        `)

        await sleep(100)

        const button = document.querySelector('[data-testid="dynamic-button"]')
        const toggle = document.querySelector('[data-testid="toggle"]')

        expect(button.classList.contains('text-sm')).toBe(true)

        // Click to change size
        toggle.click()
        await sleep(100)

        expect(button.classList.contains('text-lg')).toBe(true)
        expect(button.classList.contains('text-sm')).toBe(false)
    })

    test('should handle compound variants with string expressions', async () => {
        $vui.setStyle('conditional-button', {
            base: 'px-4 py-2 rounded',
            variants: {
                size: {
                    sm: 'text-sm',
                    lg: 'text-lg'
                },
                type: {
                    primary: 'bg-blue-500',
                    secondary: 'bg-gray-500'
                }
            },
            compoundVariants: [
                {
                    conditions: 'v.size === "lg" && v.type === "primary"',
                    classes: 'shadow-xl'
                }
            ]
        })

        loadHtml(document.body, /*html*/`
            <button x-style="conditional-button" data-size="lg" data-type="primary" data-testid="conditional-button">
                Conditional Button
            </button>
        `)

        await sleep(100)

        const button = document.querySelector('[data-testid="conditional-button"]')
        expect(button.classList.contains('shadow-xl')).toBe(true)
    })
})