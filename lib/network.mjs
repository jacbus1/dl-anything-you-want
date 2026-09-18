// SPDX-License-Identifier: MIT
// Copyright (c) 2026 jacbus1 and DL Anything You Want contributors
import http from 'node:http';
import https from 'node:https';
import dns from 'node:dns';
import { AppError, isPublicIPv4 } from './core.mjs';

function publicLookup(host, options, callback) {
  dns.lookup(host, {all:true, family:4}, (error, addresses) => {
    if (error) return callback(error);
    if (!addresses.length || addresses.some(x => !isPublicIPv4(x.address)))
      return callback(new AppError('UNSAFE_ADDRESS', '拒絕非公開網絡位址。', 502));
    // Validate exactly the addresses used by the socket, avoiding a second DNS lookup.
    if (options.all) callback(null, addresses);
    else callback(null, addresses[0].address, 4);
  });
}

export function openURL(url, {validate, method = 'GET', body, headers = {}, trustedOrigin = '', timeoutMs = 20000, redirects = 2} = {}) {
  return new Promise((resolve,reject) => {
    let u;
    try {
      u = new URL(url);
      if (!validate?.(u.href) || u.username || u.password || !['https:','http:'].includes(u.protocol))
        throw new AppError('UNSAFE_URL', '拒絕未獲允許的網絡請求。', 502);
    } catch (e) { reject(e); return; }
    const trusted = Boolean(trustedOrigin && u.origin === trustedOrigin);
    if (!trusted && (u.protocol !== 'https:' || u.port)) return reject(new AppError('UNSAFE_URL', '必須使用 HTTPS。', 502));
    const transport = u.protocol === 'https:' ? https : http;
    const req = transport.request(u, {
      method, agent:false, family:4, autoSelectFamily:false,
      ...(trusted ? {} : {lookup:publicLookup}),
      headers: {'User-Agent':'DL Anything You Want/0.1 public-media-client', 'Accept-Encoding':'identity', ...headers}
    });
    const timer = setTimeout(() => req.destroy(new AppError('UPSTREAM_TIMEOUT', '來源回應逾時。', 504)), timeoutMs);
    req.on('error', reject);
    req.on('close', () => clearTimeout(timer));
    req.on('response', response => {
      if ([301,302,303,307,308].includes(response.statusCode)) {
        const location = response.headers.location; response.destroy();
        // Never forward API credentials to a redirect. POST redirects are refused.
        if (!location || redirects <= 0 || method !== 'GET') return reject(new AppError('UPSTREAM_REDIRECT', '不接受此來源重新導向。', 502));
        let next;
        try { next = new URL(location,u).href; } catch { return reject(new AppError('UPSTREAM_REDIRECT','無效的重新導向。',502)); }
        resolve(openURL(next, {validate, trustedOrigin, timeoutMs, redirects:redirects-1})); return;
      }
      if (response.statusCode === 429) { response.destroy(); reject(new AppError('SOURCE_RATE_LIMITED','平台正在限流。請稍後再試；系統不會繞過限制。',429)); return; }
      if ([401,403].includes(response.statusCode)) { response.destroy(); reject(new AppError('SOURCE_BLOCKED','平台拒絕匿名存取或需要登入。',422)); return; }
      if (response.statusCode !== 200) { response.destroy(); reject(new AppError('SOURCE_UNAVAILABLE','來源未能提供內容。',422)); return; }
      if (response.headers['content-encoding'] && response.headers['content-encoding'] !== 'identity') {
        response.destroy(); reject(new AppError('UNSUPPORTED_ENCODING','來源未提供可處理的回應編碼。',502)); return;
      }
      resolve(response);
    });
    if (body) req.write(body);
    req.end();
  });
}

export async function readBounded(stream, maxBytes) {
  const length = Number(stream.headers?.['content-length']);
  if (Number.isFinite(length) && length > maxBytes) { stream.destroy(); throw new AppError('TOO_LARGE', '回應超過大小限制。', 413); }
  const chunks = []; let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > maxBytes) { stream.destroy(); throw new AppError('TOO_LARGE','回應超過大小限制。',413); }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}
