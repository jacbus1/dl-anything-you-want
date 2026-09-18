// SPDX-License-Identifier: MIT
// Copyright (c) 2026 jacbus1 and DL Anything You Want contributors
import { randomBytes } from 'node:crypto';

export class AppError extends Error {
  constructor(code, message, status = 400) { super(message); this.code = code; this.status = status; }
}

export function normalizeSource(input) {
  if (typeof input !== 'string' || input.length > 2048 || /[\s\\\x00-\x1f]/.test(input.trim()))
    throw new AppError('INVALID_URL', '請貼上完整、有效的 HTTPS 貼文網址。');
  let u;
  try { u = new URL(input.trim()); } catch { throw new AppError('INVALID_URL', '網址格式不正確。'); }
  if (u.protocol !== 'https:' || u.username || u.password || u.port)
    throw new AppError('INVALID_URL', '只接受 HTTPS 網址，不接受帳密或自訂連接埠。');
  let m;
  if (['instagram.com', 'www.instagram.com', 'm.instagram.com'].includes(u.hostname)) {
    m = u.pathname.match(/^\/(p|reel|reels|tv)\/([A-Za-z0-9_-]{3,64})\/?$/);
    if (m) return {platform: 'instagram', id: m[2], url: `https://www.instagram.com/${m[1] === 'reels' ? 'reel' : m[1]}/${m[2]}/`};
    m = u.pathname.match(/^\/share\/(?:reel|p)\/([A-Za-z0-9_-]{3,64})\/?$/);
    if (m) return {platform: 'instagram', id: m[1], url: `https://www.instagram.com${u.pathname}`};
  }
  if (['threads.com', 'www.threads.com', 'threads.net', 'www.threads.net'].includes(u.hostname)) {
    m = u.pathname.match(/^\/@([A-Za-z0-9._]{1,64})\/post\/([A-Za-z0-9_-]{3,64})\/?$/);
    if (m) return {platform: 'threads', id: m[2], url: `https://www.threads.com/@${m[1]}/post/${m[2]}`};
    m = u.pathname.match(/^\/share\/([A-Za-z0-9_-]{3,64})\/?$/);
    if (m) return {platform: 'threads', id: m[1], share: true, url: `https://www.threads.com/share/${m[1]}/`};
    m = u.pathname.match(/^\/t\/([A-Za-z0-9_-]{3,64})\/?$/);
    if (m) return {platform: 'threads', id: m[1], url: `https://www.threads.com/t/${m[1]}`};
  }
  if (['tiktok.com','www.tiktok.com','m.tiktok.com'].includes(u.hostname)) {
    m = u.pathname.match(/^\/@([A-Za-z0-9._-]{1,64})\/video\/(\d{5,32})\/?$/);
    if (m) return {platform:'tiktok',id:m[2],url:`https://www.tiktok.com/@${m[1]}/video/${m[2]}`};
  }
  if (['vm.tiktok.com','vt.tiktok.com'].includes(u.hostname)) {
    m = u.pathname.match(/^\/([A-Za-z0-9_-]{3,64})\/?$/);
    if (m) return {platform:'tiktok',id:m[1],url:`https://${u.hostname}/${m[1]}/`};
  }
  if (u.hostname === 'fb.watch') {
    m = u.pathname.match(/^\/([A-Za-z0-9_-]{3,64})\/?$/);
    if (m) return {platform:'facebook',id:m[1],url:`https://fb.watch/${m[1]}/`};
  }
  if (['facebook.com','www.facebook.com','m.facebook.com'].includes(u.hostname)) {
    m = u.pathname.match(/^\/(?:reel|share\/v)\/([A-Za-z0-9_-]{3,64})\/?$/);
    if (m) return {platform:'facebook',id:m[1],url:`https://www.facebook.com${u.pathname}`};
    m = u.pathname.match(/^\/[^/]{1,100}\/videos\/(\d{3,32})\/?$/);
    if (m) return {platform:'facebook',id:m[1],url:`https://www.facebook.com${u.pathname}`};
    if (u.pathname === '/watch/' && /^\d{3,32}$/.test(u.searchParams.get('v') || ''))
      return {platform:'facebook',id:u.searchParams.get('v'),url:`https://www.facebook.com/watch/?v=${u.searchParams.get('v')}`};
  }
  if (['youtube.com','www.youtube.com','m.youtube.com'].includes(u.hostname)) {
    if (u.pathname === '/watch' && /^[A-Za-z0-9_-]{11}$/.test(u.searchParams.get('v') || ''))
      return {platform:'youtube',id:u.searchParams.get('v'),url:`https://www.youtube.com/watch?v=${u.searchParams.get('v')}`};
    m = u.pathname.match(/^\/(?:shorts|live)\/([A-Za-z0-9_-]{11})\/?$/);
    if (m) return {platform:'youtube',id:m[1],url:`https://www.youtube.com/watch?v=${m[1]}`};
  }
  if (u.hostname === 'youtu.be' && (m=u.pathname.match(/^\/([A-Za-z0-9_-]{11})\/?$/)))
    return {platform:'youtube',id:m[1],url:`https://www.youtube.com/watch?v=${m[1]}`};
  throw new AppError('UNSUPPORTED_URL', '只接受 Facebook、Instagram、Threads、TikTok 或 YouTube 的單則公開媒體網址。');
}

