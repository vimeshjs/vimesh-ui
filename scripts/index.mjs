

function setupVimeshUI(G = {}) {
    setupCore(G)
    setupXComponent(G)
    setupXImport(G)
    setupXInclude(G)
    setupXStyle(G)
    return G.$vui
}

export default setupVimeshUI

export {
    setupVimeshUI,
    setupCore,
    setupXComponent,
    setupXImport,
    setupXInclude,
    setupXStyle
}