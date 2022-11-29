if (!$vui.setups) $vui.setups = {}
if (!$vui.components) $vui.components = {}
$vui.ready(() => {
    const _ = $vui._
    const { directive, prefixed, addRootSelector, magic, closestDataStack, mergeProxies, evaluateLater, effect } = Alpine
    const ATTR_UI = 'v-ui'
    const ATTR_CLOAK = 'v-cloak'

    const DIR_COMP = prefixed('component')
    const DIR_IMPORT = prefixed('import')
    const DIR_DATA = prefixed('data')
    const DIR_INIT = prefixed('init')

    let styleElement = document.createElement('style')
    styleElement.setAttribute('id', 'vimesh-ui-component-common-styles')
    styleElement.innerHTML = `
    [${ATTR_UI}] {display : block}
    [${ATTR_CLOAK}] {display: none !important;}
    `
    document.head.prepend(styleElement)
    addRootSelector(() => `[${DIR_COMP}]`)
    function findWrapperComponent(el, filter) {
        if (!el) return null
        if (el._vui_type) {
            if (!filter || filter(el)) return el
        }
        return findWrapperComponent(el.parentNode)
    }
    magic('api', el => {
        let comp = findWrapperComponent(el)
        return mergeProxies([comp && comp._vui_api || {}, ...closestDataStack(el)])
    })
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
        const namespace = value || $vui.config.namespace || 'vui'
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
                let elComp = this
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
                    elComp._vui_api = setup(elComp)
                }
                if (!elComp.hasAttribute(DIR_DATA))
                    elComp.setAttribute(DIR_DATA, '{}')
                elComp.removeAttribute(ATTR_CLOAK)
            }
        }
        customElements.define(compName.toLowerCase(), $vui.components[compName]);
    })
})