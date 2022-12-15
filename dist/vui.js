// Vimesh UI v0.10.2
"use strict";!function(t){if(!t.$vui){t.$vui={config:{debug:!1},ready(e){t.Alpine?e():document.addEventListener("alpine:init",e)}};const e=new Date,o=t.$vui._={elapse(){return new Date-e},isString(e){return null!=e&&"string"==typeof e.valueOf()},isArray(e){return Array.isArray(e)},isFunction(e){return"function"==typeof e},isPlainObject(e){return null!==e&&"object"==typeof e&&e.constructor===Object},each(e,r){e&&(o.isArray(e)?e.forEach((e,t)=>{r(e,t,t)}):Object.entries(e).forEach(([e,t],n)=>{r(t,e,n)}))},map(e,r){let i=[];return o.each(e,(e,t,n)=>i.push(r(e,t,n))),i},filter(e,r){let i=[];return o.each(e,(e,t,n)=>r(e,t,n)&&i.push(e)),i},extend(n,...t){var r=t.length;if(r<1||null==n)return n;for(let e=0;e<r;e++){const i=t[e];o.isPlainObject(i)&&Object.keys(i).forEach(e=>{var t=Object.getOwnPropertyDescriptor(i,e);t.get||t.set?Object.defineProperty(n,e,t):n[e]=i[e]})}return n}}}}(window),$vui.setups||($vui.setups={}),$vui.components||($vui.components={}),$vui.ready(()=>{const p=$vui._,{directive:e,prefixed:f,addRootSelector:t,magic:n,closestDataStack:a,mergeProxies:u,initTree:y,evaluate:s,mutateDom:_,reactive:$}=Alpine,A="v-ui",m="v-cloak",i="vui",v=f("component"),w=f("import"),b=f("data"),E=f("init"),N=f("ignore"),c=[i];let l=document.createElement("style");function d(e){e&&(e=e.trim(),-1===c.indexOf(e)&&c.push(e))}function x(e){if(e.tagName){var t=e.tagName.indexOf("-");if(-1===t)return!1;e=e.tagName.substring(0,t).toLowerCase();if(-1!==c.indexOf(e))return!0}return!1}function h(e){return e.parentNode?x(e.parentNode)?e.parentNode:h(e.parentNode):null}function r(e,t){p.each(e.querySelectorAll("*"),e=>{x(e)&&t(e),"TEMPLATE"===e.tagName&&r(e.content,t)})}function o(e,n){if(!e)return null;if(e._vui_type){if(p.isString(n)){let t=n;n=e=>e._vui_type===t}if(!n||n(e))return e}return o(e.parentNode,n)}function g(e,t){const n=o(e,t);if(!n)return null;e={$of(t){return t?g(n.parentNode,e=>e._vui_type===t):null},get $meta(){return O(this.$el)},get $parent(){return h(this.$el)},$closest(e){return o(this.$el,e)},$find(e){return T(this.$el,e)},$findOne(e){e=T(this.$el,e);return 0<e.length?e[0]:null}};return u([e,n._vui_api||{},...a(n)])}function O(e){return{prefix:e._vui_prefix,type:e._vui_type,namespace:e._vui_namespace}}function T(e,n){if(p.isString(n)){let t=n;n=e=>e._vui_type===t}let t=[];return r(e,e=>{n&&!n(e)||t.push(e)}),t}l.setAttribute("id","vimesh-ui-component-common-styles"),l.innerHTML=`
    [v-ui] {display : block}
    [${m}] {display: none !important;}
    `,document.head.prepend(l),$vui.addNamespace=d,$vui.getComponentMeta=O,$vui.isComponent=x,$vui.visitComponents=r,$vui.findChildComponents=T,$vui.getParentComponent=h,$vui.findClosestComponent=o,$vui.$api=e=>g(e),$vui.$data=Alpine.$data,$vui.nextTick=Alpine.nextTick,$vui.focus=(e,t)=>e&&e.focus&&e.focus(t||{preventScroll:!0}),$vui.scrollIntoView=(e,t)=>e&&e.scrollIntoView&&e.scrollIntoView(t||{block:"nearest"}),$vui.extractNamespaces=e=>{p.each([e,...e.querySelectorAll("*")],n=>{"TEMPLATE"===n.tagName&&$vui.extractNamespaces(n.content),p.each(n.attributes,t=>{let e=t.name;if(e.startsWith(v))d(function(e){var t=e.indexOf(":");if(-1===t)return i;var n=e.indexOf(".",t);return-1===n?e.substring(t+1):e.substring(t+1,n)}(e));else if(e.startsWith(w)&&t.value){let e=t.value.trim();e=e.startsWith("[")&&e.endsWith("]")?s(n,t.value):e.split(";"),p.each(e,e=>{var t=e.indexOf("/");-1!==t&&d(e.substring(0,t))})}})})},$vui.prepareComponents=e=>{r(e,e=>{e.setAttribute(m,""),e.setAttribute(N,"")})},$vui.extractNamespaces(document),$vui.prepareComponents(document),t(()=>`[${v}]`),n("api",e=>g(e)),n("prop",r=>(e,t)=>{var n=o(r);return n?Alpine.bound(n,e,t):null}),e("component",(o,{expression:a,value:e,modifiers:t},{})=>{if("template"!==o.tagName.toLowerCase())return console.warn("x-component can only be used on a <template> tag",o);const u=e||$vui.config.namespace||i;const s=($vui.config.prefixMap||{})[u]||u,c=s+"-"+a,d=t.includes("unwrap"),n=o.content.querySelector("script");if(n){const r=document.createElement("script");p.each(n.attributes,e=>r.setAttribute(e.name,e.value)),r.setAttribute("component",c),r.innerHTML=`
$vui.setups["${c}"] = ($el)=>{
${n.innerHTML}
}
//# sourceURL=__vui__/${c}.js
`,document.body.append(r),n.remove()}function l(e,n){p.each(e.attributes,t=>{if(v!==t.name&&!t.name.startsWith(v)&&w!==t.name&&!t.name.startsWith(w))try{let e=t.name;e.startsWith("@")?e=f("on")+":"+e.substring(1):e.startsWith(":")&&(e=f("bind")+":"+e.substring(1)),E===e&&n.getAttribute(E)?n.setAttribute(e,t.value+";"+n.getAttribute(E)):b===e&&n.getAttribute(b)?n.setAttribute(e,"{..."+t.value+",..."+n.getAttribute(b)+"}"):"class"===e?n.setAttribute(e,t.value+" "+(n.getAttribute("class")||"")):n.hasAttribute(e)||n.setAttribute(e,t.value)}catch(e){console.warn(`Fails to set attribute ${t.name}=${t.value} in `+n.tagName.toLowerCase())}})}$vui.components[c]=class extends HTMLElement{connectedCallback(){let n=this;_(()=>{const r={},i=[];p.each(this.querySelectorAll(`[${f("for")}]`),e=>{e._x_lookup&&(Object.values(e._x_lookup).forEach(e=>e.remove()),delete o._x_prevKeys,delete o._x_lookup)}),p.each(this.childNodes,e=>{var t,n;e.tagName&&e.hasAttribute("slot")?(t=e.getAttribute("slot")||"",n="TEMPLATE"===e.tagName?e.content.cloneNode(!0).childNodes:[e.cloneNode(!0)],r[t]?r[t].push(...n):r[t]=n):i.push(e.cloneNode(!0))}),d?(l(this,n=o.content.cloneNode(!0).firstElementChild),this.after(n),this.remove()):(n.innerHTML=o.innerHTML,n.setAttribute(A,$vui.config.debug?""+p.elapse():"")),l(o,n),p.each(n.querySelectorAll("slot"),e=>{var t=e.getAttribute("name")||"";e.after(...r[t]||i),e.remove()}),n._vui_prefix=s,n._vui_type=a,n._vui_namespace=u;let e=$vui.setups[c],t=(e&&(n._vui_api=$(e(n))),n.hasAttribute(b)||n.setAttribute(b,"{}"),n.removeAttribute(m),n.removeAttribute(N),delete n._x_ignore,h(n));if(!t||t._vui_type){if(y(n),n._vui_api){let e=g(n);e.onMounted&&e.onMounted()}p.each(n._vui_deferred_elements,t=>{if(t._vui_api){let e=g(t);e.onMounted&&e.onMounted()}}),delete n._vui_deferred_elements}else t._vui_deferred_elements||(t._vui_deferred_elements=[]),t._vui_deferred_elements.push(n),n._vui_deferred_elements&&t._vui_deferred_elements.push(...n._vui_deferred_elements)})}disconnectedCallback(){if(this._vui_api){let e=g(this);e.onUnmounted&&e.onUnmounted()}}attributeChangedCallback(t,n,r){if(this._vui_api){let e=g(this);e.onAttributeChanged&&e.onAttributeChanged(t,n,r)}}},customElements.define(c.toLowerCase(),$vui.components[c])})}),$vui.import=e=>{const l=$vui._,a=$vui.config.importMap;if(!a||!a["*"])return Promise.reject('You must setup import url template for the fallback namespace "*"');if($vui.imports||($vui.imports={}),$vui.importScriptIndex||($vui.importScriptIndex=1),l.isString(e)&&(e=[e]),l.isArray(e)){const u=[];return l.each(e,n=>{let s=n=n.trim(),r=a["*"],c=null,i="",e=n.indexOf(":"),o=(-1!==e&&(i=n.substring(0,e),n=n.substring(e+1),i&&$vui.addNamespace(i)),e=n.lastIndexOf("/"),"");-1!==e&&(o=n.substring(0,e+1),n=n.substring(e+1)),l.each(n.split(","),e=>{e=e.trim();e={path:o,namespace:i,component:e};e.namespace&&a[e.namespace]&&(r=a[e.namespace]);try{const t=new Function("data","with (data){return `"+r+"`}");c=t(e)}catch(e){return void console.error(`Fails to parse url template ${r} with component `+n)}c&&!$vui.imports[c]&&($vui.imports[c]=!0,u.push(fetch(c).then(e=>{if(!e.ok)throw Error(`${e.status} (${e.statusText})`);return e.text()}).then(e=>{const t=document.createElement("div");t._x_ignore=!0,t.innerHTML=e;let u=[...t.childNodes];return new Promise(o=>{const a=e=>{if(e<u.length){const r=u[e];if(r.remove(),"SCRIPT"===r.tagName){const i=document.createElement("script");var t,n=r.src&&!r.async;n&&(i.onload=()=>{a(e+1)},i.onerror=()=>{console.error(`Fails to load script from "${i.src}"`),a(e+1)}),l.each(r.attributes,e=>i.setAttribute(e.name,e.value)),r.src||(t=`__vui__/scripts/js_${$vui.importScriptIndex}.js`,i.setAttribute("file",t),i.innerHTML=r.innerHTML+`\r
//# sourceURL=`+t,$vui.importScriptIndex++),document.body.append(i),n||a(e+1)}else"TEMPLATE"===r.tagName&&($vui.extractNamespaces(r),$vui.prepareComponents(r),document.body.append(r)),a(e+1)}else $vui.config.debug&&console.log(`Imported ${s} @ `+c),o()};a(0)})}).catch(e=>{console.error(`Fails to import ${s} @ `+c,e)})))})}),Promise.all(u)}return Promise.reject(`Fails to import ${comp} !`)},$vui.ready(()=>{const r=$vui._,{directive:e,evaluateLater:i,effect:o,prefixed:t,addRootSelector:n}=Alpine;n(()=>`[${t("import")}]`),e("import",(t,{expression:n},{})=>{if(n){let e=n.trim();if(e.startsWith("[")&&e.endsWith("]")){let e=i(t,n);o(()=>e(e=>{r.isArray(e)&&$vui.import(e)}))}else $vui.import(e.split(";"))}})}),$vui.include=(l,e)=>{const d=$vui._,p=l._vui_unwrap;let t;for(let e=l;e&&!(t=e._vui_base_url);e=e.parentElement);if(t=t||document.baseURI,d.isArray(e)){const n=[];return d.each(e,c=>{if(c=c.trim()){let s=new URL(c,t).href;n.push(fetch(s).then(e=>e.text()).then(e=>{const t=document.createElement("div");t._x_ignore=!0,t.innerHTML=e;let u=[...t.childNodes];return new Promise(o=>{const a=e=>{if(e<u.length){const r=u[e];if(r.remove(),"SCRIPT"===r.tagName){const i=document.createElement("script");var t,n=r.src&&!r.async;n&&(i.onload=()=>{a(e+1)},i.onerror=()=>{console.error(`Fails to load script from "${i.src}"`),a(e+1)}),d.each(r.attributes,e=>i.setAttribute(e.name,e.value)),r.src||(t=`__vui__/scripts/js_${$vui.importScriptIndex}.js`,i.setAttribute("file",t),i.innerHTML=r.innerHTML+`\r
//From ${c}\r
//# sourceURL=`+t,$vui.importScriptIndex++),document.body.append(i),n||a(e+1)}else r._vui_base_url=s,p?l.before(r):l.append(r),a(e+1)}else $vui.config.debug&&console.log("Included "+c),p&&l.remove(),o()};a(0)})}).catch(e=>{console.error(`Fails to include ${comp} @ `+c,e)}))}}),Promise.all(n)}return Promise.reject(`Fails to include ${e} !`)},$vui.ready(()=>{const i=$vui._,{directive:e,evaluateLater:o,effect:a,prefixed:t,addRootSelector:n}=Alpine;n(()=>`[${t("include")}]`),e("include",(n,{expression:r,modifiers:e},{})=>{if(r){n._vui_unwrap=e.includes("unwrap");let t=r.trim();if(t.startsWith(".")||t.startsWith("/")||t.startsWith("http://")||t.startsWith("https://"))$vui.include(n,[t]);else{let e=o(n,r);a(()=>e(e=>{i.isArray(e)?$vui.include(n,e):i.isString(e)?$vui.include(n,[e]):$vui.include(n,[t])}))}}})}),(()=>{function o(e){var t=parseInt(e.getAttribute("tabindex"),10);return isNaN(t)?"true"!==e.contentEditable&&("AUDIO"!==e.nodeName&&"VIDEO"!==e.nodeName&&"DETAILS"!==e.nodeName||null!==e.getAttribute("tabindex"))?e.tabIndex:0:t}function l(e,t){return e.tabIndex===t.tabIndex?e.documentOrder-t.documentOrder:e.tabIndex-t.tabIndex}function i(e){return"INPUT"===e.tagName}function r(e){if(!e.name)return 1;function t(e){return n.querySelectorAll('input[type="radio"][name="'+e+'"]')}var n=e.form||e.ownerDocument;if("undefined"!=typeof window&&void 0!==window.CSS&&"function"==typeof window.CSS.escape)r=t(window.CSS.escape(e.name));else try{r=t(e.name)}catch(e){return console.error("Looks like you have a radio button with a name attribute containing invalid CSS selector characters and need the CSS.escape polyfill: %s",e.message),0}var r=function(e,t){for(var n=0;n<e.length;n++)if(e[n].checked&&e[n].form===t)return e[n]}(r,e.form);return!r||r===e}function d(e){return i(t=e)&&"radio"===t.type&&!r(e);var t}var e=["input","select","textarea","a[href]","button","[tabindex]","audio[controls]","video[controls]",'[contenteditable]:not([contenteditable="false"])',"details>summary:first-of-type","details"],a=e.join(","),u="undefined"==typeof Element?function(){}:Element.prototype.matches||Element.prototype.msMatchesSelector||Element.prototype.webkitMatchesSelector,s=function(e,t,n){var r=Array.prototype.slice.apply(e.querySelectorAll(a));return t&&u.call(e,a)&&r.unshift(e),r=r.filter(n)},c=function(e,t){return!(t.disabled||i(n=t)&&"hidden"===n.type||function(e,t){if("hidden"===getComputedStyle(e).visibility)return!0;var n=u.call(e,"details>summary:first-of-type")?e.parentElement:e;if(u.call(n,"details:not([open]) *"))return!0;if(t&&"full"!==t){if("non-zero-area"===t)return t=(n=e.getBoundingClientRect()).width,n=n.height,0===t&&0===n}else for(;e;){if("none"===getComputedStyle(e).display)return!0;e=e.parentElement}return!1}(t,e.displayCheck)||"DETAILS"===(n=t).tagName&&Array.prototype.slice.apply(n.children).some(function(e){return"SUMMARY"===e.tagName})||function(e){if(i(e)||"SELECT"===e.tagName||"TEXTAREA"===e.tagName||"BUTTON"===e.tagName)for(var t=e.parentElement;t;){if("FIELDSET"===t.tagName&&t.disabled){for(var n=0;n<t.children.length;n++){var r=t.children.item(n);if("LEGEND"===r.tagName)return!r.contains(e)}return!0}t=t.parentElement}return!1}(t));var n},A=function(e,t){var r=[],i=[];return s(e,(t=t||{}).includeContainer,function(e,t){return!(!c(e,t)||d(t)||o(t)<0)}.bind(null,t)).forEach(function(e,t){var n=o(e);0===n?r.push(e):i.push({documentOrder:t,tabIndex:n,node:e})}),i.sort(l).map(function(e){return e.node}).concat(r)},p=e.concat("iframe").join(","),w=function(e,t){if(t=t||{},!e)throw new Error("No node provided");return!1!==u.call(e,p)&&c(t,e)};function t(t,e){var n,r=Object.keys(t);return Object.getOwnPropertySymbols&&(n=Object.getOwnPropertySymbols(t),e&&(n=n.filter(function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable})),r.push.apply(r,n)),r}function E(r){for(var e=1;e<arguments.length;e++){var i=null!=arguments[e]?arguments[e]:{};e%2?t(Object(i),!0).forEach(function(e){var t,n;t=r,n=i[e=e],e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n}):Object.getOwnPropertyDescriptors?Object.defineProperties(r,Object.getOwnPropertyDescriptors(i)):t(Object(i)).forEach(function(e){Object.defineProperty(r,e,Object.getOwnPropertyDescriptor(i,e))})}return r}function f(e,t){function a(e,t,n){return e&&void 0!==e[t]?e[t]:r[n||t]}function i(e){var t=r[e];if(!t)return null;var n=t;if("string"==typeof t&&!(n=u.querySelector(t)))throw new Error("`".concat(e,"` refers to no known node"));if("function"==typeof t&&!(n=t()))throw new Error("`".concat(e,"` did not return a node"));return n}function o(){if(s.tabbableGroups=s.containers.map(function(e){var t=A(e);if(0<t.length)return{container:e,firstTabbableNode:t[0],lastTabbableNode:t[t.length-1]}}).filter(function(e){return!!e}),s.tabbableGroups.length<=0&&!i("fallbackFocus"))throw new Error("Your focus-trap must have at least one container with at least one tabbable node in it at all times")}function p(e){var t=i("setReturnFocus");return t||e}function f(){return s.active&&(N.activateTrap(d),s.delayInitialFocusTimer=r.delayInitialFocus?S(function(){l(c())}):l(c()),u.addEventListener("focusin",b,!0),u.addEventListener("mousedown",v,{capture:!0,passive:!1}),u.addEventListener("touchstart",v,{capture:!0,passive:!1}),u.addEventListener("click",y,{capture:!0,passive:!1}),u.addEventListener("keydown",g,{capture:!0,passive:!1}),d)}function m(){return s.active&&(u.removeEventListener("focusin",b,!0),u.removeEventListener("mousedown",v,!0),u.removeEventListener("touchstart",v,!0),u.removeEventListener("click",y,!0),u.removeEventListener("keydown",g,!0),d)}var u=document,r=E({returnFocusOnDeactivate:!0,escapeDeactivates:!0,delayInitialFocus:!0},t),s={containers:[],tabbableGroups:[],nodeFocusedBeforeActivation:null,mostRecentlyFocusedNode:null,active:!1,paused:!1,delayInitialFocusTimer:void 0},n=function(t){return s.containers.some(function(e){return e.contains(t)})},c=function(){var e;if(!1===a({},"initialFocus"))return!1;if(!(e=null!==i("initialFocus")?i("initialFocus"):n(u.activeElement)?u.activeElement:(e=s.tabbableGroups[0])&&e.firstTabbableNode||i("fallbackFocus")))throw new Error("Your focus-trap needs to have at least one focusable element");return e},l=function e(t){!1!==t&&t!==u.activeElement&&(t&&t.focus?(t.focus({preventScroll:!!r.preventScroll}),s.mostRecentlyFocusedNode=t,x(t)&&t.select()):e(c()))},v=function(e){n(e.target)||($(r.clickOutsideDeactivates,e)?d.deactivate({returnFocus:r.returnFocusOnDeactivate&&!w(e.target)}):$(r.allowOutsideClick,e)||e.preventDefault())},b=function(e){var t=n(e.target);t||e.target instanceof Document?t&&(s.mostRecentlyFocusedNode=e.target):(e.stopImmediatePropagation(),l(s.mostRecentlyFocusedNode||c()))},h=function(t){o();var e,n,r=null;0<s.tabbableGroups.length?(n=_(s.tabbableGroups,function(e){return e.container.contains(t.target)}))<0?r=t.shiftKey?s.tabbableGroups[s.tabbableGroups.length-1].lastTabbableNode:s.tabbableGroups[0].firstTabbableNode:t.shiftKey?0<=(e=(e=_(s.tabbableGroups,function(e){e=e.firstTabbableNode;return t.target===e}))<0&&s.tabbableGroups[n].container===t.target?n:e)&&(e=0===e?s.tabbableGroups.length-1:e-1,r=s.tabbableGroups[e].lastTabbableNode):0<=(e=(e=_(s.tabbableGroups,function(e){e=e.lastTabbableNode;return t.target===e}))<0&&s.tabbableGroups[n].container===t.target?n:e)&&(n=e===s.tabbableGroups.length-1?0:e+1,r=s.tabbableGroups[n].firstTabbableNode):r=i("fallbackFocus"),r&&(t.preventDefault(),l(r))},g=function(e){if(O(e)&&!1!==$(r.escapeDeactivates))return e.preventDefault(),void d.deactivate();T(e)&&h(e)},y=function(e){$(r.clickOutsideDeactivates,e)||n(e.target)||$(r.allowOutsideClick,e)||(e.preventDefault(),e.stopImmediatePropagation())},d={activate:function(e){if(s.active)return this;function t(){i&&o(),f(),r&&r()}var n=a(e,"onActivate"),r=a(e,"onPostActivate"),i=a(e,"checkCanFocusTrap");i||o(),s.active=!0,s.paused=!1,s.nodeFocusedBeforeActivation=u.activeElement,n&&n();return i?i(s.containers.concat()).then(t,t):t(),this},deactivate:function(e){if(!s.active)return this;clearTimeout(s.delayInitialFocusTimer),s.delayInitialFocusTimer=void 0,m(),s.active=!1,s.paused=!1,N.deactivateTrap(d);function t(){S(function(){o&&l(p(s.nodeFocusedBeforeActivation)),r&&r()})}var n=a(e,"onDeactivate"),r=a(e,"onPostDeactivate"),i=a(e,"checkCanReturnFocus"),o=(n&&n(),a(e,"returnFocus","returnFocusOnDeactivate"));return o&&i?i(p(s.nodeFocusedBeforeActivation)).then(t,t):t(),this},pause:function(){return s.paused||!s.active||(s.paused=!0,m()),this},unpause:function(){return s.paused&&s.active&&(s.paused=!1,o(),f()),this},updateContainerElements:function(e){e=[].concat(e).filter(Boolean);return s.containers=e.map(function(e){return"string"==typeof e?u.querySelector(e):e}),s.active&&o(),this}};return d.updateContainerElements(e),d}n=[];var n,N={activateTrap:function(e){0<n.length&&((t=n[n.length-1])!==e&&t.pause());var t=n.indexOf(e);-1===t||n.splice(t,1),n.push(e)},deactivateTrap:function(e){e=n.indexOf(e);-1!==e&&n.splice(e,1),0<n.length&&n[n.length-1].unpause()}},x=function(e){return e.tagName&&"input"===e.tagName.toLowerCase()&&"function"==typeof e.select},O=function(e){return"Escape"===e.key||"Esc"===e.key||27===e.keyCode},T=function(e){return"Tab"===e.key||9===e.keyCode},S=function(e){return setTimeout(e,0)},_=function(e,n){var r=-1;return e.every(function(e,t){return!n(e)||(r=t,!1)}),r},$=function(e){for(var t=arguments.length,n=new Array(1<t?t-1:0),r=1;r<t;r++)n[r-1]=arguments[r];return"function"==typeof e?e.apply(void 0,n):e};function m(e){let n,r;window.addEventListener("focusin",()=>{n=r,r=document.activeElement}),e.magic("focus",e=>{let t=e;return{__noscroll:!1,__wrapAround:!1,within(e){return t=e,this},withoutScrolling(){return this.__noscroll=!0,this},noscroll(){return this.__noscroll=!0,this},withWrapAround(){return this.__wrapAround=!0,this},wrap(){return this.withWrapAround()},focusable(e){return w(e)},previouslyFocused(){return n},lastFocused(){return n},focused(){return r},focusables(){return Array.isArray(t)?t:(e=t,s(e,(e=(e={displayCheck:"none"})||{}).includeContainer,c.bind(null,e)));var e},all(){return this.focusables()},isFirst(e){let t=this.all();return t[0]&&t[0].isSameNode(e)},isLast(e){let t=this.all();return t.length&&t.slice(-1)[0].isSameNode(e)},getFirst(){return this.all()[0]},getLast(){return this.all().slice(-1)[0]},getNext(){let e=this.all();var t=document.activeElement;if(-1!==e.indexOf(t))return this.__wrapAround&&e.indexOf(t)===e.length-1?e[0]:e[e.indexOf(t)+1]},getPrevious(){let e=this.all();var t=document.activeElement;if(-1!==e.indexOf(t))return this.__wrapAround&&0===e.indexOf(t)?e.slice(-1)[0]:e[e.indexOf(t)-1]},first(){this.focus(this.getFirst())},last(){this.focus(this.getLast())},next(){this.focus(this.getNext())},previous(){this.focus(this.getPrevious())},prev(){return this.previous()},focus(e){e&&setTimeout(()=>{e.hasAttribute("tabindex")||e.setAttribute("tabindex","0"),e.focus({preventScroll:this._noscroll})})}}}),e.directive("trap",e.skipDuringClone((t,{expression:e,modifiers:n},{effect:r,evaluateLater:i,cleanup:l})=>{let d=i(e),o=!1,a=f(t,{escapeDeactivates:!1,allowOutsideClick:!0,fallbackFocus:()=>t,initialFocus:t.querySelector("[autofocus]")}),u=()=>{},s=()=>{};const c=()=>{u(),u=()=>{},s(),s=()=>{},a.deactivate({returnFocus:!n.includes("noreturn")})};r(()=>d(e=>{o!==e&&(e&&!o&&setTimeout(()=>{n.includes("inert")&&(u=v(t)),n.includes("noscroll")&&(s=function(){let e=document.documentElement.style.overflow,t=document.documentElement.style.paddingRight,n=window.innerWidth-document.documentElement.clientWidth;return document.documentElement.style.overflow="hidden",document.documentElement.style.paddingRight=n+"px",()=>{document.documentElement.style.overflow=e,document.documentElement.style.paddingRight=t}}()),a.activate()}),!e&&o&&c(),o=!!e)})),l(c)},(e,{expression:t,modifiers:n},{evaluate:r})=>{n.includes("inert")&&r(t)&&v(e)}))}function v(e){let n=[];return function t(n,r){if(n.isSameNode(document.body)||!n.parentNode)return;Array.from(n.parentNode.children).forEach(e=>{e.isSameNode(n)||r(e),t(n.parentNode,r)})}(e,e=>{let t=e.hasAttribute("aria-hidden");e.setAttribute("aria-hidden","true"),n.push(()=>t||e.removeAttribute("aria-hidden"))}),()=>{for(;n.length;)n.pop()()}}document.addEventListener("alpine:init",()=>{window.Alpine.plugin(m)})})();