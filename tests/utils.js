const _ = require('lodash')
const fs = require('fs')
const sleep = t => new Promise(r => setTimeout(r, t))

function loadHtml(container, html) {
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
                        elExecute.innerHTML = elChild.innerHTML
                    }
                    container.append(elExecute)
                    if (!wait) process(i + 1)
                } else {
                    container.append(elChild)
                    process(i + 1)
                }
            } else {
                resolve()
            }
        }
        process(0)
    })
}

function fixture(debug) {
    require('@testing-library/jest-dom')
    window.fetch = jest.fn().mockImplementation((url) => {
        return Promise.resolve({
            text() {
                return Promise.resolve(fs.readFileSync(`${__dirname}/..${url}`).toString())
            }
        })
    })
    /*
    const log = console.log
    window.console.log = jest.fn().mockImplementation((...args) => {
        if (debug) log(...args)
    })
    */
    require('@vimesh/style')(window)
    $vs.config.preset = ''
    require('../dist/vui.dev')
    window.Alpine = require('alpinejs').default
    Alpine.start()
}

module.exports = {
    sleep,
    loadHtml,
    fixture,
    Normalizer : require('./normalizer')
}