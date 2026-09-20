// SPDX-License-Identifier: MIT
// Copyright (c) 2026 jacbus1 and DL Anything You Want contributors
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { AppError } from './core.mjs';

const HOSTS={
  instagram:new Set(['instagram.com','www.instagram.com','m.instagram.com']),
  threads:new Set(['threads.com','www.threads.com','threads.net','www.threads.net']),
  tiktok:new Set(['tiktok.com','www.tiktok.com','m.tiktok.com'])
};
const RESERVED=new Set(['p','reel','reels','tv','stories','explore','accounts','direct','share','developer','about','login','search']);

function cleanHandle(value,max=64){
  const s=String(value||'').trim().replace(/^@/,'');
  if(!new RegExp(`^[A-Za-z0-9._-]{1,${max}}$`).test(s) || RESERVED.has(s.toLowerCase()))
    throw new AppError('INVALID_PROFILE','Use a valid public profile URL or username.');
  return s;
}

export function normalizeProfile(input,platform='') {
  if(typeof input!=='string'||input.length>2048)throw new AppError('INVALID_PROFILE','Use a profile URL or username.');
  const raw=input.trim();
  if(!['instagram','threads','tiktok'].includes(platform)) {
    try {
      const u=new URL(raw);
      platform=Object.entries(HOSTS).find(([,hosts])=>hosts.has(u.hostname))?.[0]||'';
    } catch {}
  }
  if(!['instagram','threads','tiktok'].includes(platform))throw new AppError('INVALID_PLATFORM','Choose Instagram, Threads or TikTok.');
  if(/^@?[A-Za-z0-9._-]{1,64}$/.test(raw)){
    const username=cleanHandle(raw,platform==='instagram'?30:64);
    const url=platform==='instagram'?`https://www.instagram.com/${username}/`:platform==='threads'?`https://www.threads.com/@${username}`:`https://www.tiktok.com/@${username}`;
    return {platform,username,url};
  }
  let u;
  try{u=new URL(raw);}catch{throw new AppError('INVALID_PROFILE','Use a profile URL or username.');}
  if(u.protocol!=='https:'||u.username||u.password||u.port||!HOSTS[platform].has(u.hostname))
    throw new AppError('INVALID_PROFILE','Use a public profile URL from the selected platform.');
  let username='';
  if(platform==='instagram'){
    const m=u.pathname.match(/^\/([A-Za-z0-9._]{1,30})\/?$/); if(m)username=m[1];
  } else {
    const m=u.pathname.match(/^\/@([A-Za-z0-9._-]{1,64})\/?$/); if(m)username=m[1];
  }
  username=cleanHandle(username,platform==='instagram'?30:64);
  const url=platform==='instagram'?`https://www.instagram.com/${username}/`:platform==='threads'?`https://www.threads.com/@${username}`:`https://www.tiktok.com/@${username}`;
  return {platform,username,url};
}

export const normalizeInstagramProfile=input=>normalizeProfile(input,'instagram');

