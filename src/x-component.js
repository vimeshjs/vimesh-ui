if (!$vui.setups) $vui.setups = {}
if (!$vui.components) $vui.components = {}
$vui.ready(() => {
    const _ = $vui._
    const { directive, bind, prefixed, addRootSelector, mutateDom, initTree } = Alpine
    addRootSelector(() => `[${prefixed('component')}]`)
    directive('component', (el, { expression, value }, { cleanup }) => {
        if (el.tagName.toLowerCase() !== 'template') {
            return console.warn('x-component can only be used on a <template> tag', el)
        }
        el._x_ignore = true
        const namespace = value || $vui.config.namespace || 'vui'
        const prefixMap = $vui.config.prefixMap || {}
        const compName = `${prefixMap[namespace] || namespace}-${expression}`
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
        })
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
                    const dirComp = prefixed('component')
                    const dirImport = prefixed('import')
                    _.each(el.attributes, attr => {
                        if (dirComp === attr.name || attr.name.startsWith(dirComp) ||
                            dirImport === attr.name || attr.name.startsWith(dirImport)) return
                        try {
                            let name = attr.name
                            if (name.startsWith('@'))
                                name = `${prefixed('on')}:${name.substring(1)}`
                            else if (name.startsWith(':'))
                                name = `${prefixed('bind')}:${name.substring(1)}`
                            if ('class' === name) {
                                this.setAttribute(name, attr.value + ' ' + (this.getAttribute('class') || ''))
                            } else {
                                this.setAttribute(name, attr.value)
                            }
                        } catch (ex) {
                            console.warn(`Fails to set attribute ${attr.name}=${attr.value} in ${this.tagName.toLowerCase()}`)
                        }
                    })
                    this.innerHTML = el.innerHTML
                    _.each(this.querySelectorAll("slot"), elSlot => {
                        const name = elSlot.getAttribute('name') || ''
                        elSlot.after(...(slotContents[name] ? slotContents[name] : defaultSlotContent))
                        elSlot.remove()
                    })
                    let setup = $vui.setups[compName]
                    if (setup) bind(this, setup(this))
                    _.each(this.querySelectorAll('*[part]'), elPart => {
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