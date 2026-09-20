// SPDX-License-Identifier: MIT
// Copyright (c) 2026 jacbus1 and DL Anything You Want contributors
import http from 'node:http';
import { readFile, mkdtemp, rm, stat } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve as pathResolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { spawn } from 'node:child_process';
import { AppError, normalizeSource, TicketStore, RateLimiter, isMediaURL } from './lib/core.mjs';
import { openURL, readBounded } from './lib/network.mjs';
import { resolveMedia } from './lib/providers.mjs';
import { scanProfile, analyzeSelectedPosts } from './lib/profile-research.mjs';

export function readConfig(env=process.env) {
  const port=Number(env.PORT || 3000);
  if (!Number.isInteger(port) || port<1 || port>65535) throw new Error('PORT must be 1-65535');
  const publicOrigin=new URL(env.PUBLIC_ORIGIN || `http://localhost:${port}`).origin;
  const origins=new Set((env.ALLOWED_ORIGINS || publicOrigin).split(',').map(x => new URL(x.trim()).origin));
  const cobaltURL=env.COBALT_URL ? new URL(env.COBALT_URL).href : '';
  if (cobaltURL) {
    const u=new URL(cobaltURL);
    if (!['http:','https:'].includes(u.protocol) || u.username || u.password || u.hash || u.search || u.pathname!=='/')
      throw new Error('COBALT_URL must be an operator-controlled HTTP(S) origin with a trailing / and no credentials');
    if (['cobalt.tools','api.cobalt.tools'].includes(u.hostname)) throw new Error('Use your own Cobalt instance, not the official hosted API');
  }
  let summaryURL='';
  if(env.SUMMARY_API_URL){
    const u=new URL(env.SUMMARY_API_URL);
    if(u.username||u.password||u.hash||!(u.protocol==='https:'||(u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname))))
      throw new Error('SUMMARY_API_URL must use HTTPS, or local HTTP, without embedded credentials');
    summaryURL=u.href;
  }
  const maxFileBytes=Number(env.MAX_FILE_MB || 100)*1024*1024;
  if (!Number.isFinite(maxFileBytes) || maxFileBytes<1024 || maxFileBytes>500*1024*1024) throw new Error('Invalid MAX_FILE_MB (up to 500)');
  return {
    port,host:env.HOST || '127.0.0.1',publicOrigin,origins,cobaltURL,cobaltKey:env.COBALT_API_KEY||'',maxFileBytes,
    instagramSessionfile:env.INSTAGRAM_SESSIONFILE||'',instagramSessionUsername:env.INSTAGRAM_SESSION_USERNAME||'',
    tiktokCookiesFile:env.TIKTOK_COOKIES_FILE||'',apifyToken:env.APIFY_TOKEN||'',
    threadsActor:env.THREADS_APIFY_ACTOR||'logiover~threads-scraper',githubToken:env.GITHUB_TOKEN||'',
    summaryURL,summaryKey:env.SUMMARY_API_KEY||'',summaryModel:env.SUMMARY_MODEL||''
  };
}

const assets=new Map([
  ['/',['index.html','text/html; charset=utf-8']], ['/index.html',['index.html','text/html; charset=utf-8']],
  ['/styles.css',['styles.css','text/css; charset=utf-8']], ['/app.js',['app.js','text/javascript; charset=utf-8']],
  ['/config.js',['config.js','text/javascript; charset=utf-8']], ['/manifest.webmanifest',['manifest.webmanifest','application/manifest+json']],
  ['/icon.svg',['icon.svg','image/svg+xml']], ['/en/',['en/index.html','text/html; charset=utf-8']],
  ['/en/index.html',['en/index.html','text/html; charset=utf-8']], ['/robots.txt',['robots.txt','text/plain; charset=utf-8']],
  ['/sitemap.xml',['sitemap.xml','application/xml; charset=utf-8']], ['/llms.txt',['llms.txt','text/plain; charset=utf-8']]
]);

