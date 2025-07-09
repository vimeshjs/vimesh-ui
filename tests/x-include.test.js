const { sleep, loadHtml, fixture } = require('./utils')

describe('x-include', () => {
    beforeEach(() => {
        fixture(true)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    test('should include content from URL', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            text: () => Promise.resolve('<div class="included-content">Included content</div>')
        })
        global.fetch = mockFetch

        loadHtml(document.body, /*html*/`
            <div x-include="/content/fragment.html" data-testid="include-host">
            </div>
        `)

        await sleep(100)

        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/content/fragment.html'))
        
        const host = document.querySelector('[data-testid="include-host"]')
        const includedContent = host.querySelector('.included-content')
        expect(includedContent).toBeTruthy()
        expect(includedContent.textContent).toBe('Included content')
    })

    test('should include content from element ID', async () => {
        // Create source element
        loadHtml(document.body, /*html*/`
            <div id="source-content" style="display: none;">
                <span class="source-text">Source content</span>
            </div>
            <div x-include="#source-content" data-testid="include-host">
            </div>
        `)

        await sleep(100)

        const host = document.querySelector('[data-testid="include-host"]')
        const includedContent = host.querySelector('.source-text')
        expect(includedContent).toBeTruthy()
        expect(includedContent.textContent).toBe('Source content')
    })

    test('should include multiple URLs', async () => {
        const hostElement = document.createElement('div')
        hostElement.setAttribute('data-testid', 'multi-include-host')
        document.body.appendChild(hostElement)

        const mockFetch = jest.fn()
            .mockResolvedValueOnce({
                text: () => Promise.resolve('<div class="content-1">Content 1</div>')
            })
            .mockResolvedValueOnce({
                text: () => Promise.resolve('<div class="content-2">Content 2</div>')
            })
        global.fetch = mockFetch

        await $vui.include(hostElement, ['/content/part1.html', '/content/part2.html'])

        expect(mockFetch).toHaveBeenCalledTimes(2)
        
        const content1 = hostElement.querySelector('.content-1')
        const content2 = hostElement.querySelector('.content-2')
        expect(content1).toBeTruthy()
        expect(content2).toBeTruthy()
        expect(content1.textContent).toBe('Content 1')
        expect(content2.textContent).toBe('Content 2')
    })

    test('should handle include with scripts', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            text: () => Promise.resolve(`
                <div>Content with script</div>
                <script>
                    window.testIncludeScript = 'executed'
                </script>
            `)
        })
        global.fetch = mockFetch

        const hostElement = document.createElement('div')
        document.body.appendChild(hostElement)

        await $vui.include(hostElement, ['/content/with-script.html'])

        expect(window.testIncludeScript).toBe('executed')
    })

    test('should handle include with script tags', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            text: () => Promise.resolve(`
                <div>Content with script</div>
                <script type="text/plain">// This is a test script</script>
            `)
        })
        global.fetch = mockFetch

        const hostElement = document.createElement('div')
        document.body.appendChild(hostElement)

        await $vui.include(hostElement, ['/content/with-script.html'])

        // Check if content was included
        expect(hostElement.innerHTML).toContain('Content with script')
        
        // Check if script tag was added
        const scriptTag = document.querySelector('script[type="text/plain"]')
        expect(scriptTag).toBeTruthy()
    })

    test('should handle unwrap modifier', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            text: () => Promise.resolve('<div class="unwrapped-content">Unwrapped content</div>')
        })
        global.fetch = mockFetch

        loadHtml(document.body, /*html*/`
            <div x-include.unwrap="/content/unwrap.html" data-testid="unwrap-host">
            </div>
        `)

        await sleep(100)

        // The host element should be removed and content should be in its place
        const host = document.querySelector('[data-testid="unwrap-host"]')
        expect(host).toBeFalsy()
        
        const unwrappedContent = document.querySelector('.unwrapped-content')
        expect(unwrappedContent).toBeTruthy()
        expect(unwrappedContent.textContent).toBe('Unwrapped content')
    })

    test('should handle dynamic include with variable', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            text: () => Promise.resolve('<div class="dynamic-content">Dynamic content</div>')
        })
        global.fetch = mockFetch

        loadHtml(document.body, /*html*/`
            <div x-data="{ url: '/content/dynamic.html' }" x-include="url" data-testid="dynamic-host">
            </div>
        `)

        await sleep(100)

        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/content/dynamic.html'))
        
        const host = document.querySelector('[data-testid="dynamic-host"]')
        const dynamicContent = host.querySelector('.dynamic-content')
        expect(dynamicContent).toBeTruthy()
        expect(dynamicContent.textContent).toBe('Dynamic content')
    })

    test('should handle dynamic include with array', async () => {
        const mockFetch = jest.fn()
            .mockResolvedValue({
                text: () => Promise.resolve('<div class="array-content">Array content</div>')
            })
        global.fetch = mockFetch

        const hostElement = document.createElement('div')
        hostElement.setAttribute('data-testid', 'array-host')
        document.body.appendChild(hostElement)

        // Directly test the include function with array
        await $vui.include(hostElement, ['/content/array1.html', '/content/array2.html'])

        expect(mockFetch).toHaveBeenCalledTimes(2)
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/content/array1.html'))
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/content/array2.html'))
        
        const contents = hostElement.querySelectorAll('.array-content')
        expect(contents.length).toBe(2)
    })

    test('should handle relative URLs with base URL', async () => {
        // Set up base URL in parent element
        const parentElement = document.createElement('div')
        parentElement._vui_base_url = 'https://example.com/base/'
        
        const hostElement = document.createElement('div')
        parentElement.appendChild(hostElement)
        document.body.appendChild(parentElement)

        const mockFetch = jest.fn().mockResolvedValue({
            text: () => Promise.resolve('<div>Relative content</div>')
        })
        global.fetch = mockFetch

        await $vui.include(hostElement, ['relative/path.html'])

        expect(mockFetch).toHaveBeenCalledWith('https://example.com/base/relative/path.html')
    })

    test('should handle absolute URLs', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            text: () => Promise.resolve('<div>Absolute content</div>')
        })
        global.fetch = mockFetch

        const hostElement = document.createElement('div')
        document.body.appendChild(hostElement)

        await $vui.include(hostElement, ['https://example.com/absolute/path.html'])

        expect(mockFetch).toHaveBeenCalledWith('https://example.com/absolute/path.html')
    })

    test('should handle fetch errors gracefully', async () => {
        const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'))
        global.fetch = mockFetch

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        
        const hostElement = document.createElement('div')
        document.body.appendChild(hostElement)

        await $vui.include(hostElement, ['/content/error.html'])

        expect(consoleSpy).toHaveBeenCalledWith(
            'Fails to include /content/error.html',
            expect.any(Error)
        )

        consoleSpy.mockRestore()
    })

    test('should handle missing element ID gracefully', async () => {
        const hostElement = document.createElement('div')
        document.body.appendChild(hostElement)

        await $vui.include(hostElement, ['#non-existent-id'])

        // Should not include anything but should not error
        expect(hostElement.children.length).toBe(0)
    })

    test('should handle empty URLs in array', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            text: () => Promise.resolve('<div>Valid content</div>')
        })
        global.fetch = mockFetch

        const hostElement = document.createElement('div')
        document.body.appendChild(hostElement)

        await $vui.include(hostElement, ['', '/valid/url.html', '  ', '/another/valid.html'])

        // Should only fetch valid URLs
        expect(mockFetch).toHaveBeenCalledTimes(2)
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/valid/url.html'))
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/another/valid.html'))
    })

    test('should handle includes with complex HTML structures', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            text: () => Promise.resolve(`
                <div class="wrapper">
                    <h1>Title</h1>
                    <div class="content">Content</div>
                </div>
            `)
        })
        global.fetch = mockFetch

        const hostElement = document.createElement('div')
        document.body.appendChild(hostElement)

        await $vui.include(hostElement, ['/content/complex.html'])

        // Should have included all nested elements
        expect(hostElement.querySelector('.wrapper')).toBeTruthy()
        expect(hostElement.querySelector('h1')).toBeTruthy()
        expect(hostElement.querySelector('.content')).toBeTruthy()
        expect(hostElement.querySelector('h1').textContent).toBe('Title')
    })

    test('should preserve data stack for unwrapped elements', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            text: () => Promise.resolve('<div class="data-stack-test">Test content</div>')
        })
        global.fetch = mockFetch

        const hostElement = document.createElement('div')
        hostElement._vui_unwrap = true
        hostElement._x_dataStack = [{ test: 'data' }]
        document.body.appendChild(hostElement)

        await $vui.include(hostElement, ['/content/test.html'])

        const includedElement = document.querySelector('.data-stack-test')
        expect(includedElement).toBeTruthy()
        expect(includedElement._x_dataStack).toEqual([{ test: 'data' }])
    })

    test('should reject include with invalid input', async () => {
        const hostElement = document.createElement('div')
        document.body.appendChild(hostElement)

        await expect($vui.include(hostElement, {})).rejects.toEqual('Fails to include [object Object] !')
        await expect($vui.include(hostElement, 'string')).rejects.toEqual('Fails to include string !')
    })

    test('should handle HTTP URLs in directive', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            text: () => Promise.resolve('<div>HTTP content</div>')
        })
        global.fetch = mockFetch

        loadHtml(document.body, /*html*/`
            <div x-include="http://example.com/content.html" data-testid="http-host">
            </div>
        `)

        await sleep(100)

        expect(mockFetch).toHaveBeenCalledWith('http://example.com/content.html')
    })

    test('should handle HTTPS URLs in directive', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            text: () => Promise.resolve('<div>HTTPS content</div>')
        })
        global.fetch = mockFetch

        loadHtml(document.body, /*html*/`
            <div x-include="https://example.com/content.html" data-testid="https-host">
            </div>
        `)

        await sleep(100)

        expect(mockFetch).toHaveBeenCalledWith('https://example.com/content.html')
    })

    test('should handle path-based URLs in directive', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            text: () => Promise.resolve('<div>Path content</div>')
        })
        global.fetch = mockFetch

        loadHtml(document.body, /*html*/`
            <div x-include="./relative/content.html" data-testid="path-host">
            </div>
        `)

        await sleep(100)

        // URL will be resolved relative to document.baseURI
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('relative/content.html'))
    })

    test('should set base URL on included elements', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            text: () => Promise.resolve('<div class="base-url-test">Test content</div>')
        })
        global.fetch = mockFetch

        const hostElement = document.createElement('div')
        document.body.appendChild(hostElement)

        await $vui.include(hostElement, ['https://example.com/content/test.html'])

        const includedElement = hostElement.querySelector('.base-url-test')
        expect(includedElement).toBeTruthy()
        expect(includedElement._vui_base_url).toBe('https://example.com/content/test.html')
    })
})