// Vimesh UI v0.1.0
"use strict";

(function (G) {
    if (G.$vui) return // Vimesh UI core is already loaded
    let currentTheme = null
    G.$vui = {
        ready(callback) {
            if (G.Alpine) {
                callback()
            } else {
                document.addEventListener('alpine:init', callback)
            }
        },
        get theme() {
            return currentTheme
        },
        set theme(val) {
            if (!$vs) return console.warn('Vimesh style has not been loaded!')
            if (!val) return console.warn('Empty theme is not acceptable!')
            currentTheme = val
            _.extend($vs.config.aliasColors, currentTheme.colors)
            $vs.reset()
        },
        defineComponent(type, propDefs, init) {
            const TYPE = Symbol(type)
            _.set(G, type, (data) => {
                let compApi = {
                    classes() {
                        console.log('base classes')
                        return []
                    }
                }
                let component = {
                    __type__: type,
                    [TYPE]: compApi,
                    get api() {
                        return this[TYPE]
                    },

                    init() {
                        console.log('init 1')
                        _.each(propDefs, pd => {
                            if (_.isString(pd)) {
                                compApi[pd] = Alpine.bound(this.$el, pd)
                            }
                        })
                        Alpine.bind(this.$el, {
                            ':class': 'api.classes()'
                        })
                        if (_.isFunction(init)) {
                            init.bind(this)(this, data)
                        }
                    }
                }
                return _.extend(component, data)
            })
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
        pick(object, ...keys) {
            return keys.reduce((obj, key) => {
                if (object && object.hasOwnProperty(key)) {
                    obj[key] = object[key];
                }
                return obj;
            }, {});
        },
        toEnum(enumValues) {
            let def = {}
            _.each(enumValues.split(','), e => {
                e = e.trim()
                def[e] = e
            })
            return Object.freeze(def)
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
        },
        merge(target, source, options = { clone: true }) {
            const output = options.clone ? _.extend({}, target) : target;
            if (_.isPlainObject(target) && _.isPlainObject(source)) {
                Object.keys(source).forEach((key) => {
                    if (key === '__proto__') return
                    if (_.isArray(options.include) && options.include.indexOf(key) === -1) return
                    if (_.isArray(options.exclude) && options.exclude.indexOf(key) !== -1) return
                    if (_.isPlainObject(source[key]) && key in target && _.isPlainObject(target[key])) {
                        output[key] = _.merge(target[key], source[key], { clone: options.clone })
                    } else {
                        output[key] = source[key]
                    }
                });
            }
            return output;
        }
    }
})(window);;
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
// Vimesh Style v0.13.2

function setupCore(G) {
    if (G.$vs) return // Vimesh style core is already loaded    
    G.$vs = {
        config: {
            auto: true,
            prefix: 'vs',
            attributify: 'all', // all, none, prefix
            preset: true,
            breakpoints: {
                sm: 640,
                md: 768,
                lg: 1024,
                xl: 1280,
                '2xl': 1536
            },
            fonts: {
                sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
                serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
                mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
            },
            colors: {
                rose: 'f43f5e',
                pink: 'ec4899',
                fuchsia: 'd946ef',
                purple: 'a855f7',
                violet: '8b5cf6',
                indigo: '6366f1',
                blue: '3b82f6',
                sky: '0ea5e9',
                cyan: '06b6d4',
                teal: '14b8a6',
                emerald: '10b981',
                green: '22c55e',
                lime: '84cc16',
                yellow: 'eab308',
                amber: 'f59e0b',
                orange: 'f97316',
                red: 'ef4444',
                gray: ['#fafafa', '#f4f4f5', '#e4e4e7', '#d4d4d8', '#a1a1aa', '#71717a', '#52525b', '#3f3f46', '#27272a', '#18181b']
            },
            aliasColors: {
                lightBlue: 'sky'
            },
            specialColors: {
                white: '#ffffff',
                black: '#000000',
                transparent: 'transparent',
                current: 'currentColor'
            },
            keyframes: {
                spin: `{to{transform:rotate(360deg)}}`,
                ping: `{75%,100%{transform:scale(2);opacity:0}}`,
                pulse: `{50%{opacity:.5}}`,
                bounce: `{0%,100%{transform:translateY(-25%);animation-timing-function:cubic-bezier(0.8,0,1,1)}50%{transform:none;animation-timing-function:cubic-bezier(0,0,0.2,1)}}`
            },
            animation: {
                none: '',
                spin: `spin 1s linear infinite`,
                ping: `ping 1s cubic-bezier(0, 0, 0.2, 1) infinite`,
                pulse: `pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
                bounce: `bounce 1s infinite`
            }
        }
    }

    const $vs = G.$vs
    const C = $vs.config

    function isString(str) {
        return (str != null && typeof str.valueOf() === "string")
    }
    function isArray(array) {
        return Array.isArray(array)
    }
    function isFunction(func) {
        return typeof func === "function";
    }
    function isPlainObject(item) {
        return item !== null && typeof item === 'object' && item.constructor === Object;
    }
    function each(objOrArray, callback) {
        if (isArray(objOrArray)) {
            objOrArray.forEach((val, index) => {
                callback(val, index, index)
            })
        } else {
            Object.entries(objOrArray).forEach(([key, val], index) => {
                callback(val, key, index)
            })
        }
    }
    function extend(target, ...sources) {
        const length = sources.length
        if (length < 1 || target == null) return target
        for (let i = 0; i < length; i++) {
            const source = sources[i]
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
    $vs._ = { isString, isArray, isFunction, isPlainObject, each, extend }

    const KNOWN_ATTR_NAMES = 'font,text,underline,list,bg,gradient,border,divide,ring,icon,container,p,m,space,w,min-w,max-w,h,min-h,max-h,flex,grid,table,order,align,justify,place,display,pos,box,caret,isolation,object,overflow,overscroll,z,shadow,opacity,blend,filter,backdrop,transition,animate,transform,appearance,cursor,outline,pointer,resize,select,sr'
    let addedClasses = {}
    let classMap = $vs.classMap = {}
    let initMap = {}
    let presetStyles = []
    let autoStyles = []
    let initStyles = []
    let styleElement = null
    let stylesOutput = null
    let generators = $vs.generators = []
    let cache = {}
    let knownAttributes = {}
    each(KNOWN_ATTR_NAMES.split(','), a => knownAttributes[a] = true)

    function decomposeClassName(className) {
        if (isString(className)) {
            let breakpoint = null
            let pseudo = null
            let segs = className.split(':')
            className = segs[segs.length - 1]
            if (segs.length === 3) {
                breakpoint = segs[0]
                pseudo = segs[1]
            } else if (segs.length === 2) {
                if (C.breakpoints[segs[0]])
                    breakpoint = segs[0]
                else
                    pseudo = segs[0]
            }
            return { breakpoint, pseudo, name: className }
        } else {
            console.error(`Wrong parameter ${className}`)
        }
    }
    function normalizeCssName(name) {
        return name.replace(/:/g, '\\:').replace(/\//g, '\\/').replace(/\./g, '\\.')
    }
    function register(keys, generatorOrStyle, initFunc) {
        if (!generatorOrStyle) return
        if (!isArray(keys)) keys = [keys]
        if (isFunction(generatorOrStyle))
            each(keys, key => generators.push({ prefix: key, generator: generatorOrStyle, init: initFunc }))
        else
            each(keys, key => {
                classMap[key] = generatorOrStyle;
                if (initFunc) initMap[key] = initFunc
            })
    }
    function resolveClass(className) {
        if (!className) return null
        let classDetails = decomposeClassName(className)
        let cdn = classDetails.name
        let style = classMap[cdn]
        if (style && initMap[cdn]) initMap[cdn](classDetails)
        for (let i = 0; !style && i < generators.length; i++) {
            let gi = generators[i]
            if (cdn.indexOf(gi.prefix) == 0) {
                style = gi.generator(classDetails)
                if (style && gi.init) gi.init(classDetails)
            }
        }
        return style
    }
    function updateAutoStyles() {
        let all = initStyles.concat(autoStyles)
        if (all.length > 0) {
            let newStyles = (C.preset ? presetStyles : []).concat(all).join('\n')
            if (newStyles !== stylesOutput) {
                if (G.document) {
                    if (styleElement)
                        styleElement.innerHTML = stylesOutput = newStyles
                    else
                        setTimeout(updateAutoStyles)
                } else {
                    stylesOutput = newStyles
                }
            }
        }
    }
    function addPresetStyle(style) {
        if (presetStyles.indexOf(style) == -1) {
            presetStyles.push(style)
        }
    }
    function addInitStyle(style) {
        if (initStyles.indexOf(style) == -1) {
            initStyles.push(style)
        }
    }
    function addClasses(classes, update = true) {
        if (classes) {
            if (isString(classes))
                classes = classes.split(' ')
            else {
                let all = []
                each(classes, cls => all = all.concat(cls && cls.split && cls.split(' ') || []))
                classes = all
            }
            each(classes, name => {
                if (!name || addedClasses[name]) return
                let style = resolveClass(name)
                if (style) {
                    let classDetails = decomposeClassName(name)
                    let fullname = normalizeCssName(classDetails.name)
                    if (classDetails.pseudo) fullname = `${classDetails.pseudo}\\:${fullname}:${classDetails.pseudo}`
                    if (classDetails.breakpoint) fullname = `${classDetails.breakpoint}\\:${fullname}`
                    if (style.name) {
                        if (style.name.indexOf('$') == 0) {
                            fullname += style.name.substring(1)
                        } else {
                            fullname = style.name
                        }
                        style = style.style
                    }
                    style = `{${style}}`
                    if (classDetails.breakpoint) {
                        style = `@media (min-width: ${C.breakpoints[classDetails.breakpoint]}px) {\n  .${fullname} ${style} \n}`
                    } else {
                        style = `.${fullname} ${style} `
                    }
                    addedClasses[name] = true
                    autoStyles.push(style)
                }
            })
            if (update) updateAutoStyles()
        }
    }
    function recordKnownClasses(el, update = true) {
        const prefix = C.prefix + ':'
        let classes = []
        let classesFromAttrs = []
        let cn = el.className
        if (cn) {
            classes.push(cn)
            // SVGAnimatedString
            if (cn.baseVal) classes.push(cn.baseVal)
            if (cn.animVal) classes.push(cn.animVal)
        }
        each(el.attributes, a => {
            let prop = a.name
            let group = null
            if (C.attributify !== 'none' && prop.startsWith(prefix))
                group = prop.substring(prefix.length)
            else if (C.attributify === 'all' && knownAttributes[prop])
                group = prop
            if (group) {
                let val = a.value
                let groupCache = cache[group]
                if (!groupCache) groupCache = cache[group] = {}
                each(val.split(/ |,/).filter(Boolean), cls => {
                    let pos = cls.indexOf('~')
                    if (pos !== -1) cls = cls.replace('~', group)
                    if (groupCache[cls]) {
                        if ('-' !== groupCache[cls]) classesFromAttrs.push(groupCache[cls])
                        return
                    }
                    let r = resolveClass(cls)
                    if (r) {
                        classesFromAttrs.push(cls)
                        groupCache[cls] = cls
                    } else {
                        pos = cls.lastIndexOf(':')
                        let ncls = group + '-' + cls
                        if (pos !== -1) {
                            ncls = cls.substring(0, pos + 1) + group + '-' + cls.substring(pos + 1)
                        }
                        r = resolveClass(ncls)
                        if (r) {
                            groupCache[cls] = ncls
                            classesFromAttrs.push(ncls)
                        } else {
                            ncls = group + cls
                            if (pos !== -1) {
                                ncls = cls.substring(0, pos + 1) + group + cls.substring(pos + 1)
                            }
                            r = resolveClass(ncls)
                            if (r) {
                                groupCache[cls] = ncls
                                classesFromAttrs.push(ncls)
                            } else {
                                groupCache[cls] = '-'
                            }
                        }
                    }
                })
            }
        })
        if (el._vs_undo_add_classes_from_attrs)
            el._vs_undo_add_classes_from_attrs()
        if (classesFromAttrs.length > 0) {
            let classesToAdd = classesFromAttrs.join(' ').split(' ').filter(i => !el.classList.contains(i)).filter(Boolean)
            el.classList.add(...classesToAdd)
            el._vs_undo_add_classes_from_attrs = () => {
                el.classList.remove(...classesToAdd)
            }
        }
        return [...classes, ...classesFromAttrs]
    }
    function resolveAll(root, update = true) {
        if (!root || !root.querySelectorAll) return
        let all = [root, ...root.querySelectorAll(C.attributify === 'none' ? '*[class]' : '*')]
        let allClasses = []
        each(all, el => allClasses.push(...recordKnownClasses(el)))
        addClasses(allClasses, update)
    }
    function resetStyles() {
        addedClasses = {}
        autoStyles = []
        stylesOutput = null
        cache = {}
        if (styleElement) {
            styleElement.innerHTML = null
            if (C.auto && G.document) resolveAll(G.document.body)
        }
    }
    const CLASS_NAMES = /class\s*=\s*['\"](?<class>[^'\"]*)['\"]/g
    function extractClasses(html) {
        let match
        let classes = []
        while ((match = CLASS_NAMES.exec(html)) !== null) {
            each(match.groups.class.split(' '), cls => {
                cls = cls && cls.trim()
                if (cls && classes.indexOf(cls) === -1) classes.push(cls)
            })
        }
        return classes
    }
    const hueStep = 2;
    const saturationStep = 0.16;
    const saturationStep2 = 0.05;
    const brightnessStep1 = 0.05;
    const brightnessStep2 = 0.15;
    const lightColorCount = 5;
    const darkColorCount = 4;

    function getHue(hsv, i, isLight) {
        let hue;
        if (hsv.h >= 60 && hsv.h <= 240) {
            hue = isLight ? hsv.h - hueStep * i : hsv.h + hueStep * i;
        } else {
            hue = isLight ? hsv.h + hueStep * i : hsv.h - hueStep * i;
        }
        if (hue < 0) {
            hue += 360;
        } else if (hue >= 360) {
            hue -= 360;
        }
        return Math.round(hue);
    }

    function getSaturation(hsv, i, isLight) {
        let saturation;
        if (isLight) {
            saturation = hsv.s - saturationStep * i;
        } else if (i === darkColorCount) {
            saturation = hsv.s + saturationStep;
        } else {
            saturation = hsv.s + saturationStep2 * i;
        }
        if (saturation > 1) {
            saturation = 1;
        }
        if (isLight && i === lightColorCount && saturation > 0.1) {
            saturation = 0.1;
        }
        if (saturation < 0.06) {
            saturation = 0.06;
        }
        return Number(saturation.toFixed(2));
    }

    function getValue(hsv, i, isLight) {
        let value;
        if (isLight) {
            value = hsv.v + brightnessStep1 * i;
        } else {
            value = hsv.v - brightnessStep2 * i
        }
        if (value > 1) {
            value = 1;
        }
        if (value < 0) {
            value = 0
        }
        return Number(value.toFixed(2))
    }
    function rgbToHsv(rgb) {
        let { r, g, b } = rgb
        r /= 255, g /= 255, b /= 255;

        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, v = max;

        var d = max - min;
        s = max == 0 ? 0 : d / max;

        if (max == min) {
            h = 0; // achromatic
        } else {
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }

            h /= 6;
        }

        return { h, s, v };
    }
    function hsvToRgb(hsv) {
        let { h, s, v } = hsv
        var r, g, b;

        var i = Math.floor(h * 6);
        var f = h * 6 - i;
        var p = v * (1 - s);
        var q = v * (1 - f * s);
        var t = v * (1 - (1 - f) * s);

        switch (i % 6) {
            case 0: r = v, g = t, b = p; break;
            case 1: r = q, g = v, b = p; break;
            case 2: r = p, g = v, b = t; break;
            case 3: r = p, g = q, b = v; break;
            case 4: r = t, g = p, b = v; break;
            case 5: r = v, g = p, b = q; break;
        }

        return { r: r * 255, g: g * 255, b: b * 255 };
    }

    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            var r = parseInt(result[1], 16);
            var g = parseInt(result[2], 16);
            var b = parseInt(result[3], 16);
            return { r, g, b }
        }
        return null;
    }
    function rgbToHex(rgb) {
        let { r, g, b } = rgb
        return ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
    }
    function colorPalette(color, index) {
        if (index === 6) return color
        let isLight = index <= 6
        let rgb = hexToRgb(color)
        let hsv = rgbToHsv(rgb)
        var i = isLight ? lightColorCount + 1 - index : index - lightColorCount - 1;
        hsv = { h: hsv.h * 360, s: hsv.s, v: hsv.v }
        hsv = {
            h: getHue(hsv, i, isLight) / 360,
            s: getSaturation(hsv, i, isLight),
            v: getValue(hsv, i, isLight),
        }
        rgb = hsvToRgb(hsv)
        return rgbToHex(rgb)
    }

    function resolveColor(name) {
        if (!name) return null
        let cv = null
        if (C.aliasColors[name]) name = C.aliasColors[name]
        if (C.specialColors[name]) {
            cv = C.specialColors[name]
            if (cv[0] == '#') cv = hexToRgb(cv)
        } else {
            let pos = name.lastIndexOf('-')
            let depth = null
            if (pos != -1) {
                depth = name.substring(pos + 1)
                name = name.substring(0, pos)
                let parts = name.split('-')
                if (parts.length > 1) {
                    name = parts[0]
                    for (let i = 1; i < parts.length; i++) {
                        if (parts[i].length > 0)
                            name += parts[i][0].toUpperCase() + parts[i].substring(1)
                    }
                }
            }
            if (C.aliasColors[name]) name = C.aliasColors[name]
            let color = C.colors[name]
            if (!color) return null
            let w = depth ? +depth : 500
            let index = 50 === w ? 1 : (w / 100) + 1
            if (isArray(color)) return color[index - 1]
            let hex = colorPalette(color, index)
            cv = hexToRgb(hex)
        }
        return cv
    }
    function generateColors(classNamePrefix, styleName, nameAffix) {
        const vn = `--${C.prefix}-${classNamePrefix}-opacity`
        register(`${classNamePrefix}-opacity-`, classDetails => {
            let parts = classDetails.name.split('-')
            let style = `${vn}: ${+parts[2] / 100};`
            return nameAffix ? { name: `$${nameAffix}`, style } : style
        })
        register(`${classNamePrefix}-`, classDetails => {
            let cv = resolveColor(classDetails.name.substring(classNamePrefix.length + 1))
            if (!cv) return null
            let style = isString(cv) ? `${styleName}: ${cv};` : `${vn}:1;${styleName}: rgba(${cv.r},${cv.g},${cv.b},var(${vn}));`
            return nameAffix ? { name: `$${nameAffix}`, style } : style
        })
    }
    function generateSizes(handler) {
        for (let i = 0; i <= 96; i++) {
            if (i == 13 || i == 15 || (i >= 16 && (i - 16) % 4 != 0)) continue
            handler(i, `${i * 0.25}${0 == i ? 'px' : 'rem'}`)
            if (1 == i) handler('px', '1px')
            if (i <= 3) handler(i + 0.5, `${i * 0.25 + 0.125}rem`)
        }
    }
    extend($vs._, {
        hexToRgb,
        rgbToHex,
        register,
        resolveColor,
        generateColors,
        generateSizes,
        resolveClass,
        addPresetStyle,
        addInitStyle
    })
    extend($vs, {
        get styles() { return stylesOutput },
        reset: resetStyles,
        extract: extractClasses,
        add: addClasses,
        resolveAll
    })

    if (!G.document) {
        extend($vs, {
            ready(callback) { callback() }
        })
    } else {
        const D = G.document
        extend($vs, {
            ready(callback) {
                if (D.readyState === "complete") {
                    callback()
                } else {
                    D.addEventListener("DOMContentLoaded", callback)
                }
            }
        })
        $vs.ready(() => {
            const VSC = 'vimesh-styles'
            styleElement = D.getElementById(VSC)
            if (!styleElement) {
                styleElement = D.createElement('style')
                styleElement.setAttribute('id', VSC)
                D.head.appendChild(styleElement)
            }
            if (C.auto) resolveAll(D.body)
            const observer = new MutationObserver((mutations) => {
                if (C.auto) {
                    observer.disconnect()
                    each(mutations, m => {
                        if (m.type === 'childList') {
                            m.addedNodes.forEach(node => resolveAll(node, false))
                        } else if (m.type === 'attributes') {
                            addClasses(recordKnownClasses(m.target), false)
                        }
                    })
                    updateAutoStyles()
                    observer.observe(D, { attributes: true, childList: true, subtree: true })
                }
            })
            observer.observe(D, { attributes: true, childList: true, subtree: true })
        })
    }
}
function setupPreset(G) {
    if (!G.$vs) return console.error('Vimesh style core is not loaded!')
    G.$vs._.addPresetStyle(`html{line-height:1.5;-webkit-text-size-adjust:100%}body{margin:0;font-family:inherit;line-height:inherit}hr{height:0;color:inherit}abbr[title]{-webkit-text-decoration:underline dotted;text-decoration:underline dotted}b,strong{font-weight:bolder}code,kbd,pre,samp{font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;line-height:1.15;margin:0}button,select{text-transform:none}[type=button],[type=reset],[type=submit],button{-webkit-appearance:button}::-moz-focus-inner{border-style:none;padding:0}:-moz-focusring{outline:1px dotted ButtonText}:-moz-ui-invalid{box-shadow:none}legend{padding:0}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dd,dl,figure,h1,h2,h3,h4,h5,h6,hr,p,pre{margin:0}button{background-color:transparent;background-image:none}fieldset{margin:0;padding:0}ol,ul{list-style:none;margin:0;padding:0}*,::after,::before{box-sizing:border-box;border-width:0;border-style:solid;border-color:currentColor}hr{border-top-width:1px}img{border-style:solid}textarea{resize:vertical}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}[role=button],button{cursor:pointer}:-moz-focusring{outline:auto}table{border-collapse:collapse}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}button,input,optgroup,select,textarea{padding:0;line-height:inherit;color:inherit}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]{display:none}`)
}

function setupLayout(G) {
    if (!G.$vs) return console.error('Vimesh style core is not loaded!')
    const E = G.$vs._.each
    const R = G.$vs._.register
    const GS = G.$vs._.generateSizes
    const C = G.$vs.config
    const P = C.prefix
    let i

    // Container
    R('container', classDetails => {
        if (classDetails.breakpoint) {
            return `max-width: ${C.breakpoints[classDetails.breakpoint]}px;`
        } else {
            return `width: 100%;`
        }
    })

    // Display
    E(['block', 'inline-block', 'inline', 'flex', 'inline-flex',
        'table', 'inline-table', 'table-caption', 'table-cell', 'table-column', 'table-row',
        'table-column-group', 'table-footer-group', 'table-header-group', 'table-row-group',
        'flow-root', 'grid', 'inline-grid', 'contents', 'list-item', 'hidden'
    ], v => R(v, `display: ${'hidden' === v ? 'none' : v};`))

    // Flex 
    R(`flex-grow-0`, `flex-grow: 0;`)
    R(`flex-grow`, `flex-grow: 1;`)
    R(`flex-shrink-0`, `flex-shrink: 0;`)
    R(`flex-shrink`, `flex-shrink: 1;`)
    E({ '1': '1 1 0%', auto: "1 1 auto", initial: "0 1 auto", none: 'none' }, (v, k) => R(`flex-${k}`, `flex: ${v};`))
    E(['row', 'row-reverse', 'col', 'col-reverse'], v => R(`flex-${v}`, `flex-direction: ${v.replace('col', 'column')};`))
    E(['wrap', 'wrap-reverse', 'nowrap'], v => R(`flex-${v}`, `flex-wrap: ${v};`))

    // Clear
    E(['left', 'right', 'both', 'none'], v => R(`clear-${v}`, `clear: ${v};`))

    // Position
    E(['static', 'fixed', 'absolute', 'relative', 'sticky'], v => R(v, `position: ${v};`))

    // Width & Height
    E({ auto: 'auto', full: '100%', screen: '100vw', min: 'min-content', max: 'max-content' }, (v, k) => R(`w-${k}`, `width: ${v};`))
    E({ auto: 'auto', full: '100%', screen: '100vh' }, (v, k) => R(`h-${k}`, `height: ${v};`))
    E([2, 3, 4, 5, 6, 12], max => {
        for (i = 1; i < max; i++) {
            R(`w-${i}/${max}`, `width: ${+(i * 100 / max).toFixed(6)}%;`)
            R(`h-${i}/${max}`, `height: ${+(i * 100 / max).toFixed(6)}%;`)
        }
    })
    GS((name, value) => {
        R(`w-${name}`, `width: ${value};`)
        R(`h-${name}`, `height: ${value};`)
    })

    // Min & Max Width
    const ws = { '0': '0px', full: '100%', min: 'min-content', max: 'max-content' }
    E(ws, (v, k) => R(`min-w-${k}`, `min-width: ${v};`))
    ws.none = 'none'
    ws.prose = '65ch'
    E(['xs', 'sm', 'md', 'lg', 'xl'], (v, i) => ws[v] = `${20 + i * 4}rem`)
    E(['sm', 'md', 'lg', 'xl', '2xl'], v => ws[`screen-${v}`] = `${C.breakpoints[v]}px`)
    for (i = 2; i <= 7; i++) ws[`${i}xl`] = `${30 + i * 6}rem`
    E(ws, (v, k) => R(`max-w-${k}`, `max-width: ${v};`))

    // Min & Max Height
    E({ '0': '0px', full: '100%', screen: '100vh' }, (v, k) => {
        R(`min-h-${k}`, `min-height: ${v};`)
        R(`max-h-${k}`, `max-height: ${v};`)
    })
    GS((name, value) => {
        R(`max-h-${name}`, `max-height: ${value};`)
    })

    // Padding & Margin 
    function generateMargins(s, name, value) {
        R(`${s}m-${name}`, `margin: ${s}${value};`)
        const ml = `margin-left: ${s}${value};`
        const mr = `margin-right: ${s}${value};`
        const mt = `margin-top: ${s}${value};`
        const mb = `margin-bottom: ${s}${value};`
        R(`${s}mx-${name}`, `${ml}${mr}`)
        R(`${s}ml-${name}`, `${ml}`)
        R(`${s}mr-${name}`, `${mr}`)
        R(`${s}my-${name}`, `${mt}${mb}`)
        R(`${s}mt-${name}`, `${mt}`)
        R(`${s}mb-${name}`, `${mb}`)
    }
    generateMargins('', 'auto', 'auto')
    GS((name, value) => {
        R(`p-${name}`, `padding: ${value};`)
        const pl = `padding-left: ${value};`
        const pr = `padding-right: ${value};`
        const pt = `padding-top: ${value};`
        const pb = `padding-bottom: ${value};`
        R(`px-${name}`, `${pl}${pr}`)
        R(`pl-${name}`, `${pl}`)
        R(`pr-${name}`, `${pr}`)
        R(`py-${name}`, `${pt}${pb}`)
        R(`pt-${name}`, `${pt}`)
        R(`pb-${name}`, `${pb}`)

        E(['', '-'], s => generateMargins(s, name, value))
    })

    // Top / Right / Bottom / Left
    GS((name, value) => {
        E(['', '-'], s => {
            const l = `left: ${s}${value};`
            const r = `right: ${s}${value};`
            const t = `top: ${s}${value};`
            const b = `bottom: ${s}${value};`
            R(`${s}inset-${name}`, `${l}${r}${t}${b}`)
            R(`${s}inset-x-${name}`, `${l}${r}`)
            R(`${s}left-${name}`, `${l}`)
            R(`${s}right-${name}`, `${r}`)
            R(`${s}inset-y-${name}`, `${t}${b}`)
            R(`${s}top-${name}`, `${t}`)
            R(`${s}bottom-${name}`, `${b}`)
        })
    })

    // Space
    const sc = ' > :not([hidden]) ~ :not([hidden])'
    R('space-x-reverse', { name: `$${sc}`, style: `--${P}-space-x-reverse: 1;` })
    R('space-y-reverse', { name: `$${sc}`, style: `--${P}-space-y-reverse: 1;` })
    GS((name, value) => {
        E({ x: ['right', 'left'], y: ['top', 'bottom'] }, (vs, k) => E(['', '-'], (s) => {
            R(`${s}space-${k}-${name}`, { name: `$${sc}`, style: `--${P}-space-${k}-reverse: 0;margin-${vs[0]}: calc(${s}${value} * var(--${P}-space-${k}-reverse));margin-${vs[1]}: calc(${s}${value} * calc(1 - var(--${P}-space-${k}-reverse)));` })
        }))
    })

    // Order
    E({ first: -9999, last: 9999, none: 0 }, (v, k) => R(`order-${k}`, `order: ${v};`))
    for (i = 1; i <= 12; i++) R(`order-${i}`, `order: ${i};`)

    // Grid
    R(`grid-cols-none`, `grid-template-columns: none;`)
    for (i = 1; i <= 12; i++) R(`grid-cols-${i}`, `grid-template-columns: repeat(${i}, minmax(0, 1fr));`)

    E([['col', 'column'], ['row', 'row']], ([n1, n2], row) => {
        R(`${n1}-auto`, `grid-${n2}: auto;`)
        R(`${n1}-span-full`, `grid-${n2}: 1 / -1;`)
        R(`${n1}-start-auto`, `grid-${n2}-start: auto;`)
        R(`${n1}-end-auto`, `grid-${n2}-end: auto;`)
        let len = (row ? 7 : 13)
        for (i = 1; i <= len; i++) {
            R(`${n1}-span-${i}`, `grid-${n2}: span ${i} / span ${i};`)
            R(`${n1}-start-${i}`, `grid-${n2}-start: span ${i} / span ${i};`)
            R(`${n1}-end-${i}`, `grid-${n2}-end: span ${i} / span ${i};`)
        }
    })

    R(`grid-rows-none`, `grid-template-rows: none;`)
    for (i = 1; i <= 6; i++) R(`grid-rows-${i}`, `grid-template-rows: repeat(${i}, minmax(0, 1fr));`)

    E(['row', 'col', 'row-dense', 'col-dense'], v => R(`grid-flow-${v}`, `grid-auto-flow: ${v};`))
    E({ auto: 'auto', min: 'min-content', max: 'max-content', fr: 'minmax(0, 1fr)' }, (v, k) => {
        R(`auto-cols-${k}`, `grid-auto-columns: ${v};`)
        R(`auto-rows-${k}`, `grid-auto-rows: ${v};`)
    })

    // Gap
    GS((name, value) => {
        R(`gap-${name}`, `gap: ${value};`)
        R(`gap-x-${name}`, `column-gap: ${value};`)
        R(`gap-y-${name}`, `row-gap: ${value};`)
    })

    // Justify & Align & Place
    E({ start: 'flex-start', end: 'flex-end', center: 'center', between: 'space-between', around: 'space-around', evenly: 'space-evenly' }, (v, k) => {
        R(`justify-${k}`, `justify-content: ${v};`)
        R(`content-${k}`, `align-content: ${v};`)
    })
    E({ start: 'start', end: 'end', center: 'center', stretch: 'stretch', between: 'space-between', around: 'space-around', evenly: 'space-evenly' }, (v, k) => {
        R(`place-content-${k}`, `place-content: ${v};`)
    })
    E(['start', 'end', 'center', 'stretch'], v => {
        R(`justify-items-${v}`, `justify-items: ${v};`)
        R(`place-items-${v}`, `place-items: ${v};`)
    })
    E(['auto', 'start', 'end', 'center', 'stretch'], v => {
        R(`justify-self-${v}`, `justify-self: ${v};`)
        R(`place-self-${v}`, `place-self: ${v};`)
    })
    E(['start', 'end', 'center', 'baseline', 'stretch'], v => R(`items-${v}`, `align-items: ${v};`))
    E(['auto', 'start', 'end', 'center', 'baseline', 'stretch'], v => R(`self-${v}`, `align-self: ${v};`))

    // Box Sizing & Decoration Break
    R(`decoration-slice`, `box-decoration-break: slice;`)
    R(`decoration-clone`, `box-decoration-break: clone;`)
    R(`box-border`, `box-sizing: border-box;`)
    R(`box-content`, `box-sizing: content-box;`)

    // Isolation
    R(`isolate`, `isolation: isolate;`)
    R(`isolation-auto`, `isolation: auto;`)

    // Float
    E(['left', 'right', 'none'], v => R(`float-${v}`, `float: ${v};`))

    // Object Fit & Position
    E(['contain', 'cover', 'fill', 'none', 'scale-down'], v => R(`object-${v}`, `object-fit: ${v};`))
    E(['bottom', 'center', 'left', 'left-bottom', 'left-top', 'right', 'right-bottom', 'right-top', 'top'], v => R(`object-${v}`, `object-position: ${v.replace('-', ' ')};`))

    // Overflow
    E(['auto', 'hidden', 'visible', 'scroll'], v => {
        R(`overflow-${v}`, `overflow: ${v};`)
        R(`overflow-x-${v}`, `overflow-x: ${v};`)
        R(`overflow-y-${v}`, `overflow-y: ${v};`)
    })

    // Overscroll
    E(['auto', 'none', 'contain'], v => {
        R(`overscroll-${v}`, `overscroll-behavior: ${v};`)
        R(`overscroll-x-${v}`, `overscroll-behavior-x: ${v};`)
        R(`overscroll-y-${v}`, `overscroll-behavior-y: ${v};`)
    })

    // Visibility
    R(`visible`, `visibility: visible;`)
    R(`invisible`, `visibility: hidden;`)

    // Z-Index
    E([0, 10, 20, 30, 40, 50, 'auto'], v => R(`z-${v}`, `z-index: ${v};`))

    // Tables
    R(`border-collapse`, `border-collapse: collapse;`)
    R(`border-separate`, `border-collapse: separate;`)
    R(`table-auto`, `table-layout: auto;`)
    R(`table-fixed`, `table-layout: fixed;`)

}

function setupPaint(G) {
    if (!G.$vs) return console.error('Vimesh style core is not loaded!')
    const E = G.$vs._.each
    const R = G.$vs._.register
    const GS = G.$vs._.generateSizes
    const GC = G.$vs._.generateColors
    const C = G.$vs.config
    const P = C.prefix
    const { rgbToHex, resolveColor, addInitStyle, isString } = G.$vs._
    let i

    // Font
    R('font-', classDetails => {
        let parts = classDetails.name.split('-')
        let font = C.fonts[parts[1]]
        if (!font) return null
        return `font-family: ${font};`
    })

    E({
        xs: [0.75, 1], sm: [0.875, 1.25], base: [1, 1.5], lg: [1.125, 1.75], xl: [1.25, 1.75],
        '2xl': [1.5, 2], '3xl': [1.875, 2.25], '4xl': [2.25, 2.5], '5xl': [3], '6xl': [3.75], '7xl': [4.5], '8xl': [6], '9xl': [8]
    }, (v, k) => R(`text-${k}`, `font-size: ${v[0]}rem;line-height: ${v.length > 1 ? `${v[1]}rem` : 1};`))

    R(`antialiased`, `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;`)
    R(`subpixel-antialiased`, `-webkit-font-smoothing: auto; -moz-osx-font-smoothing: auto;`)
    R(`italic`, `font-style: italic;`)
    R(`not-italic`, `font-style: normal;`)
    E(['thin', 'extralight', 'light', 'normal', 'medium', 'semibold', 'bold', 'extrabold', 'black'], (v, i) => R(`font-${v}`, `font-weight: ${(i + 1) * 100};`))

    // Letter Spacing
    E({ tighter: -0.05, tight: -0.025, normal: 0, wide: 0.025, wider: 0.05, widest: 0.1 }, (v, k) => R(`tracking-${k}`, `letter-spacing: ${v}em;`))

    // Line Height
    for (i = 3; i <= 10; i++) R(`leading-${i}`, `line-height: ${0.25 * i}rem;`)
    E({ none: 1, tight: 1.25, snug: 1.375, normal: 1.5, relaxed: 1.625, loose: 2 }, (v, k) => R(`leading-${k}`, `line-height: ${v};`))

    // List Style Type & Style
    E(['none', 'disc', 'decimal'], v => R(`list-${v}`, `list-style-type: ${v};`))
    E(['inside', 'outside'], v => R(`list-${v}`, `list-style-position: ${v};`))

    // Placeholder
    GC('placeholder', 'color', '::placeholder')

    // Text
    GC('text', 'color')
    E(['left', 'center', 'right', 'justify'], v => R(`text-${v}`, `text-align: ${v};`))
    E(['underline', 'line-through', 'none'], v => R(`${'none' == v ? 'no-underline' : v}`, `text-decoration: ${v};`))
    E(['uppercase', 'lowercase', 'capitalize', 'none'], v => R(`${'none' == v ? 'normal-case' : v}`, `text-transform: ${v};`))
    E(['ellipsis', 'clip'], v => R(`overflow-${v}`, `text-overflow: ${v}`))
    R('truncate', 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap;')
    E(['baseline', 'top', 'middle', 'bottom', 'text-top', 'text-bottom'], v => R(`align-${v}`, `vertical-align: ${v};`))
    E(['normal', 'nowrap', 'pre', 'pre-line', 'pre-wrap'], v => R(`whitespace-${v}`, `white-space: ${v};`))
    R(`break-normal`, `overflow-wrap: normal; word-break: normal;`)
    R(`break-words`, `overflow-wrap: break-word;`)
    R(`break-all`, `word-break: break-all;`)

    // Background
    E(['fixed', 'local', 'scroll'], v => R(`bg-${v}`, `background-attachment: ${v}`))
    E(['text', 'content', 'padding', 'border'], v => R(`bg-clip-${v}`, `background-clip: ${v}${v == 'text' ? '' : '-box'};`))
    GC('bg', 'background-color')
    E(['border', 'padding', 'content'], v => R(`bg-origin-${v}`, `background-origin: ${v}-box;`))
    E(['bottom', 'center', 'left', 'left-bottom', 'left-top', 'right', 'right-bottom', 'right-top', 'top'], v => R(`bg-${v}`, `background-position: ${v.replace('-', ' ')};`))
    E(['repeat', 'no-repeat', 'repeat-x', 'repeat-y', 'round', 'space'], v => R(`bg-${v.indexOf('repeat') != -1 ? v : `repeat-${v}`}`, `background-repeat: ${v};`))
    E(['auto', 'cover', 'contain'], v => R(`bg-${v}`, `background-size: ${v};`))

    // Gradient Background 
    R(`bg-none`, `background-image: none;`)
    const DM = { t: 'top', r: 'right', b: 'bottom', l: 'left' }
    const dirs = ['t', 'tr', 'r', 'br', 'b', 'bl', 'l', 'tl']
    E(dirs, v => R(`bg-gradient-to-${v}`, `background-image: linear-gradient(to ${v.length == 1 ? DM[v[0]] : `${DM[v[0]]} ${DM[v[1]]}`}, var(--${P}-gradient-stops));`))

    const from = 'from-', to = 'to-', via = 'via-'
    R(from, classDetails => {
        let cv = resolveColor(classDetails.name.substring(from.length))
        if (!cv) return null
        return `--${P}-gradient-from: ${isString(cv) ? cv : '#' + rgbToHex(cv)}; --${P}-gradient-stops: var(--${P}-gradient-from), var(--${P}-gradient-to, rgba(${cv.r},${cv.g},${cv.b}, 0));`
    })
    R(to, classDetails => {
        let cv = resolveColor(classDetails.name.substring(to.length))
        if (!cv) return null
        return `--${P}-gradient-to: ${isString(cv) ? cv : '#' + rgbToHex(cv)};`
    })
    R(via, classDetails => {
        let cv = resolveColor(classDetails.name.substring(via.length))
        if (!cv) return null
        return `--${P}-gradient-stops: var(--${P}-gradient-from), ${isString(cv) ? cv : '#' + rgbToHex(cv)}, var(--${P}-gradient-to, rgba(${cv.r},${cv.g},${cv.b}, 0));`
    })

    // SVG
    R(`fill-current`, `fill: currentColor;`)
    R(`stroke-current`, `stroke: currentColor;`)
    E([0, 1, 2], v => R(`stroke-${v}`, `stroke-width: ${v}`))

    // Border
    R(`rounded-none`, `border-radius: 0px;`)
    E({ none: '0px', sm: 0.125, _: 0.25, md: 0.375, lg: 0.5, xl: 0.75, '2xl': 1, '3xl': 1.5, full: '9999px' }, (s, n) => {
        s = isString(s) ? s : s + 'rem'
        R(`rounded${'_' == n ? '' : `-${n}`}`, `border-radius: ${s};`)
        E(dirs, v => {
            if (v.length == 1) {
                let isTB = 't' == v || 'b' == v
                let d2 = isTB ? ['l', 'r'] : ['t', 'b']
                R(`rounded-${v}${'_' == n ? '' : `-${n}`}`, `border-${isTB ? DM[v] : DM[d2[0]]}-${isTB ? DM[d2[0]] : DM[v]}-radius: ${s}; border-${isTB ? DM[v] : DM[d2[1]]}-${isTB ? DM[d2[1]] : DM[v]}-radius: ${s};`)
            } else {
                R(`rounded-${v}${'_' == n ? '' : `-${n}`}`, `border-${DM[v[0]]}-${DM[v[1]]}-radius: ${s}; `)
            }
        })
    })
    E([0, 1, 2, 4, 8], w => {
        R(`border${w == 1 ? '' : `-${w}`}`, `border-width: ${w}px;`)
        E(Object.keys(DM), d => R(`border-${d}${w == 1 ? '' : `-${w}`}`, `border-${DM[d]}-width: ${w}px;`))
    })
    GC('border', 'border-color')
    E(['solid', 'dashed', 'dotted', 'double', 'none'], v => R(`border-${v}`, `border-style: ${v};`))

    // Divide
    const sc = ' > :not([hidden]) ~ :not([hidden])'
    E(['x', 'y'], a => {
        let d2 = a == 'x' ? ['left', 'right'] : ['top', 'bottom']
        R(`divide-${a}-reverse`, { name: `$${sc}`, style: `--${P}-divide-${a}-reverse: 1;` })
        E([0, 1, 2, 4, 8], w => {
            R(`divide-${a}${w == 1 ? '' : `-${w}`}`, { name: `$${sc}`, style: `--${P}-divide-${a}-reverse: 0; border-${d2[0]}-width: calc(${w}px * calc(1 - var(--${P}-divide-${a}-reverse))); border-${d2[1]}-width: calc(${w}px * var(--${P}-divide-${a}-reverse));` })
        })
    })
    GC('divide', 'border-color', sc)
    E(['solid', 'dashed', 'dotted', 'double', 'none'], v => R(`divide-${v}`, { name: `$${sc}`, style: `border-style: ${v};` }))

    // Ring
    const initShadow = () => addInitStyle(`*, ::before, ::after {--${P}-shadow: 0 0 #0000;}`)
    const initRing = () => { initShadow(); addInitStyle(`*, ::before, ::after {--${P}-ring-inset: var(--${P}-empty,/*!*/ /*!*/); --${P}-ring-offset-width: 0px; --${P}-ring-offset-color: #fff; --${P}-ring-color: rgba(59, 130, 246, 0.5); --${P}-ring-offset-shadow: 0 0 #0000; --${P}-ring-shadow: 0 0 #0000;}`) }

    R(`ring-inset`, `--${P}-ring-inset: inset;`)
    E([0, 1, 2, 4, 8, 3], w => R(`ring${w == 3 ? '' : `-${w}`}`, `--${P}-ring-offset-shadow: var(--${P}-ring-inset) 0 0 0 var(--${P}-ring-offset-width) var(--${P}-ring-offset-color); --${P}-ring-shadow: var(--${P}-ring-inset) 0 0 0 calc(${w}px + var(--${P}-ring-offset-width)) var(--${P}-ring-color); box-shadow: var(--${P}-ring-offset-shadow), var(--${P}-ring-shadow), var(--${P}-shadow, 0 0 #0000);`, initRing))
    GC('ring', `--${P}-ring-color`)
    E([0, 1, 2, 4, 8], w => R(`ring-offset-${w}`, `--${P}-ring-offset-width: ${w}px;`))
    const roc = 'ring-offset-'
    R(roc, classDetails => {
        let cv = resolveColor(classDetails.name.substring(roc.length))
        if (!cv) return null
        return `--${P}-ring-offset-color: ${isString(cv) ? cv : '#' + rgbToHex(cv)}; `
    })

    // Effects
    const bs = `box-shadow: var(--${P}-ring-offset-shadow, 0 0 #0000), var(--${P}-ring-shadow, 0 0 #0000), var(--${P}-shadow);`
    E({
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        _: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        none: '0 0 #0000'
    }, (v, k) => R(`shadow${k == '_' ? '' : `-${k}`}`, `--${P}-shadow: ${v};${bs}`), initShadow)

    R(`opacity-`, classDetails => {
        let parts = classDetails.name.split('-')
        return `opacity: ${+parts[1] / 100};`
    })
    const bms = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity']
    E(bms, v => R(`mix-blend-${v}`, `mix-blend-mode: ${v};`))
    E(bms, v => R(`bg-blend-${v}`, `background-blend-mode: ${v};`))

    // Transition & Animation
    E({
        none: 'none', all: 'all', opacity: 'opacity', shadow: 'box-shadow', transform: 'transform',
        _: 'background-color, border-color, color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter',
        colors: 'background-color, border-color, color, fill, stroke'
    }, (v, k) => R(`transition${k == '_' ? '' : `-${k}`}`, `transition-property: ${v}; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms;`))
    R('duration-', classDetails => {
        let parts = classDetails.name.split('-')
        return `transition-duration: ${parts[1]}ms;`
    })
    E({ linear: 'linear', in: 'cubic-bezier(0.4, 0, 1, 1)', out: 'cubic-bezier(0, 0, 0.2, 1)', 'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)' },
        (v, k) => R(`ease-${k}`, `transition-timing-function: ${v};`))
    R('delay-', classDetails => {
        let parts = classDetails.name.split('-')
        return `transition-delay: ${parts[1]}ms;`
    })

    const ani = `animate-`
    R(ani, classDetails => {
        let k = classDetails.name.substring(ani.length)
        let v = C.animation[k]
        if (!v) return null
        return `animation: ${v};`
    }, classDetails => {
        let k = classDetails.name.substring(ani.length)
        if (C.keyframes[k])
            addInitStyle(`@keyframes ${k}${C.keyframes[k]}`)
    })

    // Transform
    const tvs = `--${P}-translate-x: 0; --${P}-translate-y: 0; --${P}-rotate: 0; --${P}-skew-x: 0; --${P}-skew-y: 0; --${P}-scale-x: 1; --${P}-scale-y: 1;`
    const ts = `rotate(var(--${P}-rotate)) skewX(var(--${P}-skew-x)) skewY(var(--${P}-skew-y)) scaleX(var(--${P}-scale-x)) scaleY(var(--${P}-scale-y));`
    R(`transform`, `${tvs}transform: translateX(var(--${P}-translate-x)) translateY(var(--${P}-translate-y)) ${ts}`)
    R(`transform-gpu`, `${tvs}translate3d(var(--${P}-translate-x), var(--${P}-translate-y), 0) ${ts}`)
    R(`transform-none`, `transform: none;`)
    E(['center', 'top', 'top-right', 'right', 'bottom-right', 'bottom', 'bottom-left', 'left', 'top-left'], v => R(`origin-${v}`, `transform-origin: ${v.replace('-', ' ')};`))
    R('scale-', classDetails => {
        let parts = classDetails.name.split('-')
        let v = +parts[parts.length - 1] / 100
        if (parts.length == 2)
            return `--${P}-scale-x: ${v};--${P}-scale-y: ${v};`
        else
            return `--${P}-scale-${parts[1]}: ${v};`
    })
    R(['rotate-', '-rotate-'], classDetails => {
        let cn = classDetails.name
        let s = ''
        if ('-' == cn[0]) {
            cn = cn.substring(1)
            s = '-'
        }
        let parts = cn.split('-')
        return `--${P}-rotate: ${s}${parts[1]}deg;`
    })
    function genTrans(name, value) {
        E(['x', 'y'], a => E(['', '-'], (s) => {
            R(`${s}translate-${a}-${name}`, `--${P}-translate-${a}: ${s}${value};`)
        }))
    }
    GS(genTrans)
    E([2, 3, 4], max => {
        for (i = 1; i < max; i++) {
            genTrans(`${i}/${max}`, `${+(i * 100 / max).toFixed(6)}%;`)
        }
    })
    genTrans('full', '100%')
    E([0, 1, 2, 3, 6, 12], d => E(['x', 'y'], a => E(['', '-'], (s) => {
        R(`${s}skew-${a}-${d}`, `--${P}-skew-${a}: ${s}${d}deg;`)
    })))

    // Interactivity 
    R(`appearance-none`, `appearance: none;`)
    E(['auto', 'default', 'pointer', 'wait', 'text', 'move', 'help', 'not-allowed'], v => R(`cursor-${v}`, `cursor: ${v};`))
    E(['none', 'white', 'black'], v => R(`outline-${v}`, `outline: 2px ${v == 'none' ? 'solid transparent' : `dotted ${v}`}; outline-offset: 2px;`))
    E(['none', 'auto'], v => R(`pointer-events-${v}`, `pointer-events: ${v};`))
    E({ none: 'none', y: 'vertical', x: 'horizontal', _: 'both' }, (v, k) => R(`resize${k == '_' ? '' : `-${k}`}`, `resize: ${v};`))
    E(['none', 'text', 'all', 'auto'], v => R(`select-${v}`, `user-select: ${v};`))

    // Screen Readers
    R(`sr-only`, `position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0;`)
    R(`not-sr-only`, `position: static; width: auto; height: auto; padding: 0; margin: 0; overflow: visible; clip: auto; white-space: normal;`)
}


function setupVimeshStyle(G) {
    setupCore(G)
    setupPreset(G)
    setupLayout(G)
    setupPaint(G)
}

setupVimeshStyle(window);(() => {
  // node_modules/tabbable/dist/index.esm.js
  /*!
  * tabbable 5.2.1
  * @license MIT, https://github.com/focus-trap/tabbable/blob/master/LICENSE
  */
  var candidateSelectors = ["input", "select", "textarea", "a[href]", "button", "[tabindex]", "audio[controls]", "video[controls]", '[contenteditable]:not([contenteditable="false"])', "details>summary:first-of-type", "details"];
  var candidateSelector = /* @__PURE__ */ candidateSelectors.join(",");
  var matches = typeof Element === "undefined" ? function() {
  } : Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
  var getCandidates = function getCandidates2(el, includeContainer, filter) {
    var candidates = Array.prototype.slice.apply(el.querySelectorAll(candidateSelector));
    if (includeContainer && matches.call(el, candidateSelector)) {
      candidates.unshift(el);
    }
    candidates = candidates.filter(filter);
    return candidates;
  };
  var isContentEditable = function isContentEditable2(node) {
    return node.contentEditable === "true";
  };
  var getTabindex = function getTabindex2(node) {
    var tabindexAttr = parseInt(node.getAttribute("tabindex"), 10);
    if (!isNaN(tabindexAttr)) {
      return tabindexAttr;
    }
    if (isContentEditable(node)) {
      return 0;
    }
    if ((node.nodeName === "AUDIO" || node.nodeName === "VIDEO" || node.nodeName === "DETAILS") && node.getAttribute("tabindex") === null) {
      return 0;
    }
    return node.tabIndex;
  };
  var sortOrderedTabbables = function sortOrderedTabbables2(a, b) {
    return a.tabIndex === b.tabIndex ? a.documentOrder - b.documentOrder : a.tabIndex - b.tabIndex;
  };
  var isInput = function isInput2(node) {
    return node.tagName === "INPUT";
  };
  var isHiddenInput = function isHiddenInput2(node) {
    return isInput(node) && node.type === "hidden";
  };
  var isDetailsWithSummary = function isDetailsWithSummary2(node) {
    var r = node.tagName === "DETAILS" && Array.prototype.slice.apply(node.children).some(function(child) {
      return child.tagName === "SUMMARY";
    });
    return r;
  };
  var getCheckedRadio = function getCheckedRadio2(nodes, form) {
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].checked && nodes[i].form === form) {
        return nodes[i];
      }
    }
  };
  var isTabbableRadio = function isTabbableRadio2(node) {
    if (!node.name) {
      return true;
    }
    var radioScope = node.form || node.ownerDocument;
    var queryRadios = function queryRadios2(name) {
      return radioScope.querySelectorAll('input[type="radio"][name="' + name + '"]');
    };
    var radioSet;
    if (typeof window !== "undefined" && typeof window.CSS !== "undefined" && typeof window.CSS.escape === "function") {
      radioSet = queryRadios(window.CSS.escape(node.name));
    } else {
      try {
        radioSet = queryRadios(node.name);
      } catch (err) {
        console.error("Looks like you have a radio button with a name attribute containing invalid CSS selector characters and need the CSS.escape polyfill: %s", err.message);
        return false;
      }
    }
    var checked = getCheckedRadio(radioSet, node.form);
    return !checked || checked === node;
  };
  var isRadio = function isRadio2(node) {
    return isInput(node) && node.type === "radio";
  };
  var isNonTabbableRadio = function isNonTabbableRadio2(node) {
    return isRadio(node) && !isTabbableRadio(node);
  };
  var isHidden = function isHidden2(node, displayCheck) {
    if (getComputedStyle(node).visibility === "hidden") {
      return true;
    }
    var isDirectSummary = matches.call(node, "details>summary:first-of-type");
    var nodeUnderDetails = isDirectSummary ? node.parentElement : node;
    if (matches.call(nodeUnderDetails, "details:not([open]) *")) {
      return true;
    }
    if (!displayCheck || displayCheck === "full") {
      while (node) {
        if (getComputedStyle(node).display === "none") {
          return true;
        }
        node = node.parentElement;
      }
    } else if (displayCheck === "non-zero-area") {
      var _node$getBoundingClie = node.getBoundingClientRect(), width = _node$getBoundingClie.width, height = _node$getBoundingClie.height;
      return width === 0 && height === 0;
    }
    return false;
  };
  var isDisabledFromFieldset = function isDisabledFromFieldset2(node) {
    if (isInput(node) || node.tagName === "SELECT" || node.tagName === "TEXTAREA" || node.tagName === "BUTTON") {
      var parentNode = node.parentElement;
      while (parentNode) {
        if (parentNode.tagName === "FIELDSET" && parentNode.disabled) {
          for (var i = 0; i < parentNode.children.length; i++) {
            var child = parentNode.children.item(i);
            if (child.tagName === "LEGEND") {
              if (child.contains(node)) {
                return false;
              }
              return true;
            }
          }
          return true;
        }
        parentNode = parentNode.parentElement;
      }
    }
    return false;
  };
  var isNodeMatchingSelectorFocusable = function isNodeMatchingSelectorFocusable2(options, node) {
    if (node.disabled || isHiddenInput(node) || isHidden(node, options.displayCheck) || isDetailsWithSummary(node) || isDisabledFromFieldset(node)) {
      return false;
    }
    return true;
  };
  var isNodeMatchingSelectorTabbable = function isNodeMatchingSelectorTabbable2(options, node) {
    if (!isNodeMatchingSelectorFocusable(options, node) || isNonTabbableRadio(node) || getTabindex(node) < 0) {
      return false;
    }
    return true;
  };
  var tabbable = function tabbable2(el, options) {
    options = options || {};
    var regularTabbables = [];
    var orderedTabbables = [];
    var candidates = getCandidates(el, options.includeContainer, isNodeMatchingSelectorTabbable.bind(null, options));
    candidates.forEach(function(candidate, i) {
      var candidateTabindex = getTabindex(candidate);
      if (candidateTabindex === 0) {
        regularTabbables.push(candidate);
      } else {
        orderedTabbables.push({
          documentOrder: i,
          tabIndex: candidateTabindex,
          node: candidate
        });
      }
    });
    var tabbableNodes = orderedTabbables.sort(sortOrderedTabbables).map(function(a) {
      return a.node;
    }).concat(regularTabbables);
    return tabbableNodes;
  };
  var focusable = function focusable2(el, options) {
    options = options || {};
    var candidates = getCandidates(el, options.includeContainer, isNodeMatchingSelectorFocusable.bind(null, options));
    return candidates;
  };
  var focusableCandidateSelector = /* @__PURE__ */ candidateSelectors.concat("iframe").join(",");
  var isFocusable = function isFocusable2(node, options) {
    options = options || {};
    if (!node) {
      throw new Error("No node provided");
    }
    if (matches.call(node, focusableCandidateSelector) === false) {
      return false;
    }
    return isNodeMatchingSelectorFocusable(options, node);
  };

  // node_modules/focus-trap/dist/focus-trap.esm.js
  /*!
  * focus-trap 6.6.1
  * @license MIT, https://github.com/focus-trap/focus-trap/blob/master/LICENSE
  */
  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);
      if (enumerableOnly) {
        symbols = symbols.filter(function(sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        });
      }
      keys.push.apply(keys, symbols);
    }
    return keys;
  }
  function _objectSpread2(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? arguments[i] : {};
      if (i % 2) {
        ownKeys(Object(source), true).forEach(function(key) {
          _defineProperty(target, key, source[key]);
        });
      } else if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
      } else {
        ownKeys(Object(source)).forEach(function(key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
    }
    return target;
  }
  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  var activeFocusTraps = function() {
    var trapQueue = [];
    return {
      activateTrap: function activateTrap(trap) {
        if (trapQueue.length > 0) {
          var activeTrap = trapQueue[trapQueue.length - 1];
          if (activeTrap !== trap) {
            activeTrap.pause();
          }
        }
        var trapIndex = trapQueue.indexOf(trap);
        if (trapIndex === -1) {
          trapQueue.push(trap);
        } else {
          trapQueue.splice(trapIndex, 1);
          trapQueue.push(trap);
        }
      },
      deactivateTrap: function deactivateTrap(trap) {
        var trapIndex = trapQueue.indexOf(trap);
        if (trapIndex !== -1) {
          trapQueue.splice(trapIndex, 1);
        }
        if (trapQueue.length > 0) {
          trapQueue[trapQueue.length - 1].unpause();
        }
      }
    };
  }();
  var isSelectableInput = function isSelectableInput2(node) {
    return node.tagName && node.tagName.toLowerCase() === "input" && typeof node.select === "function";
  };
  var isEscapeEvent = function isEscapeEvent2(e) {
    return e.key === "Escape" || e.key === "Esc" || e.keyCode === 27;
  };
  var isTabEvent = function isTabEvent2(e) {
    return e.key === "Tab" || e.keyCode === 9;
  };
  var delay = function delay2(fn) {
    return setTimeout(fn, 0);
  };
  var findIndex = function findIndex2(arr, fn) {
    var idx = -1;
    arr.every(function(value, i) {
      if (fn(value)) {
        idx = i;
        return false;
      }
      return true;
    });
    return idx;
  };
  var valueOrHandler = function valueOrHandler2(value) {
    for (var _len = arguments.length, params = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      params[_key - 1] = arguments[_key];
    }
    return typeof value === "function" ? value.apply(void 0, params) : value;
  };
  var createFocusTrap = function createFocusTrap2(elements, userOptions) {
    var doc = document;
    var config = _objectSpread2({
      returnFocusOnDeactivate: true,
      escapeDeactivates: true,
      delayInitialFocus: true
    }, userOptions);
    var state = {
      containers: [],
      tabbableGroups: [],
      nodeFocusedBeforeActivation: null,
      mostRecentlyFocusedNode: null,
      active: false,
      paused: false,
      delayInitialFocusTimer: void 0
    };
    var trap;
    var getOption = function getOption2(configOverrideOptions, optionName, configOptionName) {
      return configOverrideOptions && configOverrideOptions[optionName] !== void 0 ? configOverrideOptions[optionName] : config[configOptionName || optionName];
    };
    var containersContain = function containersContain2(element) {
      return state.containers.some(function(container) {
        return container.contains(element);
      });
    };
    var getNodeForOption = function getNodeForOption2(optionName) {
      var optionValue = config[optionName];
      if (!optionValue) {
        return null;
      }
      var node = optionValue;
      if (typeof optionValue === "string") {
        node = doc.querySelector(optionValue);
        if (!node) {
          throw new Error("`".concat(optionName, "` refers to no known node"));
        }
      }
      if (typeof optionValue === "function") {
        node = optionValue();
        if (!node) {
          throw new Error("`".concat(optionName, "` did not return a node"));
        }
      }
      return node;
    };
    var getInitialFocusNode = function getInitialFocusNode2() {
      var node;
      if (getOption({}, "initialFocus") === false) {
        return false;
      }
      if (getNodeForOption("initialFocus") !== null) {
        node = getNodeForOption("initialFocus");
      } else if (containersContain(doc.activeElement)) {
        node = doc.activeElement;
      } else {
        var firstTabbableGroup = state.tabbableGroups[0];
        var firstTabbableNode = firstTabbableGroup && firstTabbableGroup.firstTabbableNode;
        node = firstTabbableNode || getNodeForOption("fallbackFocus");
      }
      if (!node) {
        throw new Error("Your focus-trap needs to have at least one focusable element");
      }
      return node;
    };
    var updateTabbableNodes = function updateTabbableNodes2() {
      state.tabbableGroups = state.containers.map(function(container) {
        var tabbableNodes = tabbable(container);
        if (tabbableNodes.length > 0) {
          return {
            container,
            firstTabbableNode: tabbableNodes[0],
            lastTabbableNode: tabbableNodes[tabbableNodes.length - 1]
          };
        }
        return void 0;
      }).filter(function(group) {
        return !!group;
      });
      if (state.tabbableGroups.length <= 0 && !getNodeForOption("fallbackFocus")) {
        throw new Error("Your focus-trap must have at least one container with at least one tabbable node in it at all times");
      }
    };
    var tryFocus = function tryFocus2(node) {
      if (node === false) {
        return;
      }
      if (node === doc.activeElement) {
        return;
      }
      if (!node || !node.focus) {
        tryFocus2(getInitialFocusNode());
        return;
      }
      node.focus({
        preventScroll: !!config.preventScroll
      });
      state.mostRecentlyFocusedNode = node;
      if (isSelectableInput(node)) {
        node.select();
      }
    };
    var getReturnFocusNode = function getReturnFocusNode2(previousActiveElement) {
      var node = getNodeForOption("setReturnFocus");
      return node ? node : previousActiveElement;
    };
    var checkPointerDown = function checkPointerDown2(e) {
      if (containersContain(e.target)) {
        return;
      }
      if (valueOrHandler(config.clickOutsideDeactivates, e)) {
        trap.deactivate({
          returnFocus: config.returnFocusOnDeactivate && !isFocusable(e.target)
        });
        return;
      }
      if (valueOrHandler(config.allowOutsideClick, e)) {
        return;
      }
      e.preventDefault();
    };
    var checkFocusIn = function checkFocusIn2(e) {
      var targetContained = containersContain(e.target);
      if (targetContained || e.target instanceof Document) {
        if (targetContained) {
          state.mostRecentlyFocusedNode = e.target;
        }
      } else {
        e.stopImmediatePropagation();
        tryFocus(state.mostRecentlyFocusedNode || getInitialFocusNode());
      }
    };
    var checkTab = function checkTab2(e) {
      updateTabbableNodes();
      var destinationNode = null;
      if (state.tabbableGroups.length > 0) {
        var containerIndex = findIndex(state.tabbableGroups, function(_ref) {
          var container = _ref.container;
          return container.contains(e.target);
        });
        if (containerIndex < 0) {
          if (e.shiftKey) {
            destinationNode = state.tabbableGroups[state.tabbableGroups.length - 1].lastTabbableNode;
          } else {
            destinationNode = state.tabbableGroups[0].firstTabbableNode;
          }
        } else if (e.shiftKey) {
          var startOfGroupIndex = findIndex(state.tabbableGroups, function(_ref2) {
            var firstTabbableNode = _ref2.firstTabbableNode;
            return e.target === firstTabbableNode;
          });
          if (startOfGroupIndex < 0 && state.tabbableGroups[containerIndex].container === e.target) {
            startOfGroupIndex = containerIndex;
          }
          if (startOfGroupIndex >= 0) {
            var destinationGroupIndex = startOfGroupIndex === 0 ? state.tabbableGroups.length - 1 : startOfGroupIndex - 1;
            var destinationGroup = state.tabbableGroups[destinationGroupIndex];
            destinationNode = destinationGroup.lastTabbableNode;
          }
        } else {
          var lastOfGroupIndex = findIndex(state.tabbableGroups, function(_ref3) {
            var lastTabbableNode = _ref3.lastTabbableNode;
            return e.target === lastTabbableNode;
          });
          if (lastOfGroupIndex < 0 && state.tabbableGroups[containerIndex].container === e.target) {
            lastOfGroupIndex = containerIndex;
          }
          if (lastOfGroupIndex >= 0) {
            var _destinationGroupIndex = lastOfGroupIndex === state.tabbableGroups.length - 1 ? 0 : lastOfGroupIndex + 1;
            var _destinationGroup = state.tabbableGroups[_destinationGroupIndex];
            destinationNode = _destinationGroup.firstTabbableNode;
          }
        }
      } else {
        destinationNode = getNodeForOption("fallbackFocus");
      }
      if (destinationNode) {
        e.preventDefault();
        tryFocus(destinationNode);
      }
    };
    var checkKey = function checkKey2(e) {
      if (isEscapeEvent(e) && valueOrHandler(config.escapeDeactivates) !== false) {
        e.preventDefault();
        trap.deactivate();
        return;
      }
      if (isTabEvent(e)) {
        checkTab(e);
        return;
      }
    };
    var checkClick = function checkClick2(e) {
      if (valueOrHandler(config.clickOutsideDeactivates, e)) {
        return;
      }
      if (containersContain(e.target)) {
        return;
      }
      if (valueOrHandler(config.allowOutsideClick, e)) {
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    var addListeners = function addListeners2() {
      if (!state.active) {
        return;
      }
      activeFocusTraps.activateTrap(trap);
      state.delayInitialFocusTimer = config.delayInitialFocus ? delay(function() {
        tryFocus(getInitialFocusNode());
      }) : tryFocus(getInitialFocusNode());
      doc.addEventListener("focusin", checkFocusIn, true);
      doc.addEventListener("mousedown", checkPointerDown, {
        capture: true,
        passive: false
      });
      doc.addEventListener("touchstart", checkPointerDown, {
        capture: true,
        passive: false
      });
      doc.addEventListener("click", checkClick, {
        capture: true,
        passive: false
      });
      doc.addEventListener("keydown", checkKey, {
        capture: true,
        passive: false
      });
      return trap;
    };
    var removeListeners = function removeListeners2() {
      if (!state.active) {
        return;
      }
      doc.removeEventListener("focusin", checkFocusIn, true);
      doc.removeEventListener("mousedown", checkPointerDown, true);
      doc.removeEventListener("touchstart", checkPointerDown, true);
      doc.removeEventListener("click", checkClick, true);
      doc.removeEventListener("keydown", checkKey, true);
      return trap;
    };
    trap = {
      activate: function activate(activateOptions) {
        if (state.active) {
          return this;
        }
        var onActivate = getOption(activateOptions, "onActivate");
        var onPostActivate = getOption(activateOptions, "onPostActivate");
        var checkCanFocusTrap = getOption(activateOptions, "checkCanFocusTrap");
        if (!checkCanFocusTrap) {
          updateTabbableNodes();
        }
        state.active = true;
        state.paused = false;
        state.nodeFocusedBeforeActivation = doc.activeElement;
        if (onActivate) {
          onActivate();
        }
        var finishActivation = function finishActivation2() {
          if (checkCanFocusTrap) {
            updateTabbableNodes();
          }
          addListeners();
          if (onPostActivate) {
            onPostActivate();
          }
        };
        if (checkCanFocusTrap) {
          checkCanFocusTrap(state.containers.concat()).then(finishActivation, finishActivation);
          return this;
        }
        finishActivation();
        return this;
      },
      deactivate: function deactivate(deactivateOptions) {
        if (!state.active) {
          return this;
        }
        clearTimeout(state.delayInitialFocusTimer);
        state.delayInitialFocusTimer = void 0;
        removeListeners();
        state.active = false;
        state.paused = false;
        activeFocusTraps.deactivateTrap(trap);
        var onDeactivate = getOption(deactivateOptions, "onDeactivate");
        var onPostDeactivate = getOption(deactivateOptions, "onPostDeactivate");
        var checkCanReturnFocus = getOption(deactivateOptions, "checkCanReturnFocus");
        if (onDeactivate) {
          onDeactivate();
        }
        var returnFocus = getOption(deactivateOptions, "returnFocus", "returnFocusOnDeactivate");
        var finishDeactivation = function finishDeactivation2() {
          delay(function() {
            if (returnFocus) {
              tryFocus(getReturnFocusNode(state.nodeFocusedBeforeActivation));
            }
            if (onPostDeactivate) {
              onPostDeactivate();
            }
          });
        };
        if (returnFocus && checkCanReturnFocus) {
          checkCanReturnFocus(getReturnFocusNode(state.nodeFocusedBeforeActivation)).then(finishDeactivation, finishDeactivation);
          return this;
        }
        finishDeactivation();
        return this;
      },
      pause: function pause() {
        if (state.paused || !state.active) {
          return this;
        }
        state.paused = true;
        removeListeners();
        return this;
      },
      unpause: function unpause() {
        if (!state.paused || !state.active) {
          return this;
        }
        state.paused = false;
        updateTabbableNodes();
        addListeners();
        return this;
      },
      updateContainerElements: function updateContainerElements(containerElements) {
        var elementsAsArray = [].concat(containerElements).filter(Boolean);
        state.containers = elementsAsArray.map(function(element) {
          return typeof element === "string" ? doc.querySelector(element) : element;
        });
        if (state.active) {
          updateTabbableNodes();
        }
        return this;
      }
    };
    trap.updateContainerElements(elements);
    return trap;
  };

  // packages/focus/src/index.js
  function src_default(Alpine) {
    let lastFocused;
    let currentFocused;
    window.addEventListener("focusin", () => {
      lastFocused = currentFocused;
      currentFocused = document.activeElement;
    });
    Alpine.magic("focus", (el) => {
      let within = el;
      return {
        __noscroll: false,
        __wrapAround: false,
        within(el2) {
          within = el2;
          return this;
        },
        withoutScrolling() {
          this.__noscroll = true;
          return this;
        },
        noscroll() {
          this.__noscroll = true;
          return this;
        },
        withWrapAround() {
          this.__wrapAround = true;
          return this;
        },
        wrap() {
          return this.withWrapAround();
        },
        focusable(el2) {
          return isFocusable(el2);
        },
        previouslyFocused() {
          return lastFocused;
        },
        lastFocused() {
          return lastFocused;
        },
        focused() {
          return currentFocused;
        },
        focusables() {
          if (Array.isArray(within))
            return within;
          return focusable(within, {displayCheck: "none"});
        },
        all() {
          return this.focusables();
        },
        isFirst(el2) {
          let els = this.all();
          return els[0] && els[0].isSameNode(el2);
        },
        isLast(el2) {
          let els = this.all();
          return els.length && els.slice(-1)[0].isSameNode(el2);
        },
        getFirst() {
          return this.all()[0];
        },
        getLast() {
          return this.all().slice(-1)[0];
        },
        getNext() {
          let list = this.all();
          let current = document.activeElement;
          if (list.indexOf(current) === -1)
            return;
          if (this.__wrapAround && list.indexOf(current) === list.length - 1) {
            return list[0];
          }
          return list[list.indexOf(current) + 1];
        },
        getPrevious() {
          let list = this.all();
          let current = document.activeElement;
          if (list.indexOf(current) === -1)
            return;
          if (this.__wrapAround && list.indexOf(current) === 0) {
            return list.slice(-1)[0];
          }
          return list[list.indexOf(current) - 1];
        },
        first() {
          this.focus(this.getFirst());
        },
        last() {
          this.focus(this.getLast());
        },
        next() {
          this.focus(this.getNext());
        },
        previous() {
          this.focus(this.getPrevious());
        },
        prev() {
          return this.previous();
        },
        focus(el2) {
          if (!el2)
            return;
          setTimeout(() => {
            if (!el2.hasAttribute("tabindex"))
              el2.setAttribute("tabindex", "0");
            el2.focus({preventScroll: this._noscroll});
          });
        }
      };
    });
    Alpine.directive("trap", Alpine.skipDuringClone((el, {expression, modifiers}, {effect, evaluateLater, cleanup}) => {
      let evaluator = evaluateLater(expression);
      let oldValue = false;
      let trap = createFocusTrap(el, {
        escapeDeactivates: false,
        allowOutsideClick: true,
        fallbackFocus: () => el,
        initialFocus: el.querySelector("[autofocus]")
      });
      let undoInert = () => {
      };
      let undoDisableScrolling = () => {
      };
      const releaseFocus = () => {
        undoInert();
        undoInert = () => {
        };
        undoDisableScrolling();
        undoDisableScrolling = () => {
        };
        trap.deactivate({
          returnFocus: !modifiers.includes("noreturn")
        });
      };
      effect(() => evaluator((value) => {
        if (oldValue === value)
          return;
        if (value && !oldValue) {
          setTimeout(() => {
            if (modifiers.includes("inert"))
              undoInert = setInert(el);
            if (modifiers.includes("noscroll"))
              undoDisableScrolling = disableScrolling();
            trap.activate();
          });
        }
        if (!value && oldValue) {
          releaseFocus();
        }
        oldValue = !!value;
      }));
      cleanup(releaseFocus);
    }, (el, {expression, modifiers}, {evaluate}) => {
      if (modifiers.includes("inert") && evaluate(expression))
        setInert(el);
    }));
  }
  function setInert(el) {
    let undos = [];
    crawlSiblingsUp(el, (sibling) => {
      let cache = sibling.hasAttribute("aria-hidden");
      sibling.setAttribute("aria-hidden", "true");
      undos.push(() => cache || sibling.removeAttribute("aria-hidden"));
    });
    return () => {
      while (undos.length)
        undos.pop()();
    };
  }
  function crawlSiblingsUp(el, callback) {
    if (el.isSameNode(document.body) || !el.parentNode)
      return;
    Array.from(el.parentNode.children).forEach((sibling) => {
      if (!sibling.isSameNode(el))
        callback(sibling);
      crawlSiblingsUp(el.parentNode, callback);
    });
  }
  function disableScrolling() {
    let overflow = document.documentElement.style.overflow;
    let paddingRight = document.documentElement.style.paddingRight;
    let scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.documentElement.style.overflow = overflow;
      document.documentElement.style.paddingRight = paddingRight;
    };
  }

  // packages/focus/builds/cdn.js
  document.addEventListener("alpine:init", () => {
    window.Alpine.plugin(src_default);
  });
})();
;(() => {
  // packages/collapse/src/index.js
  function src_default(Alpine) {
    Alpine.directive("collapse", collapse);
    collapse.inline = (el, {modifiers}) => {
      if (!modifiers.includes("min"))
        return;
      el._x_doShow = () => {
      };
      el._x_doHide = () => {
      };
    };
    function collapse(el, {modifiers}) {
      let duration = modifierValue(modifiers, "duration", 250) / 1e3;
      let floor = modifierValue(modifiers, "min", 0);
      let fullyHide = !modifiers.includes("min");
      if (!el._x_isShown)
        el.style.height = `${floor}px`;
      if (!el._x_isShown && fullyHide)
        el.hidden = true;
      if (!el._x_isShown)
        el.style.overflow = "hidden";
      let setFunction = (el2, styles) => {
        let revertFunction = Alpine.setStyles(el2, styles);
        return styles.height ? () => {
        } : revertFunction;
      };
      let transitionStyles = {
        transitionProperty: "height",
        transitionDuration: `${duration}s`,
        transitionTimingFunction: "cubic-bezier(0.4, 0.0, 0.2, 1)"
      };
      el._x_transition = {
        in(before = () => {
        }, after = () => {
        }) {
          if (fullyHide)
            el.hidden = false;
          if (fullyHide)
            el.style.display = null;
          let current = el.getBoundingClientRect().height;
          el.style.height = "auto";
          let full = el.getBoundingClientRect().height;
          if (current === full) {
            current = floor;
          }
          Alpine.transition(el, Alpine.setStyles, {
            during: transitionStyles,
            start: {height: current + "px"},
            end: {height: full + "px"}
          }, () => el._x_isShown = true, () => {
            if (el.style.height == `${full}px`) {
              el.style.overflow = null;
            }
          });
        },
        out(before = () => {
        }, after = () => {
        }) {
          let full = el.getBoundingClientRect().height;
          Alpine.transition(el, setFunction, {
            during: transitionStyles,
            start: {height: full + "px"},
            end: {height: floor + "px"}
          }, () => el.style.overflow = "hidden", () => {
            el._x_isShown = false;
            if (el.style.height == `${floor}px` && fullyHide) {
              el.style.display = "none";
              el.hidden = true;
            }
          });
        }
      };
    }
  }
  function modifierValue(modifiers, key, fallback) {
    if (modifiers.indexOf(key) === -1)
      return fallback;
    const rawValue = modifiers[modifiers.indexOf(key) + 1];
    if (!rawValue)
      return fallback;
    if (key === "duration") {
      let match = rawValue.match(/([0-9]+)ms/);
      if (match)
        return match[1];
    }
    if (key === "min") {
      let match = rawValue.match(/([0-9]+)px/);
      if (match)
        return match[1];
    }
    return rawValue;
  }

  // packages/collapse/builds/cdn.js
  document.addEventListener("alpine:init", () => {
    window.Alpine.plugin(src_default);
  });
})();
;(() => {
  // packages/persist/src/index.js
  function src_default(Alpine) {
    let persist = () => {
      let alias;
      let storage = localStorage;
      return Alpine.interceptor((initialValue, getter, setter, path, key) => {
        let lookup = alias || `_x_${path}`;
        let initial = storageHas(lookup, storage) ? storageGet(lookup, storage) : initialValue;
        setter(initial);
        Alpine.effect(() => {
          let value = getter();
          storageSet(lookup, value, storage);
          setter(value);
        });
        return initial;
      }, (func) => {
        func.as = (key) => {
          alias = key;
          return func;
        }, func.using = (target) => {
          storage = target;
          return func;
        };
      });
    };
    Object.defineProperty(Alpine, "$persist", {get: () => persist()});
    Alpine.magic("persist", persist);
  }
  function storageHas(key, storage) {
    return storage.getItem(key) !== null;
  }
  function storageGet(key, storage) {
    return JSON.parse(storage.getItem(key, storage));
  }
  function storageSet(key, value, storage) {
    storage.setItem(key, JSON.stringify(value));
  }

  // packages/persist/builds/cdn.js
  document.addEventListener("alpine:init", () => {
    window.Alpine.plugin(src_default);
  });
})();
;(() => {
  // packages/mask/src/index.js
  function src_default(Alpine) {
    Alpine.directive("mask", (el, {value, expression}, {effect, evaluateLater}) => {
      let templateFn = () => expression;
      let lastInputValue = "";
      if (["function", "dynamic"].includes(value)) {
        let evaluator = evaluateLater(expression);
        effect(() => {
          templateFn = (input) => {
            let result;
            Alpine.dontAutoEvaluateFunctions(() => {
              evaluator((value2) => {
                result = typeof value2 === "function" ? value2(input) : value2;
              }, {scope: {
                $input: input,
                $money: formatMoney.bind({el})
              }});
            });
            return result;
          };
          processInputValue(el);
        });
      } else {
        processInputValue(el);
      }
      el.addEventListener("input", () => processInputValue(el));
      el.addEventListener("blur", () => processInputValue(el, false));
      function processInputValue(el2, shouldRestoreCursor = true) {
        let input = el2.value;
        let template = templateFn(input);
        if (!template || template === "false")
          return false;
        if (lastInputValue.length - el2.value.length === 1) {
          return lastInputValue = el2.value;
        }
        let setInput = () => {
          lastInputValue = el2.value = formatInput(input, template);
        };
        if (shouldRestoreCursor) {
          restoreCursorPosition(el2, template, () => {
            setInput();
          });
        } else {
          setInput();
        }
      }
      function formatInput(input, template) {
        if (input === "")
          return "";
        let strippedDownInput = stripDown(template, input);
        let rebuiltInput = buildUp(template, strippedDownInput);
        return rebuiltInput;
      }
    });
  }
  function restoreCursorPosition(el, template, callback) {
    let cursorPosition = el.selectionStart;
    let unformattedValue = el.value;
    callback();
    let beforeLeftOfCursorBeforeFormatting = unformattedValue.slice(0, cursorPosition);
    let newPosition = buildUp(template, stripDown(template, beforeLeftOfCursorBeforeFormatting)).length;
    el.setSelectionRange(newPosition, newPosition);
  }
  function stripDown(template, input) {
    let inputToBeStripped = input;
    let output = "";
    let regexes = {
      "9": /[0-9]/,
      a: /[a-zA-Z]/,
      "*": /[a-zA-Z0-9]/
    };
    let wildcardTemplate = "";
    for (let i = 0; i < template.length; i++) {
      if (["9", "a", "*"].includes(template[i])) {
        wildcardTemplate += template[i];
        continue;
      }
      for (let j = 0; j < inputToBeStripped.length; j++) {
        if (inputToBeStripped[j] === template[i]) {
          inputToBeStripped = inputToBeStripped.slice(0, j) + inputToBeStripped.slice(j + 1);
          break;
        }
      }
    }
    for (let i = 0; i < wildcardTemplate.length; i++) {
      let found = false;
      for (let j = 0; j < inputToBeStripped.length; j++) {
        if (regexes[wildcardTemplate[i]].test(inputToBeStripped[j])) {
          output += inputToBeStripped[j];
          inputToBeStripped = inputToBeStripped.slice(0, j) + inputToBeStripped.slice(j + 1);
          found = true;
          break;
        }
      }
      if (!found)
        break;
    }
    return output;
  }
  function buildUp(template, input) {
    let clean = Array.from(input);
    let output = "";
    for (let i = 0; i < template.length; i++) {
      if (!["9", "a", "*"].includes(template[i])) {
        output += template[i];
        continue;
      }
      if (clean.length === 0)
        break;
      output += clean.shift();
    }
    return output;
  }
  function formatMoney(input, delimeter = ".", thousands) {
    thousands = delimeter === "," && thousands === void 0 ? "." : ",";
    let addThousands = (input2, thousands2) => {
      let output = "";
      let counter = 0;
      for (let i = input2.length - 1; i >= 0; i--) {
        if (input2[i] === thousands2)
          continue;
        if (counter === 3) {
          output = input2[i] + thousands2 + output;
          counter = 0;
        } else {
          output = input2[i] + output;
        }
        counter++;
      }
      return output;
    };
    let strippedInput = input.replaceAll(new RegExp(`[^0-9\\${delimeter}]`, "g"), "");
    let template = Array.from({length: strippedInput.split(delimeter)[0].length}).fill("9").join("");
    template = addThousands(template, thousands);
    if (input.includes(delimeter))
      template += `${delimeter}99`;
    queueMicrotask(() => {
      if (this.el.value.endsWith(delimeter))
        return;
      if (this.el.value[this.el.selectionStart - 1] === delimeter) {
        this.el.setSelectionRange(this.el.selectionStart - 1, this.el.selectionStart - 1);
      }
    });
    return template;
  }

  // packages/mask/builds/cdn.js
  document.addEventListener("alpine:init", () => {
    window.Alpine.plugin(src_default);
  });
})();
;(() => {
  // packages/intersect/src/index.js
  function src_default(Alpine) {
    Alpine.directive("intersect", (el, {value, expression, modifiers}, {evaluateLater, cleanup}) => {
      let evaluate = evaluateLater(expression);
      let options = {
        rootMargin: getRootMargin(modifiers),
        threshold: getThreshhold(modifiers)
      };
      let observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting === (value === "leave"))
            return;
          evaluate();
          modifiers.includes("once") && observer.disconnect();
        });
      }, options);
      observer.observe(el);
      cleanup(() => {
        observer.disconnect();
      });
    });
  }
  function getThreshhold(modifiers) {
    if (modifiers.includes("full"))
      return 0.99;
    if (modifiers.includes("half"))
      return 0.5;
    if (!modifiers.includes("threshold"))
      return 0;
    let threshold = modifiers[modifiers.indexOf("threshold") + 1];
    if (threshold === "100")
      return 1;
    if (threshold === "0")
      return 0;
    return Number(`.${threshold}`);
  }
  function getLengthValue(rawValue) {
    let match = rawValue.match(/^(-?[0-9]+)(px|%)?$/);
    return match ? match[1] + (match[2] || "px") : void 0;
  }
  function getRootMargin(modifiers) {
    const key = "margin";
    const fallback = "0px 0px 0px 0px";
    const index = modifiers.indexOf(key);
    if (index === -1)
      return fallback;
    let values = [];
    for (let i = 1; i < 5; i++) {
      values.push(getLengthValue(modifiers[index + i] || ""));
    }
    values = values.filter((v) => v !== void 0);
    return values.length ? values.join(" ").trim() : fallback;
  }

  // packages/intersect/builds/cdn.js
  document.addEventListener("alpine:init", () => {
    window.Alpine.plugin(src_default);
  });
})();
;(() => {
  // packages/alpinejs/src/scheduler.js
  var flushPending = false;
  var flushing = false;
  var queue = [];
  function scheduler(callback) {
    queueJob(callback);
  }
  function queueJob(job) {
    if (!queue.includes(job))
      queue.push(job);
    queueFlush();
  }
  function dequeueJob(job) {
    let index = queue.indexOf(job);
    if (index !== -1)
      queue.splice(index, 1);
  }
  function queueFlush() {
    if (!flushing && !flushPending) {
      flushPending = true;
      queueMicrotask(flushJobs);
    }
  }
  function flushJobs() {
    flushPending = false;
    flushing = true;
    for (let i = 0; i < queue.length; i++) {
      queue[i]();
    }
    queue.length = 0;
    flushing = false;
  }

  // packages/alpinejs/src/reactivity.js
  var reactive;
  var effect;
  var release;
  var raw;
  var shouldSchedule = true;
  function disableEffectScheduling(callback) {
    shouldSchedule = false;
    callback();
    shouldSchedule = true;
  }
  function setReactivityEngine(engine) {
    reactive = engine.reactive;
    release = engine.release;
    effect = (callback) => engine.effect(callback, {scheduler: (task) => {
      if (shouldSchedule) {
        scheduler(task);
      } else {
        task();
      }
    }});
    raw = engine.raw;
  }
  function overrideEffect(override) {
    effect = override;
  }
  function elementBoundEffect(el) {
    let cleanup2 = () => {
    };
    let wrappedEffect = (callback) => {
      let effectReference = effect(callback);
      if (!el._x_effects) {
        el._x_effects = new Set();
        el._x_runEffects = () => {
          el._x_effects.forEach((i) => i());
        };
      }
      el._x_effects.add(effectReference);
      cleanup2 = () => {
        if (effectReference === void 0)
          return;
        el._x_effects.delete(effectReference);
        release(effectReference);
      };
      return effectReference;
    };
    return [wrappedEffect, () => {
      cleanup2();
    }];
  }

  // packages/alpinejs/src/mutation.js
  var onAttributeAddeds = [];
  var onElRemoveds = [];
  var onElAddeds = [];
  function onElAdded(callback) {
    onElAddeds.push(callback);
  }
  function onElRemoved(el, callback) {
    if (typeof callback === "function") {
      if (!el._x_cleanups)
        el._x_cleanups = [];
      el._x_cleanups.push(callback);
    } else {
      callback = el;
      onElRemoveds.push(callback);
    }
  }
  function onAttributesAdded(callback) {
    onAttributeAddeds.push(callback);
  }
  function onAttributeRemoved(el, name, callback) {
    if (!el._x_attributeCleanups)
      el._x_attributeCleanups = {};
    if (!el._x_attributeCleanups[name])
      el._x_attributeCleanups[name] = [];
    el._x_attributeCleanups[name].push(callback);
  }
  function cleanupAttributes(el, names) {
    if (!el._x_attributeCleanups)
      return;
    Object.entries(el._x_attributeCleanups).forEach(([name, value]) => {
      if (names === void 0 || names.includes(name)) {
        value.forEach((i) => i());
        delete el._x_attributeCleanups[name];
      }
    });
  }
  var observer = new MutationObserver(onMutate);
  var currentlyObserving = false;
  function startObservingMutations() {
    observer.observe(document, {subtree: true, childList: true, attributes: true, attributeOldValue: true});
    currentlyObserving = true;
  }
  function stopObservingMutations() {
    flushObserver();
    observer.disconnect();
    currentlyObserving = false;
  }
  var recordQueue = [];
  var willProcessRecordQueue = false;
  function flushObserver() {
    recordQueue = recordQueue.concat(observer.takeRecords());
    if (recordQueue.length && !willProcessRecordQueue) {
      willProcessRecordQueue = true;
      queueMicrotask(() => {
        processRecordQueue();
        willProcessRecordQueue = false;
      });
    }
  }
  function processRecordQueue() {
    onMutate(recordQueue);
    recordQueue.length = 0;
  }
  function mutateDom(callback) {
    if (!currentlyObserving)
      return callback();
    stopObservingMutations();
    let result = callback();
    startObservingMutations();
    return result;
  }
  var isCollecting = false;
  var deferredMutations = [];
  function deferMutations() {
    isCollecting = true;
  }
  function flushAndStopDeferringMutations() {
    isCollecting = false;
    onMutate(deferredMutations);
    deferredMutations = [];
  }
  function onMutate(mutations) {
    if (isCollecting) {
      deferredMutations = deferredMutations.concat(mutations);
      return;
    }
    let addedNodes = [];
    let removedNodes = [];
    let addedAttributes = new Map();
    let removedAttributes = new Map();
    for (let i = 0; i < mutations.length; i++) {
      if (mutations[i].target._x_ignoreMutationObserver)
        continue;
      if (mutations[i].type === "childList") {
        mutations[i].addedNodes.forEach((node) => node.nodeType === 1 && addedNodes.push(node));
        mutations[i].removedNodes.forEach((node) => node.nodeType === 1 && removedNodes.push(node));
      }
      if (mutations[i].type === "attributes") {
        let el = mutations[i].target;
        let name = mutations[i].attributeName;
        let oldValue = mutations[i].oldValue;
        let add2 = () => {
          if (!addedAttributes.has(el))
            addedAttributes.set(el, []);
          addedAttributes.get(el).push({name, value: el.getAttribute(name)});
        };
        let remove = () => {
          if (!removedAttributes.has(el))
            removedAttributes.set(el, []);
          removedAttributes.get(el).push(name);
        };
        if (el.hasAttribute(name) && oldValue === null) {
          add2();
        } else if (el.hasAttribute(name)) {
          remove();
          add2();
        } else {
          remove();
        }
      }
    }
    removedAttributes.forEach((attrs, el) => {
      cleanupAttributes(el, attrs);
    });
    addedAttributes.forEach((attrs, el) => {
      onAttributeAddeds.forEach((i) => i(el, attrs));
    });
    for (let node of removedNodes) {
      if (addedNodes.includes(node))
        continue;
      onElRemoveds.forEach((i) => i(node));
      if (node._x_cleanups) {
        while (node._x_cleanups.length)
          node._x_cleanups.pop()();
      }
    }
    addedNodes.forEach((node) => {
      node._x_ignoreSelf = true;
      node._x_ignore = true;
    });
    for (let node of addedNodes) {
      if (removedNodes.includes(node))
        continue;
      if (!node.isConnected)
        continue;
      delete node._x_ignoreSelf;
      delete node._x_ignore;
      onElAddeds.forEach((i) => i(node));
      node._x_ignore = true;
      node._x_ignoreSelf = true;
    }
    addedNodes.forEach((node) => {
      delete node._x_ignoreSelf;
      delete node._x_ignore;
    });
    addedNodes = null;
    removedNodes = null;
    addedAttributes = null;
    removedAttributes = null;
  }

  // packages/alpinejs/src/scope.js
  function scope(node) {
    return mergeProxies(closestDataStack(node));
  }
  function addScopeToNode(node, data2, referenceNode) {
    node._x_dataStack = [data2, ...closestDataStack(referenceNode || node)];
    return () => {
      node._x_dataStack = node._x_dataStack.filter((i) => i !== data2);
    };
  }
  function refreshScope(element, scope2) {
    let existingScope = element._x_dataStack[0];
    Object.entries(scope2).forEach(([key, value]) => {
      existingScope[key] = value;
    });
  }
  function closestDataStack(node) {
    if (node._x_dataStack)
      return node._x_dataStack;
    if (typeof ShadowRoot === "function" && node instanceof ShadowRoot) {
      return closestDataStack(node.host);
    }
    if (!node.parentNode) {
      return [];
    }
    return closestDataStack(node.parentNode);
  }
  function mergeProxies(objects) {
    let thisProxy = new Proxy({}, {
      ownKeys: () => {
        return Array.from(new Set(objects.flatMap((i) => Object.keys(i))));
      },
      has: (target, name) => {
        return objects.some((obj) => obj.hasOwnProperty(name));
      },
      get: (target, name) => {
        return (objects.find((obj) => {
          if (obj.hasOwnProperty(name)) {
            let descriptor = Object.getOwnPropertyDescriptor(obj, name);
            if (descriptor.get && descriptor.get._x_alreadyBound || descriptor.set && descriptor.set._x_alreadyBound) {
              return true;
            }
            if ((descriptor.get || descriptor.set) && descriptor.enumerable) {
              let getter = descriptor.get;
              let setter = descriptor.set;
              let property = descriptor;
              getter = getter && getter.bind(thisProxy);
              setter = setter && setter.bind(thisProxy);
              if (getter)
                getter._x_alreadyBound = true;
              if (setter)
                setter._x_alreadyBound = true;
              Object.defineProperty(obj, name, {
                ...property,
                get: getter,
                set: setter
              });
            }
            return true;
          }
          return false;
        }) || {})[name];
      },
      set: (target, name, value) => {
        let closestObjectWithKey = objects.find((obj) => obj.hasOwnProperty(name));
        if (closestObjectWithKey) {
          closestObjectWithKey[name] = value;
        } else {
          objects[objects.length - 1][name] = value;
        }
        return true;
      }
    });
    return thisProxy;
  }

  // packages/alpinejs/src/interceptor.js
  function initInterceptors(data2) {
    let isObject2 = (val) => typeof val === "object" && !Array.isArray(val) && val !== null;
    let recurse = (obj, basePath = "") => {
      Object.entries(Object.getOwnPropertyDescriptors(obj)).forEach(([key, {value, enumerable}]) => {
        if (enumerable === false || value === void 0)
          return;
        let path = basePath === "" ? key : `${basePath}.${key}`;
        if (typeof value === "object" && value !== null && value._x_interceptor) {
          obj[key] = value.initialize(data2, path, key);
        } else {
          if (isObject2(value) && value !== obj && !(value instanceof Element)) {
            recurse(value, path);
          }
        }
      });
    };
    return recurse(data2);
  }
  function interceptor(callback, mutateObj = () => {
  }) {
    let obj = {
      initialValue: void 0,
      _x_interceptor: true,
      initialize(data2, path, key) {
        return callback(this.initialValue, () => get(data2, path), (value) => set(data2, path, value), path, key);
      }
    };
    mutateObj(obj);
    return (initialValue) => {
      if (typeof initialValue === "object" && initialValue !== null && initialValue._x_interceptor) {
        let initialize = obj.initialize.bind(obj);
        obj.initialize = (data2, path, key) => {
          let innerValue = initialValue.initialize(data2, path, key);
          obj.initialValue = innerValue;
          return initialize(data2, path, key);
        };
      } else {
        obj.initialValue = initialValue;
      }
      return obj;
    };
  }
  function get(obj, path) {
    return path.split(".").reduce((carry, segment) => carry[segment], obj);
  }
  function set(obj, path, value) {
    if (typeof path === "string")
      path = path.split(".");
    if (path.length === 1)
      obj[path[0]] = value;
    else if (path.length === 0)
      throw error;
    else {
      if (obj[path[0]])
        return set(obj[path[0]], path.slice(1), value);
      else {
        obj[path[0]] = {};
        return set(obj[path[0]], path.slice(1), value);
      }
    }
  }

  // packages/alpinejs/src/magics.js
  var magics = {};
  function magic(name, callback) {
    magics[name] = callback;
  }
  function injectMagics(obj, el) {
    Object.entries(magics).forEach(([name, callback]) => {
      Object.defineProperty(obj, `$${name}`, {
        get() {
          let [utilities, cleanup2] = getElementBoundUtilities(el);
          utilities = {interceptor, ...utilities};
          onElRemoved(el, cleanup2);
          return callback(el, utilities);
        },
        enumerable: false
      });
    });
    return obj;
  }

  // packages/alpinejs/src/utils/error.js
  function tryCatch(el, expression, callback, ...args) {
    try {
      return callback(...args);
    } catch (e) {
      handleError(e, el, expression);
    }
  }
  function handleError(error2, el, expression = void 0) {
    Object.assign(error2, {el, expression});
    console.warn(`Alpine Expression Error: ${error2.message}

${expression ? 'Expression: "' + expression + '"\n\n' : ""}`, el);
    setTimeout(() => {
      throw error2;
    }, 0);
  }

  // packages/alpinejs/src/evaluator.js
  var shouldAutoEvaluateFunctions = true;
  function dontAutoEvaluateFunctions(callback) {
    let cache = shouldAutoEvaluateFunctions;
    shouldAutoEvaluateFunctions = false;
    callback();
    shouldAutoEvaluateFunctions = cache;
  }
  function evaluate(el, expression, extras = {}) {
    let result;
    evaluateLater(el, expression)((value) => result = value, extras);
    return result;
  }
  function evaluateLater(...args) {
    return theEvaluatorFunction(...args);
  }
  var theEvaluatorFunction = normalEvaluator;
  function setEvaluator(newEvaluator) {
    theEvaluatorFunction = newEvaluator;
  }
  function normalEvaluator(el, expression) {
    let overriddenMagics = {};
    injectMagics(overriddenMagics, el);
    let dataStack = [overriddenMagics, ...closestDataStack(el)];
    if (typeof expression === "function") {
      return generateEvaluatorFromFunction(dataStack, expression);
    }
    let evaluator = generateEvaluatorFromString(dataStack, expression, el);
    return tryCatch.bind(null, el, expression, evaluator);
  }
  function generateEvaluatorFromFunction(dataStack, func) {
    return (receiver = () => {
    }, {scope: scope2 = {}, params = []} = {}) => {
      let result = func.apply(mergeProxies([scope2, ...dataStack]), params);
      runIfTypeOfFunction(receiver, result);
    };
  }
  var evaluatorMemo = {};
  function generateFunctionFromString(expression, el) {
    if (evaluatorMemo[expression]) {
      return evaluatorMemo[expression];
    }
    let AsyncFunction = Object.getPrototypeOf(async function() {
    }).constructor;
    let rightSideSafeExpression = /^[\n\s]*if.*\(.*\)/.test(expression) || /^(let|const)\s/.test(expression) ? `(() => { ${expression} })()` : expression;
    const safeAsyncFunction = () => {
      try {
        return new AsyncFunction(["__self", "scope"], `with (scope) { __self.result = ${rightSideSafeExpression} }; __self.finished = true; return __self.result;`);
      } catch (error2) {
        handleError(error2, el, expression);
        return Promise.resolve();
      }
    };
    let func = safeAsyncFunction();
    evaluatorMemo[expression] = func;
    return func;
  }
  function generateEvaluatorFromString(dataStack, expression, el) {
    let func = generateFunctionFromString(expression, el);
    return (receiver = () => {
    }, {scope: scope2 = {}, params = []} = {}) => {
      func.result = void 0;
      func.finished = false;
      let completeScope = mergeProxies([scope2, ...dataStack]);
      if (typeof func === "function") {
        let promise = func(func, completeScope).catch((error2) => handleError(error2, el, expression));
        if (func.finished) {
          runIfTypeOfFunction(receiver, func.result, completeScope, params, el);
          func.result = void 0;
        } else {
          promise.then((result) => {
            runIfTypeOfFunction(receiver, result, completeScope, params, el);
          }).catch((error2) => handleError(error2, el, expression)).finally(() => func.result = void 0);
        }
      }
    };
  }
  function runIfTypeOfFunction(receiver, value, scope2, params, el) {
    if (shouldAutoEvaluateFunctions && typeof value === "function") {
      let result = value.apply(scope2, params);
      if (result instanceof Promise) {
        result.then((i) => runIfTypeOfFunction(receiver, i, scope2, params)).catch((error2) => handleError(error2, el, value));
      } else {
        receiver(result);
      }
    } else {
      receiver(value);
    }
  }

  // packages/alpinejs/src/directives.js
  var prefixAsString = "x-";
  function prefix(subject = "") {
    return prefixAsString + subject;
  }
  function setPrefix(newPrefix) {
    prefixAsString = newPrefix;
  }
  var directiveHandlers = {};
  function directive(name, callback) {
    directiveHandlers[name] = callback;
  }
  function directives(el, attributes, originalAttributeOverride) {
    attributes = Array.from(attributes);
    if (el._x_virtualDirectives) {
      let vAttributes = Object.entries(el._x_virtualDirectives).map(([name, value]) => ({name, value}));
      let staticAttributes = attributesOnly(vAttributes);
      vAttributes = vAttributes.map((attribute) => {
        if (staticAttributes.find((attr) => attr.name === attribute.name)) {
          return {
            name: `x-bind:${attribute.name}`,
            value: `"${attribute.value}"`
          };
        }
        return attribute;
      });
      attributes = attributes.concat(vAttributes);
    }
    let transformedAttributeMap = {};
    let directives2 = attributes.map(toTransformedAttributes((newName, oldName) => transformedAttributeMap[newName] = oldName)).filter(outNonAlpineAttributes).map(toParsedDirectives(transformedAttributeMap, originalAttributeOverride)).sort(byPriority);
    return directives2.map((directive2) => {
      return getDirectiveHandler(el, directive2);
    });
  }
  function attributesOnly(attributes) {
    return Array.from(attributes).map(toTransformedAttributes()).filter((attr) => !outNonAlpineAttributes(attr));
  }
  var isDeferringHandlers = false;
  var directiveHandlerStacks = new Map();
  var currentHandlerStackKey = Symbol();
  function deferHandlingDirectives(callback) {
    isDeferringHandlers = true;
    let key = Symbol();
    currentHandlerStackKey = key;
    directiveHandlerStacks.set(key, []);
    let flushHandlers = () => {
      while (directiveHandlerStacks.get(key).length)
        directiveHandlerStacks.get(key).shift()();
      directiveHandlerStacks.delete(key);
    };
    let stopDeferring = () => {
      isDeferringHandlers = false;
      flushHandlers();
    };
    callback(flushHandlers);
    stopDeferring();
  }
  function getElementBoundUtilities(el) {
    let cleanups = [];
    let cleanup2 = (callback) => cleanups.push(callback);
    let [effect3, cleanupEffect] = elementBoundEffect(el);
    cleanups.push(cleanupEffect);
    let utilities = {
      Alpine: alpine_default,
      effect: effect3,
      cleanup: cleanup2,
      evaluateLater: evaluateLater.bind(evaluateLater, el),
      evaluate: evaluate.bind(evaluate, el)
    };
    let doCleanup = () => cleanups.forEach((i) => i());
    return [utilities, doCleanup];
  }
  function getDirectiveHandler(el, directive2) {
    let noop = () => {
    };
    let handler3 = directiveHandlers[directive2.type] || noop;
    let [utilities, cleanup2] = getElementBoundUtilities(el);
    onAttributeRemoved(el, directive2.original, cleanup2);
    let fullHandler = () => {
      if (el._x_ignore || el._x_ignoreSelf)
        return;
      handler3.inline && handler3.inline(el, directive2, utilities);
      handler3 = handler3.bind(handler3, el, directive2, utilities);
      isDeferringHandlers ? directiveHandlerStacks.get(currentHandlerStackKey).push(handler3) : handler3();
    };
    fullHandler.runCleanups = cleanup2;
    return fullHandler;
  }
  var startingWith = (subject, replacement) => ({name, value}) => {
    if (name.startsWith(subject))
      name = name.replace(subject, replacement);
    return {name, value};
  };
  var into = (i) => i;
  function toTransformedAttributes(callback = () => {
  }) {
    return ({name, value}) => {
      let {name: newName, value: newValue} = attributeTransformers.reduce((carry, transform) => {
        return transform(carry);
      }, {name, value});
      if (newName !== name)
        callback(newName, name);
      return {name: newName, value: newValue};
    };
  }
  var attributeTransformers = [];
  function mapAttributes(callback) {
    attributeTransformers.push(callback);
  }
  function outNonAlpineAttributes({name}) {
    return alpineAttributeRegex().test(name);
  }
  var alpineAttributeRegex = () => new RegExp(`^${prefixAsString}([^:^.]+)\\b`);
  function toParsedDirectives(transformedAttributeMap, originalAttributeOverride) {
    return ({name, value}) => {
      let typeMatch = name.match(alpineAttributeRegex());
      let valueMatch = name.match(/:([a-zA-Z0-9\-:]+)/);
      let modifiers = name.match(/\.[^.\]]+(?=[^\]]*$)/g) || [];
      let original = originalAttributeOverride || transformedAttributeMap[name] || name;
      return {
        type: typeMatch ? typeMatch[1] : null,
        value: valueMatch ? valueMatch[1] : null,
        modifiers: modifiers.map((i) => i.replace(".", "")),
        expression: value,
        original
      };
    };
  }
  var DEFAULT = "DEFAULT";
  var directiveOrder = [
    "ignore",
    "ref",
    "data",
    "id",
    "bind",
    "init",
    "for",
    "mask",
    "model",
    "modelable",
    "transition",
    "show",
    "if",
    DEFAULT,
    "teleport"
  ];
  function byPriority(a, b) {
    let typeA = directiveOrder.indexOf(a.type) === -1 ? DEFAULT : a.type;
    let typeB = directiveOrder.indexOf(b.type) === -1 ? DEFAULT : b.type;
    return directiveOrder.indexOf(typeA) - directiveOrder.indexOf(typeB);
  }

  // packages/alpinejs/src/utils/dispatch.js
  function dispatch(el, name, detail = {}) {
    el.dispatchEvent(new CustomEvent(name, {
      detail,
      bubbles: true,
      composed: true,
      cancelable: true
    }));
  }

  // packages/alpinejs/src/nextTick.js
  var tickStack = [];
  var isHolding = false;
  function nextTick(callback = () => {
  }) {
    queueMicrotask(() => {
      isHolding || setTimeout(() => {
        releaseNextTicks();
      });
    });
    return new Promise((res) => {
      tickStack.push(() => {
        callback();
        res();
      });
    });
  }
  function releaseNextTicks() {
    isHolding = false;
    while (tickStack.length)
      tickStack.shift()();
  }
  function holdNextTicks() {
    isHolding = true;
  }

  // packages/alpinejs/src/utils/walk.js
  function walk(el, callback) {
    if (typeof ShadowRoot === "function" && el instanceof ShadowRoot) {
      Array.from(el.children).forEach((el2) => walk(el2, callback));
      return;
    }
    let skip = false;
    callback(el, () => skip = true);
    if (skip)
      return;
    let node = el.firstElementChild;
    while (node) {
      walk(node, callback, false);
      node = node.nextElementSibling;
    }
  }

  // packages/alpinejs/src/utils/warn.js
  function warn(message, ...args) {
    console.warn(`Alpine Warning: ${message}`, ...args);
  }

  // packages/alpinejs/src/lifecycle.js
  function start() {
    if (!document.body)
      warn("Unable to initialize. Trying to load Alpine before `<body>` is available. Did you forget to add `defer` in Alpine's `<script>` tag?");
    dispatch(document, "alpine:init");
    dispatch(document, "alpine:initializing");
    startObservingMutations();
    onElAdded((el) => initTree(el, walk));
    onElRemoved((el) => destroyTree(el));
    onAttributesAdded((el, attrs) => {
      directives(el, attrs).forEach((handle) => handle());
    });
    let outNestedComponents = (el) => !closestRoot(el.parentElement, true);
    Array.from(document.querySelectorAll(allSelectors())).filter(outNestedComponents).forEach((el) => {
      initTree(el);
    });
    dispatch(document, "alpine:initialized");
  }
  var rootSelectorCallbacks = [];
  var initSelectorCallbacks = [];
  function rootSelectors() {
    return rootSelectorCallbacks.map((fn) => fn());
  }
  function allSelectors() {
    return rootSelectorCallbacks.concat(initSelectorCallbacks).map((fn) => fn());
  }
  function addRootSelector(selectorCallback) {
    rootSelectorCallbacks.push(selectorCallback);
  }
  function addInitSelector(selectorCallback) {
    initSelectorCallbacks.push(selectorCallback);
  }
  function closestRoot(el, includeInitSelectors = false) {
    return findClosest(el, (element) => {
      const selectors = includeInitSelectors ? allSelectors() : rootSelectors();
      if (selectors.some((selector) => element.matches(selector)))
        return true;
    });
  }
  function findClosest(el, callback) {
    if (!el)
      return;
    if (callback(el))
      return el;
    if (el._x_teleportBack)
      el = el._x_teleportBack;
    if (!el.parentElement)
      return;
    return findClosest(el.parentElement, callback);
  }
  function isRoot(el) {
    return rootSelectors().some((selector) => el.matches(selector));
  }
  function initTree(el, walker = walk) {
    deferHandlingDirectives(() => {
      walker(el, (el2, skip) => {
        directives(el2, el2.attributes).forEach((handle) => handle());
        el2._x_ignore && skip();
      });
    });
  }
  function destroyTree(root) {
    walk(root, (el) => cleanupAttributes(el));
  }

  // packages/alpinejs/src/utils/classes.js
  function setClasses(el, value) {
    if (Array.isArray(value)) {
      return setClassesFromString(el, value.join(" "));
    } else if (typeof value === "object" && value !== null) {
      return setClassesFromObject(el, value);
    } else if (typeof value === "function") {
      return setClasses(el, value());
    }
    return setClassesFromString(el, value);
  }
  function setClassesFromString(el, classString) {
    let split = (classString2) => classString2.split(" ").filter(Boolean);
    let missingClasses = (classString2) => classString2.split(" ").filter((i) => !el.classList.contains(i)).filter(Boolean);
    let addClassesAndReturnUndo = (classes) => {
      el.classList.add(...classes);
      return () => {
        el.classList.remove(...classes);
      };
    };
    classString = classString === true ? classString = "" : classString || "";
    return addClassesAndReturnUndo(missingClasses(classString));
  }
  function setClassesFromObject(el, classObject) {
    let split = (classString) => classString.split(" ").filter(Boolean);
    let forAdd = Object.entries(classObject).flatMap(([classString, bool]) => bool ? split(classString) : false).filter(Boolean);
    let forRemove = Object.entries(classObject).flatMap(([classString, bool]) => !bool ? split(classString) : false).filter(Boolean);
    let added = [];
    let removed = [];
    forRemove.forEach((i) => {
      if (el.classList.contains(i)) {
        el.classList.remove(i);
        removed.push(i);
      }
    });
    forAdd.forEach((i) => {
      if (!el.classList.contains(i)) {
        el.classList.add(i);
        added.push(i);
      }
    });
    return () => {
      removed.forEach((i) => el.classList.add(i));
      added.forEach((i) => el.classList.remove(i));
    };
  }

  // packages/alpinejs/src/utils/styles.js
  function setStyles(el, value) {
    if (typeof value === "object" && value !== null) {
      return setStylesFromObject(el, value);
    }
    return setStylesFromString(el, value);
  }
  function setStylesFromObject(el, value) {
    let previousStyles = {};
    Object.entries(value).forEach(([key, value2]) => {
      previousStyles[key] = el.style[key];
      if (!key.startsWith("--")) {
        key = kebabCase(key);
      }
      el.style.setProperty(key, value2);
    });
    setTimeout(() => {
      if (el.style.length === 0) {
        el.removeAttribute("style");
      }
    });
    return () => {
      setStyles(el, previousStyles);
    };
  }
  function setStylesFromString(el, value) {
    let cache = el.getAttribute("style", value);
    el.setAttribute("style", value);
    return () => {
      el.setAttribute("style", cache || "");
    };
  }
  function kebabCase(subject) {
    return subject.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  }

  // packages/alpinejs/src/utils/once.js
  function once(callback, fallback = () => {
  }) {
    let called = false;
    return function() {
      if (!called) {
        called = true;
        callback.apply(this, arguments);
      } else {
        fallback.apply(this, arguments);
      }
    };
  }

  // packages/alpinejs/src/directives/x-transition.js
  directive("transition", (el, {value, modifiers, expression}, {evaluate: evaluate2}) => {
    if (typeof expression === "function")
      expression = evaluate2(expression);
    if (!expression) {
      registerTransitionsFromHelper(el, modifiers, value);
    } else {
      registerTransitionsFromClassString(el, expression, value);
    }
  });
  function registerTransitionsFromClassString(el, classString, stage) {
    registerTransitionObject(el, setClasses, "");
    let directiveStorageMap = {
      enter: (classes) => {
        el._x_transition.enter.during = classes;
      },
      "enter-start": (classes) => {
        el._x_transition.enter.start = classes;
      },
      "enter-end": (classes) => {
        el._x_transition.enter.end = classes;
      },
      leave: (classes) => {
        el._x_transition.leave.during = classes;
      },
      "leave-start": (classes) => {
        el._x_transition.leave.start = classes;
      },
      "leave-end": (classes) => {
        el._x_transition.leave.end = classes;
      }
    };
    directiveStorageMap[stage](classString);
  }
  function registerTransitionsFromHelper(el, modifiers, stage) {
    registerTransitionObject(el, setStyles);
    let doesntSpecify = !modifiers.includes("in") && !modifiers.includes("out") && !stage;
    let transitioningIn = doesntSpecify || modifiers.includes("in") || ["enter"].includes(stage);
    let transitioningOut = doesntSpecify || modifiers.includes("out") || ["leave"].includes(stage);
    if (modifiers.includes("in") && !doesntSpecify) {
      modifiers = modifiers.filter((i, index) => index < modifiers.indexOf("out"));
    }
    if (modifiers.includes("out") && !doesntSpecify) {
      modifiers = modifiers.filter((i, index) => index > modifiers.indexOf("out"));
    }
    let wantsAll = !modifiers.includes("opacity") && !modifiers.includes("scale");
    let wantsOpacity = wantsAll || modifiers.includes("opacity");
    let wantsScale = wantsAll || modifiers.includes("scale");
    let opacityValue = wantsOpacity ? 0 : 1;
    let scaleValue = wantsScale ? modifierValue(modifiers, "scale", 95) / 100 : 1;
    let delay = modifierValue(modifiers, "delay", 0);
    let origin = modifierValue(modifiers, "origin", "center");
    let property = "opacity, transform";
    let durationIn = modifierValue(modifiers, "duration", 150) / 1e3;
    let durationOut = modifierValue(modifiers, "duration", 75) / 1e3;
    let easing = `cubic-bezier(0.4, 0.0, 0.2, 1)`;
    if (transitioningIn) {
      el._x_transition.enter.during = {
        transformOrigin: origin,
        transitionDelay: delay,
        transitionProperty: property,
        transitionDuration: `${durationIn}s`,
        transitionTimingFunction: easing
      };
      el._x_transition.enter.start = {
        opacity: opacityValue,
        transform: `scale(${scaleValue})`
      };
      el._x_transition.enter.end = {
        opacity: 1,
        transform: `scale(1)`
      };
    }
    if (transitioningOut) {
      el._x_transition.leave.during = {
        transformOrigin: origin,
        transitionDelay: delay,
        transitionProperty: property,
        transitionDuration: `${durationOut}s`,
        transitionTimingFunction: easing
      };
      el._x_transition.leave.start = {
        opacity: 1,
        transform: `scale(1)`
      };
      el._x_transition.leave.end = {
        opacity: opacityValue,
        transform: `scale(${scaleValue})`
      };
    }
  }
  function registerTransitionObject(el, setFunction, defaultValue = {}) {
    if (!el._x_transition)
      el._x_transition = {
        enter: {during: defaultValue, start: defaultValue, end: defaultValue},
        leave: {during: defaultValue, start: defaultValue, end: defaultValue},
        in(before = () => {
        }, after = () => {
        }) {
          transition(el, setFunction, {
            during: this.enter.during,
            start: this.enter.start,
            end: this.enter.end
          }, before, after);
        },
        out(before = () => {
        }, after = () => {
        }) {
          transition(el, setFunction, {
            during: this.leave.during,
            start: this.leave.start,
            end: this.leave.end
          }, before, after);
        }
      };
  }
  window.Element.prototype._x_toggleAndCascadeWithTransitions = function(el, value, show, hide) {
    const nextTick2 = document.visibilityState === "visible" ? requestAnimationFrame : setTimeout;
    let clickAwayCompatibleShow = () => nextTick2(show);
    if (value) {
      if (el._x_transition && (el._x_transition.enter || el._x_transition.leave)) {
        el._x_transition.enter && (Object.entries(el._x_transition.enter.during).length || Object.entries(el._x_transition.enter.start).length || Object.entries(el._x_transition.enter.end).length) ? el._x_transition.in(show) : clickAwayCompatibleShow();
      } else {
        el._x_transition ? el._x_transition.in(show) : clickAwayCompatibleShow();
      }
      return;
    }
    el._x_hidePromise = el._x_transition ? new Promise((resolve, reject) => {
      el._x_transition.out(() => {
      }, () => resolve(hide));
      el._x_transitioning.beforeCancel(() => reject({isFromCancelledTransition: true}));
    }) : Promise.resolve(hide);
    queueMicrotask(() => {
      let closest = closestHide(el);
      if (closest) {
        if (!closest._x_hideChildren)
          closest._x_hideChildren = [];
        closest._x_hideChildren.push(el);
      } else {
        nextTick2(() => {
          let hideAfterChildren = (el2) => {
            let carry = Promise.all([
              el2._x_hidePromise,
              ...(el2._x_hideChildren || []).map(hideAfterChildren)
            ]).then(([i]) => i());
            delete el2._x_hidePromise;
            delete el2._x_hideChildren;
            return carry;
          };
          hideAfterChildren(el).catch((e) => {
            if (!e.isFromCancelledTransition)
              throw e;
          });
        });
      }
    });
  };
  function closestHide(el) {
    let parent = el.parentNode;
    if (!parent)
      return;
    return parent._x_hidePromise ? parent : closestHide(parent);
  }
  function transition(el, setFunction, {during, start: start2, end} = {}, before = () => {
  }, after = () => {
  }) {
    if (el._x_transitioning)
      el._x_transitioning.cancel();
    if (Object.keys(during).length === 0 && Object.keys(start2).length === 0 && Object.keys(end).length === 0) {
      before();
      after();
      return;
    }
    let undoStart, undoDuring, undoEnd;
    performTransition(el, {
      start() {
        undoStart = setFunction(el, start2);
      },
      during() {
        undoDuring = setFunction(el, during);
      },
      before,
      end() {
        undoStart();
        undoEnd = setFunction(el, end);
      },
      after,
      cleanup() {
        undoDuring();
        undoEnd();
      }
    });
  }
  function performTransition(el, stages) {
    let interrupted, reachedBefore, reachedEnd;
    let finish = once(() => {
      mutateDom(() => {
        interrupted = true;
        if (!reachedBefore)
          stages.before();
        if (!reachedEnd) {
          stages.end();
          releaseNextTicks();
        }
        stages.after();
        if (el.isConnected)
          stages.cleanup();
        delete el._x_transitioning;
      });
    });
    el._x_transitioning = {
      beforeCancels: [],
      beforeCancel(callback) {
        this.beforeCancels.push(callback);
      },
      cancel: once(function() {
        while (this.beforeCancels.length) {
          this.beforeCancels.shift()();
        }
        ;
        finish();
      }),
      finish
    };
    mutateDom(() => {
      stages.start();
      stages.during();
    });
    holdNextTicks();
    requestAnimationFrame(() => {
      if (interrupted)
        return;
      let duration = Number(getComputedStyle(el).transitionDuration.replace(/,.*/, "").replace("s", "")) * 1e3;
      let delay = Number(getComputedStyle(el).transitionDelay.replace(/,.*/, "").replace("s", "")) * 1e3;
      if (duration === 0)
        duration = Number(getComputedStyle(el).animationDuration.replace("s", "")) * 1e3;
      mutateDom(() => {
        stages.before();
      });
      reachedBefore = true;
      requestAnimationFrame(() => {
        if (interrupted)
          return;
        mutateDom(() => {
          stages.end();
        });
        releaseNextTicks();
        setTimeout(el._x_transitioning.finish, duration + delay);
        reachedEnd = true;
      });
    });
  }
  function modifierValue(modifiers, key, fallback) {
    if (modifiers.indexOf(key) === -1)
      return fallback;
    const rawValue = modifiers[modifiers.indexOf(key) + 1];
    if (!rawValue)
      return fallback;
    if (key === "scale") {
      if (isNaN(rawValue))
        return fallback;
    }
    if (key === "duration") {
      let match = rawValue.match(/([0-9]+)ms/);
      if (match)
        return match[1];
    }
    if (key === "origin") {
      if (["top", "right", "left", "center", "bottom"].includes(modifiers[modifiers.indexOf(key) + 2])) {
        return [rawValue, modifiers[modifiers.indexOf(key) + 2]].join(" ");
      }
    }
    return rawValue;
  }

  // packages/alpinejs/src/clone.js
  var isCloning = false;
  function skipDuringClone(callback, fallback = () => {
  }) {
    return (...args) => isCloning ? fallback(...args) : callback(...args);
  }
  function clone(oldEl, newEl) {
    if (!newEl._x_dataStack)
      newEl._x_dataStack = oldEl._x_dataStack;
    isCloning = true;
    dontRegisterReactiveSideEffects(() => {
      cloneTree(newEl);
    });
    isCloning = false;
  }
  function cloneTree(el) {
    let hasRunThroughFirstEl = false;
    let shallowWalker = (el2, callback) => {
      walk(el2, (el3, skip) => {
        if (hasRunThroughFirstEl && isRoot(el3))
          return skip();
        hasRunThroughFirstEl = true;
        callback(el3, skip);
      });
    };
    initTree(el, shallowWalker);
  }
  function dontRegisterReactiveSideEffects(callback) {
    let cache = effect;
    overrideEffect((callback2, el) => {
      let storedEffect = cache(callback2);
      release(storedEffect);
      return () => {
      };
    });
    callback();
    overrideEffect(cache);
  }

  // packages/alpinejs/src/utils/bind.js
  function bind(el, name, value, modifiers = []) {
    if (!el._x_bindings)
      el._x_bindings = reactive({});
    el._x_bindings[name] = value;
    name = modifiers.includes("camel") ? camelCase(name) : name;
    switch (name) {
      case "value":
        bindInputValue(el, value);
        break;
      case "style":
        bindStyles(el, value);
        break;
      case "class":
        bindClasses(el, value);
        break;
      default:
        bindAttribute(el, name, value);
        break;
    }
  }
  function bindInputValue(el, value) {
    if (el.type === "radio") {
      if (el.attributes.value === void 0) {
        el.value = value;
      }
      if (window.fromModel) {
        el.checked = checkedAttrLooseCompare(el.value, value);
      }
    } else if (el.type === "checkbox") {
      if (Number.isInteger(value)) {
        el.value = value;
      } else if (!Number.isInteger(value) && !Array.isArray(value) && typeof value !== "boolean" && ![null, void 0].includes(value)) {
        el.value = String(value);
      } else {
        if (Array.isArray(value)) {
          el.checked = value.some((val) => checkedAttrLooseCompare(val, el.value));
        } else {
          el.checked = !!value;
        }
      }
    } else if (el.tagName === "SELECT") {
      updateSelect(el, value);
    } else {
      if (el.value === value)
        return;
      el.value = value;
    }
  }
  function bindClasses(el, value) {
    if (el._x_undoAddedClasses)
      el._x_undoAddedClasses();
    el._x_undoAddedClasses = setClasses(el, value);
  }
  function bindStyles(el, value) {
    if (el._x_undoAddedStyles)
      el._x_undoAddedStyles();
    el._x_undoAddedStyles = setStyles(el, value);
  }
  function bindAttribute(el, name, value) {
    if ([null, void 0, false].includes(value) && attributeShouldntBePreservedIfFalsy(name)) {
      el.removeAttribute(name);
    } else {
      if (isBooleanAttr(name))
        value = name;
      setIfChanged(el, name, value);
    }
  }
  function setIfChanged(el, attrName, value) {
    if (el.getAttribute(attrName) != value) {
      el.setAttribute(attrName, value);
    }
  }
  function updateSelect(el, value) {
    const arrayWrappedValue = [].concat(value).map((value2) => {
      return value2 + "";
    });
    Array.from(el.options).forEach((option) => {
      option.selected = arrayWrappedValue.includes(option.value);
    });
  }
  function camelCase(subject) {
    return subject.toLowerCase().replace(/-(\w)/g, (match, char) => char.toUpperCase());
  }
  function checkedAttrLooseCompare(valueA, valueB) {
    return valueA == valueB;
  }
  function isBooleanAttr(attrName) {
    const booleanAttributes = [
      "disabled",
      "checked",
      "required",
      "readonly",
      "hidden",
      "open",
      "selected",
      "autofocus",
      "itemscope",
      "multiple",
      "novalidate",
      "allowfullscreen",
      "allowpaymentrequest",
      "formnovalidate",
      "autoplay",
      "controls",
      "loop",
      "muted",
      "playsinline",
      "default",
      "ismap",
      "reversed",
      "async",
      "defer",
      "nomodule"
    ];
    return booleanAttributes.includes(attrName);
  }
  function attributeShouldntBePreservedIfFalsy(name) {
    return !["aria-pressed", "aria-checked", "aria-expanded", "aria-selected"].includes(name);
  }
  function getBinding(el, name, fallback) {
    if (el._x_bindings && el._x_bindings[name] !== void 0)
      return el._x_bindings[name];
    let attr = el.getAttribute(name);
    if (attr === null)
      return typeof fallback === "function" ? fallback() : fallback;
    if (isBooleanAttr(name)) {
      return !![name, "true"].includes(attr);
    }
    if (attr === "")
      return true;
    return attr;
  }

  // packages/alpinejs/src/utils/debounce.js
  function debounce(func, wait) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // packages/alpinejs/src/utils/throttle.js
  function throttle(func, limit) {
    let inThrottle;
    return function() {
      let context = this, args = arguments;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // packages/alpinejs/src/plugin.js
  function plugin(callback) {
    callback(alpine_default);
  }

  // packages/alpinejs/src/store.js
  var stores = {};
  var isReactive = false;
  function store(name, value) {
    if (!isReactive) {
      stores = reactive(stores);
      isReactive = true;
    }
    if (value === void 0) {
      return stores[name];
    }
    stores[name] = value;
    if (typeof value === "object" && value !== null && value.hasOwnProperty("init") && typeof value.init === "function") {
      stores[name].init();
    }
    initInterceptors(stores[name]);
  }
  function getStores() {
    return stores;
  }

  // packages/alpinejs/src/binds.js
  var binds = {};
  function bind2(name, bindings) {
    let getBindings = typeof bindings !== "function" ? () => bindings : bindings;
    if (name instanceof Element) {
      applyBindingsObject(name, getBindings());
    } else {
      binds[name] = getBindings;
    }
  }
  function injectBindingProviders(obj) {
    Object.entries(binds).forEach(([name, callback]) => {
      Object.defineProperty(obj, name, {
        get() {
          return (...args) => {
            return callback(...args);
          };
        }
      });
    });
    return obj;
  }
  function applyBindingsObject(el, obj, original) {
    let cleanupRunners = [];
    while (cleanupRunners.length)
      cleanupRunners.pop()();
    let attributes = Object.entries(obj).map(([name, value]) => ({name, value}));
    let staticAttributes = attributesOnly(attributes);
    attributes = attributes.map((attribute) => {
      if (staticAttributes.find((attr) => attr.name === attribute.name)) {
        return {
          name: `x-bind:${attribute.name}`,
          value: `"${attribute.value}"`
        };
      }
      return attribute;
    });
    directives(el, attributes, original).map((handle) => {
      cleanupRunners.push(handle.runCleanups);
      handle();
    });
  }

  // packages/alpinejs/src/datas.js
  var datas = {};
  function data(name, callback) {
    datas[name] = callback;
  }
  function injectDataProviders(obj, context) {
    Object.entries(datas).forEach(([name, callback]) => {
      Object.defineProperty(obj, name, {
        get() {
          return (...args) => {
            return callback.bind(context)(...args);
          };
        },
        enumerable: false
      });
    });
    return obj;
  }

  // packages/alpinejs/src/alpine.js
  var Alpine = {
    get reactive() {
      return reactive;
    },
    get release() {
      return release;
    },
    get effect() {
      return effect;
    },
    get raw() {
      return raw;
    },
    version: "3.10.3",
    flushAndStopDeferringMutations,
    dontAutoEvaluateFunctions,
    disableEffectScheduling,
    setReactivityEngine,
    closestDataStack,
    skipDuringClone,
    addRootSelector,
    addInitSelector,
    addScopeToNode,
    deferMutations,
    mapAttributes,
    evaluateLater,
    setEvaluator,
    mergeProxies,
    findClosest,
    closestRoot,
    interceptor,
    transition,
    setStyles,
    mutateDom,
    directive,
    throttle,
    debounce,
    evaluate,
    initTree,
    nextTick,
    prefixed: prefix,
    prefix: setPrefix,
    plugin,
    magic,
    store,
    start,
    clone,
    bound: getBinding,
    $data: scope,
    data,
    bind: bind2
  };
  var alpine_default = Alpine;

  // node_modules/@vue/shared/dist/shared.esm-bundler.js
  function makeMap(str, expectsLowerCase) {
    const map = Object.create(null);
    const list = str.split(",");
    for (let i = 0; i < list.length; i++) {
      map[list[i]] = true;
    }
    return expectsLowerCase ? (val) => !!map[val.toLowerCase()] : (val) => !!map[val];
  }
  var PatchFlagNames = {
    [1]: `TEXT`,
    [2]: `CLASS`,
    [4]: `STYLE`,
    [8]: `PROPS`,
    [16]: `FULL_PROPS`,
    [32]: `HYDRATE_EVENTS`,
    [64]: `STABLE_FRAGMENT`,
    [128]: `KEYED_FRAGMENT`,
    [256]: `UNKEYED_FRAGMENT`,
    [512]: `NEED_PATCH`,
    [1024]: `DYNAMIC_SLOTS`,
    [2048]: `DEV_ROOT_FRAGMENT`,
    [-1]: `HOISTED`,
    [-2]: `BAIL`
  };
  var slotFlagsText = {
    [1]: "STABLE",
    [2]: "DYNAMIC",
    [3]: "FORWARDED"
  };
  var specialBooleanAttrs = `itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly`;
  var isBooleanAttr2 = /* @__PURE__ */ makeMap(specialBooleanAttrs + `,async,autofocus,autoplay,controls,default,defer,disabled,hidden,loop,open,required,reversed,scoped,seamless,checked,muted,multiple,selected`);
  var EMPTY_OBJ = true ? Object.freeze({}) : {};
  var EMPTY_ARR = true ? Object.freeze([]) : [];
  var extend = Object.assign;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var hasOwn = (val, key) => hasOwnProperty.call(val, key);
  var isArray = Array.isArray;
  var isMap = (val) => toTypeString(val) === "[object Map]";
  var isString = (val) => typeof val === "string";
  var isSymbol = (val) => typeof val === "symbol";
  var isObject = (val) => val !== null && typeof val === "object";
  var objectToString = Object.prototype.toString;
  var toTypeString = (value) => objectToString.call(value);
  var toRawType = (value) => {
    return toTypeString(value).slice(8, -1);
  };
  var isIntegerKey = (key) => isString(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
  var cacheStringFunction = (fn) => {
    const cache = Object.create(null);
    return (str) => {
      const hit = cache[str];
      return hit || (cache[str] = fn(str));
    };
  };
  var camelizeRE = /-(\w)/g;
  var camelize = cacheStringFunction((str) => {
    return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : "");
  });
  var hyphenateRE = /\B([A-Z])/g;
  var hyphenate = cacheStringFunction((str) => str.replace(hyphenateRE, "-$1").toLowerCase());
  var capitalize = cacheStringFunction((str) => str.charAt(0).toUpperCase() + str.slice(1));
  var toHandlerKey = cacheStringFunction((str) => str ? `on${capitalize(str)}` : ``);
  var hasChanged = (value, oldValue) => value !== oldValue && (value === value || oldValue === oldValue);

  // node_modules/@vue/reactivity/dist/reactivity.esm-bundler.js
  var targetMap = new WeakMap();
  var effectStack = [];
  var activeEffect;
  var ITERATE_KEY = Symbol(true ? "iterate" : "");
  var MAP_KEY_ITERATE_KEY = Symbol(true ? "Map key iterate" : "");
  function isEffect(fn) {
    return fn && fn._isEffect === true;
  }
  function effect2(fn, options = EMPTY_OBJ) {
    if (isEffect(fn)) {
      fn = fn.raw;
    }
    const effect3 = createReactiveEffect(fn, options);
    if (!options.lazy) {
      effect3();
    }
    return effect3;
  }
  function stop(effect3) {
    if (effect3.active) {
      cleanup(effect3);
      if (effect3.options.onStop) {
        effect3.options.onStop();
      }
      effect3.active = false;
    }
  }
  var uid = 0;
  function createReactiveEffect(fn, options) {
    const effect3 = function reactiveEffect() {
      if (!effect3.active) {
        return fn();
      }
      if (!effectStack.includes(effect3)) {
        cleanup(effect3);
        try {
          enableTracking();
          effectStack.push(effect3);
          activeEffect = effect3;
          return fn();
        } finally {
          effectStack.pop();
          resetTracking();
          activeEffect = effectStack[effectStack.length - 1];
        }
      }
    };
    effect3.id = uid++;
    effect3.allowRecurse = !!options.allowRecurse;
    effect3._isEffect = true;
    effect3.active = true;
    effect3.raw = fn;
    effect3.deps = [];
    effect3.options = options;
    return effect3;
  }
  function cleanup(effect3) {
    const {deps} = effect3;
    if (deps.length) {
      for (let i = 0; i < deps.length; i++) {
        deps[i].delete(effect3);
      }
      deps.length = 0;
    }
  }
  var shouldTrack = true;
  var trackStack = [];
  function pauseTracking() {
    trackStack.push(shouldTrack);
    shouldTrack = false;
  }
  function enableTracking() {
    trackStack.push(shouldTrack);
    shouldTrack = true;
  }
  function resetTracking() {
    const last = trackStack.pop();
    shouldTrack = last === void 0 ? true : last;
  }
  function track(target, type, key) {
    if (!shouldTrack || activeEffect === void 0) {
      return;
    }
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = new Set());
    }
    if (!dep.has(activeEffect)) {
      dep.add(activeEffect);
      activeEffect.deps.push(dep);
      if (activeEffect.options.onTrack) {
        activeEffect.options.onTrack({
          effect: activeEffect,
          target,
          type,
          key
        });
      }
    }
  }
  function trigger(target, type, key, newValue, oldValue, oldTarget) {
    const depsMap = targetMap.get(target);
    if (!depsMap) {
      return;
    }
    const effects = new Set();
    const add2 = (effectsToAdd) => {
      if (effectsToAdd) {
        effectsToAdd.forEach((effect3) => {
          if (effect3 !== activeEffect || effect3.allowRecurse) {
            effects.add(effect3);
          }
        });
      }
    };
    if (type === "clear") {
      depsMap.forEach(add2);
    } else if (key === "length" && isArray(target)) {
      depsMap.forEach((dep, key2) => {
        if (key2 === "length" || key2 >= newValue) {
          add2(dep);
        }
      });
    } else {
      if (key !== void 0) {
        add2(depsMap.get(key));
      }
      switch (type) {
        case "add":
          if (!isArray(target)) {
            add2(depsMap.get(ITERATE_KEY));
            if (isMap(target)) {
              add2(depsMap.get(MAP_KEY_ITERATE_KEY));
            }
          } else if (isIntegerKey(key)) {
            add2(depsMap.get("length"));
          }
          break;
        case "delete":
          if (!isArray(target)) {
            add2(depsMap.get(ITERATE_KEY));
            if (isMap(target)) {
              add2(depsMap.get(MAP_KEY_ITERATE_KEY));
            }
          }
          break;
        case "set":
          if (isMap(target)) {
            add2(depsMap.get(ITERATE_KEY));
          }
          break;
      }
    }
    const run = (effect3) => {
      if (effect3.options.onTrigger) {
        effect3.options.onTrigger({
          effect: effect3,
          target,
          key,
          type,
          newValue,
          oldValue,
          oldTarget
        });
      }
      if (effect3.options.scheduler) {
        effect3.options.scheduler(effect3);
      } else {
        effect3();
      }
    };
    effects.forEach(run);
  }
  var isNonTrackableKeys = /* @__PURE__ */ makeMap(`__proto__,__v_isRef,__isVue`);
  var builtInSymbols = new Set(Object.getOwnPropertyNames(Symbol).map((key) => Symbol[key]).filter(isSymbol));
  var get2 = /* @__PURE__ */ createGetter();
  var shallowGet = /* @__PURE__ */ createGetter(false, true);
  var readonlyGet = /* @__PURE__ */ createGetter(true);
  var shallowReadonlyGet = /* @__PURE__ */ createGetter(true, true);
  var arrayInstrumentations = {};
  ["includes", "indexOf", "lastIndexOf"].forEach((key) => {
    const method = Array.prototype[key];
    arrayInstrumentations[key] = function(...args) {
      const arr = toRaw(this);
      for (let i = 0, l = this.length; i < l; i++) {
        track(arr, "get", i + "");
      }
      const res = method.apply(arr, args);
      if (res === -1 || res === false) {
        return method.apply(arr, args.map(toRaw));
      } else {
        return res;
      }
    };
  });
  ["push", "pop", "shift", "unshift", "splice"].forEach((key) => {
    const method = Array.prototype[key];
    arrayInstrumentations[key] = function(...args) {
      pauseTracking();
      const res = method.apply(this, args);
      resetTracking();
      return res;
    };
  });
  function createGetter(isReadonly = false, shallow = false) {
    return function get3(target, key, receiver) {
      if (key === "__v_isReactive") {
        return !isReadonly;
      } else if (key === "__v_isReadonly") {
        return isReadonly;
      } else if (key === "__v_raw" && receiver === (isReadonly ? shallow ? shallowReadonlyMap : readonlyMap : shallow ? shallowReactiveMap : reactiveMap).get(target)) {
        return target;
      }
      const targetIsArray = isArray(target);
      if (!isReadonly && targetIsArray && hasOwn(arrayInstrumentations, key)) {
        return Reflect.get(arrayInstrumentations, key, receiver);
      }
      const res = Reflect.get(target, key, receiver);
      if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
        return res;
      }
      if (!isReadonly) {
        track(target, "get", key);
      }
      if (shallow) {
        return res;
      }
      if (isRef(res)) {
        const shouldUnwrap = !targetIsArray || !isIntegerKey(key);
        return shouldUnwrap ? res.value : res;
      }
      if (isObject(res)) {
        return isReadonly ? readonly(res) : reactive2(res);
      }
      return res;
    };
  }
  var set2 = /* @__PURE__ */ createSetter();
  var shallowSet = /* @__PURE__ */ createSetter(true);
  function createSetter(shallow = false) {
    return function set3(target, key, value, receiver) {
      let oldValue = target[key];
      if (!shallow) {
        value = toRaw(value);
        oldValue = toRaw(oldValue);
        if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
          oldValue.value = value;
          return true;
        }
      }
      const hadKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);
      const result = Reflect.set(target, key, value, receiver);
      if (target === toRaw(receiver)) {
        if (!hadKey) {
          trigger(target, "add", key, value);
        } else if (hasChanged(value, oldValue)) {
          trigger(target, "set", key, value, oldValue);
        }
      }
      return result;
    };
  }
  function deleteProperty(target, key) {
    const hadKey = hasOwn(target, key);
    const oldValue = target[key];
    const result = Reflect.deleteProperty(target, key);
    if (result && hadKey) {
      trigger(target, "delete", key, void 0, oldValue);
    }
    return result;
  }
  function has(target, key) {
    const result = Reflect.has(target, key);
    if (!isSymbol(key) || !builtInSymbols.has(key)) {
      track(target, "has", key);
    }
    return result;
  }
  function ownKeys(target) {
    track(target, "iterate", isArray(target) ? "length" : ITERATE_KEY);
    return Reflect.ownKeys(target);
  }
  var mutableHandlers = {
    get: get2,
    set: set2,
    deleteProperty,
    has,
    ownKeys
  };
  var readonlyHandlers = {
    get: readonlyGet,
    set(target, key) {
      if (true) {
        console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target);
      }
      return true;
    },
    deleteProperty(target, key) {
      if (true) {
        console.warn(`Delete operation on key "${String(key)}" failed: target is readonly.`, target);
      }
      return true;
    }
  };
  var shallowReactiveHandlers = extend({}, mutableHandlers, {
    get: shallowGet,
    set: shallowSet
  });
  var shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet
  });
  var toReactive = (value) => isObject(value) ? reactive2(value) : value;
  var toReadonly = (value) => isObject(value) ? readonly(value) : value;
  var toShallow = (value) => value;
  var getProto = (v) => Reflect.getPrototypeOf(v);
  function get$1(target, key, isReadonly = false, isShallow = false) {
    target = target["__v_raw"];
    const rawTarget = toRaw(target);
    const rawKey = toRaw(key);
    if (key !== rawKey) {
      !isReadonly && track(rawTarget, "get", key);
    }
    !isReadonly && track(rawTarget, "get", rawKey);
    const {has: has2} = getProto(rawTarget);
    const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
    if (has2.call(rawTarget, key)) {
      return wrap(target.get(key));
    } else if (has2.call(rawTarget, rawKey)) {
      return wrap(target.get(rawKey));
    } else if (target !== rawTarget) {
      target.get(key);
    }
  }
  function has$1(key, isReadonly = false) {
    const target = this["__v_raw"];
    const rawTarget = toRaw(target);
    const rawKey = toRaw(key);
    if (key !== rawKey) {
      !isReadonly && track(rawTarget, "has", key);
    }
    !isReadonly && track(rawTarget, "has", rawKey);
    return key === rawKey ? target.has(key) : target.has(key) || target.has(rawKey);
  }
  function size(target, isReadonly = false) {
    target = target["__v_raw"];
    !isReadonly && track(toRaw(target), "iterate", ITERATE_KEY);
    return Reflect.get(target, "size", target);
  }
  function add(value) {
    value = toRaw(value);
    const target = toRaw(this);
    const proto = getProto(target);
    const hadKey = proto.has.call(target, value);
    if (!hadKey) {
      target.add(value);
      trigger(target, "add", value, value);
    }
    return this;
  }
  function set$1(key, value) {
    value = toRaw(value);
    const target = toRaw(this);
    const {has: has2, get: get3} = getProto(target);
    let hadKey = has2.call(target, key);
    if (!hadKey) {
      key = toRaw(key);
      hadKey = has2.call(target, key);
    } else if (true) {
      checkIdentityKeys(target, has2, key);
    }
    const oldValue = get3.call(target, key);
    target.set(key, value);
    if (!hadKey) {
      trigger(target, "add", key, value);
    } else if (hasChanged(value, oldValue)) {
      trigger(target, "set", key, value, oldValue);
    }
    return this;
  }
  function deleteEntry(key) {
    const target = toRaw(this);
    const {has: has2, get: get3} = getProto(target);
    let hadKey = has2.call(target, key);
    if (!hadKey) {
      key = toRaw(key);
      hadKey = has2.call(target, key);
    } else if (true) {
      checkIdentityKeys(target, has2, key);
    }
    const oldValue = get3 ? get3.call(target, key) : void 0;
    const result = target.delete(key);
    if (hadKey) {
      trigger(target, "delete", key, void 0, oldValue);
    }
    return result;
  }
  function clear() {
    const target = toRaw(this);
    const hadItems = target.size !== 0;
    const oldTarget = true ? isMap(target) ? new Map(target) : new Set(target) : void 0;
    const result = target.clear();
    if (hadItems) {
      trigger(target, "clear", void 0, void 0, oldTarget);
    }
    return result;
  }
  function createForEach(isReadonly, isShallow) {
    return function forEach(callback, thisArg) {
      const observed = this;
      const target = observed["__v_raw"];
      const rawTarget = toRaw(target);
      const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
      !isReadonly && track(rawTarget, "iterate", ITERATE_KEY);
      return target.forEach((value, key) => {
        return callback.call(thisArg, wrap(value), wrap(key), observed);
      });
    };
  }
  function createIterableMethod(method, isReadonly, isShallow) {
    return function(...args) {
      const target = this["__v_raw"];
      const rawTarget = toRaw(target);
      const targetIsMap = isMap(rawTarget);
      const isPair = method === "entries" || method === Symbol.iterator && targetIsMap;
      const isKeyOnly = method === "keys" && targetIsMap;
      const innerIterator = target[method](...args);
      const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
      !isReadonly && track(rawTarget, "iterate", isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY);
      return {
        next() {
          const {value, done} = innerIterator.next();
          return done ? {value, done} : {
            value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
            done
          };
        },
        [Symbol.iterator]() {
          return this;
        }
      };
    };
  }
  function createReadonlyMethod(type) {
    return function(...args) {
      if (true) {
        const key = args[0] ? `on key "${args[0]}" ` : ``;
        console.warn(`${capitalize(type)} operation ${key}failed: target is readonly.`, toRaw(this));
      }
      return type === "delete" ? false : this;
    };
  }
  var mutableInstrumentations = {
    get(key) {
      return get$1(this, key);
    },
    get size() {
      return size(this);
    },
    has: has$1,
    add,
    set: set$1,
    delete: deleteEntry,
    clear,
    forEach: createForEach(false, false)
  };
  var shallowInstrumentations = {
    get(key) {
      return get$1(this, key, false, true);
    },
    get size() {
      return size(this);
    },
    has: has$1,
    add,
    set: set$1,
    delete: deleteEntry,
    clear,
    forEach: createForEach(false, true)
  };
  var readonlyInstrumentations = {
    get(key) {
      return get$1(this, key, true);
    },
    get size() {
      return size(this, true);
    },
    has(key) {
      return has$1.call(this, key, true);
    },
    add: createReadonlyMethod("add"),
    set: createReadonlyMethod("set"),
    delete: createReadonlyMethod("delete"),
    clear: createReadonlyMethod("clear"),
    forEach: createForEach(true, false)
  };
  var shallowReadonlyInstrumentations = {
    get(key) {
      return get$1(this, key, true, true);
    },
    get size() {
      return size(this, true);
    },
    has(key) {
      return has$1.call(this, key, true);
    },
    add: createReadonlyMethod("add"),
    set: createReadonlyMethod("set"),
    delete: createReadonlyMethod("delete"),
    clear: createReadonlyMethod("clear"),
    forEach: createForEach(true, true)
  };
  var iteratorMethods = ["keys", "values", "entries", Symbol.iterator];
  iteratorMethods.forEach((method) => {
    mutableInstrumentations[method] = createIterableMethod(method, false, false);
    readonlyInstrumentations[method] = createIterableMethod(method, true, false);
    shallowInstrumentations[method] = createIterableMethod(method, false, true);
    shallowReadonlyInstrumentations[method] = createIterableMethod(method, true, true);
  });
  function createInstrumentationGetter(isReadonly, shallow) {
    const instrumentations = shallow ? isReadonly ? shallowReadonlyInstrumentations : shallowInstrumentations : isReadonly ? readonlyInstrumentations : mutableInstrumentations;
    return (target, key, receiver) => {
      if (key === "__v_isReactive") {
        return !isReadonly;
      } else if (key === "__v_isReadonly") {
        return isReadonly;
      } else if (key === "__v_raw") {
        return target;
      }
      return Reflect.get(hasOwn(instrumentations, key) && key in target ? instrumentations : target, key, receiver);
    };
  }
  var mutableCollectionHandlers = {
    get: createInstrumentationGetter(false, false)
  };
  var shallowCollectionHandlers = {
    get: createInstrumentationGetter(false, true)
  };
  var readonlyCollectionHandlers = {
    get: createInstrumentationGetter(true, false)
  };
  var shallowReadonlyCollectionHandlers = {
    get: createInstrumentationGetter(true, true)
  };
  function checkIdentityKeys(target, has2, key) {
    const rawKey = toRaw(key);
    if (rawKey !== key && has2.call(target, rawKey)) {
      const type = toRawType(target);
      console.warn(`Reactive ${type} contains both the raw and reactive versions of the same object${type === `Map` ? ` as keys` : ``}, which can lead to inconsistencies. Avoid differentiating between the raw and reactive versions of an object and only use the reactive version if possible.`);
    }
  }
  var reactiveMap = new WeakMap();
  var shallowReactiveMap = new WeakMap();
  var readonlyMap = new WeakMap();
  var shallowReadonlyMap = new WeakMap();
  function targetTypeMap(rawType) {
    switch (rawType) {
      case "Object":
      case "Array":
        return 1;
      case "Map":
      case "Set":
      case "WeakMap":
      case "WeakSet":
        return 2;
      default:
        return 0;
    }
  }
  function getTargetType(value) {
    return value["__v_skip"] || !Object.isExtensible(value) ? 0 : targetTypeMap(toRawType(value));
  }
  function reactive2(target) {
    if (target && target["__v_isReadonly"]) {
      return target;
    }
    return createReactiveObject(target, false, mutableHandlers, mutableCollectionHandlers, reactiveMap);
  }
  function readonly(target) {
    return createReactiveObject(target, true, readonlyHandlers, readonlyCollectionHandlers, readonlyMap);
  }
  function createReactiveObject(target, isReadonly, baseHandlers, collectionHandlers, proxyMap) {
    if (!isObject(target)) {
      if (true) {
        console.warn(`value cannot be made reactive: ${String(target)}`);
      }
      return target;
    }
    if (target["__v_raw"] && !(isReadonly && target["__v_isReactive"])) {
      return target;
    }
    const existingProxy = proxyMap.get(target);
    if (existingProxy) {
      return existingProxy;
    }
    const targetType = getTargetType(target);
    if (targetType === 0) {
      return target;
    }
    const proxy = new Proxy(target, targetType === 2 ? collectionHandlers : baseHandlers);
    proxyMap.set(target, proxy);
    return proxy;
  }
  function toRaw(observed) {
    return observed && toRaw(observed["__v_raw"]) || observed;
  }
  function isRef(r) {
    return Boolean(r && r.__v_isRef === true);
  }

  // packages/alpinejs/src/magics/$nextTick.js
  magic("nextTick", () => nextTick);

  // packages/alpinejs/src/magics/$dispatch.js
  magic("dispatch", (el) => dispatch.bind(dispatch, el));

  // packages/alpinejs/src/magics/$watch.js
  magic("watch", (el, {evaluateLater: evaluateLater2, effect: effect3}) => (key, callback) => {
    let evaluate2 = evaluateLater2(key);
    let firstTime = true;
    let oldValue;
    let effectReference = effect3(() => evaluate2((value) => {
      JSON.stringify(value);
      if (!firstTime) {
        queueMicrotask(() => {
          callback(value, oldValue);
          oldValue = value;
        });
      } else {
        oldValue = value;
      }
      firstTime = false;
    }));
    el._x_effects.delete(effectReference);
  });

  // packages/alpinejs/src/magics/$store.js
  magic("store", getStores);

  // packages/alpinejs/src/magics/$data.js
  magic("data", (el) => scope(el));

  // packages/alpinejs/src/magics/$root.js
  magic("root", (el) => closestRoot(el));

  // packages/alpinejs/src/magics/$refs.js
  magic("refs", (el) => {
    if (el._x_refs_proxy)
      return el._x_refs_proxy;
    el._x_refs_proxy = mergeProxies(getArrayOfRefObject(el));
    return el._x_refs_proxy;
  });
  function getArrayOfRefObject(el) {
    let refObjects = [];
    let currentEl = el;
    while (currentEl) {
      if (currentEl._x_refs)
        refObjects.push(currentEl._x_refs);
      currentEl = currentEl.parentNode;
    }
    return refObjects;
  }

  // packages/alpinejs/src/ids.js
  var globalIdMemo = {};
  function findAndIncrementId(name) {
    if (!globalIdMemo[name])
      globalIdMemo[name] = 0;
    return ++globalIdMemo[name];
  }
  function closestIdRoot(el, name) {
    return findClosest(el, (element) => {
      if (element._x_ids && element._x_ids[name])
        return true;
    });
  }
  function setIdRoot(el, name) {
    if (!el._x_ids)
      el._x_ids = {};
    if (!el._x_ids[name])
      el._x_ids[name] = findAndIncrementId(name);
  }

  // packages/alpinejs/src/magics/$id.js
  magic("id", (el) => (name, key = null) => {
    let root = closestIdRoot(el, name);
    let id = root ? root._x_ids[name] : findAndIncrementId(name);
    return key ? `${name}-${id}-${key}` : `${name}-${id}`;
  });

  // packages/alpinejs/src/magics/$el.js
  magic("el", (el) => el);

  // packages/alpinejs/src/magics/index.js
  warnMissingPluginMagic("Focus", "focus", "focus");
  warnMissingPluginMagic("Persist", "persist", "persist");
  function warnMissingPluginMagic(name, magicName, slug) {
    magic(magicName, (el) => warn(`You can't use [$${directiveName}] without first installing the "${name}" plugin here: https://alpinejs.dev/plugins/${slug}`, el));
  }

  // packages/alpinejs/src/directives/x-modelable.js
  directive("modelable", (el, {expression}, {effect: effect3, evaluateLater: evaluateLater2}) => {
    let func = evaluateLater2(expression);
    let innerGet = () => {
      let result;
      func((i) => result = i);
      return result;
    };
    let evaluateInnerSet = evaluateLater2(`${expression} = __placeholder`);
    let innerSet = (val) => evaluateInnerSet(() => {
    }, {scope: {__placeholder: val}});
    let initialValue = innerGet();
    innerSet(initialValue);
    queueMicrotask(() => {
      if (!el._x_model)
        return;
      el._x_removeModelListeners["default"]();
      let outerGet = el._x_model.get;
      let outerSet = el._x_model.set;
      effect3(() => innerSet(outerGet()));
      effect3(() => outerSet(innerGet()));
    });
  });

  // packages/alpinejs/src/directives/x-teleport.js
  directive("teleport", (el, {expression}, {cleanup: cleanup2}) => {
    if (el.tagName.toLowerCase() !== "template")
      warn("x-teleport can only be used on a <template> tag", el);
    let target = document.querySelector(expression);
    if (!target)
      warn(`Cannot find x-teleport element for selector: "${expression}"`);
    let clone2 = el.content.cloneNode(true).firstElementChild;
    el._x_teleport = clone2;
    clone2._x_teleportBack = el;
    if (el._x_forwardEvents) {
      el._x_forwardEvents.forEach((eventName) => {
        clone2.addEventListener(eventName, (e) => {
          e.stopPropagation();
          el.dispatchEvent(new e.constructor(e.type, e));
        });
      });
    }
    addScopeToNode(clone2, {}, el);
    mutateDom(() => {
      target.appendChild(clone2);
      initTree(clone2);
      clone2._x_ignore = true;
    });
    cleanup2(() => clone2.remove());
  });

  // packages/alpinejs/src/directives/x-ignore.js
  var handler = () => {
  };
  handler.inline = (el, {modifiers}, {cleanup: cleanup2}) => {
    modifiers.includes("self") ? el._x_ignoreSelf = true : el._x_ignore = true;
    cleanup2(() => {
      modifiers.includes("self") ? delete el._x_ignoreSelf : delete el._x_ignore;
    });
  };
  directive("ignore", handler);

  // packages/alpinejs/src/directives/x-effect.js
  directive("effect", (el, {expression}, {effect: effect3}) => effect3(evaluateLater(el, expression)));

  // packages/alpinejs/src/utils/on.js
  function on(el, event, modifiers, callback) {
    let listenerTarget = el;
    let handler3 = (e) => callback(e);
    let options = {};
    let wrapHandler = (callback2, wrapper) => (e) => wrapper(callback2, e);
    if (modifiers.includes("dot"))
      event = dotSyntax(event);
    if (modifiers.includes("camel"))
      event = camelCase2(event);
    if (modifiers.includes("passive"))
      options.passive = true;
    if (modifiers.includes("capture"))
      options.capture = true;
    if (modifiers.includes("window"))
      listenerTarget = window;
    if (modifiers.includes("document"))
      listenerTarget = document;
    if (modifiers.includes("prevent"))
      handler3 = wrapHandler(handler3, (next, e) => {
        e.preventDefault();
        next(e);
      });
    if (modifiers.includes("stop"))
      handler3 = wrapHandler(handler3, (next, e) => {
        e.stopPropagation();
        next(e);
      });
    if (modifiers.includes("self"))
      handler3 = wrapHandler(handler3, (next, e) => {
        e.target === el && next(e);
      });
    if (modifiers.includes("away") || modifiers.includes("outside")) {
      listenerTarget = document;
      handler3 = wrapHandler(handler3, (next, e) => {
        if (el.contains(e.target))
          return;
        if (e.target.isConnected === false)
          return;
        if (el.offsetWidth < 1 && el.offsetHeight < 1)
          return;
        if (el._x_isShown === false)
          return;
        next(e);
      });
    }
    if (modifiers.includes("once")) {
      handler3 = wrapHandler(handler3, (next, e) => {
        next(e);
        listenerTarget.removeEventListener(event, handler3, options);
      });
    }
    handler3 = wrapHandler(handler3, (next, e) => {
      if (isKeyEvent(event)) {
        if (isListeningForASpecificKeyThatHasntBeenPressed(e, modifiers)) {
          return;
        }
      }
      next(e);
    });
    if (modifiers.includes("debounce")) {
      let nextModifier = modifiers[modifiers.indexOf("debounce") + 1] || "invalid-wait";
      let wait = isNumeric(nextModifier.split("ms")[0]) ? Number(nextModifier.split("ms")[0]) : 250;
      handler3 = debounce(handler3, wait);
    }
    if (modifiers.includes("throttle")) {
      let nextModifier = modifiers[modifiers.indexOf("throttle") + 1] || "invalid-wait";
      let wait = isNumeric(nextModifier.split("ms")[0]) ? Number(nextModifier.split("ms")[0]) : 250;
      handler3 = throttle(handler3, wait);
    }
    listenerTarget.addEventListener(event, handler3, options);
    return () => {
      listenerTarget.removeEventListener(event, handler3, options);
    };
  }
  function dotSyntax(subject) {
    return subject.replace(/-/g, ".");
  }
  function camelCase2(subject) {
    return subject.toLowerCase().replace(/-(\w)/g, (match, char) => char.toUpperCase());
  }
  function isNumeric(subject) {
    return !Array.isArray(subject) && !isNaN(subject);
  }
  function kebabCase2(subject) {
    return subject.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/[_\s]/, "-").toLowerCase();
  }
  function isKeyEvent(event) {
    return ["keydown", "keyup"].includes(event);
  }
  function isListeningForASpecificKeyThatHasntBeenPressed(e, modifiers) {
    let keyModifiers = modifiers.filter((i) => {
      return !["window", "document", "prevent", "stop", "once"].includes(i);
    });
    if (keyModifiers.includes("debounce")) {
      let debounceIndex = keyModifiers.indexOf("debounce");
      keyModifiers.splice(debounceIndex, isNumeric((keyModifiers[debounceIndex + 1] || "invalid-wait").split("ms")[0]) ? 2 : 1);
    }
    if (keyModifiers.length === 0)
      return false;
    if (keyModifiers.length === 1 && keyToModifiers(e.key).includes(keyModifiers[0]))
      return false;
    const systemKeyModifiers = ["ctrl", "shift", "alt", "meta", "cmd", "super"];
    const selectedSystemKeyModifiers = systemKeyModifiers.filter((modifier) => keyModifiers.includes(modifier));
    keyModifiers = keyModifiers.filter((i) => !selectedSystemKeyModifiers.includes(i));
    if (selectedSystemKeyModifiers.length > 0) {
      const activelyPressedKeyModifiers = selectedSystemKeyModifiers.filter((modifier) => {
        if (modifier === "cmd" || modifier === "super")
          modifier = "meta";
        return e[`${modifier}Key`];
      });
      if (activelyPressedKeyModifiers.length === selectedSystemKeyModifiers.length) {
        if (keyToModifiers(e.key).includes(keyModifiers[0]))
          return false;
      }
    }
    return true;
  }
  function keyToModifiers(key) {
    if (!key)
      return [];
    key = kebabCase2(key);
    let modifierToKeyMap = {
      ctrl: "control",
      slash: "/",
      space: "-",
      spacebar: "-",
      cmd: "meta",
      esc: "escape",
      up: "arrow-up",
      down: "arrow-down",
      left: "arrow-left",
      right: "arrow-right",
      period: ".",
      equal: "="
    };
    modifierToKeyMap[key] = key;
    return Object.keys(modifierToKeyMap).map((modifier) => {
      if (modifierToKeyMap[modifier] === key)
        return modifier;
    }).filter((modifier) => modifier);
  }

  // packages/alpinejs/src/directives/x-model.js
  directive("model", (el, {modifiers, expression}, {effect: effect3, cleanup: cleanup2}) => {
    let evaluate2 = evaluateLater(el, expression);
    let assignmentExpression = `${expression} = rightSideOfExpression($event, ${expression})`;
    let evaluateAssignment = evaluateLater(el, assignmentExpression);
    var event = el.tagName.toLowerCase() === "select" || ["checkbox", "radio"].includes(el.type) || modifiers.includes("lazy") ? "change" : "input";
    let assigmentFunction = generateAssignmentFunction(el, modifiers, expression);
    let removeListener = on(el, event, modifiers, (e) => {
      evaluateAssignment(() => {
      }, {scope: {
        $event: e,
        rightSideOfExpression: assigmentFunction
      }});
    });
    if (!el._x_removeModelListeners)
      el._x_removeModelListeners = {};
    el._x_removeModelListeners["default"] = removeListener;
    cleanup2(() => el._x_removeModelListeners["default"]());
    let evaluateSetModel = evaluateLater(el, `${expression} = __placeholder`);
    el._x_model = {
      get() {
        let result;
        evaluate2((value) => result = value);
        return result;
      },
      set(value) {
        evaluateSetModel(() => {
        }, {scope: {__placeholder: value}});
      }
    };
    el._x_forceModelUpdate = () => {
      evaluate2((value) => {
        if (value === void 0 && expression.match(/\./))
          value = "";
        window.fromModel = true;
        mutateDom(() => bind(el, "value", value));
        delete window.fromModel;
      });
    };
    effect3(() => {
      if (modifiers.includes("unintrusive") && document.activeElement.isSameNode(el))
        return;
      el._x_forceModelUpdate();
    });
  });
  function generateAssignmentFunction(el, modifiers, expression) {
    if (el.type === "radio") {
      mutateDom(() => {
        if (!el.hasAttribute("name"))
          el.setAttribute("name", expression);
      });
    }
    return (event, currentValue) => {
      return mutateDom(() => {
        if (event instanceof CustomEvent && event.detail !== void 0) {
          return event.detail || event.target.value;
        } else if (el.type === "checkbox") {
          if (Array.isArray(currentValue)) {
            let newValue = modifiers.includes("number") ? safeParseNumber(event.target.value) : event.target.value;
            return event.target.checked ? currentValue.concat([newValue]) : currentValue.filter((el2) => !checkedAttrLooseCompare2(el2, newValue));
          } else {
            return event.target.checked;
          }
        } else if (el.tagName.toLowerCase() === "select" && el.multiple) {
          return modifiers.includes("number") ? Array.from(event.target.selectedOptions).map((option) => {
            let rawValue = option.value || option.text;
            return safeParseNumber(rawValue);
          }) : Array.from(event.target.selectedOptions).map((option) => {
            return option.value || option.text;
          });
        } else {
          let rawValue = event.target.value;
          return modifiers.includes("number") ? safeParseNumber(rawValue) : modifiers.includes("trim") ? rawValue.trim() : rawValue;
        }
      });
    };
  }
  function safeParseNumber(rawValue) {
    let number = rawValue ? parseFloat(rawValue) : null;
    return isNumeric2(number) ? number : rawValue;
  }
  function checkedAttrLooseCompare2(valueA, valueB) {
    return valueA == valueB;
  }
  function isNumeric2(subject) {
    return !Array.isArray(subject) && !isNaN(subject);
  }

  // packages/alpinejs/src/directives/x-cloak.js
  directive("cloak", (el) => queueMicrotask(() => mutateDom(() => el.removeAttribute(prefix("cloak")))));

  // packages/alpinejs/src/directives/x-init.js
  addInitSelector(() => `[${prefix("init")}]`);
  directive("init", skipDuringClone((el, {expression}, {evaluate: evaluate2}) => {
    if (typeof expression === "string") {
      return !!expression.trim() && evaluate2(expression, {}, false);
    }
    return evaluate2(expression, {}, false);
  }));

  // packages/alpinejs/src/directives/x-text.js
  directive("text", (el, {expression}, {effect: effect3, evaluateLater: evaluateLater2}) => {
    let evaluate2 = evaluateLater2(expression);
    effect3(() => {
      evaluate2((value) => {
        mutateDom(() => {
          el.textContent = value;
        });
      });
    });
  });

  // packages/alpinejs/src/directives/x-html.js
  directive("html", (el, {expression}, {effect: effect3, evaluateLater: evaluateLater2}) => {
    let evaluate2 = evaluateLater2(expression);
    effect3(() => {
      evaluate2((value) => {
        mutateDom(() => {
          el.innerHTML = value;
          el._x_ignoreSelf = true;
          initTree(el);
          delete el._x_ignoreSelf;
        });
      });
    });
  });

  // packages/alpinejs/src/directives/x-bind.js
  mapAttributes(startingWith(":", into(prefix("bind:"))));
  directive("bind", (el, {value, modifiers, expression, original}, {effect: effect3}) => {
    if (!value) {
      let bindingProviders = {};
      injectBindingProviders(bindingProviders);
      let getBindings = evaluateLater(el, expression);
      getBindings((bindings) => {
        applyBindingsObject(el, bindings, original);
      }, {scope: bindingProviders});
      return;
    }
    if (value === "key")
      return storeKeyForXFor(el, expression);
    let evaluate2 = evaluateLater(el, expression);
    effect3(() => evaluate2((result) => {
      if (result === void 0 && expression.match(/\./))
        result = "";
      mutateDom(() => bind(el, value, result, modifiers));
    }));
  });
  function storeKeyForXFor(el, expression) {
    el._x_keyExpression = expression;
  }

  // packages/alpinejs/src/directives/x-data.js
  addRootSelector(() => `[${prefix("data")}]`);
  directive("data", skipDuringClone((el, {expression}, {cleanup: cleanup2}) => {
    expression = expression === "" ? "{}" : expression;
    let magicContext = {};
    injectMagics(magicContext, el);
    let dataProviderContext = {};
    injectDataProviders(dataProviderContext, magicContext);
    let data2 = evaluate(el, expression, {scope: dataProviderContext});
    if (data2 === void 0)
      data2 = {};
    injectMagics(data2, el);
    let reactiveData = reactive(data2);
    initInterceptors(reactiveData);
    let undo = addScopeToNode(el, reactiveData);
    reactiveData["init"] && evaluate(el, reactiveData["init"]);
    cleanup2(() => {
      reactiveData["destroy"] && evaluate(el, reactiveData["destroy"]);
      undo();
    });
  }));

  // packages/alpinejs/src/directives/x-show.js
  directive("show", (el, {modifiers, expression}, {effect: effect3}) => {
    let evaluate2 = evaluateLater(el, expression);
    if (!el._x_doHide)
      el._x_doHide = () => {
        mutateDom(() => {
          el.style.setProperty("display", "none", modifiers.includes("important") ? "important" : void 0);
        });
      };
    if (!el._x_doShow)
      el._x_doShow = () => {
        mutateDom(() => {
          if (el.style.length === 1 && el.style.display === "none") {
            el.removeAttribute("style");
          } else {
            el.style.removeProperty("display");
          }
        });
      };
    let hide = () => {
      el._x_doHide();
      el._x_isShown = false;
    };
    let show = () => {
      el._x_doShow();
      el._x_isShown = true;
    };
    let clickAwayCompatibleShow = () => setTimeout(show);
    let toggle = once((value) => value ? show() : hide(), (value) => {
      if (typeof el._x_toggleAndCascadeWithTransitions === "function") {
        el._x_toggleAndCascadeWithTransitions(el, value, show, hide);
      } else {
        value ? clickAwayCompatibleShow() : hide();
      }
    });
    let oldValue;
    let firstTime = true;
    effect3(() => evaluate2((value) => {
      if (!firstTime && value === oldValue)
        return;
      if (modifiers.includes("immediate"))
        value ? clickAwayCompatibleShow() : hide();
      toggle(value);
      oldValue = value;
      firstTime = false;
    }));
  });

  // packages/alpinejs/src/directives/x-for.js
  directive("for", (el, {expression}, {effect: effect3, cleanup: cleanup2}) => {
    let iteratorNames = parseForExpression(expression);
    let evaluateItems = evaluateLater(el, iteratorNames.items);
    let evaluateKey = evaluateLater(el, el._x_keyExpression || "index");
    el._x_prevKeys = [];
    el._x_lookup = {};
    effect3(() => loop(el, iteratorNames, evaluateItems, evaluateKey));
    cleanup2(() => {
      Object.values(el._x_lookup).forEach((el2) => el2.remove());
      delete el._x_prevKeys;
      delete el._x_lookup;
    });
  });
  function loop(el, iteratorNames, evaluateItems, evaluateKey) {
    let isObject2 = (i) => typeof i === "object" && !Array.isArray(i);
    let templateEl = el;
    evaluateItems((items) => {
      if (isNumeric3(items) && items >= 0) {
        items = Array.from(Array(items).keys(), (i) => i + 1);
      }
      if (items === void 0)
        items = [];
      let lookup = el._x_lookup;
      let prevKeys = el._x_prevKeys;
      let scopes = [];
      let keys = [];
      if (isObject2(items)) {
        items = Object.entries(items).map(([key, value]) => {
          let scope2 = getIterationScopeVariables(iteratorNames, value, key, items);
          evaluateKey((value2) => keys.push(value2), {scope: {index: key, ...scope2}});
          scopes.push(scope2);
        });
      } else {
        for (let i = 0; i < items.length; i++) {
          let scope2 = getIterationScopeVariables(iteratorNames, items[i], i, items);
          evaluateKey((value) => keys.push(value), {scope: {index: i, ...scope2}});
          scopes.push(scope2);
        }
      }
      let adds = [];
      let moves = [];
      let removes = [];
      let sames = [];
      for (let i = 0; i < prevKeys.length; i++) {
        let key = prevKeys[i];
        if (keys.indexOf(key) === -1)
          removes.push(key);
      }
      prevKeys = prevKeys.filter((key) => !removes.includes(key));
      let lastKey = "template";
      for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let prevIndex = prevKeys.indexOf(key);
        if (prevIndex === -1) {
          prevKeys.splice(i, 0, key);
          adds.push([lastKey, i]);
        } else if (prevIndex !== i) {
          let keyInSpot = prevKeys.splice(i, 1)[0];
          let keyForSpot = prevKeys.splice(prevIndex - 1, 1)[0];
          prevKeys.splice(i, 0, keyForSpot);
          prevKeys.splice(prevIndex, 0, keyInSpot);
          moves.push([keyInSpot, keyForSpot]);
        } else {
          sames.push(key);
        }
        lastKey = key;
      }
      for (let i = 0; i < removes.length; i++) {
        let key = removes[i];
        if (!!lookup[key]._x_effects) {
          lookup[key]._x_effects.forEach(dequeueJob);
        }
        lookup[key].remove();
        lookup[key] = null;
        delete lookup[key];
      }
      for (let i = 0; i < moves.length; i++) {
        let [keyInSpot, keyForSpot] = moves[i];
        let elInSpot = lookup[keyInSpot];
        let elForSpot = lookup[keyForSpot];
        let marker = document.createElement("div");
        mutateDom(() => {
          elForSpot.after(marker);
          elInSpot.after(elForSpot);
          elForSpot._x_currentIfEl && elForSpot.after(elForSpot._x_currentIfEl);
          marker.before(elInSpot);
          elInSpot._x_currentIfEl && elInSpot.after(elInSpot._x_currentIfEl);
          marker.remove();
        });
        refreshScope(elForSpot, scopes[keys.indexOf(keyForSpot)]);
      }
      for (let i = 0; i < adds.length; i++) {
        let [lastKey2, index] = adds[i];
        let lastEl = lastKey2 === "template" ? templateEl : lookup[lastKey2];
        if (lastEl._x_currentIfEl)
          lastEl = lastEl._x_currentIfEl;
        let scope2 = scopes[index];
        let key = keys[index];
        let clone2 = document.importNode(templateEl.content, true).firstElementChild;
        addScopeToNode(clone2, reactive(scope2), templateEl);
        mutateDom(() => {
          lastEl.after(clone2);
          initTree(clone2);
        });
        if (typeof key === "object") {
          warn("x-for key cannot be an object, it must be a string or an integer", templateEl);
        }
        lookup[key] = clone2;
      }
      for (let i = 0; i < sames.length; i++) {
        refreshScope(lookup[sames[i]], scopes[keys.indexOf(sames[i])]);
      }
      templateEl._x_prevKeys = keys;
    });
  }
  function parseForExpression(expression) {
    let forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
    let stripParensRE = /^\s*\(|\)\s*$/g;
    let forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
    let inMatch = expression.match(forAliasRE);
    if (!inMatch)
      return;
    let res = {};
    res.items = inMatch[2].trim();
    let item = inMatch[1].replace(stripParensRE, "").trim();
    let iteratorMatch = item.match(forIteratorRE);
    if (iteratorMatch) {
      res.item = item.replace(forIteratorRE, "").trim();
      res.index = iteratorMatch[1].trim();
      if (iteratorMatch[2]) {
        res.collection = iteratorMatch[2].trim();
      }
    } else {
      res.item = item;
    }
    return res;
  }
  function getIterationScopeVariables(iteratorNames, item, index, items) {
    let scopeVariables = {};
    if (/^\[.*\]$/.test(iteratorNames.item) && Array.isArray(item)) {
      let names = iteratorNames.item.replace("[", "").replace("]", "").split(",").map((i) => i.trim());
      names.forEach((name, i) => {
        scopeVariables[name] = item[i];
      });
    } else if (/^\{.*\}$/.test(iteratorNames.item) && !Array.isArray(item) && typeof item === "object") {
      let names = iteratorNames.item.replace("{", "").replace("}", "").split(",").map((i) => i.trim());
      names.forEach((name) => {
        scopeVariables[name] = item[name];
      });
    } else {
      scopeVariables[iteratorNames.item] = item;
    }
    if (iteratorNames.index)
      scopeVariables[iteratorNames.index] = index;
    if (iteratorNames.collection)
      scopeVariables[iteratorNames.collection] = items;
    return scopeVariables;
  }
  function isNumeric3(subject) {
    return !Array.isArray(subject) && !isNaN(subject);
  }

  // packages/alpinejs/src/directives/x-ref.js
  function handler2() {
  }
  handler2.inline = (el, {expression}, {cleanup: cleanup2}) => {
    let root = closestRoot(el);
    if (!root._x_refs)
      root._x_refs = {};
    root._x_refs[expression] = el;
    cleanup2(() => delete root._x_refs[expression]);
  };
  directive("ref", handler2);

  // packages/alpinejs/src/directives/x-if.js
  directive("if", (el, {expression}, {effect: effect3, cleanup: cleanup2}) => {
    let evaluate2 = evaluateLater(el, expression);
    let show = () => {
      if (el._x_currentIfEl)
        return el._x_currentIfEl;
      let clone2 = el.content.cloneNode(true).firstElementChild;
      addScopeToNode(clone2, {}, el);
      mutateDom(() => {
        el.after(clone2);
        initTree(clone2);
      });
      el._x_currentIfEl = clone2;
      el._x_undoIf = () => {
        walk(clone2, (node) => {
          if (!!node._x_effects) {
            node._x_effects.forEach(dequeueJob);
          }
        });
        clone2.remove();
        delete el._x_currentIfEl;
      };
      return clone2;
    };
    let hide = () => {
      if (!el._x_undoIf)
        return;
      el._x_undoIf();
      delete el._x_undoIf;
    };
    effect3(() => evaluate2((value) => {
      value ? show() : hide();
    }));
    cleanup2(() => el._x_undoIf && el._x_undoIf());
  });

  // packages/alpinejs/src/directives/x-id.js
  directive("id", (el, {expression}, {evaluate: evaluate2}) => {
    let names = evaluate2(expression);
    names.forEach((name) => setIdRoot(el, name));
  });

  // packages/alpinejs/src/directives/x-on.js
  mapAttributes(startingWith("@", into(prefix("on:"))));
  directive("on", skipDuringClone((el, {value, modifiers, expression}, {cleanup: cleanup2}) => {
    let evaluate2 = expression ? evaluateLater(el, expression) : () => {
    };
    if (el.tagName.toLowerCase() === "template") {
      if (!el._x_forwardEvents)
        el._x_forwardEvents = [];
      if (!el._x_forwardEvents.includes(value))
        el._x_forwardEvents.push(value);
    }
    let removeListener = on(el, value, modifiers, (e) => {
      evaluate2(() => {
      }, {scope: {$event: e}, params: [e]});
    });
    cleanup2(() => removeListener());
  }));

  // packages/alpinejs/src/directives/index.js
  warnMissingPluginDirective("Collapse", "collapse", "collapse");
  warnMissingPluginDirective("Intersect", "intersect", "intersect");
  warnMissingPluginDirective("Focus", "trap", "focus");
  warnMissingPluginDirective("Mask", "mask", "mask");
  function warnMissingPluginDirective(name, directiveName2, slug) {
    directive(directiveName2, (el) => warn(`You can't use [x-${directiveName2}] without first installing the "${name}" plugin here: https://alpinejs.dev/plugins/${slug}`, el));
  }

  // packages/alpinejs/src/index.js
  alpine_default.setEvaluator(normalEvaluator);
  alpine_default.setReactivityEngine({reactive: reactive2, effect: effect2, release: stop, raw: toRaw});
  var src_default = alpine_default;

  // packages/alpinejs/builds/cdn.js
  window.Alpine = src_default;
  queueMicrotask(() => {
    src_default.start();
  });
})();
