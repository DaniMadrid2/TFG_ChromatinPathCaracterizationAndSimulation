import { installLocalFileShims } from './dependencies/assets/localFetchShim.js';

declare global {
  interface Window {
    blogDirName?: string;
    dntiDir?: string;
    DNTIHandleResize?: () => void;
    __TFGLocalMode?: boolean;
  }
}

installLocalFileShims();

window.__TFGLocalMode = true;
window.blogDirName = '.';
window.dntiDir = '.';

if (typeof window.DNTIHandleResize !== 'function') {
  window.DNTIHandleResize = () => {};
}

const hideIfEmpty = (selector: string) => {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (el && !el.children.length && !el.textContent?.trim()) el.style.display = 'none';
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    hideIfEmpty('#nav');
    hideIfEmpty('#mininav');
  }, { once: true });
} else {
  hideIfEmpty('#nav');
  hideIfEmpty('#mininav');
}

console.log('[TFG local] bootstrap listo');

export {};
