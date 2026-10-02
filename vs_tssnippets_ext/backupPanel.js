function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[character]);
}

function renderBackupPanel(model) {
    const option = (value, label, selected) => `<option value="${escapeHtml(value)}"${selected ? " selected" : ""}>${escapeHtml(label)}</option>`;
    const variants = model.variants.map((item) => option(item.relativeDir, item.label, item.relativeDir === model.variantDirectory)).join("");
    const generations = model.generations.map((item) => option(item, item === 1 ? "1 (base, primera)" : String(item), item === model.generation)).join("");
    const availableFiles = model.files.filter((file) => file.filePath);
    const fileOptions = availableFiles.map((file) => option(file.label, file.label, file.label === model.selectedFile)).join("");
    const sections = model.files.map((file) => {
        const heading = `<h2>${escapeHtml(file.label)}</h2>`;
        if (!file.filePath) return `<section>${heading}<p class="muted">No hay archivo para esta iteracion.</p></section>`;
        const fileName = `<div class="filename">${escapeHtml(file.filePath)}</div>`;
        if (file.error) return `<section>${heading}${fileName}<p class="muted">${escapeHtml(file.error)}</p></section>`;
        if (file.image) {
            const channels = file.image.ranges.map((range) => `<span><b>${escapeHtml(range.name)}</b> ${escapeHtml(range.min === null ? "n/a" : Number(range.min).toPrecision(5))} - ${escapeHtml(range.max === null ? "n/a" : Number(range.max).toPrecision(5))}</span>`).join("");
            return `<section>${heading}${fileName}<div class="size">${escapeHtml(file.size)}</div><div class="image-wrap"><img src="${file.image.uri}" width="${file.image.width}" height="${file.image.height}" alt="${escapeHtml(file.label)}"></div><div class="legend">${channels}</div><p class="muted">Cada canal se escala entre su minimo y maximo; el alfa conserva su valor 0-1.</p></section>`;
        }
        return `<section>${heading}${fileName}<pre>${escapeHtml(file.text || "Sin datos legibles.")}</pre></section>`;
    }).join("");
    const nonce = Math.random().toString(36).slice(2);
    return `<!doctype html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'"><style nonce="${nonce}">
        body{margin:0;color:var(--vscode-foreground);background:var(--vscode-editor-background);font-family:var(--vscode-font-family);font-size:13px}header{position:sticky;top:0;z-index:2;background:var(--vscode-editor-background);border-bottom:1px solid var(--vscode-panel-border);padding:12px 16px}h1{font-size:15px;margin:0 0 10px}h2{font-size:13px;margin:0 0 6px} .controls{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:end}label{display:grid;gap:4px;color:var(--vscode-descriptionForeground)}select,button{min-height:28px;font:inherit;color:var(--vscode-input-foreground);background:var(--vscode-input-background);border:1px solid var(--vscode-input-border);border-radius:3px;padding:3px 6px}button{color:var(--vscode-button-foreground);background:var(--vscode-button-background);cursor:pointer;padding:3px 12px}button:hover{background:var(--vscode-button-hoverBackground)}button:disabled{opacity:.5;cursor:default}main{padding:0 16px 24px}section{padding:14px 0;border-bottom:1px solid var(--vscode-panel-border)}.filename,.size,.muted{color:var(--vscode-descriptionForeground);font-size:12px}.filename{overflow-wrap:anywhere}.size{margin:8px 0}.image-wrap{overflow:auto;max-height:65vh}.image-wrap img{display:block;max-width:100%;height:auto;image-rendering:pixelated}.legend{display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:8px}.legend span{white-space:nowrap}pre{overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;font-family:var(--vscode-editor-font-family);font-size:12px}
    </style></head><body><header><h1>${escapeHtml(model.title)}</h1><div class="controls"><label>Ruta<select id="path">${variants}</select></label><label>Contenido<select id="scope">${option("single", "Salidas del draw", model.scope === "single")}${option("all", "Todos los archivos", model.scope === "all")}</select></label><label>Iteracion<select id="generation">${generations}</select></label><label>Archivo<select id="file">${fileOptions}</select></label><button id="open"${availableFiles.length ? "" : " disabled"}>Open File</button></div></header><main>${sections || '<p class="muted">No hay backups para esta seleccion.</p>'}</main><script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        for (const id of ["path", "scope", "generation"]) document.getElementById(id).addEventListener("change", event => vscode.postMessage({type:"select", field:id, value:event.target.value}));
        document.getElementById("file").addEventListener("change", event => vscode.postMessage({type:"file", value:event.target.value}));
        document.getElementById("open").addEventListener("click", () => vscode.postMessage({type:"open", value:document.getElementById("file").value}));
    </script></body></html>`;
}

module.exports = { renderBackupPanel };
