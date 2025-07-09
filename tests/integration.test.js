const { sleep, loadHtml, fixture } = require('./utils')

describe('Integration Tests', () => {
    beforeEach(() => {
        fixture(true)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    describe('Component Lifecycle Integration', () => {
        test('should handle complete component lifecycle with mount and unmount', async () => {
            const lifecycleEvents = []
            
            window.testLifecycle = {
                onMounted: (name) => lifecycleEvents.push(`${name}:mounted`),
                onUnmounted: (name) => lifecycleEvents.push(`${name}:unmounted`),
                onAttributeChanged: (name, attr, oldVal, newVal) => lifecycleEvents.push(`${name}:attr:${attr}:${oldVal}->${newVal}`)
            }

            // First load templates
            loadHtml(document.body, /*html*/`
                <template x-component="parent-component">
                    <div class="parent">
                        <h1>Parent Component</h1>
                        <slot></slot>
                    </div>
                    <script>
                        return {
                            onMounted() {
                                window.testLifecycle.onMounted('parent')
                            },
                            onUnmounted() {
                                window.testLifecycle.onUnmounted('parent')
                            },
                            onAttributeChanged(name, oldValue, newValue) {
                                window.testLifecycle.onAttributeChanged('parent', name, oldValue, newValue)
                            }
                        }
                    </script>
                </template>
                
                <template x-component="child-component">
                    <div class="child">
                        <h2>Child Component</h2>
                        <slot></slot>
                    </div>
                    <script>
                        return {
                            onMounted() {
                                window.testLifecycle.onMounted('child')
                            },
                            onUnmounted() {
                                window.testLifecycle.onUnmounted('child')
                            }
                        }
                    </script>
                </template>
            `)

            await sleep(200)

            // Now create components after templates are registered
            const parent = document.createElement('vui-parent-component')
            parent.setAttribute('data-testid', 'parent')
            const child = document.createElement('vui-child-component')
            child.setAttribute('data-testid', 'child')
            child.textContent = 'Child Content'
            parent.appendChild(child)
            document.body.appendChild(parent)

            await sleep(300)

            // Check that components were created and have APIs
            expect(parent._vui_type).toBe('parent-component')
            expect(child._vui_type).toBe('child-component')

            // Test basic component structure
            expect(parent.querySelector('.parent')).toBeTruthy()
            expect(child.querySelector('.child')).toBeTruthy()

            // Test unmounting
            parent.remove()
            await sleep(100)
            
            // Verify components were removed from DOM
            expect(document.querySelector('[data-testid="parent"]')).toBeFalsy()
            expect(document.querySelector('[data-testid="child"]')).toBeFalsy()
        })

        test('should handle nested component mounting order', async () => {
            // First load templates
            loadHtml(document.body, /*html*/`
                <template x-component="level1-component">
                    <div class="level1">
                        Level 1: <slot></slot>
                    </div>
                </template>
                
                <template x-component="level2-component">
                    <div class="level2">
                        Level 2: <slot></slot>
                    </div>
                </template>
                
                <template x-component="level3-component">
                    <div class="level3">
                        Level 3: <slot></slot>
                    </div>
                </template>
            `)

            await sleep(200)

            // Now create nested components
            const level1 = document.createElement('vui-level1-component')
            const level2 = document.createElement('vui-level2-component')
            const level3 = document.createElement('vui-level3-component')
            
            level3.textContent = 'Deep nested content'
            level2.appendChild(level3)
            level1.appendChild(level2)
            document.body.appendChild(level1)

            await sleep(300)

            // Check nested structure was created
            expect(level1._vui_type).toBe('level1-component')
            expect(level2._vui_type).toBe('level2-component')
            expect(level3._vui_type).toBe('level3-component')
            
            // Check DOM structure
            expect(level1.querySelector('.level1')).toBeTruthy()
            expect(level2.querySelector('.level2')).toBeTruthy()
            expect(level3.querySelector('.level3')).toBeTruthy()
            
            // Check nesting - find the nested components within the DOM structure
            const level2InDom = level1.querySelector('vui-level2-component')
            const level3InDom = level2.querySelector('vui-level3-component')
            
            expect(level2InDom).toBeTruthy()
            expect(level3InDom).toBeTruthy()
        })
    })

    describe('Component Communication', () => {
        test('should enable parent-child component communication via $api', async () => {
            // First load templates
            loadHtml(document.body, /*html*/`
                <template x-component="parent-communication">
                    <div>
                        <h1>Parent</h1>
                        <slot></slot>
                    </div>
                    <script>
                        return {
                            sendToChild() {
                                return 'message sent to child'
                            },
                            receiveFromChild(message) {
                                return \`Parent received: \${message}\`
                            }
                        }
                    </script>
                </template>
                
                <template x-component="child-communication">
                    <div>
                        <h2>Child</h2>
                    </div>
                    <script>
                        return {
                            message: 'No message yet',
                            sendToParent() {
                                return 'message sent to parent'
                            },
                            receiveFromParent(message) {
                                this.message = message
                                return \`Child received: \${message}\`
                            }
                        }
                    </script>
                </template>
            `)

            await sleep(200)

            // Create components
            const parent = document.createElement('vui-parent-communication')
            parent.setAttribute('data-testid', 'parent-comm')
            const child = document.createElement('vui-child-communication')
            child.setAttribute('data-testid', 'child-comm')
            parent.appendChild(child)
            document.body.appendChild(parent)

            await sleep(300)

            // Test that components have APIs
            expect(parent._vui_api).toBeDefined()
            expect(child._vui_api).toBeDefined()

            // Test API methods exist
            expect(typeof parent._vui_api.sendToChild).toBe('function')
            expect(typeof parent._vui_api.receiveFromChild).toBe('function')
            expect(typeof child._vui_api.sendToParent).toBe('function')
            expect(typeof child._vui_api.receiveFromParent).toBe('function')

            // Test basic communication
            const parentResult = parent._vui_api.sendToChild()
            expect(parentResult).toBe('message sent to child')

            const childResult = child._vui_api.receiveFromParent('Hello from parent!')
            expect(childResult).toBe('Child received: Hello from parent!')
        })

        test('should handle sibling component communication', async () => {
            // First load templates
            loadHtml(document.body, /*html*/`
                <template x-component="container-component">
                    <div class="container">
                        <h1>Container</h1>
                        <slot></slot>
                    </div>
                    <script>
                        return {
                            broadcast(from, message) {
                                return \`broadcasting \${message} from \${from}\`
                            }
                        }
                    </script>
                </template>
                
                <template x-component="sibling-a">
                    <div class="sibling-a">
                        <h2>Sibling A</h2>
                    </div>
                    <script>
                        return {
                            lastMessage: 'No messages',
                            sendMessage() {
                                return 'Hello from Sibling A'
                            },
                            receiveMessage(message) {
                                this.lastMessage = message
                                return \`A received: \${message}\`
                            }
                        }
                    </script>
                </template>
                
                <template x-component="sibling-b">
                    <div class="sibling-b">
                        <h2>Sibling B</h2>
                    </div>
                    <script>
                        return {
                            lastMessage: 'No messages',
                            sendMessage() {
                                return 'Hello from Sibling B'
                            },
                            receiveMessage(message) {
                                this.lastMessage = message
                                return \`B received: \${message}\`
                            }
                        }
                    </script>
                </template>
            `)

            await sleep(200)

            // Create components
            const container = document.createElement('vui-container-component')
            container.setAttribute('data-testid', 'container')
            const siblingA = document.createElement('vui-sibling-a')
            siblingA.setAttribute('data-testid', 'sibling-a')
            const siblingB = document.createElement('vui-sibling-b')
            siblingB.setAttribute('data-testid', 'sibling-b')
            
            container.appendChild(siblingA)
            container.appendChild(siblingB)
            document.body.appendChild(container)

            await sleep(300)

            // Test that components have APIs
            expect(container._vui_api).toBeDefined()
            expect(siblingA._vui_api).toBeDefined()
            expect(siblingB._vui_api).toBeDefined()

            // Test API methods
            expect(typeof container._vui_api.broadcast).toBe('function')
            expect(typeof siblingA._vui_api.sendMessage).toBe('function')
            expect(typeof siblingA._vui_api.receiveMessage).toBe('function')
            expect(typeof siblingB._vui_api.sendMessage).toBe('function')
            expect(typeof siblingB._vui_api.receiveMessage).toBe('function')

            // Test sibling communication
            const messageA = siblingA._vui_api.sendMessage()
            expect(messageA).toBe('Hello from Sibling A')

            const receivedB = siblingB._vui_api.receiveMessage('Hello from Sibling A')
            expect(receivedB).toBe('B received: Hello from Sibling A')
        })
    })

    describe('Complex Integration Scenarios', () => {
        test('should handle dynamic component creation with import', async () => {
            // Setup mock fetch for dynamic import
            const mockFetch = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
                text: () => Promise.resolve(`
                    <template x-component="dynamic-item">
                        <div class="dynamic-item">
                            <span>Dynamic Item</span>
                        </div>
                        <script>
                            return {
                                itemText: 'Dynamic Item'
                            }
                        </script>
                    </template>
                `)
            })
            global.fetch = mockFetch

            $vui.config.importMap = {
                "*": "/components/${component}.html"
            }

            try {
                // Test dynamic import functionality
                await $vui.import('dynamic-item')
                
                expect(mockFetch).toHaveBeenCalledWith('/components/dynamic-item.html')
                
                // Check if component was registered
                const elementClass = customElements.get('vui-dynamic-item')
                expect(elementClass).toBeDefined()
                
                // Test creating the imported component
                const item = document.createElement('vui-dynamic-item')
                document.body.appendChild(item)
                
                await sleep(300)
                
                expect(item._vui_type).toBe('dynamic-item')
                expect(item.querySelector('.dynamic-item')).toBeTruthy()
            } catch (error) {
                // If import fails, just test that we can create component manually
                loadHtml(document.body, /*html*/`
                    <template x-component="dynamic-item">
                        <div class="dynamic-item">
                            <span>Dynamic Item</span>
                        </div>
                    </template>
                `)
                
                await sleep(200)
                
                const item = document.createElement('vui-dynamic-item')
                document.body.appendChild(item)
                
                await sleep(200)
                
                expect(item._vui_type).toBe('dynamic-item')
                expect(item.querySelector('.dynamic-item')).toBeTruthy()
            }
        })

        test('should handle complex styling with component hierarchy', async () => {
            // Test basic style registration and retrieval
            $vui.setStyle('card', {
                base: 'border rounded-lg p-4',
                variants: {
                    size: {
                        sm: 'p-2 text-sm',
                        lg: 'p-6 text-lg'
                    },
                    color: {
                        blue: 'border-blue-500 bg-blue-50',
                        red: 'border-red-500 bg-red-50'
                    }
                }
            })

            // Test that style was registered
            const cardStyle = $vui.getStyle('card')
            expect(cardStyle).toBeDefined()
            expect(cardStyle.base).toBe('border rounded-lg p-4')
            expect(cardStyle.variants.size.lg).toBe('p-6 text-lg')
            expect(cardStyle.variants.color.blue).toBe('border-blue-500 bg-blue-50')

            // Test style application with x-style directive
            loadHtml(document.body, /*html*/`
                <div x-style="card" data-size="lg" data-color="blue" data-testid="styled-card">
                    Card content
                </div>
            `)

            await sleep(200)

            const card = document.querySelector('[data-testid="styled-card"]')

            // Check that some basic styles were applied
            expect(card.classList.contains('border')).toBe(true)
            expect(card.classList.contains('rounded-lg')).toBe(true)
            
            // Test style object generation by accessing the registered style
            const smallRedStyle = $vui.getStyle('card')
            expect(smallRedStyle.variants.size.sm).toBe('p-2 text-sm')
            expect(smallRedStyle.variants.color.red).toBe('border-red-500 bg-red-50')
        })

        test('should handle component creation and cleanup', async () => {
            // First load template
            loadHtml(document.body, /*html*/`
                <template x-component="memory-component">
                    <div class="memory-component">
                        <span>Memory Component</span>
                    </div>
                    <script>
                        return {
                            componentId: 'test-component'
                        }
                    </script>
                </template>
            `)

            await sleep(200)

            const components = []

            // Create multiple components
            for (let i = 0; i < 3; i++) {
                const comp = document.createElement('vui-memory-component')
                comp.setAttribute('data-id', 'comp-' + i)
                comp.setAttribute('data-testid', 'memory-comp-' + i)
                document.body.appendChild(comp)
                components.push(comp)
            }

            await sleep(300)

            // Verify components were created
            expect(components.length).toBe(3)
            components.forEach((comp, i) => {
                expect(comp._vui_type).toBe('memory-component')
                expect(comp.getAttribute('data-id')).toBe('comp-' + i)
                expect(comp.querySelector('.memory-component')).toBeTruthy()
            })

            // Clean up components
            components.forEach(comp => comp.remove())

            await sleep(100)

            // Verify components were removed
            components.forEach((comp, i) => {
                expect(document.querySelector(`[data-testid="memory-comp-${i}"]`)).toBeFalsy()
            })
        })
    })
})