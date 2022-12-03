if (!$vui.setups) $vui.setups = {}
if (!$vui.components) $vui.components = {}
$vui.ready(() => {
    const _ = $vui._
    const { directive, prefixed, addRootSelector, magic,
        closestDataStack, mergeProxies, initTree, evaluateLater,
        evaluate, effect, nextTick, mutateDom, reactive } = Alpine
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
        if (!el.parentNode) return null
        if (isComponent(el.parentNode)) return el.parentNode
        return getParentComponent(el.parentNode)
    }
    function visitComponents(elContainer, callback) {
        _.each(elContainer.querySelectorAll('*'), el => {
            if (isComponent(el)) callback(el)
            if (el.tagName === 'TEMPLATE') {
                visitComponents(el.content, callback)
            }
        })
    }
    function findWrapperComponent(el, filter) {
        if (!el) return null
        if (el._vui_type) {
            if (!filter || filter(el)) return el
        }
        return findWrapperComponent(el.parentNode)
    }
    function getApiOf(el, filter) {
        const comp = findWrapperComponent(el, filter)
        if (!comp) return {}
        const of = {
            of(type) {
                if (!type) return {}
                return getApiOf(comp.parentNode, el => el._vui_type === type)
            }
        }
        return mergeProxies([of, comp._vui_api || {}, ...closestDataStack(comp)])
    }
    _.each(document.querySelectorAll('*'), el => {
        _.each(el.attributes, attr => {
            let name = attr.name
            if (name.startsWith(DIR_COMP)) {
                let ns = getNamespaceFromXcomponent(name)
                addNamespace(ns)
            } else if (name.startsWith(DIR_IMPORT) && attr.value) {
                let comps = attr.value.trim()
                if (comps.startsWith('[') && comps.endsWith(']')) {
                    comps = evaluate(el, attr.value)
                } else {
                    comps = comps.split(';')
                }
                _.each(comps, comp => {
                    let p = comp.indexOf('/')
                    if (p !== -1) {
                        let ns = comp.substring(0, p)
                        addNamespace(ns)
                    }
                })
            }
        })
    })
    $vui.prepareComponents = (elContainer) => {
        visitComponents(elContainer, el => {
            el.setAttribute(ATTR_CLOAK, '')
            el.setAttribute(DIR_IGNORE, '')
        })
    }
    $vui.prepareComponents(document)
    addRootSelector(() => `[${DIR_COMP}]`)
    magic('api', el => getApiOf(el))
    magic('prop', el => {
        return (name) => {
            let comp = findWrapperComponent(el)
            if (!comp) return null
            return (comp._x_bindings || {})[name] || Alpine.bound(comp, name)
        }
    })

    directive('component', (el, { expression, value, modifiers }, { cleanup }) => {
        if (el.tagName.toLowerCase() !== 'template') {
            return console.warn('x-component can only be used on a <template> tag', el)
        }
        const namespace = value || $vui.config.namespace || DEFAULT_NAMESPACE
        const prefixMap = $vui.config.prefixMap || {}
        const prefix = prefixMap[namespace] || namespace
        const compName = `${prefix}-${expression}`
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
                if (DIR_COMP === attr.name || attr.name.startsWith(DIR_COMP) ||
                    DIR_IMPORT === attr.name || attr.name.startsWith(DIR_IMPORT)) return
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
                mutateDom(() => {
                    const slotContents = {}
                    const defaultSlotContent = []
                    _.each(this.querySelectorAll(`[${prefixed('for')}]`), elFor => {
                        if (elFor._x_lookup) {
                            Object.values(elFor._x_lookup).forEach(el => el.remove())
                            delete el._x_prevKeys
                            delete el._x_lookup
                        }
                    })
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
                        copyAttributes(this, elComp)
                        this.after(elComp)
                        this.remove()
                    } else {
                        elComp.innerHTML = el.innerHTML
                        elComp.setAttribute(ATTR_UI, $vui.config.debug ? `${_.elapse()}` : '')
                    }
                    copyAttributes(el, elComp)

                    _.each(elComp.querySelectorAll("slot"), elSlot => {
                        const name = elSlot.getAttribute('name') || ''
                        elSlot.after(...(slotContents[name] ? slotContents[name] : defaultSlotContent))
                        elSlot.remove()
                    })

                    elComp._vui_prefix = prefix
                    elComp._vui_type = expression
                    elComp._vui_namespace = namespace
                    let setup = $vui.setups[compName]
                    if (setup) {
                        elComp._vui_api = reactive(setup(elComp))
                    }
                    if (!elComp.hasAttribute(DIR_DATA))
                        elComp.setAttribute(DIR_DATA, '{}')
                    elComp.removeAttribute(ATTR_CLOAK)
                    elComp.removeAttribute(DIR_IGNORE)
                    delete elComp._x_ignore
                    let elParentComp = getParentComponent(elComp)
                    if (!elParentComp || elParentComp._vui_type) {
                        initTree(elComp)
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
                    } else {
                        // wait for parent component to be mounted
                        if (!elParentComp._vui_deferred_elements)
                            elParentComp._vui_deferred_elements = []
                        elParentComp._vui_deferred_elements.push(elComp)
                        if (elComp._vui_deferred_elements)
                            elParentComp._vui_deferred_elements.push(...elComp._vui_deferred_elements)
                    }
                })
            }
            disconnectedCallback() {
                if (this._vui_api) {
                    let api = getApiOf(this)
                    if (api.onUnmounted) api.onUnmounted()
                }
            }
            attributeChangedCallback(name, oldValue, newValue) {
                if (this._vui_api) {
                    let api = getApiOf(this)
                    if (api.onUnmounted) api.onAttributeChanged(name, oldValue, newValue)
                }
            }
        }
        customElements.define(compName.toLowerCase(), $vui.components[compName]);
    })
})