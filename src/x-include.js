$vui.include = (elHost, urls) => {
    const _ = $vui._
    const unwrap = elHost._vui_unwrap
    if (_.isArray(urls)) {
        const tasks = []
        _.each(urls, url => {
            url = url.trim()
            if (url) {
                tasks.push(fetch(url).then(r => r.text()).then(html => {
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
                                    if (unwrap){
                                        elHost.before(elChild)
                                    } else {
                                        elHost.append(elChild)
                                    }
                                    process(i + 1)
                                }
                            } else {
                                if ($vui.config.debug)
                                    console.log(`Included ${url}`)
                                if (unwrap) elHost.remove()
                                resolve()
                            }
                        }
                        process(0)
                    })
                }).catch(ex => {
                    console.error(`Fails to include ${comp} @ ${url}`, ex)
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
    const { directive, evaluateLater, effect, prefixed, addRootSelector } = Alpine
    addRootSelector(() => `[${prefixed('include')}]`)
    directive('include', (el, { expression, modifiers }, { cleanup }) => {
        if (!expression) return
        el._vui_unwrap = modifiers.includes('unwrap')
        let urls = expression.trim()
        if (urls.startsWith('.') || urls.startsWith('/') || urls.startsWith('http://') || urls.startsWith('https://')) {
            $vui.include(el, [urls])
        } else {
            let evaluate = evaluateLater(el, expression)
            effect(() => evaluate(value => {
                if (_.isArray(value)) {
                    $vui.include(el, value)
                } else if (_.isString(value)) {
                    $vui.include(el, [value])
                }
            }))
        }
    })
})