
if (!$vui.setups) $vui.setups = {}
if (!$vui.components) $vui.components = {}
$vui.ready(() => {
    const _ = $vui._
    const { directive, bind, prefixed } = Alpine
    directive('component', (el, { expression }, { cleanup }) => {
        if (el.tagName.toLowerCase() !== 'template') warn('x-ui can only be used on a <template> tag', el)
        const compName = expression
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
                const slotContents = {}
                const defaultSlotContent = []
                _.each(this.childNodes, elChild => {
                    if (elChild.tagName === 'TEMPLATE') {
                        let slotName = elChild.getAttribute('slot')
                        if (slotName) slotContents[slotName] = elChild.content.cloneNode(true).childNodes
                    } else {
                        defaultSlotContent.push(elChild.cloneNode(true))
                    }
                })
                const curDirective = prefixed('component')
                _.each(el.attributes, attr => {
                    if (curDirective === attr.name) return
                    try {
                        let name = attr.name
                        if (name.startsWith('@'))
                            name = `${prefixed('on')}:${name.substring(1)}`
                        else if (name.startsWith(':'))
                            name = `${prefixed('bind')}:${name.substring(1)}`
                        this.setAttribute(name, attr.value)
                    } catch (ex) {
                        console.warn(`Fails to set attribute ${attr.name}=${attr.value} in ${this.tagName.toLowerCase()}`)
                    }
                })
                this.innerHTML = el.innerHTML
                _.each(this.querySelectorAll("slot"), elSlot => {
                    const name = elSlot.getAttribute('name')
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
            }
        }
        customElements.define(compName, $vui.components[compName]);
    })
})