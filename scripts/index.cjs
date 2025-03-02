
function setupVimeshUI(G = {}) {
    setupCore(G)
    setupXComponent(G)
    setupXImport(G)
    setupXInclude(G)
    setupXStyle(G)
    return G.$vui
}

module.exports = {
    setupVimeshUI,
    setupCore,
    setupXComponent,
    setupXImport,
    setupXInclude,
    setupXStyle
}