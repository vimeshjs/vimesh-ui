// Vimesh UI v0.15.0
function setupCore(G) {
    if (G.$vui) return // Vimesh UI core is already loaded

    G.$vui = {
        config: {
            debug: false
        },
        ready(callback) {
            if (G.Alpine) {
                callback()
            } else {
                document.addEventListener('alpine:init', callback)
            }
        }
    }
    const initAt = new Date()
    const _ = G.$vui._ = {
        elapse() {
            return new Date() - initAt
        },
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
        map(objOrArray, callback) {
            let result = []
            _.each(objOrArray, (val, key, index) => result.push(callback(val, key, index)))
            return result
        },
        filter(objOrArray, callback) {
            let result = []
            _.each(objOrArray, (val, key, index) => callback(val, key, index) && result.push(val))
            return result
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
        }
    }
};function setupXComponent(G) {
    if (!G.$vui) return console.error('Vimesh UI core is not loaded!')
    const $vui = G.$vui
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
                if ($vui.config.autoImport === true)
                    return true
                if (allNamespaces.indexOf(ns) !== -1) {
                    return true
                }
            }
            return false
        }
        function getParentComponent(el) {
            return visitParent(el, isComponent)
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
                if ($vui.config.autoImport === true)
                    $vui.import(el.tagName.replace('-', ':').toLowerCase())
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
                return Alpine.bound(comp, `${name}`, fallback)
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
            if (!customElements.get(compName.toLowerCase())) {
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
                                const name = elSlot.getAttribute('name')
                                let elsToAppend = name ? slotContents[name] : defaultSlotContent
                                if (!elsToAppend || elsToAppend.length === 0) {
                                    elsToAppend = Array.from(elSlot.childNodes)
                                }
                                elSlot.after(...elsToAppend)
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
            }
        })
    })
};function setupXImport(G) {
    if (!G.$vui) return console.error('Vimesh UI core is not loaded!')
    const $vui = G.$vui
    $vui.import = (comps) => {
        if (!comps) return
        const _ = $vui._
        const importMap = $vui.config.importMap
        //if (!importMap || !importMap['*'])
        //    return Promise.reject('You must setup import url template for the fallback namespace "*"')

        if (!$vui.imports) $vui.imports = {}
        if (!$vui.importScriptIndex) $vui.importScriptIndex = 1
        if (_.isString(comps)) comps = [comps]
        if (_.isArray(comps)) {
            const tasks = []
            _.each(comps, comp => {
                if (!comp) return
                let fullname = comp = comp.trim()
                let urlTpl = importMap['*']
                let url = null
                let namespace = ''
                let pos = comp.indexOf(':')
                if (pos !== -1) {
                    namespace = comp.substring(0, pos)
                    comp = comp.substring(pos + 1)
                    if (namespace) $vui.addNamespace(namespace)
                }
                pos = comp.lastIndexOf('/')
                let path = ''
                if (pos !== -1) {
                    path = comp.substring(0, pos + 1)
                    comp = comp.substring(pos + 1)
                }
                _.each(comp.split(','), component => {
                    component = component.trim()
                    let compInfo = { path, namespace, component, fullname: `${namespace ? namespace + ':' : ''}${path}${component}` }
                    if (compInfo.namespace && importMap[compInfo.namespace])
                        urlTpl = importMap[compInfo.namespace]
                    if (!urlTpl) {
                        return console.error(`Url template for namespace '${compInfo.namespace}' is not defined!`)
                    }
                    try {
                        const parse = new Function("data", "with (data){return `" + urlTpl + "`}")
                        url = parse(compInfo)
                    } catch (ex) {
                        console.error(`Fails to parse url template ${urlTpl} with component ${comp}`)
                        return
                    }
                    if (url && !$vui.imports[url]) {
                        let importMeta = { url, ...compInfo }
                        $vui.imports[url] = importMeta
                        tasks.push(fetch(url).then(r => {
                            if (!r.ok) throw Error(`${r.status} (${r.statusText})`)
                            return r.text()
                        }).then(html => {
                            const el = document.createElement('div')
                            el._x_ignore = true
                            el.innerHTML = html
                            importMeta.html = html
                            let all = [...el.childNodes]
                            return new Promise((resolve) => {
                                const process = (i) => {
                                    if (i < all.length) {
                                        const elChild = all[i]
                                        elChild.remove()
                                        if (elChild.tagName === 'LINK') {
                                            document.head.append(elChild)
                                            process(i + 1)
                                        } else if (elChild.tagName === 'SCRIPT') {
                                            if (elChild.hasAttribute('use-meta')) {
                                                elChild.innerHTML = `const __import_meta__ = ${JSON.stringify(importMeta)}\r\n` + elChild.innerHTML
                                            }
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
                                            elChild.setAttribute('v-cloak', '')
                                            $vui.extractNamespaces(elChild)
                                            $vui.prepareComponents(elChild)
                                            document.body.append(elChild)
                                            process(i + 1)
                                        } else {
                                            process(i + 1)
                                        }
                                    } else {
                                        if ($vui.config.debug)
                                            console.log(`Imported ${fullname} @ ${url}`)
                                        resolve()
                                    }
                                }
                                process(0)
                            })
                        }).catch(ex => {
                            console.error(`Fails to import ${fullname} @ ${url}`, ex)
                        }))
                    }
                })
            })
            return Promise.all(tasks)
        } else {
            return Promise.reject(`Fails to import ${comps} !`)
        }
    }
    $vui.ready(() => {
        const _ = $vui._
        const { directive, prefixed, addRootSelector } = Alpine
        addRootSelector(() => `[${prefixed('import')}]`)
        directive('import', (el, { expression, value }, { effect, evaluateLater }) => {
            if (!expression) return
            if (value) {
                if (value === 'dynamic' || value === 'dyn') {
                    let evaluate = evaluateLater(expression)
                    effect(() => evaluate(val => $vui.import(val)))
                } else {
                    console.error(`${prefixed('import')}:${value} is not allowed!`)
                }
            } else {
                $vui.import(expression.split(';'))
            }
        })
    })
};function setupXInclude(G) {
    if (!G.$vui) return console.error('Vimesh UI core is not loaded!')
    const $vui = G.$vui
    $vui.include = (elHost, urls) => {
        const _ = $vui._
        const unwrap = elHost._vui_unwrap
        let baseUrl
        for (let elCurrent = elHost; elCurrent; elCurrent = elCurrent.parentElement) {
            baseUrl = elCurrent._vui_base_url
            if (baseUrl) break
        }
        if (!baseUrl)
            baseUrl = document.baseURI
        if (_.isArray(urls)) {
            const tasks = []
            _.each(urls, url => {
                url = url.trim()
                if (url) {
                    let fullUrl = new URL(url, baseUrl).href
                    let loader
                    if (url[0] == '#') {
                        let id = url.substring(1)
                        loader = new Promise(resolve => {
                            let el = document.getElementById(id)
                            resolve(el && el.innerHTML || '')
                        })
                    } else {
                        loader = fetch(fullUrl).then(r => r.text())
                    }
                    tasks.push(loader.then(html => {
                        const el = document.createElement('div')
                        el._x_ignore = true
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
                                            elExecute.innerHTML = `${elChild.innerHTML}\r\n//From ${url}\r\n//# sourceURL=${file}`
                                            $vui.importScriptIndex++
                                        }
                                        document.body.append(elExecute)
                                        if (!wait) process(i + 1)
                                    } else {
                                        elChild._vui_base_url = fullUrl
                                        if (unwrap) {
                                            elChild._x_dataStack = elHost._x_dataStack
                                            elHost.before(elChild)
                                        } else {
                                            elHost.append(elChild)
                                        }
                                        process(i + 1)
                                    }
                                } else {
                                    if ($vui.config.debug)
                                        console.log(`Included ${url}`)
                                    if (unwrap)
                                        elHost.remove()
                                    resolve()
                                }
                            }
                            process(0)
                        })
                    }).catch(ex => {
                        console.error(`Fails to include ${url}`, ex)
                    }))
                }
            })
            return Promise.all(tasks)
        } else {
            return Promise.reject(`Fails to include ${urls} !`)
        }
    }
    $vui.ready(() => {
        const _ = $vui._
        const { directive, prefixed, addRootSelector } = Alpine
        addRootSelector(() => `[${prefixed('include')}]`)
        directive('include', (el, { expression, modifiers }, { effect, evaluateLater }) => {
            if (!expression) return
            el._vui_unwrap = modifiers.includes('unwrap')
            let urls = expression.trim()
            if (urls.startsWith('#') || urls.startsWith('.') || urls.startsWith('/') || urls.startsWith('http://') || urls.startsWith('https://')) {
                $vui.include(el, [urls])
            } else {
                let evaluate = evaluateLater(expression)
                effect(() => evaluate(value => {
                    if (_.isArray(value)) {
                        $vui.include(el, value)
                    } else if (_.isString(value)) {
                        $vui.include(el, [value])
                    } else {
                        $vui.include(el, [urls])
                    }
                }))
            }
        })
    })
};function setupXStyle(G) {
    if (!G.$vui) return console.error('Vimesh UI core is not loaded!')
    const $vui = G.$vui
    $vui.config.styleVariantPrefix = 'data-'
    $vui.ready(() => {
        const { directive, bound, reactive } = G.Alpine

        // Create multi-theme registries
        const registries = {};

        // Default registry
        registries['default'] = reactive({});

        // Theme configuration
        const themes = reactive({
            current: 'default'
        });

        // Function cache for storing compiled condition functions
        const conditionFnCache = new Map();

        // Register style component
        $vui.setStyle = function (theme, name, config) {
            if (undefined === config) {
                config = name;
                name = theme;
                theme = themes.current;
            }
            let registry = registries[theme]
            if (!registry) {
                registry = registries[theme] = reactive({});
            }
            registry[name] = {
                base: config.base || '',
                variants: config.variants || {},
                compoundVariants: config.compoundVariants || [],
                defaultVariants: config.defaultVariants || {},
                parts: config.parts || {},
                parent: config.parent || null
            };
        };

        // Get style configuration
        $vui.getStyle = function (theme, name) {
            if (undefined === name) {
                name = theme;
                theme = themes.current;
            }
            const registry = registries[theme];
            return registry[name];
        };

        // Batch register style components
        $vui.loadStyles = function (stylesConfig) {
            Object.entries(stylesConfig).forEach(([name, config]) => {
                $vui.setStyle(name, config);
            });
        };

        $vui.loadThemes = function (themeConfig) {
            Object.entries(themeConfig).forEach(([themeName, stylesConfig]) => {
                Object.entries(stylesConfig).forEach(([name, config]) => {
                    $vui.setStyle(themeName, name, config);
                });
            });
        };

        // Allow users to customize class category configuration
        $vui.configClassCategories = function (customCategories) {
            Object.assign(classCategories, customCategories);
        };

        // Set current theme
        $vui.setTheme = function (themeName) {
            themes.current = themeName;
            if (!registries[themeName]) {
                registries[themeName] = reactive({});
            }
        };

        // Get current theme
        $vui.getTheme = function () {
            return themes.current;
        };

        // Store current applied class names for each element
        const elementStyles = new WeakMap();

        // Improved class merging function, handling Tailwind class name conflicts
        // Class category configuration
        const classCategories = {
            margin: {
                regex: /^m[trblxy]?-/,
                key: /^m[trblxy]?-/
            },
            padding: {
                regex: /^p[trblxy]?-/,
                key: /^p[trblxy]?-/
            },
            textSize: {
                regex: /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/
            },
            textAlign: {
                regex: /^text-(left|center|right|justify)$/
            },
            textColor: {
                regex: /^text-/,
                exclude: 'textSize,textAlign'
            },
            fontWeight: {
                regex: /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/
            },
            backgroundColor: {
                regex: /^bg-/
            },
            borderColor: {
                regex: /^border-/,
                exclude: 'borderWidth'
            },
            borderWidth: {
                regex: /^border(-[0-9]+)?$|^border-(t|r|b|l|x|y)(-[0-9]+)?$/,
                key: /^border(-[trblxy])?/
            },
            borderRadius: {
                regex: /^rounded(-[trblse])?(-[a-z]+)?$/,
                key: /^rounded(-[trblse])?/
            },
            width: {
                regex: /^(w-|min-w-|max-w-)/,
                key: /^(w-|min-w-|max-w-)/
            },
            height: {
                regex: /^(h-|min-h-|max-h-)/,
                key: /^(h-|min-h-|max-h-)/
            },
            position: {
                regex: /^(top-|right-|bottom-|left-|inset-)/,
                key: /^(top-|right-|bottom-|left-|inset-)/
            },
            shadow: {
                regex: /^shadow(-[a-z]+)?$/
            },
            display: {
                regex: /^(block|inline|inline-block|flex|inline-flex|grid|inline-grid|hidden)$/
            },
            flex: {
                regex: /^flex-/,
                key: /^flex-[a-z]+/
            },
            grid: {
                regex: /^grid-/,
                key: /^grid-[a-z]+/
            },
            gap: {
                regex: /^gap-/,
                key: /^gap-[xy]?/
            },
            space: {
                regex: /^space-[xy]-/,
                key: /^space-[xy]-/
            }
        };

        // Improved class merging function, handling Tailwind class name conflicts
        function mergeClasses(...classes) {
            // Flatten and filter empty values
            const allClasses = classes
                .filter(Boolean)
                .join(' ')
                .split(' ')
                .filter(Boolean);

            // Store final class names by category
            const finalClassesByCategory = {};

            // Initialize Maps for all categories
            Object.keys(classCategories).forEach(category => {
                finalClassesByCategory[category] = new Map();
            });

            // Other uncategorized class names
            finalClassesByCategory.other = new Map();

            // Process each class name
            allClasses.forEach(cls => {
                let matched = false;

                // Check if matches any category
                for (const [category, config] of Object.entries(classCategories)) {
                    if (config.regex.test(cls)) {
                        // Check if needs to be excluded
                        if (config.exclude) {
                            let shouldExclude = false;

                            if (typeof config.exclude === 'string') {
                                // Split by comma and check if any excluded category matches
                                const excludedCategories = config.exclude.split(',');

                                for (const excludedCategory of excludedCategories) {
                                    const excludedConfig = classCategories[excludedCategory.trim()];
                                    if (excludedConfig && excludedConfig.regex.test(cls)) {
                                        shouldExclude = true;
                                        break;
                                    }
                                }
                            } else if (Array.isArray(config.exclude)) {
                                // Legacy support for regex array
                                shouldExclude = config.exclude.some(regex => regex.test(cls));
                            } else if (config.exclude instanceof RegExp) {
                                // Support for single regex
                                shouldExclude = config.exclude.test(cls);
                            }

                            if (shouldExclude) continue;
                        }

                        // Get key for storing in the map
                        let keyValue;
                        if (config.key) {
                            const match = cls.match(config.key);
                            keyValue = match ? match[0] : category;
                        } else {
                            keyValue = category;
                        }

                        finalClassesByCategory[category].set(keyValue, cls);
                        matched = true;
                        break;
                    }
                }

                // If no category matched, add to other category
                if (!matched) {
                    finalClassesByCategory.other.set(cls, cls);
                }
            });

            // Merge all category class names to final list
            const finalClasses = [];
            Object.values(finalClassesByCategory).forEach(categoryMap => {
                categoryMap.forEach(cls => finalClasses.push(cls));
            });

            return finalClasses;
        }

        function visitParentStyles(themeName, styleName, partName, callback) {
            if (!registries[themeName] || !registries[themeName][styleName]) return;
            const style = registries[themeName][styleName];
            if (style.parent) {
                visitParentStyles(style.parent, styleName, partName, callback);
            }
            callback(partName ? style.parts[partName] : style, themeName, styleName);
        }
        function getVariantValue(el, variantName) {
            const attrName = `${$vui.config.styleVariantPrefix}${variantName}`;
            let variantValue = bound(el, attrName);
            if (undefined === variantValue && el._x_part && el._x_part.hostElement) {
                const hostElement = el._x_part.hostElement;
                variantValue = bound(hostElement, attrName);
            }
            return variantValue;
        }

        // Update element classes based on style name and style configuration
        function updateElementClasses(el, styleName, partName) {
            // If styleConfig is not provided, get it from registry

            if (!$vui.getStyle(styleName)) return;

            // Clear previously applied class names
            if (elementStyles.has(el)) {
                const oldClasses = elementStyles.get(el);
                oldClasses.forEach(cls => el.classList.remove(cls));
            }

            // Collect class names to apply
            const classesToApply = [];
            const appliedVariants = {};
            const defaultVariants = {};

            // Add base style
            visitParentStyles(themes.current, styleName, partName,
                (style) => {
                    if (style.base) classesToApply.push(style.base);

                    if (style.variants) {
                        Object.keys(style.variants).forEach(variantName => {
                            let variantValue = appliedVariants[variantName];
                            if (undefined === variantValue)
                                variantValue = appliedVariants[variantName] = getVariantValue(el, variantName);
                            if (style.defaultVariants && style.defaultVariants[variantName] !== undefined)
                                defaultVariants[variantName] = style.defaultVariants[variantName];
                            if (undefined === variantValue)
                                variantValue = defaultVariants[variantName];

                            // If has variant value, add variant style
                            if (undefined !== variantValue) {
                                // For boolean attributes, convert to string to match style definition
                                const lookupValue = 'boolean' === typeof variantValue ? String(variantValue) : variantValue;

                                // Apply base variant style
                                if (style.variants[variantName] && style.variants[variantName][lookupValue]) {
                                    classesToApply.push(style.variants[variantName][lookupValue]);
                                }
                            }
                        });
                    }

                    // Process compound variants
                    if (style.compoundVariants) {
                        const allVariants = { ...defaultVariants, ...appliedVariants }
                        style.compoundVariants.forEach(compound => {
                            if (compound.conditions === undefined) return;
                            let conditionsMet = false;

                            // Check if condition is a string (function expression)
                            if (typeof compound.conditions === 'string') {
                                try {
                                    // Try to get function from cache
                                    let conditionFn = conditionFnCache.get(compound.conditions);

                                    // If not in cache, compile and cache
                                    if (!conditionFn) {
                                        // Use Function constructor instead of eval
                                        // Check if it's an arrow function or regular function definition
                                        if (compound.conditions.includes('=>') || compound.conditions.startsWith('function')) {
                                            // Create a wrapper function, return the parsed function
                                            conditionFn = new Function('return ' + compound.conditions)();
                                        } else {
                                            // Simple expression, create function directly
                                            conditionFn = new Function('v', 'el', 'return ' + compound.conditions);
                                        }
                                        conditionFnCache.set(compound.conditions, conditionFn);
                                    }

                                    // Execute function
                                    conditionsMet = conditionFn(allVariants, el);
                                } catch (error) {
                                    console.error('Error evaluating condition string:', error);
                                }
                            }
                            // Check if condition is a function
                            else if (typeof compound.conditions === 'function') {
                                // Pass all currently applied variant values and element
                                conditionsMet = compound.conditions(allVariants, el);
                            } else {
                                // Object form conditions
                                conditionsMet = Object.entries(compound.conditions).every(
                                    ([key, value]) => {
                                        // If value is array, check if current variant value is in array
                                        if (Array.isArray(value)) {
                                            return value.includes(allVariants[key]);
                                        }
                                        // Otherwise direct comparison
                                        return allVariants[key] === value;
                                    }
                                );
                            }

                            // If all conditions met, add compound style
                            if (conditionsMet) {
                                classesToApply.push(compound.classes);
                            }
                        });
                    }
                }
            );



            // Merge all class names and apply
            const mergedClasses = mergeClasses(...classesToApply);
            mergedClasses.forEach(cls => el.classList.add(cls));

            // Store applied class names
            elementStyles.set(el, mergedClasses);
        }


        // Register x-style directive
        directive('style', (el, { expression }, { effect }) => {
            if (el.tagName === 'TEMPLATE') return
            const styleName = expression;

            effect(() => {
                updateElementClasses(el, styleName);
            });
        });
        // Add support for x-part directive

        // Register x-part directive
        directive('part', (el, { expression }, { effect }) => {
            if (el.tagName === 'TEMPLATE') return
            // Get part name
            const partName = expression;
            // Find the nearest x-style element as host node
            let hostElement = el.parentElement;
            while (hostElement && !hostElement.hasAttribute('x-style')) {
                hostElement = hostElement.parentElement;
            }
            if (!hostElement) return;
            const componentName = hostElement.getAttribute('x-style');
            // Store part info for future updates
            if (!el._x_part) {
                el._x_part = {
                    hostElement,
                    componentName,
                    partName
                };
            }
            effect(() => {
                const componentStyle = $vui.getStyle(componentName);
                if (!componentStyle || !componentStyle.parts || !componentStyle.parts[partName]) return;
                // Update element classes
                updateElementClasses(el, componentName, partName);
            });

        });
    })
}

function setupVimeshUI(G = {}) {
    setupCore(G)
    setupXComponent(G)
    setupXImport(G)
    setupXInclude(G)
    setupXStyle(G)
    return G.$vui
}

export default setupVimeshUI

export {
    setupVimeshUI,
    setupCore,
    setupXComponent,
    setupXImport,
    setupXInclude,
    setupXStyle
}