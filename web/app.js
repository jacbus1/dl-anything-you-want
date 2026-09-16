// SPDX-License-Identifier: MIT
// Copyright (c) 2026 jacbus1 and FramePocket contributors
'use strict';
const $=id=>document.getElementById(id);
let apiBase='';
try {
  const raw=window.FRAMEPOCKET_CONFIG?.apiBase || window.location.origin;
  const u=new URL(raw);
  if (u.username || u.password || u.pathname!=='/' || u.search || u.hash ||
    !(u.protocol==='https:' || (u.protocol==='http:' && ['localhost','127.0.0.1'].includes(u.hostname)))) throw new Error('invalid API origin');
  apiBase=u.origin;
} catch { $('connection').textContent='API 設定無效'; }
function message(text,error=false) { $('message').textContent=text; $('message').classList.toggle('error',error); }
function clearResults() { $('results').hidden=true; $('file-list').replaceChildren(); }
function safeSource(input) {
  const u=new URL(input.trim());
  if (u.protocol!=='https:' || u.username || u.password || u.port || !['instagram.com','www.instagram.com','m.instagram.com','threads.com','www.threads.com','threads.net','www.threads.net'].includes(u.hostname)) throw new Error('只接受 Instagram／Threads 的 HTTPS 貼文連結。');
  return u.href;
}
function showResults(data,demo=false) {
  clearResults(); $('results').hidden=false;
  $('result-count').textContent=`${data.items.length} 個檔案${demo?' · DEMO':''}`;
  $('result-note').textContent=demo?'示範資料：沒有解析真實貼文，下載按鈕已停用。':`${data.experimental?'Threads 實驗性解析器。 ':''}每條連結只能使用一次，約一分鐘內有效。過期請重新解析。`;
  for (const item of data.items) {
    const row=document.createElement('div'); row.className='file-row';
    const icon=document.createElement('div'); icon.className='file-icon'; icon.textContent=item.type==='photo'?'▧':'▷'; icon.setAttribute('aria-hidden','true');
    const info=document.createElement('div'); info.className='file-info';
    const name=document.createElement('strong'); name.textContent=item.filename;
    const detail=document.createElement('small'); detail.textContent=item.type==='photo'?'相片 · Photo':'影片 · Video';
    info.append(name,detail);
    const control=document.createElement(demo?'button':'a'); control.textContent=demo?'示範':'儲存';
    if (demo) control.disabled=true;
    else {
      if (!/^\/api\/file\/[a-f0-9]{48}$/.test(item.path)) throw new Error('後端返回不安全的下載路徑。');
      control.href=apiBase+item.path; control.rel='noopener noreferrer'; control.referrerPolicy='no-referrer'; control.target='_blank';
      control.addEventListener('click',()=>{control.textContent='已開啟'; message('下載已交由瀏覽器處理，這不代表檔案已成功儲存。若新頁面顯示錯誤，請重新解析。');},{once:true});
    }
    row.append(icon,info,control); $('file-list').append(row);
  }
}
$('paste').addEventListener('click',async()=>{
  try { $('source-url').value=await navigator.clipboard.readText(); $('source-url').focus(); }
  catch { message('瀏覽器未授予剪貼簿權限。請在輸入欄手動貼上。'); $('source-url').focus(); }
});
let busy=false;
$('download-form').addEventListener('submit',async e=>{
  e.preventDefault(); if(busy)return; clearResults();
  if (!$('consent').checked) return message('請先確認你擁有下載權利。',true);
  if (!apiBase) return message('請先在 config.js 設定有效的 API 網址。',true);
  let url;
  try{url=safeSource($('source-url').value);}catch(err){return message(err.message,true);}
  busy=true; $('resolve').disabled=true; $('demo').disabled=true; $('resolve').textContent='正在解析…'; message('正在向你的下載服務查詢公開媒體。遇到平台限制時會停止。');
  try {
    const response=await fetch(apiBase+'/api/resolve',{method:'POST',credentials:'omit',referrerPolicy:'no-referrer',headers:{'Content-Type':'application/json'},body:JSON.stringify({url,consent:true}),signal:AbortSignal.timeout(65000)});
    let data;
    try{data=await response.json();}catch{throw new Error('此地址沒有提供下載 API。GitHub Pages 只有靜態介面，請部署並設定後端。');}
    if(!response.ok)throw new Error(data.error?.message||'解析失敗，沒有建立下載連結。');
    if(!Array.isArray(data.items)||!data.items.length||data.items.length>20)throw new Error('回應中沒有有效檔案。');
    showResults(data); message('已取得媒體連結。請選擇個別檔案儲存；下載完成狀態以瀏覽器為準。');
  } catch(err) { clearResults(); message(err.name==='TimeoutError'?'解析逾時，未取得結果。':err.message==='Failed to fetch'?'無法連接 API。請檢查後端網址、HTTPS 及允許來源設定。':err.message,true); }
  finally{busy=false;$('resolve').disabled=false;$('demo').disabled=false;$('resolve').textContent='解析連結 →';}
});
$('demo').addEventListener('click',()=>{if(busy)return;showResults({items:[{type:'photo',filename:'示範相片-01.jpg'},{type:'photo',filename:'示範相片-02.jpg'},{type:'video',filename:'示範影片-03.mp4'}]},true);message('這是介面示範，沒有下載或解析任何外部內容。');});
(async()=>{
  if(!apiBase)return;
  try{
    const r=await fetch(apiBase+'/api/health',{credentials:'omit',signal:AbortSignal.timeout(6000)}); const d=await r.json();
    if(!r.ok||d.status!=='ok')throw new Error();
    $('connection').textContent=d.instagram==='not-configured'?'API 在線 · IG 未設定':'API 在線 · 尚待實測'; $('connection').classList.add('ok');
  }catch{$('connection').textContent='尚未連接 API';message('網站介面已載入。要解析真實貼文，請先部署 API；也可查看明確標示的示範介面。');}
})();
