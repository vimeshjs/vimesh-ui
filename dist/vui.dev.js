// Vimesh UI v0.2.0
"use strict";

(function (G) {
    if (G.$vui) return // Vimesh UI core is already loaded
    G.$vui = {
        config: {},
        ready(callback) {
            if (G.Alpine) {
                callback()
            } else {
                document.addEventListener('alpine:init', callback)
            }
        }
    }

    const _ = G.$vui._ = {
        isString(str) {
            return (str != null && typeof str.valueOf() === "string")
        },
        isArray(array) {
            return Array.isArray(array)
        },
        isFunction(func) {
            return typeof func === "function";
        },
        isPlainObject(item) {
            return item !== null && typeof item === 'object' && item.constructor === Object;
        },
        each(objOrArray, callback) {
            if (!objOrArray) return
            if (_.isArray(objOrArray)) {
                objOrArray.forEach((val, index) => {
                    callback(val, index, index)
                })
            } else {
                Object.entries(objOrArray).forEach(([key, val], index) => {
                    callback(val, key, index)
                })
            }
        },
        extend(target, ...sources) {
            const length = sources.length
            if (length < 1 || target == null) return target
            for (let i = 0; i < length; i++) {
                const source = sources[i]
                if (!_.isPlainObject(source)) continue
                Object.keys(source).forEach((key) => {
                    var desc = Object.getOwnPropertyDescriptor(source, key)
                    if (desc.get || desc.set) {
                        Object.defineProperty(target, key, desc);
                    } else {
                        target[key] = source[key]
                    }
                })
            }
            return target
        },
        get(obj, path) {
            if (!_.isString(path) || !path) throw `Unable to get the property "${path}" in ${obj}`
            let parts = path.split('.')
            for (let i = 0; i < parts.length - 1; i++) {
                if (!obj[parts[i]]) return null
                obj = obj[parts[i]]
            }
            return obj[parts[parts.length - 1]]
        },
        set(obj, path, val) {
            if (!_.isString(path) || !path) throw `Unable to set the property "${path}" in ${obj}`
            let parts = path.split('.')
            for (let i = 0; i < parts.length - 1; i++) {
                if (!obj[parts[i]]) obj[parts[i]] = {}
                obj = obj[parts[i]]
            }
            obj[parts[parts.length - 1]] = val
        }
    }
})(window);;
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
                        this.setAttribute(attr.name, attr.value)
                    } catch (ex) {
                        console.warn(`Fails to set attribute ${attr.name}=${attr.value} in ${this.tagName}`)
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
});

$vui.import = (comps) => {
    const _ = $vui._
    const importMap = $vui.config.importMap
    if (!importMap || !importMap['*'])
        return Promise.reject('You must setup import url template for the fallback namespace "*"')

    if (!$vui.imports) $vui.imports = {}
    if (!$vui.importScriptIndex) $vui.importScriptIndex = 1
    if (_.isString(comps)) comps = [comps]
    if (_.isArray(comps)) {
        const tasks = []
        _.each(comps, comp => {
            comp = comp.trim()
            const urlTpl = importMap['*']
            let url = null
            let parts = comp.split('/')
            let compInfo = parts.length === 1 ? { namespace: "", component: comp } : { namespace: parts[0], component: parts[1] }
            if (compInfo.namespace && importMap[compInfo.namespace])
                urlTpl = importMap[compInfo.namespace]
            try {
                const parse = new Function("data", "with (data){return `" + urlTpl + "`}")
                url = parse(compInfo)
            } catch (ex) {
                console.error(`Fails to parse url template ${urlTpl} with component ${comp}`)
                return
            }
            if (url && !$vui.imports[url]) {
                $vui.imports[url] = true
                tasks.push(fetch(url).then(r => r.text()).then(html => {
                    const el = document.createElement('div')
                    el.innerHTML = html
                    let all = [...el.childNodes]
                    return new Promise((resolve) => {
                        const process = (i) => {
                            if (i < all.length) {
                                const elChild = all[i]
                                elChild.remove()
                                if (elChild.tagName === 'SCRIPT') {
                                    const elExecute = document.createElement("script")
                                    const wait = elChild.src && !elChild.async
                                    if (wait) {
                                        elExecute.onload = () => {
                                            process(i + 1)
                                        }
                                        elExecute.onerror = () => {
                                            console.error(`Fails to load script from "${elExecute.src}"`)
                                            process(i + 1)
                                        }
                                    }
                                    _.each(elChild.attributes, a => elExecute.setAttribute(a.name, a.value))
                                    if (!elChild.src) {
                                        let file = `__vui__/scripts/js_${$vui.importScriptIndex}.js`
                                        elExecute.setAttribute('file', file)
                                        elExecute.innerHTML = `${elChild.innerHTML}\r\n//# sourceURL=${file}`
                                        $vui.importScriptIndex++
                                    }
                                    document.body.append(elExecute)
                                    if (!wait) process(i + 1)
                                } else if (elChild.tagName === 'TEMPLATE') {
                                    document.body.append(elChild)
                                    process(i + 1)
                                } else {
                                    process(i + 1)
                                }
                            } else {
                                console.log(`Imported ${comp} @ ${url}`)
                                resolve()
                            }
                        }
                        process(0)
                    })
                }).catch(ex => {
                    console.error(`Fails to import ${comp} @ ${url}`, ex)
                }))
            }
        })
        return Promise.all(tasks)
    } else {
        return Promise.reject(`Fails to import ${comp} !`)
    }
}
$vui.ready(() => {
    const _ = $vui._
    const { directive, evaluateLater, effect } = Alpine
    directive('import', (el, { expression }, { cleanup }) => {
        if (!expression) return
        let comps = expression.trim()
        if (comps.startsWith('[') && comps.endsWith(']')) {
            let evaluate = evaluateLater(el, expression)
            effect(() => evaluate(value => {
                if (_.isArray(value)) {
                    $vui.import(value)
                }
            }))
        } else {
            $vui.import(comps.split(','))
        }
    })
})