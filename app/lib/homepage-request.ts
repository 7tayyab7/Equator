/** Router versions use /_.data or /_root.data for homepage data navigation. */
export function isHomepageRequest(url:string){const path=new URL(url).pathname;return path==='/'||path==='/_.data'||path==='/_root.data';}
