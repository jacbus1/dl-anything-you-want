// SPDX-License-Identifier: MIT
// Copyright (c) 2026 jacbus1 and DL Anything You Want contributors
'use strict';
const $=id=>document.getElementById(id);
const isEnglish=document.documentElement.lang.startsWith('en');
const t=isEnglish?{
  invalidConfig:'Invalid API configuration',invalidSource:'Use a valid HTTPS URL from the selected platform.',
  files:n=>`${n} file${n===1?'':'s'}`,note:'Each link works once and expires in about one minute.',photo:'PNG image',video:'MP4 video',audio:'MP3 audio',text:'TEXT transcript',save:'Save',opened:'Opened',
  unsafe:'The server returned an unsafe download path.',openedNote:'The browser opened the download. Resolve the link again if it expired.',
  clipboard:'Clipboard access was denied. Paste the link manually.',consent:'Confirm that you may download this content.',api:'Configure a valid API URL first.',
  working:'Preparing…',workingNote:'Preparing the selected output…',noApi:'This address has no download API. The GitHub Pages site is the frontend only.',
  failed:'Could not create a download link.',empty:'The response contains no downloadable file.',ready:'Download link ready.',timeout:'The request timed out.',
  offline:'Cannot reach the download API.',button:'Download →',engineOff:'API online · engine stopped',online:'API online',notConnected:'API offline',
  frontendOnly:'The page is online. Start or connect the download backend to download videos.'
}:{
  invalidConfig:'API 設定無效',invalidSource:'請貼上所選平台的有效 HTTPS 網址。',
  files:n=>`${n} 個檔案`,note:'每條連結只能使用一次，約一分鐘內有效。',photo:'PNG 圖片',video:'MP4 影片',audio:'MP3 音訊',text:'TEXT 文字',save:'儲存',opened:'已開啟',
  unsafe:'後端返回不安全的下載路徑。',openedNote:'瀏覽器已開啟下載；若連結過期，請重新解析。',
  clipboard:'瀏覽器未授予剪貼簿權限，請手動貼上。',consent:'請先確認你擁有下載權利。',api:'請先設定有效的 API 網址。',
  working:'準備中…',workingNote:'正在準備所選格式…',noApi:'此地址沒有下載 API；GitHub Pages 只提供介面。',failed:'無法建立下載連結。',
  empty:'回應中沒有可下載檔案。',ready:'下載連結已準備好。',timeout:'解析逾時。',offline:'無法連接下載 API。',button:'下載 →',
  engineOff:'API 在線 · 引擎未啟動',online:'API 在線',notConnected:'API 離線',frontendOnly:'網站已載入；請啟動或連接下載後端。'
};
const englishErrors={
  ENGINE_NOT_CONFIGURED:'The download engine is not running.',SOURCE_UNAVAILABLE:'The platform could not provide this public video.',
  SOURCE_BLOCKED:'The platform blocked anonymous access or requires login.',SOURCE_RATE_LIMITED:'The platform is rate limiting requests. Try again later.',
  UNSUPPORTED_URL:'Use a supported public post or video URL.',THREADS_UNAVAILABLE:'No downloadable media was found in this Threads post.',
  FORMAT_UNAVAILABLE:'This post has no media in the selected format.',PLATFORM_MISMATCH:'The selected platform does not match the URL.',
  INVALID_FORMAT:'Choose MP4, MP3, PNG or TEXT.',INVALID_LANGUAGE:'Choose a supported spoken language.',CONVERSION_FAILED:'Conversion or transcription failed.',
  CONVERTER_UNAVAILABLE:'The local converter is unavailable.',TRANSCRIBER_NOT_CONFIGURED:'The local transcription engine is not configured.',FILE_TOO_LARGE:'The media exceeds the size limit.',INVALID_MEDIA:'The source returned an invalid media file.',
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
  $('language-wrap').hidden=choice('format')!=='txt';
}
document.querySelectorAll('input[name="platform"]').forEach(x=>x.addEventListener('change',updateChoices)); updateChoices();
document.querySelectorAll('input[name="format"]').forEach(x=>x.addEventListener('change',updateChoices));
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
    const icon=document.createElement('div'); icon.className='file-icon'; icon.textContent=item.type==='photo'?'▧':item.type==='audio'?'♪':item.type==='text'?'T':'▷'; icon.setAttribute('aria-hidden','true');
    const info=document.createElement('div'); info.className='file-info';
    const name=document.createElement('strong'); name.textContent=item.filename;
    const detail=document.createElement('small'); detail.textContent=item.type==='photo'?t.photo:item.type==='audio'?t.audio:item.type==='text'?t.text:t.video;
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
  const platform=choice('platform'); const format=choice('format'); const language=$('language').value; let url;
  try{url=safeSource($('source-url').value,platform);}catch(err){return message(t.invalidSource,true);}
  busy=true; $('resolve').disabled=true; $('resolve').textContent=t.working; message(t.workingNote);
  try {
    const response=await fetch(apiBase+'/api/resolve',{method:'POST',credentials:'omit',referrerPolicy:'no-referrer',headers:{'Content-Type':'application/json'},body:JSON.stringify({url,platform,format,language,consent:true}),signal:AbortSignal.timeout(65000)});
    let data;
    try{data=await response.json();}catch{throw new Error(t.noApi);}
    if(!response.ok)throw new Error((isEnglish&&englishErrors[data.error?.code])||data.error?.message||t.failed);
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
