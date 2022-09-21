// Modified from https://github.com/TimothyRHuertas/normalizer

const defaultStyles = ["display"];
const defaultAttributes = ["style", "class"];

function normalizeHTML(node, attributesToConsider, attributesToExclude, stylesToConsider, classNamesToConsider) {
    var html = "";

    // An Element node such as <p> or <div>.
    if (node.nodeType === 1) {
        var tagName = node.tagName.toLowerCase();
        html += "<" + tagName;
        html += normalizeAttributes(node, attributesToConsider, attributesToExclude, stylesToConsider, classNamesToConsider);
        html += ">";

        if (node.hasChildNodes()) {
            Array.prototype.slice.call(node.childNodes, 0).forEach(function (node) {
                html += normalizeHTML(node, attributesToConsider, attributesToExclude, stylesToConsider, classNamesToConsider);
            });
        }
        html += "</" + tagName + ">";
    }
    // The actual Text of Element or Attr.
    else if (node.nodeType === 3 && node.nodeName !== "#comment") {
        var nodeValue = node.nodeValue.replace(/\s+/g, ' ');

        if (nodeValue.trim()) {
            html += nodeValue;
        }
    }

    return html;
}

function normalizeAttributes(node, attributesToConsider, attributesToExclude, stylesToConsider, classNamesToConsider) {
    var attributes = "";
    var attributeList = Array.prototype.slice.call(node.attributes, 0).reduce(function (map, attribute) {
        map[attribute.nodeName] = attribute.nodeValue;
        return map;
    }, {});

    Object.keys(attributeList).sort().forEach(function (attributeKey) {
        var value = attributeList[attributeKey];
        var lowerCasedAttributeKey = attributeKey.toLowerCase();

        if (!attributesToExclude[lowerCasedAttributeKey] && ( // checking blacklist
            !attributesToConsider || attributesToConsider[lowerCasedAttributeKey])) {

            if (attributeKey === "style") {
                attributes += normalizeStyle(value, stylesToConsider);
            } else if (classNamesToConsider && attributeKey === "class") {
                attributes += normalizeClass(value, classNamesToConsider);
            } else if (attributeKey !== "data-reactid") {
                attributes += " ";
                attributes += attributeKey + "=\"" + value + "\"";
            }
        }
    });

    return attributes;
}

function normalizeClass(value, classNamesToConsider) {
    var retVal = "";

    if (value && value.trim()) {
        var classNames = value.replace(/\s+/g, " ").split(" ").sort();

        retVal = classNames.reduce(function (normalized, className) {

            //if classNamesToConsider is null use them all
            if (!classNamesToConsider || classNamesToConsider[className]) {
                if (!normalized) {
                    normalized = "class=\"";
                }

                normalized += className + " ";
            }

            return normalized;
        }, "");

        if (retVal) {
            retVal = retVal.trim();
            retVal = " " + retVal + "\"";
        }
    }

    return retVal;
}

function normalizeStyle(style, stylesToConsider) {
    var normalized = "";
    var styleGroups = style.split(";");

    var styleMap = styleGroups.filter(function (group) {
        return !!group;
    }).reduce(function (map, group) {
        if (group.trim()) {
            var styleGroup = group.split(":");
            var key = styleGroup[0].trim();
            var value = styleGroup[1].trim();

            //if styles to consider is null consider them all
            if (!stylesToConsider || stylesToConsider[key.toLowerCase()]) {
                map[key] = value;
            }
        }

        return map;
    }, {});

    var keys = Object.keys(styleMap);
    var lastKeyIndex = keys.length - 1;

    keys.sort().forEach(function (key, i) {
        var value = styleMap[key];

        if (!i) {
            normalized += " style=\"";
        }

        normalized += key + ":";
        normalized += value;

        if (i !== lastKeyIndex) {
            normalized += "; ";
        } else {
            normalized += "\"";
        }
    });
    return normalized;
}

