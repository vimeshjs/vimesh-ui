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

/*
_.each(fs.readdirSync(dirSrc), f => {
    if (fs.lstatSync(`${dirSrc}/${f}`).isDirectory()) return
    if (files.indexOf(f) == -1) files.push(f)
    codeMap[f] = fs.readFileSync(`${dirSrc}/${f}`).toString()
    fs.writeFileSync(`${dirDist}/${f.substring(0, f.length - 3)}.min.js`, `// Vimesh Style v${version}\r\n` + UglifyJS.minify(codeMap[f]).code)
})
*/
let code = _.map(files, f => fs.readFileSync(`${dirSrc}/${f}`)).join(';')
_.each(processors, (func, type) => {
    let result = `// Vimesh UI v${version}\r\n` + func(code)
    fs.writeFileSync(`${dirDist}/vui${type}.js`, result)
})

