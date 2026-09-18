// SPDX-License-Identifier: MIT
// Copyright (c) 2026 jacbus1 and DL Anything You Want contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { Readable } from 'node:stream';
import { createApp, readConfig } from '../server.mjs';
const source='https://instagram.com/p/ABC123/';
const origin='http://localhost:3000';
async function boot(t,options={}) {
 const app=createApp(readConfig({}),options);app.listen(0,'127.0.0.1');await once(app,'listening');
 t.after(()=>new Promise(resolve=>{app.closeAllConnections();app.close(resolve);}));
 const base=`http://127.0.0.1:${app.address().port}`;
 return {base,post:(body,extra={})=>fetch(base+'/api/resolve',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...extra},body:JSON.stringify(body)})};
}
const resolver=async()=>({items:[{url:'https://x.fbcdn.net/example.mp4',type:'video',filename:'dl-anything-01.mp4'}],experimental:true,provider:'test-fixture'});
test('HTTP health does not claim live verification',async t=>{const {base}=await boot(t);const d=await(await fetch(base+'/api/health')).json();assert.equal(d.instagram,'not-configured');assert.equal(d.threads,'experimental-not-live-verified');});
test('HTTP frontend serves; secret paths are not public',async t=>{
 const {base}=await boot(t);const r=await fetch(base+'/');assert.equal(r.status,200);assert.match(await r.text(),/DL Anything You Want/);assert.equal(r.headers.get('x-content-type-options'),'nosniff');
 const english=await fetch(base+'/en/');assert.equal(english.status,200);assert.match(await english.text(),/<html lang="en">/);
 assert.equal((await fetch(base+'/robots.txt')).status,200);assert.equal((await fetch(base+'/sitemap.xml')).status,200);
 for(const path of ['/.env','/server.mjs','/lib/core.mjs','/docs/repository-snapshots.json','/%2e%2e/.env']) assert.equal((await fetch(base+path)).status,404);
});
test('HTTP blocks third-party origin',async t=>{const {post}=await boot(t,{resolver});const r=await post({url:source,consent:true},{Origin:'https://evil.test'});assert.equal(r.status,403);});
test('HTTP CORS preflight permits only configured origin',async t=>{
 const {base}=await boot(t);const r=await fetch(base+'/api/resolve',{method:'OPTIONS',headers:{Origin:origin}});assert.equal(r.status,204);assert.equal(r.headers.get('access-control-allow-origin'),origin);
});
test('HTTP consent, session fields and unsupported URL checks',async t=>{
 const {post}=await boot(t,{resolver});for(const body of [{url:source},{url:source,consent:true,cookies:'secret'},{url:'https://evil.test',consent:true}]) assert.equal((await post(body)).status,400);
});
test('HTTP missing engine fails honestly',async t=>{const {post}=await boot(t);const r=await post({url:source,consent:true});assert.equal(r.status,503);assert.equal((await r.json()).error.code,'ENGINE_NOT_CONFIGURED');});
test('HTTP resolve issues opaque path, not upstream URL',async t=>{
 const {post}=await boot(t,{resolver});const r=await post({url:source,consent:true});assert.equal(r.status,200);const d=await r.json();assert.match(d.items[0].path,/^\/api\/file\/[a-f0-9]{48}$/);assert(!JSON.stringify(d).includes('fbcdn.net'));
});
test('HTTP fixture media stream and one-time link',async t=>{
 const openMedia=async()=>{const s=Readable.from([Buffer.from('fixture-bytes')]);s.headers={'content-type':'video/mp4','content-length':'13'};return s;};
 const {base,post}=await boot(t,{resolver,openMedia});const d=await(await post({url:source,consent:true})).json();const r=await fetch(base+d.items[0].path);assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'video/mp4');assert.match(r.headers.get('content-disposition'),/attachment/);assert.equal(await r.text(),'fixture-bytes');assert.equal((await fetch(base+d.items[0].path)).status,410);
});
test('HTTP rejects error page disguised as media',async t=>{
 const openMedia=async()=>{const s=Readable.from(['<html>blocked</html>']);s.headers={'content-type':'text/html'};return s;};
 const {base,post}=await boot(t,{resolver,openMedia});const d=await(await post({url:source,consent:true})).json();const r=await fetch(base+d.items[0].path);assert.equal(r.status,502);assert.equal((await r.json()).error.code,'INVALID_MEDIA');
});
test('HTTP rate limiter ignores spoofed forwarding headers',async t=>{
 const {post}=await boot(t,{resolver});for(let i=0;i<6;i++)assert.equal((await post({url:source,consent:true},{'X-Forwarded-For':`8.8.8.${i}`})).status,200);
 const r=await post({url:source,consent:true},{'X-Forwarded-For':'1.1.1.1'});assert.equal(r.status,429);assert.equal(r.headers.get('retry-after'),'60');
});
test('HTTP no raw-URL proxy route',async t=>{const {base}=await boot(t);assert.equal((await fetch(base+'/api/file?url=http://127.0.0.1')).status,404);});
test('config excludes official hosted Cobalt API and credentials',()=>{
 for(const v of ['https://api.cobalt.tools/','https://user:pass@own.test/','ftp://own.test/','http://own.test/admin'])assert.throws(()=>readConfig({COBALT_URL:v}));
});

test('HTTP caps concurrent resolvers even when three bodies arrive after admission', async t => {
 const { request } = await import('node:http');
 let release;
 const gate = new Promise(resolve => { release = resolve; });
 let calls = 0;
 const app = createApp(readConfig({}), {resolver: async () => {
  calls++;
  await gate;
  return resolver();
 }});
 app.listen(0, '127.0.0.1'); await once(app, 'listening');
 t.after(() => { release(); app.closeAllConnections(); app.close(); });
 let admitted = 0, allAdmitted;
 const admission = new Promise(resolve => { allAdmitted = resolve; });
 app.on('request', () => { if (++admitted === 3) allAdmitted(); });
 const body = JSON.stringify({url: source, consent: true});
 const requests = [];
 const responses = Array.from({length: 3}, () => new Promise((resolve, reject) => {
  const req = request({hostname:'127.0.0.1',port:app.address().port,path:'/api/resolve',method:'POST',
   headers:{Origin:origin,'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}}, res => {
    res.resume(); res.on('end', () => resolve(res.statusCode));
  });
  req.on('error',reject); requests.push(req); req.flushHeaders();
 }));
 await admission;
 for (const req of requests) req.end(body);
 // Two requests remain in the resolver; the third must fail without entering it.
 const status = await Promise.race([...responses, new Promise((_, reject) => {
  const timer = setTimeout(() => reject(new Error('third resolver was not rejected')), 2000);
  t.after(() => clearTimeout(timer));
 })]);
 assert.equal(status,503); assert.equal(calls,2);
 release();
 assert.deepEqual((await Promise.all(responses)).sort(),[200,200,503]);
});
