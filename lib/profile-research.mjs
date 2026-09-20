// SPDX-License-Identifier: MIT
// Copyright (c) 2026 jacbus1 and DL Anything You Want contributors
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { AppError } from './core.mjs';

const IG_HOSTS = new Set(['instagram.com','www.instagram.com','m.instagram.com']);
const RESERVED = new Set(['p','reel','reels','tv','stories','explore','accounts','direct','share','developer','about']);

export function normalizeInstagramProfile(input) {
  if (typeof input !== 'string' || input.length > 2048) throw new AppError('INVALID_PROFILE','Use an Instagram profile URL or username.');
  const raw=input.trim();
  if (/^@?[A-Za-z0-9._]{1,30}$/.test(raw)) {
    const username=raw.replace(/^@/,'');
    if (RESERVED.has(username.toLowerCase())) throw new AppError('INVALID_PROFILE','Use an Instagram profile URL or username.');
    return {username,url:`https://www.instagram.com/${username}/`};
  }
  let u;
  try { u=new URL(raw); } catch { throw new AppError('INVALID_PROFILE','Use an Instagram profile URL or username.'); }
  if (u.protocol!=='https:' || u.username || u.password || u.port || !IG_HOSTS.has(u.hostname))
    throw new AppError('INVALID_PROFILE','Use a public Instagram profile URL.');
  const m=u.pathname.match(/^\/([A-Za-z0-9._]{1,30})\/?$/);
  if (!m || RESERVED.has(m[1].toLowerCase())) throw new AppError('INVALID_PROFILE','Use an Instagram profile URL, not a post or system page.');
  return {username:m[1],url:`https://www.instagram.com/${m[1]}/`};
}

function cleanRepo(owner,name) {
  const repo=name.replace(/\.git$/i,'').replace(/[),.;:'"!?\]}]+$/g,'');
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9_.-]{0,38})$/.test(owner) || !/^[A-Za-z0-9_.-]{1,100}$/.test(repo)) return null;
  return {owner,repo,full_name:`${owner}/${repo}`,url:`https://github.com/${owner}/${repo}`};
}

