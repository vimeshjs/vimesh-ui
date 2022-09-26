if (!$vui.setups) $vui.setups = {}
if (!$vui.components) $vui.components = {}
$vui.ready(() => {
    const _ = $vui._
    const { directive, bind, prefixed, addRootSelector, mutateDom, initTree } = Alpine
    const ATTR_UI = 'v-ui'
    const ATTR_CLOAK = 'v-cloak'
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
        const compName = `${prefixMap[namespace] || namespace}-${expression}`
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
                mutateDom(() => {
                    const slotContents = {}
                    const defaultSlotContent = []
                    _.each(this.childNodes, elChild => {
                        if (elChild.tagName === 'TEMPLATE') {
                            let slotName = elChild.getAttribute('slot') || ''
                            slotContents[slotName] = elChild.content.cloneNode(true).childNodes
                        } else {
                            _.each(elChild.querySelectorAll && elChild.querySelectorAll(`[${prefixed('for')}]`), elFor => {
                                Object.values(elFor._x_lookup).forEach(el => el.remove())
                                delete el._x_prevKeys
                                delete el._x_lookup
                            })
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
                    elComp.removeAttribute(ATTR_CLOAK)
                    _.each(elComp.querySelectorAll("slot"), elSlot => {
                        const name = elSlot.getAttribute('name') || ''
                        elSlot.after(...(slotContents[name] ? slotContents[name] : defaultSlotContent))
                        elSlot.remove()
                    })
                    let setup = $vui.setups[compName]
                    if (setup) bind(this, setup(this))
                    _.each(elComp.querySelectorAll('*[part]'), elPart => {
                        const part = elPart.getAttribute('part') || ''
                        const fullName = `${compName}${part ? `/${part}` : ''}`
                        setup = $vui.setups[fullName]
                        if (setup) bind(elPart, setup(elPart))
                    })

                    initTree(this)
                })
            }
        }
        customElements.define(compName.toLowerCase(), $vui.components[compName]);
    })
})