function convertStringToDOM(html) {
    var wrapMap = {
        option: [1, "<select multiple='multiple'>", "</select>"],
        legend: [1, "<fieldset>", "</fieldset>"],
        area: [1, "<map>", "</map>"],
        param: [1, "<object>", "</object>"],
        thead: [1, "<table>", "</table>"],
        tr: [2, "<table><tbody>", "</tbody></table>"],
        col: [2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"],
        td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],
        body: [0, "", ""],
        _default: [1, "<div>", "</div>"]
    };
    wrapMap.optgroup = wrapMap.option;
    wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
    wrapMap.th = wrapMap.td;
    var match = /<\s*\w.*?>/g.exec(html);
    var node = document.createElement('div');

    if (match != null) {
        var tag = match[0].replace(/</g, '').replace(/>/g, '').split(' ')[0];

        if (tag.toLowerCase() === 'body') {
            var body = document.createElement("body");
            // keeping the attributes
            node.innerHTML = html.replace(/<body/g, '<div').replace(/<\/body>/g, '</div>');
            var attrs = node.firstChild.attributes;
            body.innerHTML = html;
            for (var i = 0; i < attrs.length; i++) {
                body.setAttribute(attrs[i].name, attrs[i].value);
            }
            return body;
        } else {
            var map = wrapMap[tag] || wrapMap._default;
            html = map[1] + html + map[2];
            node.innerHTML = html;
            // Descend through wrappers to the right content
            var j = map[0] + 1;
            while (j--) {
                return node.lastChild.childNodes;
            }
        }
    } else {
        node.innerHTML = html;
        return node.childNodes;
    }
}

function normalizeHTMLString(domString, attributesToConsider, attributesToExclude, stylesToConsider, classNamesToConsider) {
    var domNodes = convertStringToDOM(domString);

    return [].slice.call(domNodes).map(function (domNode) {
        return normalizeHTML(domNode, attributesToConsider, attributesToExclude, stylesToConsider, classNamesToConsider);
    }).join('');
}

function toLowerMap(array) {
    return array.reduce(function (map, item) {
        map[item.toLowerCase()] = true;
        return map;
    }, {});
}

function toMap(array) {
    return array.reduce(function (map, item) {
        map[item] = true;
        return map;
    }, {});
}

module.exports = function (options) {
    if (!options) {
        options = {};
    }

    if (!options.hasOwnProperty("attributes")) {
        options.attributes = defaultAttributes;
    }

    if (!options.hasOwnProperty("attributesExcluded") || options.attributesExcluded === null) {
        options.attributesExcluded = [];
    }

    if (!options.hasOwnProperty("styles")) {
        options.styles = defaultStyles;
    }

    if (!options.hasOwnProperty("classNames")) {
        options.classNames = null; //consider all class names by default
    }

    var attributesToConsider = options.attributes ? toLowerMap(options.attributes) : null;
    var attributesToExclude = options.attributesExcluded ? toLowerMap(options.attributesExcluded) : null;
    var classNamesToConsider = options.classNames ? toMap(options.classNames) : null;
    var stylesToConsider = options.styles ? toLowerMap(options.styles) : null;

    return {
        domNode: function domNode(node) {
            if (!node || typeof node !== "object" || node.innerHTML === undefined) {
                throw new Error("This function takes one argument.  It must be a dom node and can not be null.");
            }

            return normalizeHTML(node, attributesToConsider, attributesToExclude, stylesToConsider, classNamesToConsider);
        },
        domString: function domString(string) {
            if (!string || typeof string !== "string") {
                throw new Error("This function takes one argument.  It must be a dom string and can not be empty.");
            }

            return normalizeHTMLString(string, attributesToConsider, attributesToExclude, stylesToConsider, classNamesToConsider);
        },
        normalize: function normalize(objectWithHTML) {
            if (objectWithHTML && typeof objectWithHTML === "string") {
                return this.domString(objectWithHTML);
            } else if (objectWithHTML && typeof objectWithHTML === "object" && objectWithHTML.innerHTML !== undefined) {
                return this.domNode(objectWithHTML);
            } else {
                throw new Error("This function takes one argument.  It must either be an HTML string, DOM node, react componenet or react element.");
            }
        }
    };
};