function byteLimit(maxFileBytes) {
  let total=0;
  return new Transform({transform(chunk,encoding,done) { total+=chunk.length; done(total>maxFileBytes?new AppError('FILE_TOO_LARGE','The file exceeds the size limit.',413):null,chunk); }});
}
async function runCommand(command,args,{timeoutMs=120000}={}) {
  const child=spawn(command,args,{stdio:['ignore','ignore','pipe']}); let stderr='';
  child.stderr.setEncoding('utf8'); child.stderr.on('data',x=>{if(stderr.length<4096)stderr+=x;});
  const timer=setTimeout(()=>child.kill('SIGKILL'),timeoutMs);
  try { await new Promise((resolve,reject)=>{
    child.once('error',()=>reject(new AppError('CONVERTER_UNAVAILABLE',`${command} is not installed or could not start.`,503)));
    child.once('close',code=>code===0?resolve():reject(new AppError('CONVERSION_FAILED',stderr.trim()||'Conversion failed.',502)));
  }); } finally { clearTimeout(timer); }
}
async function checkedFile(path,maxBytes) {
  const info=await stat(path).catch(()=>null);
  if (!info || info.size===0) throw new AppError('CONVERSION_FAILED','Conversion produced no output.',502);
  if (info.size>maxBytes) throw new AppError('FILE_TOO_LARGE','The file exceeds the size limit.',413);
  return info.size;
}
async function materialize(upstream,item,config) {
  const dir=await mkdtemp(join(tmpdir(),'dl-anything-')); const input=join(dir,'source');
  try {
    await pipeline(upstream,byteLimit(config.maxFileBytes),createWriteStream(input,{flags:'wx'}));
    await checkedFile(input,config.maxFileBytes);
    if (!item.transcode) return {dir,path:input,mime:item.type==='photo'?'image/jpeg':item.type==='audio'?'audio/mpeg':'video/mp4',filename:item.filename,size:(await stat(input)).size};
    const output=join(dir,item.transcode==='png'?'output.png':'output.mp3');
    const args=item.transcode==='png'
      ? ['-nostdin','-hide_banner','-loglevel','error','-threads','1','-max_pixels','16777216','-i',input,'-frames:v','1','-vf','scale=4096:4096:force_original_aspect_ratio=decrease','-vcodec','png',output]
      : ['-nostdin','-hide_banner','-loglevel','error','-threads','1','-i',input,'-vn','-t','7200','-codec:a','libmp3lame','-b:a','128k',output];
    await runCommand('ffmpeg',args); const size=await checkedFile(output,config.maxFileBytes);
    return {dir,path:output,mime:item.transcode==='png'?'image/png':'audio/mpeg',filename:item.filename,size};
  } catch(e) { await rm(dir,{recursive:true,force:true}); throw e; }
}

async function jsonBody(req,max=4096){
  if (!(req.headers['content-type']||'').startsWith('application/json')) throw new AppError('INVALID_BODY','Use JSON.',415);
  try{return JSON.parse(await readBounded(req,max));}catch(e){if(e instanceof AppError)throw e;throw new AppError('INVALID_BODY','Invalid JSON.');}
}
function onlyKeys(body,keys){
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>!keys.includes(k)))throw new AppError('UNEXPECTED_FIELD','Unexpected request fields.',400);
}

