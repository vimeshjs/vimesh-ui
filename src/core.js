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
})(window);