export function extractGitHubCandidates(text='') {
  if (typeof text!=='string' || !text) return [];
  const found=new Map();
  const add=(owner,name,direct=false)=>{
    const value=cleanRepo(owner,name); if(!value)return;
    const key=value.full_name.toLowerCase();
    const current=found.get(key)||{...value,direct:false};
    current.direct ||= direct; found.set(key,current);
  };
  for (const m of text.matchAll(/https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9_.-]{1,39})\/([A-Za-z0-9_.-]{1,100})/gi)) add(m[1],m[2],true);
  // gittrend-style captions often use bare owner/repo slugs. These are only kept
  // after GitHub verification, so ordinary prose such as AI/ML is filtered out.
  for (const m of text.matchAll(/(?:^|[\s(\[{"'=:])([A-Za-z0-9][A-Za-z0-9_.-]{0,38})\/([A-Za-z0-9][A-Za-z0-9_.-]{0,99})(?=$|[\s)\]}"',.;!?])/g))
    add(m[1],m[2],false);
  return [...found.values()];
}

function excerpt(text,max=320) {
  return String(text||'').replace(/\s+/g,' ').trim().slice(0,max);
}

export async function collectInstagramProfile(profile,{maxPosts=1000,sessionfile='',sessionUsername='',timeoutMs=600000}={}) {
  if (!Number.isInteger(maxPosts) || maxPosts<1 || maxPosts>5000) throw new AppError('INVALID_LIMIT','maxPosts must be 1-5000.');
  const script=fileURLToPath(new URL('../scripts/instagram_profile_posts.py',import.meta.url));
  const env={...process.env,INSTAGRAM_SESSIONFILE:sessionfile||'',INSTAGRAM_SESSION_USERNAME:sessionUsername||''};
  const child=spawn('python3',[script,profile.username,String(maxPosts)],{stdio:['ignore','pipe','pipe'],env});
  let stdout='',stderr='',bytes=0;
  child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
  child.stdout.on('data',chunk=>{bytes+=Buffer.byteLength(chunk);if(bytes<=16*1024*1024)stdout+=chunk;else child.kill('SIGKILL');});
  child.stderr.on('data',chunk=>{if(stderr.length<8192)stderr+=chunk;});
  const timer=setTimeout(()=>child.kill('SIGKILL'),timeoutMs);
  const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve);}).catch(err=>{
    throw new AppError('PROFILE_COLLECTOR_UNAVAILABLE',err.code==='ENOENT'?'Python 3 is not installed.':'The profile collector could not start.',503);
  }).finally(()=>clearTimeout(timer));
  if (bytes>16*1024*1024) throw new AppError('PROFILE_TOO_LARGE','The profile metadata exceeded the safety limit.',413);
  if (code!==0) {
    const msg=stderr.trim();
    if (/PROFILE_DEPENDENCY_MISSING/.test(msg)) throw new AppError('PROFILE_COLLECTOR_UNAVAILABLE','Instaloader is not installed. Use the Docker image or install Instaloader 4.15.3.',503);
    if (/PROFILE_LOGIN_REQUIRED|LoginRequiredException|401|403/.test(msg)) throw new AppError('PROFILE_LOGIN_REQUIRED','Instagram requires an operator-owned session for this profile. Configure INSTAGRAM_SESSIONFILE and INSTAGRAM_SESSION_USERNAME.',422);
    if (/PROFILE_NOT_FOUND|ProfileNotExistsException/.test(msg)) throw new AppError('PROFILE_NOT_FOUND','Instagram profile not found.',404);
    if (/TooManyRequests|429/.test(msg)) throw new AppError('PROFILE_RATE_LIMITED','Instagram rate limited the profile scan. Try later or use a valid operator-owned session.',429);
    throw new AppError('PROFILE_SCAN_FAILED',excerpt(msg,500)||'Instagram profile scan failed.',502);
  }
  try {
    const data=JSON.parse(stdout);
    if (!data || !Array.isArray(data.posts)) throw new Error();
    return data;
  } catch { throw new AppError('PROFILE_SCAN_FAILED','The profile collector returned invalid data.',502); }
}

async function githubRepo(candidate,{token='',fetchImpl=fetch}={}) {
  const headers={'Accept':'application/vnd.github+json','User-Agent':'dl-anything-you-want-profile-research','X-GitHub-Api-Version':'2022-11-28'};
  if(token)headers.Authorization=`Bearer ${token}`;
  const r=await fetchImpl(`https://api.github.com/repos/${encodeURIComponent(candidate.owner)}/${encodeURIComponent(candidate.repo)}`,{headers,redirect:'error'});
  if(r.status===404)return null;
  if(r.status===403 && r.headers?.get?.('x-ratelimit-remaining')==='0') throw new AppError('GITHUB_RATE_LIMIT','GitHub API rate limit reached. Configure GITHUB_TOKEN to enrich all repositories.',429);
  if(!r.ok) throw new AppError('GITHUB_LOOKUP_FAILED',`GitHub lookup failed for ${candidate.full_name}.`,502);
  const d=await r.json();
  return {
    full_name:d.full_name||candidate.full_name,
    url:d.html_url||candidate.url,
    description:d.description||'',
    homepage:d.homepage||'',
    language:d.language||'',
    stars:Number(d.stargazers_count)||0,
    forks:Number(d.forks_count)||0,
    open_issues:Number(d.open_issues_count)||0,
    topics:Array.isArray(d.topics)?d.topics:[],
    archived:Boolean(d.archived),
    fork:Boolean(d.fork),
    updated_at:d.updated_at||'',
    pushed_at:d.pushed_at||'',
    license:d.license?.spdx_id||''
  };
}

export function reposToCsv(repos) {
  const cols=['full_name','url','description','language','stars','forks','archived','updated_at','topics','source_posts'];
  const q=v=>`"${String(v??'').replace(/"/g,'""')}"`;
  return [cols.join(','),...repos.map(r=>cols.map(k=>q(k==='topics'?(r.topics||[]).join('|'):k==='source_posts'?(r.source_posts||[]).join('|'):r[k])).join(','))].join('\n');
}

export async function runProfileResearch(input,options={}) {
  const profile=normalizeInstagramProfile(input);
  const collector=options.collector||collectInstagramProfile;
  const data=await collector(profile,{
    maxPosts:options.maxPosts??1000,
    sessionfile:options.sessionfile||'',
    sessionUsername:options.sessionUsername||''
  });
  const byRepo=new Map();
  const scanText=(text,source)=>{
    for(const c of extractGitHubCandidates(text)){
      const key=c.full_name.toLowerCase();
      const x=byRepo.get(key)||{...c,sources:[]};
      x.direct ||= c.direct;
      x.sources.push(source);
      byRepo.set(key,x);
    }
  };
  scanText(data.biography||'',{kind:'profile',url:profile.url,excerpt:excerpt(data.biography)});
  scanText(data.external_url||'',{kind:'profile-link',url:profile.url,excerpt:excerpt(data.external_url)});
  for(const post of data.posts){
    const source={kind:'post',shortcode:post.shortcode,url:post.url,date_utc:post.date_utc||'',excerpt:excerpt(post.caption)};
    scanText(post.caption||'',source);
  }
  const repos=[];
  for(const candidate of byRepo.values()){
    let meta=null;
    try { meta=await githubRepo(candidate,{token:options.githubToken||'',fetchImpl:options.fetchImpl||fetch}); }
    catch(err){
      if(err instanceof AppError && err.code==='GITHUB_RATE_LIMIT') throw err;
      if(candidate.direct) repos.push({...candidate,verified:false,description:candidate.sources[0]?.excerpt||'',source_posts:candidate.sources.filter(x=>x.shortcode).map(x=>x.shortcode),sources:candidate.sources});
      continue;
    }
    if(!meta){
      if(candidate.direct) repos.push({...candidate,verified:false,description:candidate.sources[0]?.excerpt||'',source_posts:candidate.sources.filter(x=>x.shortcode).map(x=>x.shortcode),sources:candidate.sources});
      continue;
    }
    repos.push({...meta,verified:true,direct:candidate.direct,source_posts:[...new Set(candidate.sources.filter(x=>x.shortcode).map(x=>x.shortcode))],sources:candidate.sources});
  }
  repos.sort((a,b)=>b.source_posts.length-a.source_posts.length || a.full_name.localeCompare(b.full_name));
  return {
    profile:{username:data.username||profile.username,url:profile.url,full_name:data.full_name||'',biography:data.biography||'',external_url:data.external_url||'',media_count:Number(data.media_count)||data.posts.length},
    scan:{posts_scanned:data.posts.length,truncated:Boolean(data.truncated),authenticated:Boolean(data.authenticated),github_candidates:byRepo.size,repositories:repos.length},
    repos,
    csv:reposToCsv(repos)
  };
}
