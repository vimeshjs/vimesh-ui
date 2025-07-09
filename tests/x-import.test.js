const { sleep, loadHtml, fixture } = require('./utils')

describe('x-import', () => {
    beforeEach(() => {
        fixture(true)
    })

    afterEach(() => {
        document.body.innerHTML = ''
        // Clean up imports
        if (window.$vui && window.$vui.imports) {
            window.$vui.imports = {}
        }
    })

    test('should import component from string', async () => {
        // Setup import map
        $vui.config.importMap = {
            "*": "/components/${component}.html"
        }

        // Mock fetch to return component HTML
        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(`
                <template x-component="test-component">
                    <div>Imported component</div>
                </template>
            `)
        })
        global.fetch = mockFetch

        // Import component
        await $vui.import('test-component')

        expect(mockFetch).toHaveBeenCalledWith('/components/test-component.html')
        
        // Check if component template was added
        const template = document.querySelector('template[x-component="test-component"]')
        expect(template).toBeTruthy()
    })

    test('should import component with namespace', async () => {
        $vui.config.importMap = {
            "ui": "/ui-components/${component}.html",
            "*": "/components/${component}.html"
        }

        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(`
                <template x-component="button">
                    <button>UI Button</button>
                </template>
            `)
        })
        global.fetch = mockFetch

        await $vui.import('ui:button')

        expect(mockFetch).toHaveBeenCalledWith('/ui-components/button.html')
    })

    test('should import multiple components', async () => {
        $vui.config.importMap = {
            "*": "/components/${component}.html"
        }

        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(`
                <template x-component="component">
                    <div>Component</div>
                </template>
            `)
        })
        global.fetch = mockFetch

        await $vui.import(['comp1', 'comp2', 'comp3'])

        expect(mockFetch).toHaveBeenCalledTimes(3)
        expect(mockFetch).toHaveBeenCalledWith('/components/comp1.html')
        expect(mockFetch).toHaveBeenCalledWith('/components/comp2.html')
        expect(mockFetch).toHaveBeenCalledWith('/components/comp3.html')
    })

    test('should import components from path', async () => {
        $vui.config.importMap = {
            "*": "/components/${path}${component}.html"
        }

        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(`
                <template x-component="form-input">
                    <input type="text" />
                </template>
            `)
        })
        global.fetch = mockFetch

        await $vui.import('forms/input')

        expect(mockFetch).toHaveBeenCalledWith('/components/forms/input.html')
    })

    test('should import comma-separated components', async () => {
        $vui.config.importMap = {
            "*": "/components/${component}.html"
        }

        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(`
                <template x-component="component">
                    <div>Component</div>
                </template>
            `)
        })
        global.fetch = mockFetch

        await $vui.import('button,input,select')

        expect(mockFetch).toHaveBeenCalledTimes(3)
        expect(mockFetch).toHaveBeenCalledWith('/components/button.html')
        expect(mockFetch).toHaveBeenCalledWith('/components/input.html')
        expect(mockFetch).toHaveBeenCalledWith('/components/select.html')
    })

    test('should handle import with scripts', async () => {
        $vui.config.importMap = {
            "*": "/components/${component}.html"
        }

        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(`
                <template x-component="script-component">
                    <div>Component with script</div>
                    <script>
                        console.log('Component script loaded')
                    </script>
                </template>
                <script>
                    console.log('Global script loaded')
                </script>
            `)
        })
        global.fetch = mockFetch

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

        await $vui.import('script-component')

        // Check if scripts were executed
        expect(consoleSpy).toHaveBeenCalledWith('Global script loaded')

        consoleSpy.mockRestore()
    })

    test('should handle import with links (CSS)', async () => {
        $vui.config.importMap = {
            "*": "/components/${component}.html"
        }

        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(`
                <link rel="stylesheet" href="/styles/component.css" />
                <template x-component="styled-component">
                    <div class="styled">Styled component</div>
                </template>
            `)
        })
        global.fetch = mockFetch

        await $vui.import('styled-component')

        // Check if link was added to head
        const link = document.head.querySelector('link[href="/styles/component.css"]')
        expect(link).toBeTruthy()
        expect(link.getAttribute('rel')).toBe('stylesheet')
    })

    test('should handle script with use-meta attribute', async () => {
        $vui.config.importMap = {
            "*": "/components/${component}.html"
        }

        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(`
                <template x-component="meta-component">
                    <div>Meta component</div>
                </template>
                <script use-meta>
                    console.log('Import meta:', __import_meta__)
                </script>
            `)
        })
        global.fetch = mockFetch

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

        await $vui.import('meta-component')

        // Check if script received import meta
        expect(consoleSpy).toHaveBeenCalledWith(
            'Import meta:',
            expect.objectContaining({
                component: 'meta-component',
                namespace: '',
                path: '',
                url: '/components/meta-component.html'
            })
        )

        consoleSpy.mockRestore()
    })

    test('should cache imported components', async () => {
        $vui.config.importMap = {
            "*": "/components/${component}.html"
        }

        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(`
                <template x-component="cached-component">
                    <div>Cached component</div>
                </template>
            `)
        })
        global.fetch = mockFetch

        // Import the same component twice
        await $vui.import('cached-component')
        await $vui.import('cached-component')

        // Should only fetch once due to caching
        expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    test('should handle x-import directive', async () => {
        $vui.config.importMap = {
            "*": "/components/${component}.html"
        }

        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(`
                <template x-component="directive-component">
                    <div>Directive imported component</div>
                </template>
            `)
        })
        global.fetch = mockFetch

        loadHtml(document.body, /*html*/`
            <div x-import="directive-component">
                <directive-component></directive-component>
            </div>
        `)

        await sleep(100)

        expect(mockFetch).toHaveBeenCalledWith('/components/directive-component.html')
        
        const template = document.querySelector('template[x-component="directive-component"]')
        expect(template).toBeTruthy()
    })

    test('should handle x-import with multiple components', async () => {
        $vui.config.importMap = {
            "*": "/components/${component}.html"
        }

        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(`
                <template x-component="component">
                    <div>Component</div>
                </template>
            `)
        })
        global.fetch = mockFetch

        loadHtml(document.body, /*html*/`
            <div x-import="comp1;comp2;comp3">
                Content
            </div>
        `)

        await sleep(100)

        expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    test('should handle dynamic import', async () => {
        $vui.config.importMap = {
            "*": "/components/${component}.html"
        }

        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(`
                <template x-component="dynamic-component">
                    <div>Dynamic component</div>
                </template>
            `)
        })
        global.fetch = mockFetch

        loadHtml(document.body, /*html*/`
            <div x-data="{ componentName: 'dynamic-component' }" x-import:dynamic="componentName">
                Content
            </div>
        `)

        await sleep(100)

        expect(mockFetch).toHaveBeenCalledWith('/components/dynamic-component.html')
    })

    test('should handle fetch errors gracefully', async () => {
        $vui.config.importMap = {
            "*": "/components/${component}.html"
        }

        const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'))
        global.fetch = mockFetch

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

        await $vui.import('error-component')

        expect(consoleSpy).toHaveBeenCalledWith(
            'Fails to import error-component @ /components/error-component.html',
            expect.any(Error)
        )

        consoleSpy.mockRestore()
    })

    test('should handle HTTP errors', async () => {
        $vui.config.importMap = {
            "*": "/components/${component}.html"
        }

        const mockFetch = jest.fn().mockResolvedValue({
            ok: false,
            status: 404,
            statusText: 'Not Found'
        })
        global.fetch = mockFetch

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

        await $vui.import('not-found-component')

        expect(consoleSpy).toHaveBeenCalledWith(
            'Fails to import not-found-component @ /components/not-found-component.html',
            expect.any(Error)
        )

        consoleSpy.mockRestore()
    })

    test('should handle missing namespace template', async () => {
        $vui.config.importMap = {
            "defined": "/defined/${component}.html"
            // No template for "missing" namespace
        }

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

        await $vui.import('missing:component')

        expect(consoleSpy).toHaveBeenCalledWith(
            "Url template for namespace 'missing' is not defined!"
        )

        consoleSpy.mockRestore()
    })

    test('should handle invalid url template', async () => {
        $vui.config.importMap = {
            "*": "/components/${invalid_syntax}.html"
        }

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

        await $vui.import('test-component')

        expect(consoleSpy).toHaveBeenCalledWith(
            'Fails to parse url template /components/${invalid_syntax}.html with component test-component'
        )

        consoleSpy.mockRestore()
    })

    test('should reject import with invalid input', async () => {
        await expect($vui.import({})).rejects.toEqual('Fails to import [object Object] !')
        await expect($vui.import(123)).rejects.toEqual('Fails to import 123 !')
    })

    test('should handle empty/null imports gracefully', async () => {
        expect($vui.import(null)).toBeUndefined()
        expect($vui.import('')).toBeUndefined()
        await expect($vui.import([])).resolves.toEqual([])
    })

    test('should handle invalid x-import directive modifier', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

        loadHtml(document.body, /*html*/`
            <div x-import:invalid="component">
                Content
            </div>
        `)

        await sleep(100)

        expect(consoleSpy).toHaveBeenCalledWith(
            'x-import:invalid is not allowed!'
        )

        consoleSpy.mockRestore()
    })
})