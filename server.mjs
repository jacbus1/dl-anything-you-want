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
  const maxFileBytes=Number(env.MAX_FILE_MB || 100)*1024*1024;
  if (!Number.isFinite(maxFileBytes) || maxFileBytes<1024 || maxFileBytes>500*1024*1024) throw new Error('Invalid MAX_FILE_MB (up to 500)');
  const whisperBin=env.WHISPER_BIN || 'whisper-cli';
  const whisperModel=env.WHISPER_MODEL || '';
  return {port,host:env.HOST || '127.0.0.1', publicOrigin,origins,cobaltURL,cobaltKey:env.COBALT_API_KEY||'',maxFileBytes,whisperBin,whisperModel};
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
  return new Transform({transform(chunk,encoding,done) { total+=chunk.length; done(total>maxFileBytes?new AppError('FILE_TOO_LARGE','檔案超過大小限制。',413):null,chunk); }});
}

async function runCommand(command,args,{timeoutMs=120000}={}) {
  const child=spawn(command,args,{stdio:['ignore','ignore','pipe']}); let stderr='';
  child.stderr.setEncoding('utf8'); child.stderr.on('data',x=>{if(stderr.length<4096)stderr+=x;});
  const timer=setTimeout(()=>child.kill('SIGKILL'),timeoutMs);
  try { await new Promise((resolve,reject)=>{
    child.once('error',()=>reject(new AppError('CONVERTER_UNAVAILABLE',`${command} 未安裝或無法啟動。`,503)));
    child.once('close',code=>code===0?resolve():reject(new AppError('CONVERSION_FAILED',stderr.trim()||'轉換失敗。',502)));
  }); } finally { clearTimeout(timer); }
}

async function checkedFile(path,maxBytes) {
  const info=await stat(path).catch(()=>null);
  if (!info || info.size===0) throw new AppError('CONVERSION_FAILED','轉換沒有產生內容。',502);
  if (info.size>maxBytes) throw new AppError('FILE_TOO_LARGE','檔案超過大小限制。',413);
  return info.size;
}

async function materialize(upstream,item,config) {
  const dir=await mkdtemp(join(tmpdir(),'dl-anything-')); const input=join(dir,'source');
  try {
    await pipeline(upstream,byteLimit(config.maxFileBytes),createWriteStream(input,{flags:'wx'}));
    await checkedFile(input,config.maxFileBytes);
    if (!item.transcode) return {dir,path:input,mime:item.type==='photo'?'image/jpeg':item.type==='audio'?'audio/mpeg':'video/mp4',filename:item.filename,size:(await stat(input)).size};
    if (item.transcode==='txt' && !config.whisperModel) throw new AppError('TRANSCRIBER_NOT_CONFIGURED','文字轉錄引擎尚未設定。',503);
    if (item.transcode==='txt') {
      const wav=join(dir,'speech.wav'); const prefix=join(dir,'transcript');
      await runCommand('ffmpeg',['-nostdin','-hide_banner','-loglevel','error','-threads','1','-i',input,'-vn','-t','1800','-ar','16000','-ac','1','-c:a','pcm_s16le',wav]);
      await runCommand(config.whisperBin,['-m',config.whisperModel,'-f',wav,'-l',item.language,'-otxt','-of',prefix,'-nt','-np','-t','2'],{timeoutMs:300000});
      const output=`${prefix}.txt`; const size=await checkedFile(output,2*1024*1024);
      return {dir,path:output,mime:'text/plain; charset=utf-8',filename:item.filename,size};
    }
    const output=join(dir,item.transcode==='png'?'output.png':'output.mp3');
    const args=item.transcode==='png'
      ? ['-nostdin','-hide_banner','-loglevel','error','-threads','1','-max_pixels','16777216','-i',input,'-frames:v','1','-vf','scale=4096:4096:force_original_aspect_ratio=decrease','-vcodec','png',output]
      : ['-nostdin','-hide_banner','-loglevel','error','-threads','1','-i',input,'-vn','-t','7200','-codec:a','libmp3lame','-b:a','128k',output];
    await runCommand('ffmpeg',args); const size=await checkedFile(output,config.maxFileBytes);
    return {dir,path:output,mime:item.transcode==='png'?'image/png':'audio/mpeg',filename:item.filename,size};
  } catch(e) { await rm(dir,{recursive:true,force:true}); throw e; }
}

