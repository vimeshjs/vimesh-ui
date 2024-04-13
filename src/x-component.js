if (!$vui.setups) $vui.setups = {}
if (!$vui.components) $vui.components = {}
$vui.ready(() => {
    const _ = $vui._
    const { directive, prefixed, addRootSelector, magic,
        closestDataStack, mergeProxies, initTree, mutateDom, reactive } = Alpine
    const ATTR_UI = 'v-ui'
    const ATTR_CLOAK = 'v-cloak'
    const DEFAULT_NAMESPACE = 'vui'

    const DIR_COMP = prefixed('component')
    const DIR_IMPORT = prefixed('import')
    const DIR_DATA = prefixed('data')
    const DIR_INIT = prefixed('init')
    const DIR_IGNORE = prefixed('ignore')
    const allNamespaces = [DEFAULT_NAMESPACE]

    let styleElement = document.createElement('style')
    styleElement.setAttribute('id', 'vimesh-ui-component-common-styles')
    styleElement.innerHTML = `
    [${ATTR_UI}] {display : block}
    [${ATTR_CLOAK}] {display: none !important;}
    `
    document.head.prepend(styleElement)
    function addNamespace(ns) {
        if (!ns) return
        ns = ns.trim()
        if (allNamespaces.indexOf(ns) === -1)
            allNamespaces.push(ns)
    }
    function getNamespaceFromXcomponent(dirName) {
        let p1 = dirName.indexOf(':')
        if (p1 === -1) return DEFAULT_NAMESPACE
        let p2 = dirName.indexOf('.', p1)
        return p2 === -1 ? dirName.substring(p1 + 1) : dirName.substring(p1 + 1, p2)
    }
    function isComponent(el) {
        if (el._vui_type) return true
        if (el.tagName) {
            let p = el.tagName.indexOf('-')
            if (p === -1) return false
            let ns = el.tagName.substring(0, p).toLowerCase()
            if (allNamespaces.indexOf(ns) !== -1) {
                return true
            }
        }
        return false
    }
    function getParentComponent(el) {
        visitParent(el, isComponent)
    }
    function visitParent(el, filter) {
        if (!el.parentNode) return null
        if (filter(el.parentNode)) return el.parentNode
        return visitParent(el.parentNode, filter)
    }
    function visitComponents(elContainer, callback) {
        if (elContainer.tagName === 'TEMPLATE') {
            if (elContainer._x_teleport) {
                if (isComponent(elContainer._x_teleport)) callback(elContainer._x_teleport)
                return visitComponents(elContainer._x_teleport, callback)
            }
            return visitComponents(elContainer.content, callback)
        }
        _.each(elContainer.querySelectorAll('*'), el => {
            if (isComponent(el)) callback(el)
            if (el.tagName === 'TEMPLATE') {
                if (el._x_teleport) {
                    if (isComponent(el._x_teleport)) callback(el._x_teleport)
                    return visitComponents(el._x_teleport, callback)
                }
                return visitComponents(el.content, callback)
            }
        })
    }
    function findClosestComponent(el, filter) {
        if (!el) return null
        if (el._vui_type) {
            if (_.isString(filter)) {
                let type = filter
                filter = (el) => el._vui_type === type
            }
            if (!filter || filter(el)) return el
        }
        if (el._x_teleportBack) {
            return findClosestComponent(el._x_teleportBack.parentNode, filter)
        }
        return findClosestComponent(el.parentNode, filter)
    }
    function normalizeFilter(filter, defNamespace) {
        if (_.isFunction(filter)) return filter
        if (_.isPlainObject(filter)) {
            return (el) => {
                if (el._vui_type !== filter.type) return false
                if (filter.namespace && el._vui_namespace !== filter.namespace) return false
                return true
            }
        } else {
            let namespace = ''
            let type = filter
            let parts = filter.split(':')
            if (parts.length > 1) {
                namespace = parts[0] || defNamespace
                type = parts[1]
            }
            return (el) => {
                if (el._vui_type !== type) return false
                if (namespace && el._vui_namespace !== namespace) return false
                return true
            }
        }

    }
    function getApiOf(el, filter) {
        const comp = findClosestComponent(el, filter)
        if (!comp) return null
        const baseApis = {
            $of(type) {
                if (!type) return getApiOf((comp._x_teleportBack || comp).parentNode)
                return getApiOf(
                    (comp._x_teleportBack || comp).parentNode, normalizeFilter(type, comp._vui_namespace))
            },
            get $meta() { return getComponentMeta(comp) },
            get $parent() { return getParentComponent(comp) },
            $closest(filter) {
                return findClosestComponent(comp, normalizeFilter(filter, comp._vui_namespace))
            },
            $find(filter) {
                return findChildComponents(comp, normalizeFilter(filter, comp._vui_namespace))
            },
            $findOne(filter) {
                let comps = findChildComponents(comp, normalizeFilter(filter, comp._vui_namespace))
                return comps.length > 0 ? comps[0] : null
            }
        }
        return mergeProxies([baseApis, comp._vui_api || {}, ...closestDataStack(comp)])
    }
    function getComponentMeta(el) {
        return {
            type: el._vui_type,
            namespace: el._vui_namespace
        }
    }
    function findChildComponents(elContainer, filter) {
        if (_.isString(filter)) {
            let type = filter
            filter = (el) => el._vui_type === type
        }
        let result = []
        visitComponents(elContainer, (el) => {
            if (!filter || filter(el))
                result.push(el)
        })
        return result
    }
    $vui.addNamespace = addNamespace
    $vui.getComponentMeta = getComponentMeta
    $vui.isComponent = isComponent
    $vui.visitComponents = visitComponents
    $vui.findChildComponents = findChildComponents
    $vui.getParentComponent = getParentComponent
    $vui.findClosestComponent = findClosestComponent
    $vui.$api = (el) => getApiOf(el)
    $vui.$data = Alpine.$data
    $vui.setHtml = (el, html) => {
        el.innerHTML = ''
        let dom = $vui.dom(html)
        if (_.isArray(dom))
            el.append(...dom)
        else
            el.append(dom)
    }
    $vui.defer = (callback) => {
        queueMicrotask(callback)
    }
    $vui.dom = (html) => {
        const elTemp = document.createElement('div')
        elTemp._x_ignore = true
        elTemp.innerHTML = html
        $vui.extractNamespaces(elTemp)
        $vui.prepareComponents(elTemp)
        return elTemp.childNodes.length === 1 ? elTemp.firstChild : [...elTemp.childNodes]
    }
    $vui.nextTick = Alpine.nextTick
    $vui.effect = Alpine.effect
    $vui.focus = (el, options) => el && el.focus && el.focus(options || { preventScroll: true })
    $vui.scrollIntoView = (el, options) => el && el.scrollIntoView && el.scrollIntoView(options || { block: 'nearest' })
    $vui.extractNamespaces = (elContainer) => {
        _.each([elContainer, ...elContainer.querySelectorAll('*')], el => {
            if (el.tagName === 'TEMPLATE') {
                $vui.extractNamespaces(el.content)
            }
            _.each(el.attributes, attr => {
                let name = attr.name
                if (name.startsWith(DIR_COMP)) {
                    let ns = getNamespaceFromXcomponent(name)
                    addNamespace(ns)
                } else if (name.startsWith(DIR_IMPORT) && attr.value) {
                    let comps = attr.value.trim()
                    if (comps.startsWith('[') && comps.endsWith(']')) {
                        //comps = evaluate(el, attr.value)
                        return
                    } else {
                        comps = comps.split(';')
                    }
                    _.each(comps, comp => {
                        let p = comp.indexOf(':')
                        if (p !== -1) {
                            let ns = comp.substring(0, p)
                            addNamespace(ns)
                        }
                    })
                }
            })
        })
    }
    $vui.prepareComponents = (elContainer) => {
        visitComponents(elContainer, el => {
            el.setAttribute(ATTR_CLOAK, '')
            el.setAttribute(DIR_IGNORE, '')
        })
    }
    _.each($vui.config.importMap, (v, k) => {
        if (k !== '*') $vui.addNamespace(k)
    })
    $vui.extractNamespaces(document)
    $vui.prepareComponents(document)
    addRootSelector(() => `[${DIR_COMP}]`)
    magic('api', el => getApiOf(el))
    magic('prop', el => {
        return (name, fallback) => {
            let comp = findClosestComponent(el)
            if (!comp) return null
            return Alpine.bound(comp, name, fallback)
        }
    })

    directive('shtml', (el, { expression }, { effect, evaluateLater }) => {
        let evaluate = evaluateLater(expression)
        effect(() => {
            evaluate(value => {
                $vui.setHtml(el, value)
            })
        })
    })

    directive('component', (el, { expression, value, modifiers }, { cleanup }) => {
        if (el.tagName.toLowerCase() !== 'template') {
            return console.warn('x-component can only be used on a <template> tag', el)
        }
        const namespace = value || $vui.config.namespace || DEFAULT_NAMESPACE
        const compName = `${namespace}-${expression}`
        const unwrap = modifiers.includes('unwrap')
        const elScript = el.content.querySelector("script")
        if (elScript) {
            const elExecute = document.createElement("script")
            _.each(elScript.attributes, a => elExecute.setAttribute(a.name, a.value))
            elExecute.setAttribute('component', compName)
            elExecute.innerHTML = `
$vui.setups["${compName}"] = ($el)=>{
${elScript.innerHTML}
}
//# sourceURL=__vui__/${compName}.js
`
            document.body.append(elExecute)
            elScript.remove()
        }
        function copyAttributes(elFrom, elTo) {
            _.each(elFrom.attributes, attr => {
                if (DIR_COMP === attr.name || attr.name.startsWith(DIR_COMP)) return
                try {
                    let name = attr.name
                    if (name.startsWith('@'))
                        name = `${prefixed('on')}:${name.substring(1)}`
                    else if (name.startsWith(':'))
                        name = `${prefixed('bind')}:${name.substring(1)}`
                    if (DIR_INIT === name && elTo.getAttribute(DIR_INIT)) {
                        elTo.setAttribute(name, attr.value + ';' + elTo.getAttribute(DIR_INIT))
                    } else if (DIR_DATA === name && elTo.getAttribute(DIR_DATA)) {
                        elTo.setAttribute(name, '{...' + attr.value + ',...' + elTo.getAttribute(DIR_DATA) + '}')
                    } else if ('class' === name) {
                        elTo.setAttribute(name, attr.value + ' ' + (elTo.getAttribute('class') || ''))
                    } else if (!elTo.hasAttribute(name)) {
                        elTo.setAttribute(name, attr.value)
                    }
                } catch (ex) {
                    console.warn(`Fails to set attribute ${attr.name}=${attr.value} in ${elTo.tagName.toLowerCase()}`)
                }
            })
        }
        $vui.components[compName] = class extends HTMLElement {
            connectedCallback() {
                let elComp = this
                let elTopComp = getParentComponent(elComp)
                while (elTopComp) {
                    if (!elTopComp.hasAttribute(ATTR_UI) && !elTopComp._vui_type) {
                        if ($vui.config.debug) console.log('Not ready to connect ' + this.tagName)
                        return
                    }
                    elTopComp = getParentComponent(elTopComp)
                }
                elComp.setAttribute(ATTR_UI, $vui.config.debug ? `${_.elapse()}` : '')
                if ($vui.config.debug) console.log('Connect ' + this.tagName)
                mutateDom(() => {
                    const slotContents = {}
                    const defaultSlotContent = []
                    _.each(this.childNodes, elChild => {
                        if (elChild.tagName && elChild.hasAttribute('slot')) {
                            let slotName = elChild.getAttribute('slot') || ''
                            let content = elChild.tagName === 'TEMPLATE' ?
                                elChild.content.cloneNode(true).childNodes :
                                [elChild.cloneNode(true)]
                            if (slotContents[slotName])
                                slotContents[slotName].push(...content)
                            else
                                slotContents[slotName] = content
                        } else {
                            defaultSlotContent.push(elChild.cloneNode(true))
                        }
                    })
                    if (unwrap) {
                        elComp = el.content.cloneNode(true).firstElementChild
                        elComp._vui_processing = true
                        copyAttributes(this, elComp)
                        this.after(elComp)
                        this.remove()
                    } else {
                        elComp._vui_processing = true
                        elComp.innerHTML = el.innerHTML
                    }
                    copyAttributes(el, elComp)

                    const elSlots = elComp.querySelectorAll("slot")
                    _.each(elSlots, elSlot => {
                        const name = elSlot.getAttribute('name') || ''
                        elSlot.after(...(slotContents[name] ? slotContents[name] : defaultSlotContent))
                        elSlot.remove()
                    })
                    if (unwrap && isComponent(elComp)) return

                    elComp._vui_type = expression
                    elComp._vui_namespace = namespace
                    let setup = $vui.setups[compName]
                    if (setup) {
                        elComp._vui_api = reactive(setup(elComp))
                    }
                    if (!elComp.hasAttribute(DIR_DATA))
                        elComp.setAttribute(DIR_DATA, '{}')

                    let elParentComp = getParentComponent(elComp) || visitParent(elComp, el => el._vui_processing)
                    if (!elParentComp || elParentComp._vui_type) {
                        if ($vui.config.debug) console.log('Plan initTree ' + this.tagName)
                        queueMicrotask(() => {
                            if (!elComp.isConnected) return
                            elComp.removeAttribute(ATTR_CLOAK)
                            elComp.removeAttribute(DIR_IGNORE)
                            delete elComp._x_ignore
                            if ($vui.config.debug) console.log('Process initTree ' + this.tagName)
                            initTree(elComp)
                            if (elComp._vui_processing) delete elComp._vui_processing
                            if (elComp._vui_api) {
                                let api = getApiOf(elComp)
                                if (api.onMounted) api.onMounted()
                            }
                            _.each(elComp._vui_deferred_elements, el => {
                                if (el._vui_api) {
                                    let api = getApiOf(el)
                                    if (api.onMounted) api.onMounted()
                                }
                            })
                            delete elComp._vui_deferred_elements
                        })
                    } else {
                        // wait for parent component to be mounted
                        if ($vui.config.debug) console.log('Defer initTree ' + this.tagName)
                        if (!elParentComp._vui_deferred_elements)
                            elParentComp._vui_deferred_elements = []
                        elParentComp._vui_deferred_elements.push(elComp)
                        if (elComp._vui_deferred_elements)
                            elParentComp._vui_deferred_elements.push(...elComp._vui_deferred_elements)
                        queueMicrotask(() => {
                            elComp.removeAttribute(ATTR_CLOAK)
                            elComp.removeAttribute(DIR_IGNORE)
                            delete elComp._x_ignore
                        })
                    }
                })
            }
            disconnectedCallback() {
                if ($vui.config.debug) console.log((this.hasAttribute(ATTR_UI) ? 'Disconnect ' : 'Not ready to disconnect ') + this.tagName)

                if (this._vui_api) {
                    let api = getApiOf(this)
                    if (api.onUnmounted) api.onUnmounted()
                }
            }
            attributeChangedCallback(name, oldValue, newValue) {
                if (this._vui_api) {
                    let api = getApiOf(this)
                    if (api.onAttributeChanged) api.onAttributeChanged(name, oldValue, newValue)
                }
            }
        }
        customElements.define(compName.toLowerCase(), $vui.components[compName]);
    })
})