export function isPublicIPv4(ip) {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a,b,c] = p;
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
    (a === 192 && b === 0) || (a === 192 && b === 88 && c === 99) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113));
}

export function isMediaURL(value, cobaltBase = '') {
  try {
    const u = new URL(value);
    if (u.username || u.password || u.hash) return false;
    // Only the operator-configured instance's /tunnel endpoint may be internal HTTP.
    if (cobaltBase && u.origin === new URL(cobaltBase).origin && u.pathname === '/tunnel') return true;
    return u.protocol === 'https:' && !u.port && ['cdninstagram.com', 'fbcdn.net'].some(h => u.hostname === h || u.hostname.endsWith(`.${h}`));
  } catch { return false; }
}

export function mediaItem(url, type = 'video', index = 1, cobaltBase = '') {
  if (!isMediaURL(url, cobaltBase)) throw new AppError('UNSAFE_MEDIA', '來源返回不在允許清單內的媒體網址。', 502);
  if (!['video', 'photo', 'audio'].includes(type)) throw new AppError('UNSUPPORTED_MEDIA', '不支援此媒體格式。', 422);
  // Filename is intentionally independent of untrusted captions / upstream filenames.
  let ext = type === 'photo' ? 'jpg' : type === 'audio' ? 'mp3' : 'mp4';
  const match = new URL(url).pathname.match(/\.(jpg|jpeg|png|webp|mp4|mp3)$/i);
  if (match && ({photo:['jpg','jpeg','png','webp'],video:['mp4'],audio:['mp3']}[type]).includes(match[1].toLowerCase())) ext = match[1].toLowerCase();
  return {url, type, filename: `dl-anything-${String(index).padStart(2, '0')}.${ext}`};
}

export function parseCobalt(data, cobaltBase, requestedFormat = 'mp4') {
  if (!data || typeof data !== 'object') throw new AppError('UPSTREAM_FORMAT', '下載引擎回應格式不正確。', 502);
  if (data.status === 'error') throw new AppError('SOURCE_UNAVAILABLE', '下載引擎無法取得公開媒體；可能需要登入、已刪除或被限流。', 422);
  if (data.status === 'picker' && Array.isArray(data.picker) && data.picker.length && data.picker.length <= 20)
    return data.picker.map((x,i) => {
      if (!['photo','video'].includes(x.type)) throw new AppError('UNSUPPORTED_MEDIA','不支援此媒體格式。',422);
      return mediaItem(x.url,x.type,i+1,cobaltBase);
    });
  if (['redirect', 'tunnel'].includes(data.status) && typeof data.url === 'string') {
    const photo = /\.(jpe?g|png|webp)$/i.test(data.filename || new URL(data.url).pathname);
    const audio = ['mp3','txt'].includes(requestedFormat) || /\.mp3$/i.test(data.filename || '');
    return [mediaItem(data.url, photo ? 'photo' : audio ? 'audio' : 'video', 1, cobaltBase)];
  }
  throw new AppError('UPSTREAM_FORMAT', '引擎返回未支援的結果，沒有建立下載連結。', 502);
}