function cleanRepo(owner,name){
  const repo=name.replace(/\.git$/i,'').replace(/[),.;:'"!?\]}]+$/g,'');
  if(!/^[A-Za-z0-9](?:[A-Za-z0-9_.-]{0,38})$/.test(owner)||!/^[A-Za-z0-9_.-]{1,100}$/.test(repo))return null;
  return {owner,repo,full_name:`${owner}/${repo}`,url:`https://github.com/${owner}/${repo}`};
}

export function extractGitHubCandidates(text=''){
  if(typeof text!=='string'||!text)return[];
  const found=new Map();
  const add=(owner,name,direct=false)=>{
    const value=cleanRepo(owner,name);if(!value)return;
    const key=value.full_name.toLowerCase();
    const current=found.get(key)||{...value,direct:false};
    current.direct||=direct;found.set(key,current);
  };
  for(const m of text.matchAll(/https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9_.-]{1,39})\/([A-Za-z0-9_.-]{1,100})/gi))add(m[1],m[2],true);
  for(const m of text.matchAll(/(?:^|[\s(\[{"'=:])([A-Za-z0-9][A-Za-z0-9_.-]{0,38})\/([A-Za-z0-9][A-Za-z0-9_.-]{0,99})(?=$|[\s)\]}"',.;!?])/g))add(m[1],m[2],false);
  return[...found.values()];
}

const excerpt=(text,max=360)=>String(text||'').replace(/\s+/g,' ').trim().slice(0,max);

async function spawnJson(command,args,{env=process.env,timeoutMs=600000,maxBytes=16*1024*1024,errorPrefix='PROFILE'}={}){
  const child=spawn(command,args,{stdio:['ignore','pipe','pipe'],env});
  let stdout='',stderr='',bytes=0;
  child.stdout.setEncoding('utf8');child.stderr.setEncoding('utf8');
  child.stdout.on('data',chunk=>{bytes+=Buffer.byteLength(chunk);if(bytes<=maxBytes)stdout+=chunk;else child.kill('SIGKILL');});
  child.stderr.on('data',chunk=>{if(stderr.length<8192)stderr+=chunk;});
  const timer=setTimeout(()=>child.kill('SIGKILL'),timeoutMs);
  const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve);})
    .catch(err=>{throw new AppError(`${errorPrefix}_COLLECTOR_UNAVAILABLE`,err.code==='ENOENT'?`${command} is not installed.`:'The profile collector could not start.',503);})
    .finally(()=>clearTimeout(timer));
  if(bytes>maxBytes)throw new AppError('PROFILE_TOO_LARGE','The profile metadata exceeded the safety limit.',413);
  if(code!==0)return{error:stderr.trim(),code};
  try{return{data:JSON.parse(stdout),code};}catch{throw new AppError('PROFILE_SCAN_FAILED','The profile collector returned invalid JSON.',502);}
}

export async function collectInstagramProfile(profile,{maxPosts=1000,sessionfile='',sessionUsername=''}={}){
  if(!Number.isInteger(maxPosts)||maxPosts<1||maxPosts>5000)throw new AppError('INVALID_LIMIT','maxPosts must be 1-5000.');
  const script=fileURLToPath(new URL('../scripts/instagram_profile_posts.py',import.meta.url));
  const result=await spawnJson('python3',[script,profile.username,String(maxPosts)],{env:{...process.env,INSTAGRAM_SESSIONFILE:sessionfile||'',INSTAGRAM_SESSION_USERNAME:sessionUsername||''},errorPrefix:'INSTAGRAM'});
  if(result.error){
    const msg=result.error;
    if(/PROFILE_DEPENDENCY_MISSING/.test(msg))throw new AppError('PROFILE_COLLECTOR_UNAVAILABLE','Instaloader 4.15.3 is not installed.',503);
    if(/PROFILE_LOGIN_REQUIRED|LoginRequiredException|401|403/.test(msg))throw new AppError('PROFILE_LOGIN_REQUIRED','Instagram requires an operator-owned session. Configure INSTAGRAM_SESSIONFILE and INSTAGRAM_SESSION_USERNAME.',422);
    if(/PROFILE_NOT_FOUND|ProfileNotExistsException/.test(msg))throw new AppError('PROFILE_NOT_FOUND','Instagram profile not found.',404);
    if(/TooManyRequests|429/.test(msg))throw new AppError('PROFILE_RATE_LIMITED','Instagram rate limited the profile scan.',429);
    throw new AppError('PROFILE_SCAN_FAILED',excerpt(msg,500)||'Instagram profile scan failed.',502);
  }
  return result.data;
}

export async function collectTikTokProfile(profile,{maxPosts=200,cookiesFile=''}={}){
  if(!Number.isInteger(maxPosts)||maxPosts<1||maxPosts>1000)throw new AppError('INVALID_LIMIT','TikTok maxPosts must be 1-1000.');
  const args=['--ignore-config','--no-warnings','--skip-download','--dump-single-json','--playlist-end',String(maxPosts)];
  if(cookiesFile)args.push('--cookies',cookiesFile);
  args.push(profile.url);
  const result=await spawnJson('yt-dlp',args,{timeoutMs:900000,errorPrefix:'TIKTOK'});
  if(result.error){
    const msg=result.error;
    if(/secondary user ID/i.test(msg))throw new AppError('TIKTOK_PROFILE_UNAVAILABLE','TikTok did not expose the secondary user ID for this profile. Try an operator-owned cookies file or another provider.',422);
    if(/cookies|login|Sign in/i.test(msg))throw new AppError('PROFILE_LOGIN_REQUIRED','TikTok requires an operator-owned cookies file for this profile.',422);
    if(/429|Too Many Requests/i.test(msg))throw new AppError('PROFILE_RATE_LIMITED','TikTok rate limited the profile scan.',429);
    throw new AppError('PROFILE_SCAN_FAILED',excerpt(msg,500)||'TikTok profile scan failed.',502);
  }
  const root=result.data||{};
  const entries=Array.isArray(root.entries)?root.entries:[];
  const posts=entries.filter(Boolean).slice(0,maxPosts).map((x,i)=>{
    const id=String(x.id||x.display_id||i+1);
    const uploader=String(x.uploader_id||x.channel_id||profile.username).replace(/^@/,'');
    const url=x.webpage_url||x.original_url||`https://www.tiktok.com/@${uploader}/video/${id}`;
    const ts=Number(x.timestamp||x.release_timestamp||0);
    return {id,shortcode:id,url,date_utc:ts?new Date(ts*1000).toISOString():'',text:String(x.description||x.title||''),caption:String(x.description||x.title||''),type:'video',metrics:{likes:Number(x.like_count)||0,comments:Number(x.comment_count)||0,reposts:Number(x.repost_count)||0,views:Number(x.view_count)||0}};
  });
  return {username:profile.username,full_name:root.uploader||root.channel||'',biography:root.description||'',external_url:'',media_count:Number(root.playlist_count)||posts.length,authenticated:Boolean(cookiesFile),posts,truncated:posts.length>=maxPosts,provider:'yt-dlp'};
}

export async function collectThreadsProfile(profile,{maxPosts=200,apifyToken='',actor='logiover~threads-scraper',fetchImpl=fetch}={}){
  if(!apifyToken)throw new AppError('THREADS_PROVIDER_NOT_CONFIGURED','Threads profile enumeration needs APIFY_TOKEN in this version. Individual Threads post downloading remains local.',503);
  if(!Number.isInteger(maxPosts)||maxPosts<1||maxPosts>2000)throw new AppError('INVALID_LIMIT','Threads maxPosts must be 1-2000.');
  if(!/^[A-Za-z0-9_-]+~[A-Za-z0-9_-]+$/.test(actor))throw new AppError('INVALID_CONFIG','Invalid Threads actor configuration.',500);
  const url=`https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?timeout=300&memory=1024`;
  const response=await fetchImpl(url,{method:'POST',headers:{'Authorization':`Bearer ${apifyToken}`,'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({usernames:[profile.username],includeReplies:false,expandFromProfiles:false,maxResults:maxPosts})});
  if(response.status===401||response.status===403)throw new AppError('THREADS_PROVIDER_AUTH','Threads research provider rejected APIFY_TOKEN.',503);
  if(response.status===429)throw new AppError('PROFILE_RATE_LIMITED','Threads research provider rate limited the scan.',429);
  if(!response.ok)throw new AppError('PROFILE_SCAN_FAILED',`Threads provider returned HTTP ${response.status}.`,502);
  const items=await response.json();
  if(!Array.isArray(items))throw new AppError('PROFILE_SCAN_FAILED','Threads provider returned invalid data.',502);
  const own=items.filter(x=>!x.isReply && (!x.author?.username || String(x.author.username).toLowerCase()===profile.username.toLowerCase())).slice(0,maxPosts);
  const posts=own.map((x,i)=>{
    const id=String(x.code||x.postId||x.id||i+1);
    return {id,shortcode:id,url:x.url||`https://www.threads.com/@${profile.username}/post/${id}`,date_utc:x.createdAt||'',text:String(x.text||''),caption:String(x.text||''),type:'post',metrics:{likes:Number(x.likeCount)||0,replies:Number(x.replyCount)||0,reposts:Number(x.repostCount)||0,quotes:Number(x.quoteCount)||0}};
  });
  const author=own.find(x=>x.author)?.author||{};
  return {username:author.username||profile.username,full_name:author.fullName||'',biography:'',external_url:'',media_count:posts.length,authenticated:false,posts,truncated:posts.length>=maxPosts,provider:`apify:${actor}`};
}

export async function scanProfile(input,{platform='',maxPosts=200,instagramSessionfile='',instagramSessionUsername='',tiktokCookiesFile='',apifyToken='',threadsActor='',collectors={}}={}){
  const profile=normalizeProfile(input,platform);
  const collector=collectors[profile.platform]||(profile.platform==='instagram'?collectInstagramProfile:profile.platform==='threads'?collectThreadsProfile:collectTikTokProfile);
  const data=await collector(profile,{
    maxPosts,
    sessionfile:instagramSessionfile,
    sessionUsername:instagramSessionUsername,
    cookiesFile:tiktokCookiesFile,
    apifyToken,
    actor:threadsActor||'logiover~threads-scraper'
  });
  const posts=(Array.isArray(data.posts)?data.posts:[]).map((p,i)=>{
    const text=String(p.text??p.caption??'');
    return {id:String(p.id||p.shortcode||i+1),shortcode:String(p.shortcode||p.id||i+1),url:String(p.url||''),date_utc:String(p.date_utc||''),text,type:p.type||'post',metrics:p.metrics||{},github_candidates:extractGitHubCandidates(text).map(x=>x.full_name)};
  });
  return {
    profile:{platform:profile.platform,username:data.username||profile.username,url:profile.url,full_name:data.full_name||'',biography:data.biography||'',external_url:data.external_url||'',media_count:Number(data.media_count)||posts.length},
    scan:{posts_scanned:posts.length,truncated:Boolean(data.truncated),authenticated:Boolean(data.authenticated),provider:data.provider||profile.platform},
    posts
  };
}

async function githubRepo(candidate,{token='',fetchImpl=fetch}={}){
  const headers={'Accept':'application/vnd.github+json','User-Agent':'dl-anything-you-want-profile-research','X-GitHub-Api-Version':'2022-11-28'};
  if(token)headers.Authorization=`Bearer ${token}`;
  const r=await fetchImpl(`https://api.github.com/repos/${encodeURIComponent(candidate.owner)}/${encodeURIComponent(candidate.repo)}`,{headers,redirect:'error'});
  if(r.status===404)return null;
  if(r.status===403&&r.headers?.get?.('x-ratelimit-remaining')==='0')throw new AppError('GITHUB_RATE_LIMIT','GitHub API rate limit reached. Configure GITHUB_TOKEN.',429);
  if(!r.ok)throw new AppError('GITHUB_LOOKUP_FAILED',`GitHub lookup failed for ${candidate.full_name}.`,502);
  const d=await r.json();
  return {full_name:d.full_name||candidate.full_name,url:d.html_url||candidate.url,description:d.description||'',homepage:d.homepage||'',language:d.language||'',stars:Number(d.stargazers_count)||0,forks:Number(d.forks_count)||0,open_issues:Number(d.open_issues_count)||0,topics:Array.isArray(d.topics)?d.topics:[],archived:Boolean(d.archived),fork:Boolean(d.fork),updated_at:d.updated_at||'',pushed_at:d.pushed_at||'',license:d.license?.spdx_id||''};
}

function localSummary(text){
  const clean=excerpt(text,1600);
  if(!clean)return'No text caption was available.';
  const sentences=clean.split(/(?<=[.!?。！？])\s+/).filter(Boolean);
  return excerpt((sentences.slice(0,2).join(' ')||clean),420);
}
function keywords(text){
  const stop=new Set('the and for with this that from your you are was were have has into about http https com www github our their they them its not but can will just more use using'.split(' '));
  const counts=new Map();
  for(const token of String(text||'').toLowerCase().match(/[a-z][a-z0-9+_.-]{2,}/g)||[]){
    if(stop.has(token))continue;counts.set(token,(counts.get(token)||0)+1);
  }
  return[...counts].sort((a,b)=>b[1]-a[1]).slice(0,8).map(x=>x[0]);
}

async function llmSummaries(posts,{summaryURL='',summaryKey='',summaryModel='',fetchImpl=fetch}={}){
  if(!summaryURL||!summaryModel)return null;
  const input=posts.map((p,i)=>({index:i,id:p.id,url:p.url,text:excerpt(p.text,6000)}));
  const r=await fetchImpl(summaryURL,{method:'POST',headers:{'Content-Type':'application/json',...(summaryKey?{'Authorization':`Bearer ${summaryKey}`}:{})},body:JSON.stringify({model:summaryModel,temperature:0,response_format:{type:'json_object'},messages:[
    {role:'system',content:'Summarize selected social posts for research. Return strict JSON with keys overall_summary, themes, posts. posts must be an array of {index,summary,key_points}. Do not invent links or facts not present in the supplied text.'},
    {role:'user',content:JSON.stringify(input)}
  ]})});
  if(!r.ok)throw new AppError('SUMMARY_PROVIDER_FAILED',`Summary provider returned HTTP ${r.status}.`,502);
  const data=await r.json();
  const raw=data?.choices?.[0]?.message?.content;
  if(typeof raw!=='string')throw new AppError('SUMMARY_PROVIDER_FAILED','Summary provider returned an invalid response.',502);
  try{return JSON.parse(raw);}catch{throw new AppError('SUMMARY_PROVIDER_FAILED','Summary provider did not return valid JSON.',502);}
}

export function reposToCsv(repos){
  const cols=['full_name','url','description','language','stars','forks','archived','updated_at','topics','source_posts'];
  const q=v=>`"${String(v??'').replace(/"/g,'""')}"`;
  return[cols.join(','),...repos.map(r=>cols.map(k=>q(k==='topics'?(r.topics||[]).join('|'):k==='source_posts'?(r.source_posts||[]).join('|'):r[k])).join(','))].join('\n');
}

export async function analyzeSelectedPosts({platform,profile,posts},{githubToken='',summaryURL='',summaryKey='',summaryModel='',fetchImpl=fetch}={}){
  if(!['instagram','threads','tiktok'].includes(platform))throw new AppError('INVALID_PLATFORM','Choose Instagram, Threads or TikTok.');
  if(!Array.isArray(posts)||!posts.length||posts.length>100)throw new AppError('INVALID_SELECTION','Choose 1-100 posts.');
  const selected=posts.map((p,i)=>{
    if(!p||typeof p!=='object'||typeof p.url!=='string'||typeof p.text!=='string'||p.text.length>12000)throw new AppError('INVALID_SELECTION','Selected post data is invalid.');
    const u=new URL(p.url);if(u.protocol!=='https:'||!HOSTS[platform].has(u.hostname))throw new AppError('INVALID_SELECTION','A selected post URL does not match the platform.');
    return{id:String(p.id||p.shortcode||i+1),url:u.href,date_utc:String(p.date_utc||''),text:p.text};
  });
  const byRepo=new Map();
  for(const p of selected)for(const c of extractGitHubCandidates(p.text)){
    const key=c.full_name.toLowerCase();const x=byRepo.get(key)||{...c,sources:[]};x.direct||=c.direct;x.sources.push({id:p.id,url:p.url,date_utc:p.date_utc,excerpt:excerpt(p.text)});byRepo.set(key,x);
  }
  const repos=[];
  for(const candidate of byRepo.values()){
    let meta=null;
    try{meta=await githubRepo(candidate,{token:githubToken,fetchImpl});}catch(err){if(err instanceof AppError&&err.code==='GITHUB_RATE_LIMIT')throw err;}
    if(meta)repos.push({...meta,verified:true,direct:candidate.direct,source_posts:[...new Set(candidate.sources.map(x=>x.id))],sources:candidate.sources});
    else if(candidate.direct)repos.push({...candidate,verified:false,description:candidate.sources[0]?.excerpt||'',source_posts:[...new Set(candidate.sources.map(x=>x.id))],sources:candidate.sources});
  }
  repos.sort((a,b)=>b.source_posts.length-a.source_posts.length||a.full_name.localeCompare(b.full_name));
  let ai=null;
  if(summaryURL&&summaryModel)ai=await llmSummaries(selected,{summaryURL,summaryKey,summaryModel,fetchImpl});
  const perPost=selected.map((p,i)=>({id:p.id,url:p.url,date_utc:p.date_utc,summary:ai?.posts?.find?.(x=>Number(x.index)===i)?.summary||localSummary(p.text),key_points:ai?.posts?.find?.(x=>Number(x.index)===i)?.key_points||keywords(p.text),github_repos:extractGitHubCandidates(p.text).map(x=>x.full_name)}));
  const allText=selected.map(x=>x.text).join('\n');
  return {
    profile:profile||null,
    platform,
    selected_count:selected.length,
    summary_provider:ai?'configured-llm':'local-extractive',
    overall_summary:ai?.overall_summary||`Selected ${selected.length} posts. Recurring terms: ${keywords(allText).join(', ')||'none detected'}.`,
    themes:Array.isArray(ai?.themes)?ai.themes:keywords(allText),
    posts:perPost,
    repos,
    csv:reposToCsv(repos)
  };
}

// Backward-compatible helper: scan Instagram and analyze every scanned post.
export async function runProfileResearch(input,options={}){
  const scanned=await scanProfile(input,{...options,platform:options.platform||'instagram'});
  return analyzeSelectedPosts({platform:scanned.profile.platform,profile:scanned.profile,posts:scanned.posts},{githubToken:options.githubToken||'',summaryURL:options.summaryURL||'',summaryKey:options.summaryKey||'',summaryModel:options.summaryModel||'',fetchImpl:options.fetchImpl||fetch});
}
