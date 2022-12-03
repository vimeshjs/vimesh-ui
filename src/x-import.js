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
            let fullname = comp = comp.trim()
            const urlTpl = importMap['*']
            let url = null
            let pos = comp.indexOf('/')
            let namespace = pos === -1 ? '' : comp.substring(0, pos)
            if (pos !== -1) comp = comp.substring(pos + 1)
            _.each(comp.split(','), component => {
                component = component.trim()
                let compInfo = { namespace, component, full: `${namespace ? namespace + '/' : ''}${component}` }
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
                    tasks.push(fetch(url).then(r => {
                        if (!r.ok) throw Error(`${r.status} (${r.statusText})`)
                        return r.text()
                    }).then(html => {
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
                                            elExecute.innerHTML = `${elChild.innerHTML}\r\n//# sourceURL=${file}`
                                            $vui.importScriptIndex++
                                        }
                                        document.body.append(elExecute)
                                        if (!wait) process(i + 1)
                                    } else if (elChild.tagName === 'TEMPLATE') {
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
        return Promise.reject(`Fails to import ${comp} !`)
    }
}
$vui.ready(() => {
    const _ = $vui._
    const { directive, evaluateLater, effect, prefixed, addRootSelector } = Alpine
    addRootSelector(() => `[${prefixed('import')}]`)
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
            $vui.import(comps.split(';'))
        }
    })
})