const { sleep, loadHtml, fixture } = require('./utils')

describe('Comprehensive $api Testing', () => {
    beforeEach(() => {
        fixture(true)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    describe('$api core functionality', () => {
        test('should access $api from component and return methods', async () => {
            loadHtml(document.body, /*html*/`
                <template x-component="api-test">
                    <div data-testid="content">
                        <span x-text="$api.getValue()"></span>
                    </div>
                    <script>
                        return {
                            value: 'test value',
                            getValue() {
                                return this.value
                            }
                        }
                    </script>
                </template>
            `)
            
            await sleep(100)
            
            const component = document.createElement('vui-api-test')
            document.body.appendChild(component)
            
            await sleep(200)
            
            const span = component.querySelector('span')
            expect(span.textContent).toBe('test value')
        })

        test('should access $el from $api context', async () => {
            loadHtml(document.body, /*html*/`
                <template x-component="el-test">
                    <div>
                        <button @click="$api.highlightSelf()" data-testid="button">Click</button>
                    </div>
                    <script>
                        return {
                            highlightSelf() {
                                this.$el.classList.add('highlighted')
                            }
                        }
                    </script>
                </template>
            `)
            
            await sleep(100)
            
            const component = document.createElement('vui-el-test')
            document.body.appendChild(component)
            
            await sleep(200)
            
            const button = component.querySelector('[data-testid="button"]')
            button.click()
            
            await sleep(50)
            
            expect(component.classList.contains('highlighted')).toBe(true)
        })

        test('should access $prop from $api', async () => {
            loadHtml(document.body, /*html*/`
                <template x-component="prop-access">
                    <div>
                        <span data-testid="prop-value"></span>
                    </div>
                    <script>
                        return {
                            onMounted() {
                                const value = this.$prop('test-prop', 'default')
                                this.$el.querySelector('[data-testid="prop-value"]').textContent = value
                            }
                        }
                    </script>
                </template>
            `)
            
            await sleep(100)
            
            const component = document.createElement('vui-prop-access')
            component.setAttribute('test-prop', 'custom value')
            document.body.appendChild(component)
            
            await sleep(200)
            
            const propValue = component.querySelector('[data-testid="prop-value"]')
            expect(propValue.textContent).toBe('custom value')
        })
    })

    describe('$api.$of() method', () => {
        test('should find parent component API by type', async () => {
            loadHtml(document.body, /*html*/`
                <template x-component="parent">
                    <div>
                        <slot></slot>
                    </div>
                    <script>
                        return {
                            parentValue: 'I am parent',
                            getParentValue() {
                                return this.parentValue
                            }
                        }
                    </script>
                </template>
                <template x-component="child">
                    <div>
                        <span data-testid="child-text"></span>
                    </div>
                    <script>
                        return {
                            getFromParent() {
                                const parentApi = this.$of('parent')
                                return parentApi ? parentApi.getParentValue() : 'no parent'
                            },
                            onMounted() {
                                $vui.nextTick(() => {
                                    const result = this.getFromParent()
                                    const el = this.$el.querySelector('[data-testid="child-text"]')
                                    if (el) el.textContent = result
                                })
                            }
                        }
                    </script>
                </template>
            `)
            
            await sleep(100)
            
            const parent = document.createElement('vui-parent')
            parent.innerHTML = '<vui-child></vui-child>'
            document.body.appendChild(parent)
            
            await sleep(300)
            
            const childText = parent.querySelector('[data-testid="child-text"]')
            expect(childText.textContent).toBe('I am parent')
        })

        test('should find parent with namespace prefix', async () => {
            loadHtml(document.body, /*html*/`
                <template x-component:hui="dialog">
                    <div>
                        <slot></slot>
                    </div>
                    <script>
                        return {
                            isOpen: true,
                            close() {
                                this.isOpen = false
                            }
                        }
                    </script>
                </template>
                <template x-component:hui="dialog-panel">
                    <div>
                        <button @click="$api.closeDialog()" data-testid="close-btn">Close</button>
                    </div>
                    <script>
                        return {
                            closeDialog() {
                                const dialog = this.$of(':dialog')
                                if (dialog) dialog.close()
                            }
                        }
                    </script>
                </template>
            `)
            
            await sleep(100)
            
            const dialog = document.createElement('hui-dialog')
            dialog.innerHTML = '<hui-dialog-panel></hui-dialog-panel>'
            document.body.appendChild(dialog)
            
            await sleep(300)
            
            const dialogApi = window.$vui.$api(dialog)
            expect(dialogApi.isOpen).toBe(true)
            
            const closeBtn = dialog.querySelector('[data-testid="close-btn"]')
            closeBtn.click()
            
            await sleep(50)
            
            expect(dialogApi.isOpen).toBe(false)
        })

        test('should return closest parent when called without argument', async () => {
            loadHtml(document.body, /*html*/`
                <template x-component="outer">
                    <div><slot></slot></div>
                    <script>
                        return {
                            name: 'outer'
                        }
                    </script>
                </template>
                <template x-component="inner">
                    <div>
                        <button @click="$api.showParent()" data-testid="show-parent">Show Parent</button>
                        <span data-testid="parent-name"></span>
                    </div>
                    <script>
                        return {
                            showParent() {
                                const parent = this.$of()
                                const name = parent ? parent.name : 'none'
                                this.$el.querySelector('[data-testid="parent-name"]').textContent = name
                            }
                        }
                    </script>
                </template>
            `)
            
            await sleep(100)
            
            const outer = document.createElement('vui-outer')
            outer.innerHTML = '<vui-inner></vui-inner>'
            document.body.appendChild(outer)
            
            await sleep(300)
            
            const button = outer.querySelector('[data-testid="show-parent"]')
            button.click()
            
            await sleep(50)
            
            const parentName = outer.querySelector('[data-testid="parent-name"]')
            expect(parentName.textContent).toBe('outer')
        })
    })

    describe('$api.$closest() method', () => {
        test('should find closest component by type', async () => {
            loadHtml(document.body, /*html*/`
                <template x-component="container">
                    <div data-value="container-1"><slot></slot></div>
                    <script>
                        return {
                            getValue() {
                                return this.$el.getAttribute('data-value')
                            }
                        }
                    </script>
                </template>
                <template x-component="nested">
                    <div>
                        <button @click="$api.findContainer()" data-testid="find-btn">Find</button>
                        <span data-testid="result"></span>
                    </div>
                    <script>
                        return {
                            findContainer() {
                                const container = this.$closest('container')
                                const result = this.$el.querySelector('[data-testid="result"]')
                                result.textContent = container ? $vui.$api(container).getValue() : 'not found'
                            }
                        }
                    </script>
                </template>
            `)
            
            await sleep(100)
            
            const structure = document.createElement('div')
            structure.innerHTML = `
                <vui-container data-value="outer">
                    <vui-container data-value="inner">
                        <vui-nested></vui-nested>
                    </vui-container>
                </vui-container>
            `
            document.body.appendChild(structure)
            
            await sleep(300)
            
            const button = structure.querySelector('[data-testid="find-btn"]')
            button.click()
            
            await sleep(50)
            
            const result = structure.querySelector('[data-testid="result"]')
            expect(result.textContent).toBe('inner')
        })

        test('should find closest component with filter function', async () => {
            loadHtml(document.body, /*html*/`
                <template x-component="item">
                    <div><slot></slot></div>
                    <script>
                        return {
                            get active() {
                                return this.$prop('active')
                            }
                        }
                    </script>
                </template>
                <template x-component="finder">
                    <div>
                        <button @click="$api.findActive()" data-testid="find-active">Find Active</button>
                        <span data-testid="found"></span>
                    </div>
                    <script>
                        return {
                            findActive() {
                                const activeItem = this.$closest((el) => {
                                    const api = $vui.$api(el)
                                    return api && api.active === true
                                })
                                const result = this.$el.querySelector('[data-testid="found"]')
                                result.textContent = activeItem ? 'found active' : 'not found'
                            }
                        }
                    </script>
                </template>
            `)
            
            await sleep(100)
            
            const structure = document.createElement('div')
            structure.innerHTML = `
                <vui-item :active="false">
                    <vui-item :active="true">
                        <vui-finder></vui-finder>
                    </vui-item>
                </vui-item>
            `
            document.body.appendChild(structure)
            
            await sleep(300)
            
            const button = structure.querySelector('[data-testid="find-active"]')
            button.click()
            
            await sleep(50)
            
            const found = structure.querySelector('[data-testid="found"]')
            expect(found.textContent).toBe('found active')
        })
    })

    describe('$api.$find() and $api.$findOne() methods', () => {
        test('should find all child components by type', async () => {
            loadHtml(document.body, /*html*/`
                <template x-component="list">
                    <div>
                        <slot></slot>
                        <button @click="$api.countItems()" data-testid="count-btn">Count</button>
                        <span data-testid="count">0</span>
                    </div>
                    <script>
                        return {
                            countItems() {
                                const items = this.$find('list-item')
                                const countEl = this.$el.querySelector('[data-testid="count"]')
                                countEl.textContent = items.length
                            }
                        }
                    </script>
                </template>
                <template x-component="list-item">
                    <div><slot></slot></div>
                </template>
            `)
            
            await sleep(100)
            
            const list = document.createElement('vui-list')
            list.innerHTML = `
                <vui-list-item>Item 1</vui-list-item>
                <vui-list-item>Item 2</vui-list-item>
                <vui-list-item>Item 3</vui-list-item>
            `
            document.body.appendChild(list)
            
            await sleep(300)
            
            const button = list.querySelector('[data-testid="count-btn"]')
            button.click()
            
            await sleep(50)
            
            const count = list.querySelector('[data-testid="count"]')
            expect(count.textContent).toBe('3')
        })

        test('should find child components with namespace filter', async () => {
            loadHtml(document.body, /*html*/`
                <template x-component="parent-list">
                    <div>
                        <button @click="$api.countChildren()" data-testid="count-btn">Count Children</button>
                        <span data-testid="count">0</span>
                        <slot></slot>
                    </div>
                    <script>
                        return {
                            countChildren() {
                                const children = this.$find(':item')
                                const countEl = this.$el.querySelector('[data-testid="count"]')
                                countEl.textContent = children.length
                            }
                        }
                    </script>
                </template>
                <template x-component="item">
                    <div>Item</div>
                </template>
            `)
            
            await sleep(100)
            
            const list = document.createElement('vui-parent-list')
            document.body.appendChild(list)
            
            await sleep(200)
            
            // Add items after the parent is mounted
            const item1 = document.createElement('vui-item')
            const item2 = document.createElement('vui-item')
            list.appendChild(item1)
            list.appendChild(item2)
            
            await sleep(200)
            
            const button = list.querySelector('[data-testid="count-btn"]')
            button.click()
            
            await sleep(50)
            
            const count = list.querySelector('[data-testid="count"]')
            expect(count.textContent).toBe('2')
        })

        test('should find first matching child with $findOne', async () => {
            loadHtml(document.body, /*html*/`
                <template x-component="form">
                    <div>
                        <slot></slot>
                        <button @click="$api.focusFirstInput()" data-testid="focus-btn">Focus First</button>
                    </div>
                    <script>
                        return {
                            focusFirstInput() {
                                const firstInput = this.$findOne('form-input')
                                if (firstInput) {
                                    $vui.$api(firstInput).focus()
                                }
                            }
                        }
                    </script>
                </template>
                <template x-component="form-input">
                    <input type="text" data-testid="input" />
                    <script>
                        return {
                            focus() {
                                this.$el.querySelector('input').focus()
                            }
                        }
                    </script>
                </template>
            `)
            
            await sleep(100)
            
            const form = document.createElement('vui-form')
            form.innerHTML = `
                <vui-form-input></vui-form-input>
                <vui-form-input></vui-form-input>
                <vui-form-input></vui-form-input>
            `
            document.body.appendChild(form)
            
            await sleep(300)
            
            const button = form.querySelector('[data-testid="focus-btn"]')
            button.click()
            
            await sleep(50)
            
            const firstInput = form.querySelectorAll('input')[0]
            expect(document.activeElement).toBe(firstInput)
        })
    })

    describe('$api lifecycle hooks', () => {
        test('should call onMounted when component is mounted', async () => {
            let mountedCalled = false
            window.testMountedCallback = () => {
                mountedCalled = true
            }
            
            loadHtml(document.body, /*html*/`
                <template x-component="lifecycle-test">
                    <div data-testid="content">Mounted</div>
                    <script>
                        return {
                            onMounted() {
                                window.testMountedCallback()
                            }
                        }
                    </script>
                </template>
            `)
            
            await sleep(100)
            
            const component = document.createElement('vui-lifecycle-test')
            document.body.appendChild(component)
            
            await sleep(200)
            
            expect(mountedCalled).toBe(true)
            
            delete window.testMountedCallback
        })

        test('should call onUnmounted when component is removed', async () => {
            let unmountedCalled = false
            window.testUnmountedCallback = () => {
                unmountedCalled = true
            }
            
            loadHtml(document.body, /*html*/`
                <template x-component="unmount-test">
                    <div>Unmount Test</div>
                    <script>
                        return {
                            onUnmounted() {
                                window.testUnmountedCallback()
                            }
                        }
                    </script>
                </template>
            `)
            
            await sleep(100)
            
            const component = document.createElement('vui-unmount-test')
            document.body.appendChild(component)
            
            await sleep(200)
            
            expect(unmountedCalled).toBe(false)
            
            component.remove()
            await sleep(100)
            
            expect(unmountedCalled).toBe(true)
            
            delete window.testUnmountedCallback
        })
    })

    describe('$api.$meta property', () => {
        test('should access component meta information', async () => {
            loadHtml(document.body, /*html*/`
                <template x-component:custom="meta-test">
                    <div>
                        <button @click="$api.showMeta()" data-testid="meta-btn">Show Meta</button>
                        <span data-testid="type"></span>
                        <span data-testid="namespace"></span>
                        <span data-testid="prefix"></span>
                    </div>
                    <script>
                        return {
                            showMeta() {
                                const meta = this.$meta
                                this.$el.querySelector('[data-testid="type"]').textContent = meta.type || ''
                                this.$el.querySelector('[data-testid="namespace"]').textContent = meta.namespace || ''
                                this.$el.querySelector('[data-testid="prefix"]').textContent = meta.prefix || meta.namespace + '-' || ''
                            }
                        }
                    </script>
                </template>
            `)
            
            await sleep(100)
            
            const component = document.createElement('custom-meta-test')
            document.body.appendChild(component)
            
            await sleep(200)
            
            const button = component.querySelector('[data-testid="meta-btn"]')
            button.click()
            
            await sleep(50)
            
            expect(component.querySelector('[data-testid="type"]').textContent).toBe('meta-test')
            expect(component.querySelector('[data-testid="namespace"]').textContent).toBe('custom')
            expect(component.querySelector('[data-testid="prefix"]').textContent).toBe('custom-')
        })
    })

    describe('$api.$parent property', () => {
        test('should access parent component element', async () => {
            loadHtml(document.body, /*html*/`
                <template x-component="outer-parent">
                    <div data-parent-id="parent-123">
                        <slot></slot>
                    </div>
                </template>
                <template x-component="inner-child">
                    <div>
                        <button @click="$api.showParentInfo()" data-testid="info-btn">Show Parent Info</button>
                        <span data-testid="parent-info"></span>
                    </div>
                    <script>
                        return {
                            showParentInfo() {
                                if (this.$parent) {
                                    const parentEl = this.$parent.querySelector('[data-parent-id]')
                                    const id = parentEl ? parentEl.getAttribute('data-parent-id') : 'no id'
                                    this.$el.querySelector('[data-testid="parent-info"]').textContent = id
                                } else {
                                    this.$el.querySelector('[data-testid="parent-info"]').textContent = 'no parent'
                                }
                            }
                        }
                    </script>
                </template>
            `)
            
            await sleep(100)
            
            const parent = document.createElement('vui-outer-parent')
            document.body.appendChild(parent)
            
            await sleep(200)
            
            const child = document.createElement('vui-inner-child')
            parent.appendChild(child)
            
            await sleep(200)
            
            const button = parent.querySelector('[data-testid="info-btn"]')
            button.click()
            
            await sleep(50)
            
            const parentInfo = parent.querySelector('[data-testid="parent-info"]')
            expect(parentInfo.textContent).toBe('parent-123')
        })
    })

    describe('Complex $api interactions', () => {
        test('should handle complex component communication patterns', async () => {
            loadHtml(document.body, /*html*/`
                <template x-component="accordion">
                    <div>
                        <slot></slot>
                    </div>
                    <script>
                        return {
                            activePanel: null,
                            setActive(panelId) {
                                this.activePanel = panelId
                                this.$find('accordion-panel').forEach(el => {
                                    const api = $vui.$api(el)
                                    api.setExpanded(api.panelId === panelId)
                                })
                            }
                        }
                    </script>
                </template>
                <template x-component="accordion-panel" x-data="{expanded: false}">
                    <div>
                        <button @click="$api.toggle()" data-testid="toggle">
                            <slot name="header"></slot>
                        </button>
                        <div x-show="expanded" data-testid="content">
                            <slot></slot>
                        </div>
                    </div>
                    <script>
                        return {
                            get panelId() {
                                return this.$prop('panel-id')
                            },
                            setExpanded(value) {
                                this.expanded = value
                            },
                            toggle() {
                                const accordion = this.$of('accordion')
                                if (accordion) {
                                    accordion.setActive(this.panelId)
                                }
                            }
                        }
                    </script>
                </template>
            `)
            
            await sleep(100)
            
            const accordion = document.createElement('vui-accordion')
            accordion.innerHTML = `
                <vui-accordion-panel panel-id="panel1">
                    <span slot="header">Panel 1</span>
                    Content 1
                </vui-accordion-panel>
                <vui-accordion-panel panel-id="panel2">
                    <span slot="header">Panel 2</span>
                    Content 2
                </vui-accordion-panel>
            `
            document.body.appendChild(accordion)
            
            await sleep(300)
            
            const toggleButtons = accordion.querySelectorAll('[data-testid="toggle"]')
            const contents = accordion.querySelectorAll('[data-testid="content"]')
            
            // Initially all panels are collapsed
            expect(contents[0].style.display).toBe('none')
            expect(contents[1].style.display).toBe('none')
            
            // Click first panel
            toggleButtons[0].click()
            await sleep(100)
            
            expect(contents[0].style.display).not.toBe('none')
            expect(contents[1].style.display).toBe('none')
            
            // Click second panel
            toggleButtons[1].click()
            await sleep(100)
            
            expect(contents[0].style.display).toBe('none')
            expect(contents[1].style.display).not.toBe('none')
        })

        test('should handle nested component lookups with namespace', async () => {
            loadHtml(document.body, /*html*/`
                <template x-component:app="root">
                    <div><slot></slot></div>
                    <script>
                        return {
                            rootValue: 'root data'
                        }
                    </script>
                </template>
                <template x-component:app="middle">
                    <div><slot></slot></div>
                    <script>
                        return {
                            findRoot() {
                                return this.$of(':root')
                            }
                        }
                    </script>
                </template>
                <template x-component:app="leaf">
                    <div>
                        <button @click="$api.accessRoot()" data-testid="access-root">Access Root</button>
                        <span data-testid="root-value"></span>
                    </div>
                    <script>
                        return {
                            accessRoot() {
                                const middle = this.$of(':middle')
                                const root = middle ? middle.findRoot() : null
                                const value = root ? root.rootValue : 'not found'
                                this.$el.querySelector('[data-testid="root-value"]').textContent = value
                            }
                        }
                    </script>
                </template>
            `)
            
            await sleep(100)
            
            const structure = document.createElement('app-root')
            structure.innerHTML = '<app-middle><app-leaf></app-leaf></app-middle>'
            document.body.appendChild(structure)
            
            await sleep(300)
            
            const button = structure.querySelector('[data-testid="access-root"]')
            button.click()
            
            await sleep(50)
            
            const value = structure.querySelector('[data-testid="root-value"]')
            expect(value.textContent).toBe('root data')
        })
    })

    describe('$api with x-modelable integration', () => {
        test('should work with x-modelable for two-way binding', async () => {
            loadHtml(document.body, /*html*/`
                <template x-component="toggle" x-modelable="checked" x-data="{checked: false}">
                    <button @click="$api.toggle()" data-testid="toggle-btn">
                        <span x-text="checked ? 'ON' : 'OFF'"></span>
                    </button>
                    <script>
                        return {
                            toggle() {
                                this.checked = !this.checked
                            }
                        }
                    </script>
                </template>
            `)
            
            await sleep(100)
            
            const container = document.createElement('div')
            container.setAttribute('x-data', '{ isOn: false }')
            container.innerHTML = `
                <vui-toggle x-model="isOn"></vui-toggle>
                <span x-text="isOn ? 'Active' : 'Inactive'" data-testid="status"></span>
            `
            document.body.appendChild(container)
            
            await sleep(300)
            
            const button = container.querySelector('[data-testid="toggle-btn"]')
            const status = container.querySelector('[data-testid="status"]')
            
            expect(button.textContent.trim()).toBe('OFF')
            expect(status.textContent).toBe('Inactive')
            
            button.click()
            await sleep(100)
            
            expect(button.textContent.trim()).toBe('ON')
            expect(status.textContent).toBe('Active')
        })
    })

    describe('$api error handling', () => {
        test('should handle component properties correctly', async () => {
            loadHtml(document.body, /*html*/`
                <template x-component="prop-test">
                    <div>
                        <button @click="$api.logProps()" data-testid="prop-btn">Log Props</button>
                        <span data-testid="prop-value"></span>
                    </div>
                    <script>
                        return {
                            logProps() {
                                const value = this.$prop('test-value', 'default')
                                this.$el.querySelector('[data-testid="prop-value"]').textContent = value
                            }
                        }
                    </script>
                </template>
            `)
            
            await sleep(100)
            
            const component = document.createElement('vui-prop-test')
            component.setAttribute('test-value', 'custom value')
            document.body.appendChild(component)
            
            await sleep(200)
            
            const button = component.querySelector('[data-testid="prop-btn"]')
            button.click()
            
            await sleep(50)
            
            const propValue = component.querySelector('[data-testid="prop-value"]')
            expect(propValue.textContent).toBe('custom value')
        })

        test('should handle complex $api chaining', async () => {
            loadHtml(document.body, /*html*/`
                <template x-component="chain-a">
                    <div><slot></slot></div>
                    <script>
                        return {
                            valueA: 'A',
                            getChain() {
                                return this.valueA
                            }
                        }
                    </script>
                </template>
                <template x-component="chain-b">
                    <div><slot></slot></div>
                    <script>
                        return {
                            valueB: 'B',
                            getFullChain() {
                                const a = this.$of('chain-a')
                                return a ? a.getChain() + this.valueB : this.valueB
                            }
                        }
                    </script>
                </template>
                <template x-component="chain-c">
                    <div>
                        <button @click="$api.showChain()" data-testid="chain-btn">Show Chain</button>
                        <span data-testid="chain-result"></span>
                    </div>
                    <script>
                        return {
                            showChain() {
                                const b = this.$of('chain-b')
                                const result = b ? b.getFullChain() + 'C' : 'C'
                                this.$el.querySelector('[data-testid="chain-result"]').textContent = result
                            }
                        }
                    </script>
                </template>
            `)
            
            await sleep(100)
            
            const structure = document.createElement('vui-chain-a')
            structure.innerHTML = '<vui-chain-b><vui-chain-c></vui-chain-c></vui-chain-b>'
            document.body.appendChild(structure)
            
            await sleep(300)
            
            const button = structure.querySelector('[data-testid="chain-btn"]')
            button.click()
            
            await sleep(50)
            
            const result = structure.querySelector('[data-testid="chain-result"]')
            expect(result.textContent).toBe('ABC')
        })
    })
})