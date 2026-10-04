const CACHE='myschool-v5';
const STATIC=['./','./index.html','./style.css','./script.js','./manifest.webmanifest','./icons/icon.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.pathname.startsWith('/api/')||url.origin!=='self'&&url.origin!=='https://school-ai-fronted.onrender.com')return;
  e.respondWith((async()=>{
    try{
      const r=await fetch(e.request,{cache:'no-store'});
      if(r.ok&&url.origin===self.location.origin&&STATIC.includes(url.pathname.replace(/\\/$/,'/')||'/')){const c=await caches.open(CACHE);c.put(e.request,r.clone()).catch(()=>{})}
      return r;
    }catch(_){const c=await caches.match(e.request);return c||new Response('Offline',{status:503})}
  })());
});