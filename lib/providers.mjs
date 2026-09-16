// SPDX-License-Identifier: MIT
// Copyright (c) 2026 jacbus1 and FramePocket contributors
import { AppError, normalizeSource, parseCobalt, parseThreadsHTML } from './core.mjs';
import { openURL, readBounded } from './network.mjs';

export async function resolveMedia(source, config) {
  if (source.platform === 'instagram') {
    if (!config.cobaltURL) throw new AppError('ENGINE_NOT_CONFIGURED','尚未連接自架 Cobalt 下載引擎。請先完成後端設定。',503);
    const endpoint = new URL(config.cobaltURL);
    const body = JSON.stringify({url:source.url, alwaysProxy:true, localProcessing:'disabled', downloadMode:'auto'});
    const response = await openURL(endpoint.href, {
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
  const response = await openURL(source.url, {
    validate: v => { try { const n=normalizeSource(v); return n.platform==='threads' && n.id===source.id; } catch { return false; } },
    headers:{'Accept':'text/html'}
  });
  const mime=(response.headers['content-type']||'').split(';')[0];
  if (!['text/html','application/xhtml+xml'].includes(mime)) { response.destroy(); throw new AppError('UPSTREAM_FORMAT','Threads 沒有返回 HTML 頁面。',502); }
  return {items:parseThreadsHTML(await readBounded(response,4*1024*1024),source.id), provider:'anonymous-threads-html', experimental:true};
}
