function setupXStyle(G) {
    if (!G.$vui) return console.error('Vimesh UI core is not loaded!')
    const $vui = G.$vui
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
            const attrName = `${$vui.config.propPrefix}${variantName}`;
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