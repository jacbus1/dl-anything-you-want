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
      return callback(new AppError('UNSAFE_ADDRESS', 'Private network addresses are not allowed.', 502));
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
        throw new AppError('UNSAFE_URL', 'The network request is not allowed.', 502);
    } catch (e) { reject(e); return; }
    const trusted = Boolean(trustedOrigin && u.origin === trustedOrigin);
    if (!trusted && (u.protocol !== 'https:' || u.port)) return reject(new AppError('UNSAFE_URL', 'HTTPS is required.', 502));
    const transport = u.protocol === 'https:' ? https : http;
    const req = transport.request(u, {
      method, agent:false, family:4, autoSelectFamily:false,
      ...(trusted ? {} : {lookup:publicLookup}),
      headers: {'User-Agent':'DL Anything You Want/0.3 public-media-client', 'Accept-Encoding':'identity', ...headers}
    });
    const timer = setTimeout(() => req.destroy(new AppError('UPSTREAM_TIMEOUT', 'The source timed out.', 504)), timeoutMs);
    req.on('error', reject);
    req.on('close', () => clearTimeout(timer));
    req.on('response', response => {
      if ([301,302,303,307,308].includes(response.statusCode)) {
        const location = response.headers.location; response.destroy();
        // Never forward API credentials to a redirect. POST redirects are refused.
        if (!location || redirects <= 0 || method !== 'GET') return reject(new AppError('UPSTREAM_REDIRECT', 'This source redirect is not accepted.', 502));
        let next;
        try { next = new URL(location,u).href; } catch { return reject(new AppError('UPSTREAM_REDIRECT','Invalid redirect.',502)); }
        resolve(openURL(next, {validate, trustedOrigin, timeoutMs, redirects:redirects-1})); return;
      }
      if (response.statusCode === 429) { response.destroy(); reject(new AppError('SOURCE_RATE_LIMITED','The platform is rate limiting requests. Try again later.',429)); return; }
      if ([401,403].includes(response.statusCode)) { response.destroy(); reject(new AppError('SOURCE_BLOCKED','The platform blocked anonymous access or requires login.',422)); return; }
      if (response.statusCode !== 200) { response.destroy(); reject(new AppError('SOURCE_UNAVAILABLE','The source did not provide content.',422)); return; }
      if (response.headers['content-encoding'] && response.headers['content-encoding'] !== 'identity') {
        response.destroy(); reject(new AppError('UNSUPPORTED_ENCODING','The source returned an unsupported encoding.',502)); return;
      }
      resolve(response);
    });
    if (body) req.write(body);
    req.end();
  });
}

export async function readBounded(stream, maxBytes) {
  const length = Number(stream.headers?.['content-length']);
  if (Number.isFinite(length) && length > maxBytes) { stream.destroy(); throw new AppError('TOO_LARGE', 'The response exceeds the size limit.', 413); }
  const chunks = []; let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > maxBytes) { stream.destroy(); throw new AppError('TOO_LARGE','The response exceeds the size limit.',413); }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}
