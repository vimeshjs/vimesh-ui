const _ = require('lodash')
const fs = require('fs')
const UglifyJS = require("uglify-js")
const version = require('../package.json').version
const root = `${__dirname}/..`
const dirDist = `${root}/dist`
const dirSrc = `${root}/src`
const dirDepends = `${root}/node_modules`

if (!fs.existsSync(dirDist)) fs.mkdirSync(dirDist)

const processors = {
    '.dev': js => js,
    '': js => UglifyJS.minify(js).code
}

let files = ['core.js', 'x-component.js', 'x-import.js', 'x-include.js', 'x-style.js']

let code = _.map([..._.map(files, f => `${dirSrc}/${f}`)], f => fs.readFileSync(f)).join(';')

function buildBrowser() {
    _.each(processors, (func, type) => {
        console.log(`Building browser version - ${type}!`)
        let result = `// Vimesh UI v${version}\r\n` + func(code + fs.readFileSync(`${__dirname}/index.js`))
        fs.writeFileSync(`${dirDist}/vui${type}.js`, result)
    })
}

function buildCommonJS() {
    _.each(processors, (func, type) => {
        console.log(`Building commonjs version - ${type}!`)
        let result = `// Vimesh UI v${version}\r\n` + func(code + fs.readFileSync(`${__dirname}/index.cjs`))
        fs.writeFileSync(`${dirDist}/vui${type}.cjs`, result)
    })
}

function buildESM() {
    _.each(processors, (func, type) => {
        console.log(`Building esm version - ${type}!`)
        let result = `// Vimesh UI v${version}\r\n` + func(code + fs.readFileSync(`${__dirname}/index.mjs`))
        fs.writeFileSync(`${dirDist}/vui${type}.mjs`, result)
    })
}

buildBrowser()
buildCommonJS()
buildESM()

console.log(`Version ${version} has been built!`)
