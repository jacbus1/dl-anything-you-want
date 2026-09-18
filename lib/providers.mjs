// SPDX-License-Identifier: MIT
// Copyright (c) 2026 jacbus1 and DL Anything You Want contributors
import { AppError, normalizeSource, parseCobalt, parseThreadsHTML } from './core.mjs';
import { openURL, readBounded } from './network.mjs';

function selectFormat(items, format, platform) {
  if (format === 'png') {
    const photos=items.filter(x=>x.type==='photo').map((x,i)=>({...x,filename:`dl-anything-${String(i+1).padStart(2,'0')}.png`,transcode:'png'}));
    if (!photos.length) throw new AppError('FORMAT_UNAVAILABLE','This post has no downloadable image.',422);
    return photos;
  }
  if (format === 'mp3' && platform === 'threads') {
    const videos=items.filter(x=>x.type==='video').map((x,i)=>({...x,type:'audio',filename:`dl-anything-${String(i+1).padStart(2,'0')}.mp3`,transcode:'mp3'}));
    if (!videos.length) throw new AppError('FORMAT_UNAVAILABLE','This post has no video to convert.',422);
    return videos;
  }
  const wanted=format==='mp3'?'audio':'video';
  const selected=items.filter(x=>x.type===wanted);
  if (!selected.length) throw new AppError('FORMAT_UNAVAILABLE',format==='mp3'?'No downloadable audio was found.':'No downloadable video was found.',422);
  return selected;
}

export async function resolveMedia(source, config, {open = openURL, format = 'mp4'} = {}) {
  if (!['mp4','mp3','png'].includes(format)) throw new AppError('INVALID_FORMAT','This output format is not supported.');
  if (source.platform !== 'threads') {
    if (!config.cobaltURL) throw new AppError('ENGINE_NOT_CONFIGURED','The download engine is not running. Start the full service with Docker Compose.',503);
    const endpoint = new URL(config.cobaltURL);
    const body = JSON.stringify({url:source.url, alwaysProxy:true, localProcessing:'disabled',
      downloadMode:format==='mp3'?'audio':'auto', audioFormat:'mp3', audioBitrate:'128',
      videoQuality:'720', youtubeVideoCodec:'h264', youtubeVideoContainer:'mp4'});
    const response = await open(endpoint.href, {
      method:'POST', body, trustedOrigin:endpoint.origin,
      validate: v => v === endpoint.href,
      headers: {'Accept':'application/json','Content-Type':'application/json','Content-Length':Buffer.byteLength(body),
        ...(config.cobaltKey ? {'Authorization':`Api-Key ${config.cobaltKey}`} : {})}
    });
    const text = await readBounded(response,1024*1024);
    let data;
    try { data=JSON.parse(text); } catch { throw new AppError('UPSTREAM_FORMAT','The download engine did not return JSON.',502); }
    return {items:selectFormat(parseCobalt(data,config.cobaltURL,format),format,source.platform), provider:'self-hosted-cobalt', experimental:false};
  }
  let target = source;
  let response = await open(source.url, {
    validate: v => {
      try {
        const next = normalizeSource(v);
        if (next.platform !== 'threads') return false;
        if (target.share) {
          if (next.share) return next.id === target.id;
          target = next; // First official post redirect establishes the identity.
          return true;
        }
        return !next.share && next.id === target.id;
      } catch { return false; }
    },
    headers:{'Accept':'text/html'}
  });
  if (target.share) { response.destroy(); throw new AppError('THREADS_UNAVAILABLE', 'The Threads share URL did not redirect to a valid post.', 422); }
  // Fetch the clean canonical URL: share tracking parameters can return a
  // different HTML shell without the post's media data.
  if (source.share) {
    response.destroy();
    response = await open(target.url, {
      validate: v => { try { const n = normalizeSource(v); return n.platform === 'threads' && !n.share && n.id === target.id; } catch { return false; } },
      headers: {'Accept':'text/html'}
    });
  }
  const mime=(response.headers['content-type']||'').split(';')[0];
  if (!['text/html','application/xhtml+xml'].includes(mime)) { response.destroy(); throw new AppError('UPSTREAM_FORMAT','Threads did not return an HTML page.',502); }
  return {items:selectFormat(parseThreadsHTML(await readBounded(response,4*1024*1024),target.id),format,'threads'), provider:'anonymous-threads-html', experimental:true};
}
