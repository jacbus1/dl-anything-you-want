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


/* Profile Research Mode */
const research={
  scan:null,
  analysis:null
};
const researchMsg=(text,error=false)=>{const el=$('research-message');if(!el)return;el.textContent=text;el.classList.toggle('error',error);};
const researchPlatform=()=>document.querySelector('input[name="research-platform"]:checked')?.value||'instagram';
const researchPlaceholders={
  instagram:'https://www.instagram.com/gittrend.io/',
  threads:'https://www.threads.com/@gittrend.io',
  tiktok:'https://www.tiktok.com/@gittrend.io'
};
document.querySelectorAll('input[name="research-platform"]').forEach(x=>x.addEventListener('change',()=>{
  $('research-url').placeholder=researchPlaceholders[researchPlatform()];
}));
function safeExternalPost(url,platform){
  try{const u=new URL(url);return u.protocol==='https:'&&platformHosts[platform]?.includes(u.hostname)?u.href:'';}catch{return'';}
}
function updateSelectedCount(){
  const boxes=[...document.querySelectorAll('.post-select')];
  const n=boxes.filter(x=>x.checked).length;
  $('selected-count').textContent=`${n} selected`;
  $('analyze-selected').disabled=n===0;
}
function postExcerpt(text){const s=String(text||'').replace(/\s+/g,' ').trim();return s.length>360?s.slice(0,357)+'…':s||'(No caption text)';}
function renderResearchPosts(data){
  research.scan=data;
  $('research-analysis').hidden=true;
  $('research-posts').hidden=false;
  $('research-profile-name').textContent=`@${data.profile.username}`;
  $('research-coverage').textContent=`${data.scan.posts_scanned} posts scanned · ${data.scan.provider}${data.scan.truncated?' · partial scan':''}`;
  const list=$('research-post-list');list.replaceChildren();
  for(const [index,post] of data.posts.entries()){
    const row=document.createElement('label');row.className='post-card';
    const check=document.createElement('input');check.type='checkbox';check.className='post-select';check.dataset.index=String(index);check.addEventListener('change',updateSelectedCount);
    const body=document.createElement('span');body.className='post-card-body';
    const meta=document.createElement('span');meta.className='post-meta';
    const date=document.createElement('span');date.textContent=post.date_utc?new Date(post.date_utc).toLocaleString():'Date unavailable';
    const repos=document.createElement('span');repos.textContent=post.github_candidates?.length?`GitHub: ${post.github_candidates.join(', ')}`:'No GitHub repo detected';
    meta.append(date,repos);
    const text=document.createElement('span');text.className='post-copy';text.textContent=postExcerpt(post.text);
    const link=document.createElement('a');link.textContent='Open post ↗';link.target='_blank';link.rel='noopener noreferrer';link.referrerPolicy='no-referrer';
    const href=safeExternalPost(post.url,data.profile.platform);if(href)link.href=href;else link.hidden=true;
    body.append(meta,text,link);row.append(check,body);list.append(row);
  }
  updateSelectedCount();
}
$('research-form')?.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!apiBase)return researchMsg(t.api,true);
  const platform=researchPlatform();const url=$('research-url').value.trim();const maxPosts=Number($('research-limit').value);
  $('research-scan').disabled=true;$('research-scan').textContent='Scanning…';researchMsg('Scanning public profile metadata…');
  $('research-posts').hidden=true;$('research-analysis').hidden=true;
  try{
    const r=await fetch(apiBase+'/api/profile-scan',{method:'POST',credentials:'omit',referrerPolicy:'no-referrer',headers:{'Content-Type':'application/json'},body:JSON.stringify({url,platform,maxPosts}),signal:AbortSignal.timeout(310000)});
    const data=await r.json();
    if(!r.ok)throw new Error(englishErrors[data.error?.code]||data.error?.message||'Profile scan failed.');
    if(!Array.isArray(data.posts))throw new Error('Invalid profile scan response.');
    renderResearchPosts(data);
    researchMsg(`Scan ready: ${data.posts.length} posts. Choose the posts to summarize.`);
  }catch(err){researchMsg(err.name==='TimeoutError'?'Profile scan timed out.':err.message==='Failed to fetch'?t.offline:err.message,true);}
  finally{$('research-scan').disabled=false;$('research-scan').textContent='Scan profile →';}
});
$('select-all')?.addEventListener('click',()=>{document.querySelectorAll('.post-select').forEach(x=>x.checked=true);updateSelectedCount();});
$('select-github')?.addEventListener('click',()=>{document.querySelectorAll('.post-select').forEach(x=>{const p=research.scan?.posts?.[Number(x.dataset.index)];x.checked=Boolean(p?.github_candidates?.length);});updateSelectedCount();});
$('clear-selection')?.addEventListener('click',()=>{document.querySelectorAll('.post-select').forEach(x=>x.checked=false);updateSelectedCount();});
function renderAnalysis(data){
  research.analysis=data;$('research-analysis').hidden=false;
  $('summary-provider').textContent=data.summary_provider==='configured-llm'?'AI summary':'Local summary';
  $('overall-summary').textContent=data.overall_summary||'';
  const themes=$('theme-list');themes.replaceChildren();
  for(const theme of data.themes||[]){const x=document.createElement('span');x.textContent=theme;themes.append(x);}
  const summaries=$('post-summaries');summaries.replaceChildren();
  for(const p of data.posts||[]){
    const card=document.createElement('article');card.className='summary-card';
    const title=document.createElement('div');title.className='summary-title';
    const id=document.createElement('strong');id.textContent=p.id;
    const link=document.createElement('a');link.textContent='Source ↗';link.target='_blank';link.rel='noopener noreferrer';const href=safeExternalPost(p.url,data.platform);if(href)link.href=href;else link.hidden=true;
    title.append(id,link);
    const summary=document.createElement('p');summary.textContent=p.summary||'';
    const points=document.createElement('div');points.className='theme-list';for(const k of p.key_points||[]){const s=document.createElement('span');s.textContent=k;points.append(s);}
    card.append(title,summary,points);summaries.append(card);
  }
  const repos=$('repo-list');repos.replaceChildren();
  for(const repo of data.repos||[]){
    const row=document.createElement('article');row.className='repo-card';
    const top=document.createElement('div');top.className='repo-card-top';
    const link=document.createElement('a');link.textContent=repo.full_name;link.target='_blank';link.rel='noopener noreferrer';link.href=/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(repo.url)?repo.url:'#';
    const meta=document.createElement('span');meta.textContent=`${repo.stars??0} ★ · ${repo.language||'Unknown'}${repo.archived?' · Archived':''}`;
    top.append(link,meta);
    const desc=document.createElement('p');desc.textContent=repo.description||'No GitHub description available.';
    const src=document.createElement('small');src.textContent=`Found in ${repo.source_posts?.length||0} selected post(s) · ${repo.verified?'GitHub verified':'direct link, not verified'}`;
    row.append(top,desc,src);repos.append(row);
  }
  $('download-repo-csv').hidden=!(data.csv&&data.repos?.length);
  $('research-analysis').scrollIntoView({behavior:'smooth',block:'start'});
}
$('analyze-selected')?.addEventListener('click',async()=>{
  if(!research.scan)return;
  const selected=[...document.querySelectorAll('.post-select:checked')].map(x=>research.scan.posts[Number(x.dataset.index)]);
  if(!selected.length)return;
  $('analyze-selected').disabled=true;$('analyze-selected').textContent='Analyzing…';researchMsg(`Analyzing ${selected.length} selected posts…`);
  try{
    const r=await fetch(apiBase+'/api/profile-analyze',{method:'POST',credentials:'omit',referrerPolicy:'no-referrer',headers:{'Content-Type':'application/json'},body:JSON.stringify({platform:research.scan.profile.platform,profile:research.scan.profile,posts:selected}),signal:AbortSignal.timeout(180000)});
    const data=await r.json();if(!r.ok)throw new Error(englishErrors[data.error?.code]||data.error?.message||'Analysis failed.');
    renderAnalysis(data);researchMsg(`Analysis ready: ${data.selected_count} posts, ${data.repos?.length||0} GitHub repositories.`);
  }catch(err){researchMsg(err.name==='TimeoutError'?'Analysis timed out.':err.message==='Failed to fetch'?t.offline:err.message,true);}
  finally{$('analyze-selected').disabled=false;$('analyze-selected').textContent='Analyze selected →';updateSelectedCount();}
});
$('download-repo-csv')?.addEventListener('click',()=>{
  if(!research.analysis?.csv)return;
  const blob=new Blob([research.analysis.csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=`${research.scan?.profile?.username||'profile'}-github-repos.csv`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
