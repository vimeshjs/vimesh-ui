
$vui.ready(() => {
    const _ = $vui._
    const { directive, $data } = Alpine
    $vui.setups = {}
    $vui.components = {}
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
        _.each(el.content.querySelectorAll("slot"), elSlot => {
            const name = elSlot.getAttribute('name') || ''

        })
        $vui.components[compName] = class extends HTMLElement {
            connectedCallback() {
                this.innerHTML = el.innerHTML
                let setup = $vui.setups[compName]
                if (setup) {
                    Alpine.bind(this, setup(this))
                }
                _.each(this.querySelectorAll('*[part]'), elPart => {
                    const part = elPart.getAttribute('part') || ''
                    const fullName = `${compName}${part ? `/${part}` : ''}`
                    setup = $vui.setups[fullName]
                    if (setup) {
                        Alpine.bind(elPart, setup(elPart))
                    }
                })
            }
        }
        customElements.define(compName, $vui.components[compName]);
    })
})