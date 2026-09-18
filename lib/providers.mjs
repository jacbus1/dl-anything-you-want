// SPDX-License-Identifier: MIT
// Copyright (c) 2026 jacbus1 and DL Anything You Want contributors
import { AppError, normalizeSource, parseCobalt, parseThreadsHTML } from './core.mjs';
import { openURL, readBounded } from './network.mjs';

export async function resolveMedia(source, config, {open = openURL} = {}) {
  if (source.platform !== 'threads') {
    if (!config.cobaltURL) throw new AppError('ENGINE_NOT_CONFIGURED','下載引擎尚未啟動。請使用 Docker Compose 啟動完整服務。',503);
    const endpoint = new URL(config.cobaltURL);
    const body = JSON.stringify({url:source.url, alwaysProxy:true, localProcessing:'disabled', downloadMode:'auto'});
    const response = await open(endpoint.href, {
      method:'POST', body, trustedOrigin:endpoint.origin,
      validate: v => v === endpoint.href,
      headers: {'Accept':'application/json','Content-Type':'application/json','Content-Length':Buffer.byteLength(body),
        ...(config.cobaltKey ? {'Authorization':`Api-Key ${config.cobaltKey}`} : {})}
    });
    const text = await readBounded(response,1024*1024);
    let data;
    try { data=JSON.parse(text); } catch { throw new AppError('UPSTREAM_FORMAT','下載引擎未返回 JSON。',502); }
    return {items:parseCobalt(data,config.cobaltURL), provider:'self-hosted-cobalt', experimental:false};
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
  if (target.share) { response.destroy(); throw new AppError('THREADS_UNAVAILABLE', 'Threads 分享網址沒有轉到有效貼文。', 422); }
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
  if (!['text/html','application/xhtml+xml'].includes(mime)) { response.destroy(); throw new AppError('UPSTREAM_FORMAT','Threads 沒有返回 HTML 頁面。',502); }
  return {items:parseThreadsHTML(await readBounded(response,4*1024*1024),target.id), provider:'anonymous-threads-html', experimental:true};
}