function decodeHTML(s) {
  return s.replace(/&(?:amp|quot|apos|lt|gt|#39|#x[0-9a-f]+|#\d+);/gi, e => {
    const known = {'&amp;':'&','&quot;':'"','&apos;':"'",'&#39;':"'",'&lt;':'<','&gt;':'>'};
    if (known[e.toLowerCase()]) return known[e.toLowerCase()];
    const n = e.toLowerCase().startsWith('&#x') ? parseInt(e.slice(3,-1),16) : parseInt(e.slice(2,-1),10);
    return Number.isInteger(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '';
  });
}
function attrs(tag) {
  const result = {};
  for (const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) result[m[1].toLowerCase()] = decodeHTML(m[2] ?? m[3]);
  return result;
}

export function parseThreadsHTML(html, id) {
  if (typeof html !== 'string' || Buffer.byteLength(html) > 4 * 1024 * 1024)
    throw new AppError('PAGE_TOO_LARGE', '來源頁面過大。', 502);
  // Parse JSON only. Never eval script contents. Match the exact post code before reading media.
  const found = [];
  let visited = 0;
  function scan(root) {
    const stack = [[root, 0]];
    while (stack.length) {
      const [v, depth] = stack.pop();
      if (++visited > 100000) throw new AppError('PAGE_TOO_COMPLEX', '來源資料過於複雜。', 502);
      if (!v || typeof v !== 'object' || depth > 60) continue;
      if (v.code === id || v.shortcode === id) found.push(v);
      for (const x of Object.values(v)) if (x && typeof x === 'object') stack.push([x, depth+1]);
    }
  }
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    if (attrs(m[1]).type !== 'application/json') continue;
    let data;
    try { data = JSON.parse(m[2]); } catch { continue; }
    scan(data);
  }
  const candidates = [];
  for (const post of found) {
    if (post.is_private === true || post.user?.is_private === true)
      throw new AppError('PRIVATE_CONTENT', '不處理非公開內容。', 403);
    const children = Array.isArray(post.carousel_media) ? post.carousel_media.slice(0,20) : [post];
    for (const child of children) {
      const videos = (Array.isArray(child.video_versions) ? child.video_versions : []).filter(x => typeof x?.url === 'string' && isMediaURL(x.url));
      videos.sort((a,b) => (Number(b.width)||0)*(Number(b.height)||0) - (Number(a.width)||0)*(Number(a.height)||0));
      if (videos.length) candidates.push({url:videos[0].url,type:'video'});
      // image_versions2 exists on many unrelated objects too. Only accept it on
      // an exact post media node whose media_type identifies a photo or video.
      if ([1,2].includes(Number(child.media_type))) {
        const images = (Array.isArray(child.image_versions2?.candidates) ? child.image_versions2.candidates : [])
          .filter(x => typeof x?.url === 'string' && isMediaURL(x.url));
        images.sort((a,b) => (Number(b.width)||0)*(Number(b.height)||0) - (Number(a.width)||0)*(Number(a.height)||0));
        if (images.length) candidates.push({url:images[0].url,type:'photo'});
      }
    }
  }
  // Narrow OG fallback: an explicit matching canonical/og:url plus actual og:video, never og:image/avatar.
  if (!candidates.length && !found.length) {
    let canonicalMatches = false;
    let canonicalConflicts = false;
    const ogVideos = [];
    for (const m of html.matchAll(/<(?:meta|link)\b[^>]*>/gi)) {
      const a = attrs(m[0]);
      if (a.property === 'og:url' || (a.rel || '').toLowerCase() === 'canonical') {
        try {
          const s = normalizeSource(a.content || a.href);
          const matches = s.platform === 'threads' && s.id === id;
          canonicalMatches ||= matches;
          canonicalConflicts ||= !matches;
        } catch { canonicalConflicts = true; }
      }
      if (['og:video','og:video:url','og:video:secure_url'].includes(a.property) && isMediaURL(a.content)) ogVideos.push(a.content);
    }
    if (canonicalMatches && !canonicalConflicts) candidates.push(...ogVideos.map(url => ({url,type:'video'})));
  }
  const unique = [...new Map(candidates.map(x => [`${x.type}:${x.url}`,x])).values()].slice(0,20);
  if (!unique.length) throw new AppError('THREADS_UNAVAILABLE', '未在匿名公開頁面找到這則貼文的影片或圖片。可能需要登入、頁面格式已變，或貼文本身沒有可下載媒體。', 422);
  return unique.map((item,i) => mediaItem(item.url,item.type,i+1));
}

export class TicketStore {
  constructor({ttl = 60000, max = 500, now = Date.now} = {}) { this.ttl = ttl; this.max = max; this.now = now; this.items = new Map(); }
  purge() { for (const [id,x] of this.items) if (x.expires <= this.now()) this.items.delete(id); }
  issue(item) {
    this.purge();
    if (this.items.size >= this.max) throw new AppError('BUSY', '服務繁忙，請稍後再試。', 503);
    const id = randomBytes(24).toString('hex'); const expires = this.now()+this.ttl;
    this.items.set(id, {...item, expires});
    return {id, expires, type: item.type, filename: item.filename, path: `/api/file/${id}`};
  }
  take(id) {
    this.purge(); const item = this.items.get(id); this.items.delete(id);
    if (!item) throw new AppError('LINK_EXPIRED', '連結已使用或過期，請重新解析。', 410);
    return item;
  }
}

export class RateLimiter {
  constructor({limit = 6, windowMs = 60000, maxKeys = 4096, now = Date.now} = {}) {
    Object.assign(this, {limit,windowMs,maxKeys,now}); this.keys = new Map();
  }
  allow(key) {
    const now = this.now();
    for (const [k,v] of this.keys) if (v.until <= now) this.keys.delete(k);
    let x = this.keys.get(key);
    if (!x) {
      if (this.keys.size >= this.maxKeys) return false;
      x = {count:0, until:now+this.windowMs}; this.keys.set(key,x);
    }
    return ++x.count <= this.limit;
  }
}
