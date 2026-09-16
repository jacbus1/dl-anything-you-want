// SPDX-License-Identifier: MIT
// Copyright (c) 2026 jacbus1 and FramePocket contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { normalizeSource, isPublicIPv4, isMediaURL, parseCobalt, parseThreadsHTML, TicketStore, RateLimiter } from '../lib/core.mjs';
import { openURL, readBounded } from '../lib/network.mjs';
const cdn='https://video.cdninstagram.com/example.mp4';
const cobalt='http://cobalt:9000/';
const script=x=>`<script type="application/json">${JSON.stringify(x)}</script>`;

for (const [input,platform,id] of [
 ['https://www.instagram.com/p/ABC123/?utm_source=test','instagram','ABC123'],
 ['https://instagram.com/reel/ABC_def/#test','instagram','ABC_def'],
 ['https://m.instagram.com/reels/ABC123','instagram','ABC123'],
 ['https://instagram.com/tv/ABC123/','instagram','ABC123'],
 ['https://www.threads.net/@author/post/ABC123?x=y','threads','ABC123'],
 ['https://threads.com/@a.b/post/ABC123/','threads','ABC123'],
 ['https://threads.net/t/ABC123','threads','ABC123']]) {
 test(`normalizes ${input}`,()=>{const s=normalizeSource(input);assert.equal(s.platform,platform);assert.equal(s.id,id);assert(!s.url.includes('?'));assert(!s.url.includes('#'));});
}
for (const input of [null, '', 1,'http://instagram.com/p/ABC123/','https://instagram.com.evil.test/p/ABC123/',
 'https://instagram.com@evil.test/p/ABC123/','https://u:p@instagram.com/p/ABC123/','https://instagram.com:8080/p/ABC123/',
 'https://127.0.0.1/p/ABC123/','https://instagram.com/author/','https://instagram.com/stories/author/123/',
 'https://instagram.com/share/reel/ABC123/','https://threads.com/@author/','https://evil.test','javascript:alert(1)',
 'https://instagram.com/p/ABC%2f123/','https://instagram.com\\@evil.test/p/ABC123/']) {
 test(`rejects unsafe/unsupported input ${String(input)}`,()=>assert.throws(()=>normalizeSource(input)));
}
for (const ip of ['127.0.0.1','10.1.2.3','172.16.0.1','172.31.2.1','192.168.1.2','169.254.169.254','100.64.0.1','0.0.0.0','224.1.1.1','198.18.0.1','192.0.2.1','198.51.100.1','203.0.113.1','::1','999.1.1.1'])
 test(`blocks nonpublic IPv4 ${ip}`,()=>assert.equal(isPublicIPv4(ip),false));
