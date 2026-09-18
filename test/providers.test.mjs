// SPDX-License-Identifier: MIT
// Copyright (c) 2026 jacbus1 and DL Anything You Want contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {normalizeSource} from '../lib/core.mjs';
import {resolveMedia} from '../lib/providers.mjs';
const share=normalizeSource('https://www.threads.com/share/_dLMLrgDN/');
const post='https://www.threads.com/@author/post/ABC123';
function page() {
  const stream=Readable.from([Buffer.from('<script type="application/json">{"code":"ABC123","video_versions":[{"url":"https://video.cdninstagram.com/test.mp4"}]}</script>')]);
  stream.headers={'content-type':'text/html'};
  return stream;
}
test('Threads share redirects establish and then lock the post identity',async()=>{
  const result=await resolveMedia(share,{}, {open:async(url,{validate})=>{
    if (url === post) { assert(validate(post)); assert(!validate(share.url)); return page(); }
    assert.equal(url,share.url);
    assert(validate(url));
    for(const bad of ['https://evil.test/t/ABC123','https://www.threads.com/share/OTHER/','https://www.instagram.com/p/ABC123/','https://www.threads.com:8443/@a/post/ABC123']) assert(!validate(bad));
    assert(validate(post));
    assert(!validate('https://www.threads.com/@author/post/OTHER'));
    assert(!validate(share.url));
    assert(validate(post+'?tracking=1'));
    return page();
  }});
  assert.equal(result.items.length,1);
  assert.equal(result.items[0].type,'video');
});
test('Threads share without a post redirect fails closed',async()=>{
  await assert.rejects(resolveMedia(share,{}, {open:async(url,{validate})=>{assert(validate(url));return page();}}),{code:'THREADS_UNAVAILABLE'});
});
test('Direct Threads links cannot switch identity or redirect to share links',async()=>{
  await resolveMedia(normalizeSource(post),{}, {open:async(url,{validate})=>{
    assert(validate(url));assert(!validate(share.url));assert(!validate('https://www.threads.com/@a/post/OTHER'));return page();
  }});
});
test('YouTube MP3 requests Cobalt audio conversion',async()=>{
  const source=normalizeSource('https://youtu.be/aqz-KE-bpKQ');
  const result=await resolveMedia(source,{cobaltURL:'http://cobalt:9000/',cobaltKey:''},{format:'mp3',open:async(url,options)=>{
    assert.equal(url,'http://cobalt:9000/'); const body=JSON.parse(options.body);
    assert.equal(body.downloadMode,'audio'); assert.equal(body.audioFormat,'mp3'); assert.equal(body.audioBitrate,'128');
    const stream=Readable.from([Buffer.from(JSON.stringify({status:'tunnel',url:'http://cobalt:9000/tunnel?id=1',filename:'title.mp3'}))]);stream.headers={'content-type':'application/json'};return stream;
  }});
  assert.equal(result.items[0].type,'audio');assert.equal(result.items[0].filename,'dl-anything-01.mp3');
});
test('YouTube TEXT requests audio and marks it for local multilingual transcription',async()=>{
  const source=normalizeSource('https://youtu.be/aqz-KE-bpKQ');
  const result=await resolveMedia(source,{cobaltURL:'http://cobalt:9000/',cobaltKey:''},{format:'txt',open:async(url,options)=>{
    assert.equal(JSON.parse(options.body).downloadMode,'audio');
    const stream=Readable.from([Buffer.from(JSON.stringify({status:'tunnel',url:'http://cobalt:9000/tunnel?id=1',filename:'title.mp3'}))]);stream.headers={'content-type':'application/json'};return stream;
  }});
  assert.equal(result.items[0].type,'text');assert.equal(result.items[0].filename,'dl-anything-01.txt');assert.equal(result.items[0].transcode,'txt');
});
test('Threads PNG selection marks images for conversion',async()=>{
  const photoPage=()=>{const stream=Readable.from([Buffer.from('<script type="application/json">{"code":"ABC123","media_type":1,"image_versions2":{"candidates":[{"url":"https://x.fbcdn.net/photo.jpg","width":100,"height":100}]}}</script>')]);stream.headers={'content-type':'text/html'};return stream;};
  const result=await resolveMedia(normalizeSource(post),{}, {format:'png',open:async()=>photoPage()});
  assert.equal(result.items[0].filename,'dl-anything-01.png');assert.equal(result.items[0].transcode,'png');
});