export function createApp(config=readConfig(), {resolver=resolveMedia, openMedia=openURL, tickets=new TicketStore(), profileScanner=scanProfile, profileAnalyzer=analyzeSelectedPosts}={}) {
  const resolveRate=new RateLimiter(); const downloadRate=new RateLimiter({limit:24}); const researchRate=new RateLimiter({limit:6});
  const globalRate=new RateLimiter({limit:30}); let activeResolves=0; let activeDownloads=0; let activeResearch=0;
  function json(res,status,data) { res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'}); res.end(JSON.stringify(data)); }
  return http.createServer(async (req,res) => {
    res.setHeader('X-Content-Type-Options','nosniff'); res.setHeader('Referrer-Policy','no-referrer'); res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Frame-Options','DENY'); res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy',`default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self' ${[...config.origins].join(' ')}; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`);
    const origin=req.headers.origin;
    if (origin && !config.origins.has(origin)) return json(res,403,{error:{code:'ORIGIN_DENIED',message:'This website is not allowed.'}});
    if (origin) { res.setHeader('Access-Control-Allow-Origin',origin); res.setHeader('Vary','Origin'); }
    try {
      let route; try { route=new URL(req.url,'http://localhost').pathname; } catch { throw new AppError('INVALID_REQUEST','Invalid request path.'); }
      if (req.method==='OPTIONS' && ['/api/resolve','/api/profile-scan','/api/profile-analyze'].includes(route)) {
        res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS'); res.setHeader('Access-Control-Allow-Headers','Content-Type'); res.writeHead(204); res.end(); return;
      }
      if (req.method==='GET' && route==='/api/health') return json(res,200,{
        status:'ok',version:'0.5.0',engine:config.cobaltURL?'configured':'not-configured',
        research:{instagram:'available',threads:config.apifyToken?'available':'needs-provider-token',tiktok:'available',summary:config.summaryURL&&config.summaryModel?'ai':'local-extractive'}
      });
      const ip=req.socket.remoteAddress || 'unknown';
      if (req.method==='POST' && route==='/api/profile-scan') {
        if(!origin)throw new AppError('ORIGIN_REQUIRED','Requests must come from the configured website.',403);
        if(!researchRate.allow(ip))throw new AppError('RATE_LIMITED','Too many research requests. Try again in one minute.',429);
        if(activeResearch>=1)throw new AppError('BUSY','A profile research job is already running.',503);
        const body=await jsonBody(req,8192); onlyKeys(body,['url','platform','maxPosts']);
        const maxPosts=body.maxPosts==null?200:Number(body.maxPosts);
        if(!Number.isInteger(maxPosts))throw new AppError('INVALID_LIMIT','maxPosts must be an integer.');
        activeResearch++;
        try {
          const result=await profileScanner(body.url,{
            platform:body.platform||'',maxPosts,
            instagramSessionfile:config.instagramSessionfile,instagramSessionUsername:config.instagramSessionUsername,
            tiktokCookiesFile:config.tiktokCookiesFile,apifyToken:config.apifyToken,threadsActor:config.threadsActor
          });
          return json(res,200,result);
        } finally { activeResearch--; }
      }
      if (req.method==='POST' && route==='/api/profile-analyze') {
        if(!origin)throw new AppError('ORIGIN_REQUIRED','Requests must come from the configured website.',403);
        if(!researchRate.allow(ip))throw new AppError('RATE_LIMITED','Too many research requests. Try again in one minute.',429);
        if(activeResearch>=1)throw new AppError('BUSY','A profile research job is already running.',503);
        const body=await jsonBody(req,1024*1024); onlyKeys(body,['platform','profile','posts']);
        activeResearch++;
        try {
          const result=await profileAnalyzer(body,{
            githubToken:config.githubToken,summaryURL:config.summaryURL,summaryKey:config.summaryKey,summaryModel:config.summaryModel
          });
          return json(res,200,result);
        } finally { activeResearch--; }
      }
      if (req.method==='POST' && route==='/api/resolve') {
        if (!origin) throw new AppError('ORIGIN_REQUIRED','Requests must come from the configured website.',403);
        if (!resolveRate.allow(ip) || !globalRate.allow('all')) throw new AppError('RATE_LIMITED','Too many requests. Try again in one minute.',429);
        if (activeResolves>=2) throw new AppError('BUSY','The service is busy. Try again shortly.',503);
        const body=await jsonBody(req,4096); onlyKeys(body,['url','consent','platform','format']);
        if (body.consent!==true) throw new AppError('CONSENT_REQUIRED','Confirm that you may download this content.');
        const source=normalizeSource(body.url);
        const platform=body.platform || source.platform; const format=body.format || 'mp4';
        if (!['facebook','instagram','threads','tiktok','youtube'].includes(platform) || platform!==source.platform) throw new AppError('PLATFORM_MISMATCH','The selected platform does not match the URL.');
        if (!['mp4','mp3','png'].includes(format)) throw new AppError('INVALID_FORMAT','Choose MP4, MP3 or PNG.');
        if (activeResolves>=2) throw new AppError('BUSY','The service is busy. Try again shortly.',503);
        activeResolves++;
        try {
          const result=await resolver(source,config,{format});
          if (!Array.isArray(result.items) || !result.items.length || result.items.length>20) throw new AppError('UPSTREAM_FORMAT','No valid media was found.',502);
          for (const item of result.items) if (!isMediaURL(item.url,config.cobaltURL)) throw new AppError('UNSAFE_MEDIA','Unapproved media was rejected.',502);
          const items=result.items.map(x => tickets.issue(x));
          return json(res,200,{platform:source.platform,source:source.url,experimental:result.experimental,provider:result.provider,items});
        } finally { activeResolves--; }
      }
      if (req.method==='GET' && /^\/api\/file\/[a-f0-9]{48}$/.test(route)) {
        if (!downloadRate.allow(ip)) throw new AppError('RATE_LIMITED','Too many download requests.',429);
        if (activeDownloads>=2) throw new AppError('BUSY','The download service is busy.',503);
        if (req.headers.range) throw new AppError('RANGE_UNSUPPORTED','Only complete downloads are supported. Resolve the source again.',416);
        const item=tickets.take(route.split('/').at(-1)); activeDownloads++;
        try {
          const upstream=await openMedia(item.url,{validate:v=>isMediaURL(v,config.cobaltURL),trustedOrigin:config.cobaltURL?new URL(config.cobaltURL).origin:'',timeoutMs:60000});
          let mime=(upstream.headers['content-type']||'').split(';')[0].trim();
          const cobaltTunnel=Boolean(config.cobaltURL && new URL(item.url).origin===new URL(config.cobaltURL).origin && new URL(item.url).pathname==='/tunnel');
          if ((!mime || mime==='application/octet-stream') && cobaltTunnel) mime=item.transcode==='png'?'image/jpeg':item.transcode==='mp3'?'video/mp4':item.type==='audio'?'audio/mpeg':item.type==='photo'?'image/jpeg':'video/mp4';
          const allowed=item.transcode==='png'?['image/jpeg','image/png','image/webp']:item.transcode==='mp3'?['video/mp4']:item.type==='photo'?['image/jpeg','image/png','image/webp']:item.type==='audio'?['audio/mpeg','audio/mp3']:['video/mp4'];
          if (!allowed.includes(mime)) { upstream.destroy(); throw new AppError('INVALID_MEDIA','The source returned an unexpected media format.',502); }
          const length=Number(upstream.headers['content-length']);
          if (length===0) { upstream.destroy(); throw new AppError('INVALID_MEDIA','The source returned an empty file.',502); }
          if (Number.isFinite(length) && length>config.maxFileBytes) { upstream.destroy(); throw new AppError('FILE_TOO_LARGE','The file exceeds the download size limit.',413); }
          const ready=await materialize(upstream,item,config);
          try { res.setHeader('Content-Type',ready.mime); res.setHeader('Content-Disposition',`attachment; filename="${ready.filename}"`); res.setHeader('Content-Length',ready.size); await pipeline(createReadStream(ready.path),res); return; }
          finally { await rm(ready.dir,{recursive:true,force:true}); }
        } finally { activeDownloads--; }
      }
      if (req.method==='GET' && assets.has(route)) {
        const [filename,mime]=assets.get(route); const data=await readFile(new URL(`./web/${filename}`,import.meta.url));
        res.writeHead(200,{'Content-Type':mime}); res.end(data); return;
      }
      throw new AppError('NOT_FOUND','Page not found.',404);
    } catch(e) {
      if (res.headersSent || res.destroyed) { res.destroy(); return; }
      if (e.status===429) res.setHeader('Retry-After','60');
      const expected=e instanceof AppError;
      json(res,expected?e.status:502,{error:{code:expected?e.code:'UPSTREAM_FAILURE',message:expected?e.message:'The source connection failed. Try again later.'}});
    }
  });
}

if (process.argv[1] && pathResolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const config=readConfig(); const server=createApp(config);
  server.requestTimeout=25000; server.headersTimeout=10000;
  server.listen(config.port,config.host,()=>console.log(`DL Anything You Want: http://${config.host}:${config.port}`));
}
