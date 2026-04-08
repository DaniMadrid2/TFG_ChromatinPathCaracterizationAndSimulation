import { LOCAL_BINARY_ASSETS, LOCAL_PROJECT_NAME, LOCAL_TEXT_ASSETS } from './localAssetManifest.js';

const textTypes: Record<string,string> = {
  '.frag': 'text/plain; charset=utf-8',
  '.vert': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

function extnameFromKey(key: string){
  const clean = key.split('?')[0].split('#')[0];
  const idx = clean.lastIndexOf('.');
  return idx >= 0 ? clean.slice(idx).toLowerCase() : '';
}

function bytesFromBase64(base64: string){
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) out[i]=bin.charCodeAt(i);
  return out;
}

function normalizeCandidates(input: RequestInfo | URL){
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const set = new Set<string>();
  set.add(raw);
  try{
    const url = new URL(raw, window.location.href);
    const pathname = decodeURIComponent(url.pathname);
    set.add(pathname);
    const marker = '/' + LOCAL_PROJECT_NAME + '/';
    const at = pathname.lastIndexOf(marker);
    if(at >= 0){
      set.add('/' + pathname.slice(at + marker.length));
    }
    if(at >= 0){
      const localPath = '/' + pathname.slice(at + marker.length);
      set.add(localPath);
      if(localPath.startsWith('/src/')) set.add(localPath.slice(4));
    }
    if(pathname.endsWith('/alive_2.mat')) set.add('/data/alive_2.mat');
  }catch{}
  return [...set];
}

function rewriteAssetUrl(raw: string){
  if(raw.startsWith('/Imgs/')) return new URL('../static/Images/' + raw.slice('/Imgs/'.length), import.meta.url).toString();
  return raw;
}

export function installLocalFileShims(){
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    for(const key of normalizeCandidates(input)){
      if(Object.prototype.hasOwnProperty.call(LOCAL_TEXT_ASSETS,key)){
        const body = LOCAL_TEXT_ASSETS[key];
        return new Response(body,{status:200,headers:{'Content-Type': textTypes[extnameFromKey(key)] || 'text/plain; charset=utf-8'}});
      }
      if(Object.prototype.hasOwnProperty.call(LOCAL_BINARY_ASSETS,key)){
        return new Response(bytesFromBase64(LOCAL_BINARY_ASSETS[key]),{status:200,headers:{'Content-Type':'application/octet-stream'}});
      }
    }
    return nativeFetch(input as any, init);
  };

  const desc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
  if(desc?.set && desc.get){
    Object.defineProperty(HTMLImageElement.prototype,'src',{
      configurable:true,
      enumerable:desc.enumerable ?? true,
      get(){ return desc.get!.call(this); },
      set(value: string){ return desc.set!.call(this, rewriteAssetUrl(String(value ?? ''))); }
    });
  }

  const patchExistingImages = () => {
    document.querySelectorAll('img[src^="/Imgs/"]').forEach((img) => {
      const src = img.getAttribute('src');
      if(src) img.setAttribute('src', rewriteAssetUrl(src));
    });
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patchExistingImages, { once: true });
  else patchExistingImages();
}
