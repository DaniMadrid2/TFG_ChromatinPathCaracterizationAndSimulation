import { installLocalFileShims } from './dependencies/assets/localFetchShim.js';
installLocalFileShims();
window.__TFGLocalMode = true;
window.blogDirName = '.';
window.dntiDir = '.';
if (typeof window.DNTIHandleResize !== 'function') {
    window.DNTIHandleResize = () => { };
}
const hideIfEmpty = (selector) => {
    const el = document.querySelector(selector);
    if (el && !el.children.length && !el.textContent?.trim())
        el.style.display = 'none';
};
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        hideIfEmpty('#nav');
        hideIfEmpty('#mininav');
    }, { once: true });
}
else {
    hideIfEmpty('#nav');
    hideIfEmpty('#mininav');
}
console.log('[TFG local] bootstrap listo');
