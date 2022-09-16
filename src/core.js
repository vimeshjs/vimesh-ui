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
})(window);