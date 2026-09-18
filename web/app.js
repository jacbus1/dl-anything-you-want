// SPDX-License-Identifier: MIT
// Copyright (c) 2026 jacbus1 and DL Anything You Want contributors
'use strict';
const $=id=>document.getElementById(id);
const t={
  invalidConfig:'Invalid API configuration',invalidSource:'Use a valid HTTPS URL from the selected platform.',
  files:n=>`${n} file${n===1?'':'s'}`,note:'Each link works once and expires in about one minute.',photo:'PNG image',video:'MP4 video',audio:'MP3 audio',save:'Save',opened:'Opened',
  unsafe:'The server returned an unsafe download path.',openedNote:'The browser opened the download. Resolve the link again if it expired.',
  clipboard:'Clipboard access was denied. Paste the link manually.',consent:'Confirm that you may download this content.',api:'Configure a valid API URL first.',
  working:'Preparing…',workingNote:'Preparing the selected output…',noApi:'This address has no download API. The GitHub Pages site is the frontend only.',
  failed:'Could not create a download link.',empty:'The response contains no downloadable file.',ready:'Download link ready.',timeout:'The request timed out.',
  offline:'Cannot reach the download API.',button:'Download →',engineOff:'API online · engine stopped',online:'API online',notConnected:'API offline',
  frontendOnly:'The page is online. Start or connect the download backend to download videos.'
};
const englishErrors={
  ENGINE_NOT_CONFIGURED:'The download engine is not running.',SOURCE_UNAVAILABLE:'The platform could not provide this public video.',
  SOURCE_BLOCKED:'The platform blocked anonymous access or requires login.',SOURCE_RATE_LIMITED:'The platform is rate limiting requests. Try again later.',
  UNSUPPORTED_URL:'Use a supported public post or video URL.',THREADS_UNAVAILABLE:'No downloadable media was found in this Threads post.',
  FORMAT_UNAVAILABLE:'This post has no media in the selected format.',PLATFORM_MISMATCH:'The selected platform does not match the URL.',
  INVALID_FORMAT:'Choose MP4, MP3 or PNG.',CONVERSION_FAILED:'Conversion failed.',
  CONVERTER_UNAVAILABLE:'The local converter is unavailable.',FILE_TOO_LARGE:'The media exceeds the size limit.',INVALID_MEDIA:'The source returned an invalid media file.',
  RATE_LIMITED:'Too many requests. Try again in one minute.',BUSY:'The service is busy. Try again shortly.'
};
let apiBase='';
try {
  const raw=window.DL_ANYTHING_CONFIG?.apiBase || window.location.origin;
  const u=new URL(raw);
  if (u.username || u.password || u.pathname!=='/' || u.search || u.hash ||
    !(u.protocol==='https:' || (u.protocol==='http:' && ['localhost','127.0.0.1'].includes(u.hostname)))) throw new Error('invalid API origin');
  apiBase=u.origin;
} catch { $('connection').textContent=t.invalidConfig; }
function message(text,error=false) { $('message').textContent=text; $('message').classList.toggle('error',error); }
function clearResults() { $('results').hidden=true; $('file-list').replaceChildren(); }
const platformHosts={
  facebook:['facebook.com','www.facebook.com','m.facebook.com','fb.watch'],instagram:['instagram.com','www.instagram.com','m.instagram.com'],
  threads:['threads.com','www.threads.com','threads.net','www.threads.net'],tiktok:['tiktok.com','www.tiktok.com','m.tiktok.com','vm.tiktok.com','vt.tiktok.com'],
  youtube:['youtube.com','www.youtube.com','m.youtube.com','youtu.be']
};
const placeholders={facebook:'https://www.facebook.com/reel/…',instagram:'https://www.instagram.com/reel/…',threads:'https://www.threads.com/@…/post/…',tiktok:'https://www.tiktok.com/@…/video/…',youtube:'https://www.youtube.com/watch?v=…'};
function choice(name){return document.querySelector(`input[name="${name}"]:checked`)?.value;}
function updateChoices(){
  const platform=choice('platform'); $('source-url').placeholder=placeholders[platform];
  const png=document.querySelector('input[name="format"][value="png"]'); png.disabled=['facebook','youtube'].includes(platform);
  if(png.disabled&&png.checked)document.querySelector('input[name="format"][value="mp4"]').checked=true;
}
document.querySelectorAll('input[name="platform"]').forEach(x=>x.addEventListener('change',updateChoices)); updateChoices();
function safeSource(input,platform) {
  const u=new URL(input.trim());
  if (u.protocol!=='https:' || u.username || u.password || u.port || !platformHosts[platform]?.includes(u.hostname)) throw new Error(t.invalidSource);
  return u.href;
}
function showResults(data) {
  clearResults(); $('results').hidden=false;
  $('result-count').textContent=t.files(data.items.length);
  $('result-note').textContent=t.note;
  for (const item of data.items) {
    const row=document.createElement('div'); row.className='file-row';
    const icon=document.createElement('div'); icon.className='file-icon'; icon.textContent=item.type==='photo'?'▧':item.type==='audio'?'♪':'▷'; icon.setAttribute('aria-hidden','true');
    const info=document.createElement('div'); info.className='file-info';
    const name=document.createElement('strong'); name.textContent=item.filename;
    const detail=document.createElement('small'); detail.textContent=item.type==='photo'?t.photo:item.type==='audio'?t.audio:t.video;
    info.append(name,detail);
    const control=document.createElement('a'); control.textContent=t.save;
    if (!/^\/api\/file\/[a-f0-9]{48}$/.test(item.path)) throw new Error(t.unsafe);
    control.href=apiBase+item.path; control.rel='noopener noreferrer'; control.referrerPolicy='no-referrer'; control.target='_blank';
    control.addEventListener('click',()=>{control.textContent=t.opened; message(t.openedNote);},{once:true});
    row.append(icon,info,control); $('file-list').append(row);
  }
}
$('paste').addEventListener('click',async()=>{
  try { $('source-url').value=await navigator.clipboard.readText(); $('source-url').focus(); }
  catch { message(t.clipboard); $('source-url').focus(); }
});
let busy=false;
$('download-form').addEventListener('submit',async e=>{
  e.preventDefault(); if(busy)return; clearResults();
  if (!$('consent').checked) return message(t.consent,true);
  if (!apiBase) return message(t.api,true);
  const platform=choice('platform'); const format=choice('format'); let url;
  try{url=safeSource($('source-url').value,platform);}catch(err){return message(t.invalidSource,true);}
  busy=true; $('resolve').disabled=true; $('resolve').textContent=t.working; message(t.workingNote);
  try {
    const response=await fetch(apiBase+'/api/resolve',{method:'POST',credentials:'omit',referrerPolicy:'no-referrer',headers:{'Content-Type':'application/json'},body:JSON.stringify({url,platform,format,consent:true}),signal:AbortSignal.timeout(65000)});
    let data;
    try{data=await response.json();}catch{throw new Error(t.noApi);}
    if(!response.ok)throw new Error(englishErrors[data.error?.code]||data.error?.message||t.failed);
    if(!Array.isArray(data.items)||!data.items.length||data.items.length>20)throw new Error(t.empty);
    showResults(data); message(t.ready);
  } catch(err) { clearResults(); message(err.name==='TimeoutError'?t.timeout:err.message==='Failed to fetch'?t.offline:err.message,true); }
  finally{busy=false;$('resolve').disabled=false;$('resolve').textContent=t.button;}
});
(async()=>{
  if(!apiBase)return;
  try{
    const r=await fetch(apiBase+'/api/health',{credentials:'omit',signal:AbortSignal.timeout(6000)}); const d=await r.json();
    if(!r.ok||d.status!=='ok')throw new Error();
    $('connection').textContent=d.engine==='not-configured'?t.engineOff:t.online; $('connection').classList.add('ok');
  }catch{$('connection').textContent=t.notConnected;message(t.frontendOnly);}
})();