test('accepts public IPv4',()=>assert.equal(isPublicIPv4('8.8.8.8'),true));
test('media domain boundary and tunnel scope',()=>{
 assert(isMediaURL(cdn));assert(isMediaURL('https://x.fbcdn.net/a.mp4'));assert(isMediaURL('http://cobalt:9000/tunnel?id=123',cobalt));
 for(const u of ['https://fbcdn.net.evil.test/a.mp4','https://evil.test/a.mp4','http://x.fbcdn.net/a.mp4','https://u:p@x.fbcdn.net/a.mp4','http://cobalt:9000/admin','http://cobalt:8000/tunnel']) assert(!isMediaURL(u,cobalt));
});
test('Cobalt mixed carousel',()=>{const x=parseCobalt({status:'picker',picker:[{type:'photo',url:'https://x.fbcdn.net/a.jpg'},{type:'video',url:cdn}]},cobalt);assert.equal(x.length,2);assert.equal(x[0].type,'photo');assert.equal(x[1].filename,'framepocket-02.mp4');});
test('Cobalt signed tunnel',()=>assert.equal(parseCobalt({status:'tunnel',url:'http://cobalt:9000/tunnel?id=123',filename:'bad-caption.mp4'},cobalt)[0].filename,'framepocket-01.mp4'));
test('Cobalt redirects support a single image',()=>assert.equal(parseCobalt({status:'redirect',url:'https://x.fbcdn.net/a.jpg',filename:'a.jpg'},cobalt)[0].type,'photo'));
test('Cobalt unknown/error/unsafe response fails closed',()=>{for(const d of [{status:'error'},{status:'local-processing'},{status:'picker',picker:[]},{status:'redirect',url:'https://evil.test/a.mp4'},{status:'picker',picker:[{type:'audio',url:cdn}]}]) assert.throws(()=>parseCobalt(d,cobalt));});
test('Threads matches exact post, never recommendations',()=>{
 const x=parseThreadsHTML(script({posts:[{code:'OTHER',video_versions:[{url:'https://x.fbcdn.net/wrong.mp4'}]},{code:'ABC123',video_versions:[{url:cdn,width:1920,height:1080}]}]}),'ABC123');assert.deepEqual(x.map(v=>v.url),[cdn]);
});
test('Threads chooses largest available video candidate',()=>{
 const x=parseThreadsHTML(script({code:'ABC123',video_versions:[{url:'https://x.fbcdn.net/low.mp4',width:640,height:360},{url:cdn,width:1920,height:1080}]}),'ABC123');assert.equal(x[0].url,cdn);
});
test('Threads carousel videos deduplicate',()=>{
 const x=parseThreadsHTML(script({code:'ABC123',carousel_media:[{video_versions:[{url:cdn}]},{video_versions:[{url:cdn}]},{video_versions:[{url:'https://x.fbcdn.net/b.mp4'}]}]}),'ABC123');assert.equal(x.length,2);
});
test('Threads OG fallback verifies post and decodes entities',()=>{
 const html=`<meta property="og:url" content="https://threads.net/@a/post/ABC123"><meta content="https://x.fbcdn.net/a.mp4?a=1&amp;b=2" property="og:video">`;
 assert.equal(parseThreadsHTML(html,'ABC123')[0].url,'https://x.fbcdn.net/a.mp4?a=1&b=2');
});
test('Threads ignores unrelated OG video',()=>assert.throws(()=>parseThreadsHTML(`<meta property="og:url" content="https://threads.com/@a/post/OTHER"><meta property="og:video" content="${cdn}">`,'ABC123')));
test('Threads refuses a private flag',()=>assert.throws(()=>parseThreadsHTML(script({code:'ABC123',user:{is_private:true},video_versions:[{url:cdn}]}),'ABC123')));
test('Threads ignores avatars/photos and scripts that require execution',()=>{
 for(const h of ['<html>Log in</html>',script({code:'OTHER',video_versions:[{url:cdn}]}),script({code:'ABC123',image_versions2:{candidates:[{url:'https://x.fbcdn.net/avatar.jpg'}]}}),'<script>globalThis.sentinel=true</script>']) assert.throws(()=>parseThreadsHTML(h,'ABC123'));
 assert.equal(globalThis.sentinel,undefined);
});
test('Threads rejects unsafe video URLs',()=>assert.throws(()=>parseThreadsHTML(script({code:'ABC123',video_versions:[{url:'http://127.0.0.1/internal'}]}),'ABC123')));
test('ticket one-time use, entropy length, expiration, bounded store',()=>{
 let now=0;const s=new TicketStore({now:()=>now,ttl:10,max:1});const t=s.issue({url:cdn,type:'video',filename:'x.mp4'});
 assert.equal(t.id.length,48);assert.throws(()=>s.issue({}));assert.equal(s.take(t.id).url,cdn);assert.throws(()=>s.take(t.id));
 const t2=s.issue({url:cdn});now=11;assert.throws(()=>s.take(t2.id));assert.doesNotThrow(()=>s.issue({url:cdn}));
});
test('rate window resets and keys are bounded',()=>{
 let now=0;const r=new RateLimiter({limit:2,windowMs:10,maxKeys:1,now:()=>now});assert(r.allow('a'));assert(r.allow('a'));assert(!r.allow('a'));assert(!r.allow('b'));now=11;assert(r.allow('b'));
});
test('network validation rejects before connecting',async()=>{
 await assert.rejects(openURL('https://evil.test',{validate:()=>false}));await assert.rejects(openURL('http://127.0.0.1',{validate:()=>true}));
});
test('bounded reading refuses oversized streams',async()=>{const s=Readable.from([Buffer.alloc(11)]);await assert.rejects(readBounded(s,10));});

test('Threads OG fallback rejects conflicting canonical identity', () => {
 const html = `<link rel="canonical" href="https://threads.com/@a/post/OTHER"><meta property="og:url" content="https://threads.com/@a/post/ABC123"><meta property="og:video" content="${cdn}">`;
 assert.throws(() => parseThreadsHTML(html, 'ABC123'), {code:'THREADS_UNAVAILABLE'});
});