export function createApp(config=readConfig(), {resolver=resolveMedia, openMedia=openURL, tickets=new TicketStore()}={}) {
  const resolveRate=new RateLimiter(); const downloadRate=new RateLimiter({limit:24});
  const globalRate=new RateLimiter({limit:30}); let activeResolves=0; let activeDownloads=0;
  function json(res,status,data) { res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'}); res.end(JSON.stringify(data)); }
  return http.createServer(async (req,res) => {
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Frame-Options','DENY');
    res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
    // No inline scripts / external dependencies. API origin must be explicitly configured.
    res.setHeader('Content-Security-Policy',`default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self' ${[...config.origins].join(' ')}; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`);
    const origin=req.headers.origin;
    if (origin && !config.origins.has(origin)) return json(res,403,{error:{code:'ORIGIN_DENIED',message:'此網站不在允許清單內。'}});
    if (origin) { res.setHeader('Access-Control-Allow-Origin',origin); res.setHeader('Vary','Origin'); }
    try {
      let route;
      try { route=new URL(req.url,'http://localhost').pathname; }
      catch { throw new AppError('INVALID_REQUEST', '無效的請求路徑。'); }
      if (req.method==='OPTIONS' && route==='/api/resolve') {
        res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS'); res.setHeader('Access-Control-Allow-Headers','Content-Type'); res.writeHead(204); res.end(); return;
      }
      if (req.method==='GET' && route==='/api/health') return json(res,200,{status:'ok',version:'0.4.0',engine:config.cobaltURL?'configured':'not-configured',transcriber:config.whisperModel?'configured':'not-configured'});
      const ip=req.socket.remoteAddress || 'unknown'; // Never trust a user-supplied X-Forwarded-For.
      if (req.method==='POST' && route==='/api/resolve') {
        if (!origin) throw new AppError('ORIGIN_REQUIRED','必須由已設定的網站送出請求。',403);
        if (!(req.headers['content-type']||'').startsWith('application/json')) throw new AppError('INVALID_BODY','必須使用 JSON。',415);
        if (!resolveRate.allow(ip) || !globalRate.allow('all')) throw new AppError('RATE_LIMITED','請求過於頻密，請一分鐘後再試。',429);
        if (activeResolves>=2) throw new AppError('BUSY','服務正在處理其他請求，請稍後再試。',503);
        let body;
        try { body=JSON.parse(await readBounded(req,4096)); } catch(e) { if (e instanceof AppError) throw e; throw new AppError('INVALID_BODY','無效的 JSON。'); }
        if (!body || body.consent!==true) throw new AppError('CONSENT_REQUIRED','請先確認你擁有下載權利。');
        if (Object.keys(body).some(k => !['url','consent','platform','format','language'].includes(k))) throw new AppError('UNEXPECTED_FIELD','不接受 cookies、帳號、密碼或其他額外資料。');
        const source=normalizeSource(body.url);
        const platform=body.platform || source.platform; const format=body.format || 'mp4'; const language=body.language || 'auto';
        if (!['facebook','instagram','threads','tiktok','youtube'].includes(platform) || platform!==source.platform)
          throw new AppError('PLATFORM_MISMATCH','所選平台與網址不相符。');
        if (!['mp4','mp3','png','txt'].includes(format)) throw new AppError('INVALID_FORMAT','請選擇 MP4、MP3、PNG 或 TEXT。');
        if (!['auto','zh','yue','en','ja','ko','es','fr','de'].includes(language)) throw new AppError('INVALID_LANGUAGE','不支援此語言選項。');
        // Body reads yield: recheck immediately before acquiring a resolver slot.
        if (activeResolves>=2) throw new AppError('BUSY','服務正在處理其他請求，請稍後再試。',503);
        activeResolves++;
        try {
          const result=await resolver(source,config,{format});
          if (!Array.isArray(result.items) || !result.items.length || result.items.length>20) throw new AppError('UPSTREAM_FORMAT','未找到有效媒體。',502);
          for (const item of result.items) if (!isMediaURL(item.url,config.cobaltURL)) throw new AppError('UNSAFE_MEDIA','拒絕未獲允許的媒體。',502);
          const items=result.items.map(x => tickets.issue({...x,language}));
          return json(res,200,{platform:source.platform,source:source.url,experimental:result.experimental,provider:result.provider,items});
        } finally { activeResolves--; }
      }
      if (req.method==='GET' && /^\/api\/file\/[a-f0-9]{48}$/.test(route)) {
        if (!downloadRate.allow(ip)) throw new AppError('RATE_LIMITED','下載請求過於頻密。',429);
        if (activeDownloads>=2) throw new AppError('BUSY','下載通道繁忙。',503);
        if (req.headers.range) throw new AppError('RANGE_UNSUPPORTED','此版本只支援完整檔案下載，請重新解析後儲存。',416);
        const item=tickets.take(route.split('/').at(-1)); activeDownloads++;
        try {
          const upstream=await openMedia(item.url,{validate:v=>isMediaURL(v,config.cobaltURL),trustedOrigin:config.cobaltURL?new URL(config.cobaltURL).origin:'',timeoutMs:60000});
          let mime=(upstream.headers['content-type']||'').split(';')[0].trim();
          const cobaltTunnel=Boolean(config.cobaltURL && new URL(item.url).origin===new URL(config.cobaltURL).origin && new URL(item.url).pathname==='/tunnel');
          if ((!mime || mime==='application/octet-stream') && cobaltTunnel) mime=item.transcode==='png'?'image/jpeg':['mp3','txt'].includes(item.transcode)?(item.transcode==='txt'?'audio/mpeg':'video/mp4'):item.type==='audio'?'audio/mpeg':item.type==='photo'?'image/jpeg':'video/mp4';
          const allowed=item.transcode==='png'?['image/jpeg','image/png','image/webp']:
            item.transcode==='mp3'?['video/mp4']:
            item.transcode==='txt'?['video/mp4','audio/mpeg','audio/mp3']:
            item.type==='photo'?['image/jpeg','image/png','image/webp']:
            item.type==='audio'?['audio/mpeg','audio/mp3']:['video/mp4'];
          if (!allowed.includes(mime)) { upstream.destroy(); throw new AppError('INVALID_MEDIA','來源返回非預期的檔案格式；已拒絕下載。',502); }
          const length=Number(upstream.headers['content-length']);
          if (length===0) { upstream.destroy(); throw new AppError('INVALID_MEDIA','來源返回空檔案。',502); }
          if (Number.isFinite(length) && length>config.maxFileBytes) { upstream.destroy(); throw new AppError('FILE_TOO_LARGE','檔案超過下載大小限制。',413); }
          const ready=await materialize(upstream,item,config);
          try { res.setHeader('Content-Type',ready.mime); res.setHeader('Content-Disposition',`attachment; filename="${ready.filename}"`); res.setHeader('Content-Length',ready.size); await pipeline(createReadStream(ready.path),res); return; }
          finally { await rm(ready.dir,{recursive:true,force:true}); }
        } finally { activeDownloads--; }
      }
      if (req.method==='GET' && assets.has(route)) {
        const [filename,mime]=assets.get(route);
        const data=await readFile(new URL(`./web/${filename}`,import.meta.url));
        res.writeHead(200,{'Content-Type':mime}); res.end(data); return;
      }
      throw new AppError('NOT_FOUND','找不到此頁面。',404);
    } catch(e) {
      if (res.headersSent || res.destroyed) { res.destroy(); return; }
      if (e.status===429) res.setHeader('Retry-After','60');
      const expected=e instanceof AppError;
      json(res,expected?e.status:502,{error:{code:expected?e.code:'UPSTREAM_FAILURE',message:expected?e.message:'來源連線失敗。沒有取得檔案；請稍後重試。'}});
    }
  });
}

if (process.argv[1] && pathResolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const config=readConfig(); const server=createApp(config);
  server.requestTimeout=25000; server.headersTimeout=10000;
  server.listen(config.port,config.host,()=>console.log(`DL Anything You Want: http://${config.host}:${config.port}`));
}
