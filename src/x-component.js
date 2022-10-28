if (!$vui.setups) $vui.setups = {}
if (!$vui.components) $vui.components = {}
$vui.ready(() => {
    const _ = $vui._
    const { directive, bind, prefixed, addRootSelector } = Alpine
    const ATTR_UI = 'v-ui'
    const ATTR_CLOAK = 'v-cloak'
    const ATTR_X_IGNORE = 'x-ignore'
    let styleElement = document.createElement('style')
    styleElement.setAttribute('id', 'vimesh-ui-component-common-styles')
    styleElement.innerHTML = `
    [${ATTR_UI}] {display : block}
    [${ATTR_CLOAK}] {display: none !important;}
    `
    document.head.prepend(styleElement)
    addRootSelector(() => `[${prefixed('component')}]`)
    directive('component', (el, { expression, value, modifiers }, { cleanup }) => {
        if (el.tagName.toLowerCase() !== 'template') {
            return console.warn('x-component can only be used on a <template> tag', el)
        }
        el._x_ignore = true
        const dirComp = prefixed('component')
        const dirImport = prefixed('import')
        const namespace = value || $vui.config.namespace || 'vui'
        const prefixMap = $vui.config.prefixMap || {}
        const prefix = prefixMap[namespace] || namespace
        const compName = `${prefix}-${expression}`
        const unwrap = modifiers.includes('unwrap')
        _.each(el.content.querySelectorAll("script"), elScript => {
            const part = elScript.getAttribute('part') || ''
            const fullName = `${compName}${part ? `/${part}` : ''}`
            const elExecute = document.createElement("script")
            _.each(elScript.attributes, a => elExecute.setAttribute(a.name, a.value))
            elExecute.setAttribute('component', compName)
            elExecute.innerHTML = `
$vui.setups["${fullName}"] = ($el)=>{
${elScript.innerHTML}
}
//# sourceURL=__vui__/${fullName}.js
`
            document.body.append(elExecute)
            elScript.remove()
        })
        function copyAttributes(elFrom, elTo) {
            _.each(elFrom.attributes, attr => {
                if (dirComp === attr.name || attr.name.startsWith(dirComp) ||
                    dirImport === attr.name || attr.name.startsWith(dirImport)) return
                try {
                    let name = attr.name
                    if (name.startsWith('@'))
                        name = `${prefixed('on')}:${name.substring(1)}`
                    else if (name.startsWith(':'))
                        name = `${prefixed('bind')}:${name.substring(1)}`
                    if ('class' === name) {
                        elTo.setAttribute(name, attr.value + ' ' + (elTo.getAttribute('class') || ''))
                    } else {
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
                const setupRoot = () => {
                    elComp._vui_prefix = prefix
                    elComp._vui_type = expression
                    elComp._vui_namespace = namespace
                    let setup = $vui.setups[compName]
                    if (setup) bind(elComp, setup(elComp))
                }
                if (unwrap) {
                    elComp = el.content.cloneNode(true).firstElementChild
                    setupRoot()
                    copyAttributes(this, elComp)
                    this.after(elComp)
                    this.remove()
                } else {
                    setupRoot()
                    elComp.innerHTML = el.innerHTML
                    elComp.setAttribute(ATTR_UI, $vui.config.debug ? `${_.elapse()}` : '')
                }
                copyAttributes(el, elComp)
                elComp.removeAttribute(ATTR_CLOAK)
                elComp.removeAttribute(ATTR_X_IGNORE)

                _.each(elComp.querySelectorAll("slot"), elSlot => {
                    const name = elSlot.getAttribute('name') || ''
                    elSlot.after(...(slotContents[name] ? slotContents[name] : defaultSlotContent))
                    elSlot.remove()
                })
                _.each(elComp.querySelectorAll('*[part]'), elPart => {
                    const part = elPart.getAttribute('part') || ''
                    const fullName = `${compName}${part ? `/${part}` : ''}`
                    let setup = $vui.setups[fullName]
                    if (setup) bind(elPart, setup(elPart))
                })
            }
        }
        customElements.define(compName.toLowerCase(), $vui.components[compName]);
    })
})