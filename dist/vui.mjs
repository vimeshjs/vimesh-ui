// Vimesh UI v0.14.0
function setupCore(t){if(!t.$vui){t.$vui={config:{debug:!1},ready(e){t.Alpine?e():document.addEventListener("alpine:init",e)}};const e=new Date,o=t.$vui._={elapse(){return new Date-e},isString(e){return null!=e&&"string"==typeof e.valueOf()},isArray(e){return Array.isArray(e)},isFunction(e){return"function"==typeof e},isPlainObject(e){return null!==e&&"object"==typeof e&&e.constructor===Object},each(e,n){e&&(o.isArray(e)?e.forEach((e,t)=>{n(e,t,t)}):Object.entries(e).forEach(([e,t],r)=>{n(t,e,r)}))},map(e,n){let i=[];return o.each(e,(e,t,r)=>i.push(n(e,t,r))),i},filter(e,n){let i=[];return o.each(e,(e,t,r)=>n(e,t,r)&&i.push(e)),i},extend(r,...t){var n=t.length;if(n<1||null==r)return r;for(let e=0;e<n;e++){const i=t[e];o.isPlainObject(i)&&Object.keys(i).forEach(e=>{var t=Object.getOwnPropertyDescriptor(i,e);t.get||t.set?Object.defineProperty(r,e,t):r[e]=i[e]})}return r}}}}function setupXComponent(e){if(!e.$vui)return console.error("Vimesh UI core is not loaded!");const T=e.$vui;T.setups||(T.setups={}),T.components||(T.components={}),T.ready(()=>{const l=T._,{directive:e,prefixed:p,addRootSelector:t,magic:r,closestDataStack:o,mergeProxies:s,initTree:v,mutateDom:x,reactive:b}=Alpine,y="v-ui",d="v-cloak",A="vui",m=p("component"),a=p("import"),f=p("data"),$=p("init"),N=p("ignore"),c=[A];let u=document.createElement("style");function E(e){e&&(e=e.trim(),-1===c.indexOf(e)&&c.push(e))}function g(e){if(e._vui_type)return!0;if(e.tagName){var t=e.tagName.indexOf("-");if(-1===t)return!1;e=e.tagName.substring(0,t).toLowerCase();if(!0===T.config.autoImport)return!0;if(-1!==c.indexOf(e))return!0}return!1}function _(e){return k(e,g)}function k(e,t){return e.parentNode?t(e.parentNode)?e.parentNode:k(e.parentNode,t):null}function n(e,t){if("TEMPLATE"===e.tagName)return e._x_teleport?(g(e._x_teleport)&&t(e._x_teleport),n(e._x_teleport,t)):n(e.content,t);l.each(e.querySelectorAll("*"),e=>{if(g(e)&&t(e),"TEMPLATE"===e.tagName)return e._x_teleport?(g(e._x_teleport)&&t(e._x_teleport),n(e._x_teleport,t)):n(e.content,t)})}function i(e,r){if(!e)return null;if(e._vui_type){if(l.isString(r)){let t=r;r=e=>e._vui_type===t}if(!r||r(e))return e}return e._x_teleportBack?i(e._x_teleportBack.parentNode,r):i(e.parentNode,r)}function w(n,e){if(l.isFunction(n))return n;if(l.isPlainObject(n))return e=>e._vui_type===n.type&&(!n.namespace||e._vui_namespace===n.namespace);{let t="",r=n;var i=n.split(":");return 1<i.length&&(t=i[0]||e,r=i[1]),e=>e._vui_type===r&&(!t||e._vui_namespace===t)}}function h(e,t){const r=i(e,t);if(!r)return null;e={$of(e){return e?h((r._x_teleportBack||r).parentNode,w(e,r._vui_namespace)):h((r._x_teleportBack||r).parentNode)},get $meta(){return C(r)},get $parent(){return _(r)},$closest(e){return i(r,w(e,r._vui_namespace))},$find(e){return L(r,w(e,r._vui_namespace))},$findOne(e){e=L(r,w(e,r._vui_namespace));return 0<e.length?e[0]:null}};return s([e,r._vui_api||{},...o(r)])}function C(e){return{type:e._vui_type,namespace:e._vui_namespace}}function L(e,r){if(l.isString(r)){let t=r;r=e=>e._vui_type===t}let t=[];return n(e,e=>{r&&!r(e)||t.push(e)}),t}u.setAttribute("id","vimesh-ui-component-common-styles"),u.innerHTML=`
    [v-ui] {display : block}
    [${d}] {display: none !important;}
    `,document.head.prepend(u),T.addNamespace=E,T.getComponentMeta=C,T.isComponent=g,T.visitComponents=n,T.findChildComponents=L,T.getParentComponent=_,T.findClosestComponent=i,T.$api=e=>h(e),T.$data=Alpine.$data,T.setHtml=(e,t)=>{e.innerHTML="";t=T.dom(t);l.isArray(t)?e.append(...t):e.append(t)},T.defer=e=>{queueMicrotask(e)},T.dom=e=>{const t=document.createElement("div");return t._x_ignore=!0,t.innerHTML=e,T.extractNamespaces(t),T.prepareComponents(t),1===t.childNodes.length?t.firstChild:[...t.childNodes]},T.nextTick=Alpine.nextTick,T.effect=Alpine.effect,T.focus=(e,t)=>e&&e.focus&&e.focus(t||{preventScroll:!0}),T.scrollIntoView=(e,t)=>e&&e.scrollIntoView&&e.scrollIntoView(t||{block:"nearest"}),T.extractNamespaces=e=>{l.each([e,...e.querySelectorAll("*")],e=>{"TEMPLATE"===e.tagName&&T.extractNamespaces(e.content),l.each(e.attributes,t=>{let e=t.name;if(e.startsWith(m))E(function(e){var t=e.indexOf(":");if(-1===t)return A;var r=e.indexOf(".",t);return-1===r?e.substring(t+1):e.substring(t+1,r)}(e));else if(e.startsWith(a)&&t.value){let e=t.value.trim();e.startsWith("[")&&e.endsWith("]")||(e=e.split(";"),l.each(e,e=>{var t=e.indexOf(":");-1!==t&&E(e.substring(0,t))}))}})})},T.prepareComponents=e=>{n(e,e=>{!0===T.config.autoImport&&T.import(e.tagName.replace("-",":").toLowerCase()),e.setAttribute(d,""),e.setAttribute(N,"")})},l.each(T.config.importMap,(e,t)=>{"*"!==t&&T.addNamespace(t)}),T.extractNamespaces(document),T.prepareComponents(document),t(()=>`[${m}]`),r("api",e=>h(e)),r("prop",n=>(e,t)=>{var r=i(n);return r?Alpine.bound(r,e,t):null}),e("shtml",(t,{expression:e},{effect:r,evaluateLater:n})=>{let i=n(e);r(()=>{i(e=>{T.setHtml(t,e)})})}),e("component",(t,{expression:o,value:e,modifiers:r},{})=>{if("template"!==t.tagName.toLowerCase())return console.warn("x-component can only be used on a <template> tag",t);const s=e||T.config.namespace||A,a=s+"-"+o,c=r.includes("unwrap"),n=t.content.querySelector("script");if(n){const i=document.createElement("script");l.each(n.attributes,e=>i.setAttribute(e.name,e.value)),i.setAttribute("component",a),i.innerHTML=`
$vui.setups["${a}"] = ($el)=>{
${n.innerHTML}
}
//# sourceURL=__vui__/${a}.js
`,document.body.append(i),n.remove()}function u(e,r){l.each(e.attributes,t=>{if(m!==t.name&&!t.name.startsWith(m))try{let e=t.name;e.startsWith("@")?e=p("on")+":"+e.substring(1):e.startsWith(":")&&(e=p("bind")+":"+e.substring(1)),$===e&&r.getAttribute($)?r.setAttribute(e,t.value+";"+r.getAttribute($)):f===e&&r.getAttribute(f)?r.setAttribute(e,"{..."+t.value+",..."+r.getAttribute(f)+"}"):"class"===e?r.setAttribute(e,t.value+" "+(r.getAttribute("class")||"")):r.hasAttribute(e)||r.setAttribute(e,t.value)}catch(e){console.warn(`Fails to set attribute ${t.name}=${t.value} in `+r.tagName.toLowerCase())}})}customElements.get(a.toLowerCase())||(T.components[a]=class extends HTMLElement{connectedCallback(){let r=this,e=_(r);for(;e;){if(!e.hasAttribute(y)&&!e._vui_type)return void(T.config.debug&&console.log("Not ready to connect "+this.tagName));e=_(e)}r.setAttribute(y,T.config.debug?""+l.elapse():""),T.config.debug&&console.log("Connect "+this.tagName),x(()=>{const n={},i=[];l.each(this.childNodes,e=>{var t,r;e.tagName&&e.hasAttribute("slot")?(t=e.getAttribute("slot")||"",r="TEMPLATE"===e.tagName?e.content.cloneNode(!0).childNodes:[e.cloneNode(!0)],n[t]?n[t].push(...r):n[t]=r):i.push(e.cloneNode(!0))}),c?((r=t.content.cloneNode(!0).firstElementChild)._vui_processing=!0,u(this,r),this.after(r),this.remove()):(r._vui_processing=!0,r.innerHTML=t.innerHTML),u(t,r);var e=r.querySelectorAll("slot");if(l.each(e,e=>{var t=e.getAttribute("name")||"";e.after(...n[t]||i),e.remove()}),!c||!g(r)){r._vui_type=o,r._vui_namespace=s;let e=T.setups[a],t=(e&&(r._vui_api=b(e(r))),r.hasAttribute(f)||r.setAttribute(f,"{}"),_(r)||k(r,e=>e._vui_processing));!t||t._vui_type?(T.config.debug&&console.log("Plan initTree "+this.tagName),queueMicrotask(()=>{if(r.isConnected){if(r.removeAttribute(d),r.removeAttribute(N),delete r._x_ignore,T.config.debug&&console.log("Process initTree "+this.tagName),v(r),r._vui_processing&&delete r._vui_processing,r._vui_api){let e=h(r);e.onMounted&&e.onMounted()}l.each(r._vui_deferred_elements,t=>{if(t._vui_api){let e=h(t);e.onMounted&&e.onMounted()}}),delete r._vui_deferred_elements}})):(T.config.debug&&console.log("Defer initTree "+this.tagName),t._vui_deferred_elements||(t._vui_deferred_elements=[]),t._vui_deferred_elements.push(r),r._vui_deferred_elements&&t._vui_deferred_elements.push(...r._vui_deferred_elements),queueMicrotask(()=>{r.removeAttribute(d),r.removeAttribute(N),delete r._x_ignore}))}})}disconnectedCallback(){if(T.config.debug&&console.log((this.hasAttribute(y)?"Disconnect ":"Not ready to disconnect ")+this.tagName),this._vui_api){let e=h(this);e.onUnmounted&&e.onUnmounted()}}attributeChangedCallback(t,r,n){if(this._vui_api){let e=h(this);e.onAttributeChanged&&e.onAttributeChanged(t,r,n)}}},customElements.define(a.toLowerCase(),T.components[a]))})})}function setupXImport(e){if(!e.$vui)return console.error("Vimesh UI core is not loaded!");const d=e.$vui;d.import=e=>{if(e){const p=d._,s=d.config.importMap;if(d.imports||(d.imports={}),d.importScriptIndex||(d.importScriptIndex=1),p.isString(e)&&(e=[e]),p.isArray(e)){const a=[];return p.each(e,o=>{if(o){let u=o=o.trim(),r=s["*"],l=null,n="",e=o.indexOf(":"),i=(-1!==e&&(n=o.substring(0,e),o=o.substring(e+1),n&&d.addNamespace(n)),e=o.lastIndexOf("/"),"");-1!==e&&(i=o.substring(0,e+1),o=o.substring(e+1)),p.each(o.split(","),e=>{e=e.trim();e={path:i,namespace:n,component:e,fullname:(n?n+":":"")+i+e};if(!(r=e.namespace&&s[e.namespace]?s[e.namespace]:r))return console.error(`Url template for namespace '${e.namespace}' is not defined!`);try{const t=new Function("data","with (data){return `"+r+"`}");l=t(e)}catch(e){return void console.error(`Fails to parse url template ${r} with component `+o)}if(l&&!d.imports[l]){let c={url:l,...e};d.imports[l]=c,a.push(fetch(l).then(e=>{if(!e.ok)throw Error(`${e.status} (${e.statusText})`);return e.text()}).then(e=>{const t=document.createElement("div");t._x_ignore=!0,t.innerHTML=e,c.html=e;let a=[...t.childNodes];return new Promise(o=>{const s=e=>{if(e<a.length){const n=a[e];if(n.remove(),"LINK"===n.tagName)document.head.append(n),s(e+1);else if("SCRIPT"===n.tagName){n.hasAttribute("use-meta")&&(n.innerHTML=`const __import_meta__ = ${JSON.stringify(c)}\r
`+n.innerHTML);const i=document.createElement("script");var t,r=n.src&&!n.async;r&&(i.onload=()=>{s(e+1)},i.onerror=()=>{console.error(`Fails to load script from "${i.src}"`),s(e+1)}),p.each(n.attributes,e=>i.setAttribute(e.name,e.value)),n.src||(t=`__vui__/scripts/js_${d.importScriptIndex}.js`,i.setAttribute("file",t),i.innerHTML=n.innerHTML+`\r
//# sourceURL=`+t,d.importScriptIndex++),document.body.append(i),r||s(e+1)}else"TEMPLATE"===n.tagName&&(d.extractNamespaces(n),d.prepareComponents(n),document.body.append(n)),s(e+1)}else d.config.debug&&console.log(`Imported ${u} @ `+l),o()};s(0)})}).catch(e=>{console.error(`Fails to import ${u} @ `+l,e)}))}})}}),Promise.all(a)}return Promise.reject(`Fails to import ${e} !`)}},d.ready(()=>{d._;const{directive:e,prefixed:o,addRootSelector:t}=Alpine;t(()=>`[${o("import")}]`),e("import",(e,{expression:t,value:r},{effect:n,evaluateLater:i})=>{if(t)if(r)if("dynamic"===r||"dyn"===r){let e=i(t);n(()=>e(e=>d.import(e)))}else console.error(o("import")+`:${r} is not allowed!`);else d.import(t.split(";"))})})}function setupXInclude(e){if(!e.$vui)return console.error("Vimesh UI core is not loaded!");const m=e.$vui;m.include=(l,e)=>{const p=m._,d=l._vui_unwrap;let t;for(let e=l;e&&!(t=e._vui_base_url);e=e.parentElement);if(t=t||document.baseURI,p.isArray(e)){const r=[];return p.each(e,u=>{if(u=u.trim()){let c=new URL(u,t).href,e;if("#"==u[0]){let r=u.substring(1);e=new Promise(e=>{var t=document.getElementById(r);e(t&&t.innerHTML||"")})}else e=fetch(c).then(e=>e.text());r.push(e.then(e=>{const t=document.createElement("div");t._x_ignore=!0,t.innerHTML=e;let a=[...t.childNodes];return new Promise(o=>{const s=e=>{if(e<a.length){const n=a[e];if(n.remove(),"SCRIPT"===n.tagName){const i=document.createElement("script");var t,r=n.src&&!n.async;r&&(i.onload=()=>{s(e+1)},i.onerror=()=>{console.error(`Fails to load script from "${i.src}"`),s(e+1)}),p.each(n.attributes,e=>i.setAttribute(e.name,e.value)),n.src||(t=`__vui__/scripts/js_${m.importScriptIndex}.js`,i.setAttribute("file",t),i.innerHTML=n.innerHTML+`\r
//From ${u}\r
//# sourceURL=`+t,m.importScriptIndex++),document.body.append(i),r||s(e+1)}else n._vui_base_url=c,d?(n._x_dataStack=l._x_dataStack,l.before(n)):l.append(n),s(e+1)}else m.config.debug&&console.log("Included "+u),d&&l.remove(),o()};s(0)})}).catch(e=>{console.error("Fails to include "+u,e)}))}}),Promise.all(r)}return Promise.reject(`Fails to include ${e} !`)},m.ready(()=>{const s=m._,{directive:e,prefixed:t,addRootSelector:r}=Alpine;r(()=>`[${t("include")}]`),e("include",(r,{expression:n,modifiers:e},{effect:i,evaluateLater:o})=>{if(n){r._vui_unwrap=e.includes("unwrap");let t=n.trim();if(t.startsWith("#")||t.startsWith(".")||t.startsWith("/")||t.startsWith("http://")||t.startsWith("https://"))m.include(r,[t]);else{let e=o(n);i(()=>e(e=>{s.isArray(e)?m.include(r,e):s.isString(e)?m.include(r,[e]):m.include(r,[t])}))}}})})}function setupXStyle(t){if(!t.$vui)return console.error("Vimesh UI core is not loaded!");const g=t.$vui;g.ready(()=>{const{directive:e,bound:u,reactive:i}=t.Alpine,l={},p=(l.default=i({}),i({current:"default"})),d=new Map,m=(g.setStyle=function(e,t,r){void 0===r&&(r=t,t=e,e=p.current);let n=l[e];(n=n||(l[e]=i({})))[t]={base:r.base||"",variants:r.variants||{},compoundVariants:r.compoundVariants||[],defaultVariants:r.defaultVariants||{},parts:r.parts||{},parent:r.parent||null}},g.getStyle=function(e,t){return void 0===t&&(t=e,e=p.current),l[e][t]},g.loadStyles=function(e){Object.entries(e).forEach(([e,t])=>{g.setStyle(e,t)})},g.loadThemes=function(e){Object.entries(e).forEach(([r,e])=>{Object.entries(e).forEach(([e,t])=>{g.setStyle(r,e,t)})})},g.configClassCategories=function(e){Object.assign(f,e)},g.setTheme=function(e){p.current=e,l[e]||(l[e]=i({}))},g.getTheme=function(){return p.current},new WeakMap),f={margin:{regex:/^m[trblxy]?-/,key:/^m[trblxy]?-/},padding:{regex:/^p[trblxy]?-/,key:/^p[trblxy]?-/},textSize:{regex:/^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/},textAlign:{regex:/^text-(left|center|right|justify)$/},textColor:{regex:/^text-/,exclude:"textSize,textAlign"},fontWeight:{regex:/^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/},backgroundColor:{regex:/^bg-/},borderColor:{regex:/^border-/,exclude:"borderWidth"},borderWidth:{regex:/^border(-[0-9]+)?$|^border-(t|r|b|l|x|y)(-[0-9]+)?$/,key:/^border(-[trblxy])?/},borderRadius:{regex:/^rounded(-[trblse])?(-[a-z]+)?$/,key:/^rounded(-[trblse])?/},width:{regex:/^(w-|min-w-|max-w-)/,key:/^(w-|min-w-|max-w-)/},height:{regex:/^(h-|min-h-|max-h-)/,key:/^(h-|min-h-|max-h-)/},position:{regex:/^(top-|right-|bottom-|left-|inset-)/,key:/^(top-|right-|bottom-|left-|inset-)/},shadow:{regex:/^shadow(-[a-z]+)?$/},display:{regex:/^(block|inline|inline-block|flex|inline-flex|grid|inline-grid|hidden)$/},flex:{regex:/^flex-/,key:/^flex-[a-z]+/},grid:{regex:/^grid-/,key:/^grid-[a-z]+/},gap:{regex:/^gap-/,key:/^gap-[xy]?/},space:{regex:/^space-[xy]-/,key:/^space-[xy]-/}};function s(o,e,t){if(g.getStyle(e)){if(m.has(o)){const n=m.get(o);n.forEach(e=>o.classList.remove(e))}const s=[],a={},c={},r=(!function e(t,r,n,i){var o;l[t]&&l[t][r]&&((o=l[t][r]).parent&&e(o.parent,r,n,i),i(n?o.parts[n]:o,t,r))}(p.current,e,t,n=>{if(n.base&&s.push(n.base),n.variants&&Object.keys(n.variants).forEach(e=>{let t=a[e];var r;void 0===t&&(t=a[e]=function(e,t){t="data-"+t;let r=u(e,t);return void 0===r&&e._x_part&&e._x_part.hostElement&&(e=e._x_part.hostElement,r=u(e,t)),r}(o,e)),n.defaultVariants&&void 0!==n.defaultVariants[e]&&(c[e]=n.defaultVariants[e]),void 0!==(t=void 0===t?c[e]:t)&&(r="boolean"==typeof t?String(t):t,n.variants[e]&&n.variants[e][r]&&s.push(n.variants[e][r]))}),n.compoundVariants){const i={...c,...a};n.compoundVariants.forEach(r=>{if(void 0!==r.conditions){let t=!1;if("string"==typeof r.conditions)try{let e=d.get(r.conditions);e||(e=r.conditions.includes("=>")||r.conditions.startsWith("function")?new Function("return "+r.conditions)():new Function("v","el","return "+r.conditions),d.set(r.conditions,e)),t=e(i,o)}catch(e){console.error("Error evaluating condition string:",e)}else t="function"==typeof r.conditions?r.conditions(i,o):Object.entries(r.conditions).every(([e,t])=>Array.isArray(t)?t.includes(i[e]):i[e]===t);t&&s.push(r.classes)}})}}),function(...e){const t=e.filter(Boolean).join(" ").split(" ").filter(Boolean),a={},r=(Object.keys(f).forEach(e=>{a[e]=new Map}),a.other=new Map,t.forEach(t=>{let r=!1;for(var[n,i]of Object.entries(f))if(i.regex.test(t)){if(i.exclude){let e=!1;if("string"==typeof i.exclude)for(const o of i.exclude.split(",")){const s=f[o.trim()];if(s&&s.regex.test(t)){e=!0;break}}else Array.isArray(i.exclude)?e=i.exclude.some(e=>e.test(t)):i.exclude instanceof RegExp&&(e=i.exclude.test(t));if(e)continue}let e;e=i.key?(i=t.match(i.key))?i[0]:n:n,a[n].set(e,t),r=!0;break}r||a.other.set(t,t)}),[]);return Object.values(a).forEach(e=>{e.forEach(e=>r.push(e))}),r}(...s));r.forEach(e=>o.classList.add(e)),m.set(o,r)}}e("style",(e,{expression:t},{effect:r})=>{const n=t;r(()=>{s(e,n)})}),e("part",(t,{expression:e},{effect:r})=>{const n=e;let i=t.parentElement;for(;i&&!i.hasAttribute("x-style");)i=i.parentElement;if(i){const o=i.getAttribute("x-style");t._x_part||(t._x_part={hostElement:i,componentName:o,partName:n}),r(()=>{var e=g.getStyle(o);e&&e.parts&&e.parts[n]&&s(t,o,n)})}})})}function setupVimeshUI(e={}){return setupCore(e),setupXComponent(e),setupXImport(e),setupXInclude(e),setupXStyle(e),e.$vui}export default setupVimeshUI;export{setupVimeshUI,setupCore,setupXComponent,setupXImport,setupXInclude,setupXStyle};