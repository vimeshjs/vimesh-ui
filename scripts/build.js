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

let files = ['core.js', 'x-component.js', 'x-import.js']

let code = _.map([..._.map(files, f => `${dirSrc}/${f}`), `${dirDepends}/@alpinejs/focus/dist/cdn.js`], f => fs.readFileSync(f)).join(';')

_.each(processors, (func, type) => {
    let result = `// Vimesh UI v${version}\r\n` + func(code)
    fs.writeFileSync(`${dirDist}/vui${type}.js`, result)
})

console.log(`Version ${version} has been built!`)
