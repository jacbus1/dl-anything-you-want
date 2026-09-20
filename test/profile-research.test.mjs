// SPDX-License-Identifier: MIT
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeProfile, normalizeInstagramProfile, extractGitHubCandidates,
  scanProfile, analyzeSelectedPosts, reposToCsv
} from '../lib/profile-research.mjs';

test('normalizes Instagram profile URL and strips tracking parameters',()=>{
  const p=normalizeInstagramProfile('https://www.instagram.com/gittrend.io?stkn=abc');
  assert.equal(p.username,'gittrend.io');
  assert.equal(p.url,'https://www.instagram.com/gittrend.io/');
});
test('normalizes Threads and TikTok profiles',()=>{
  assert.equal(normalizeProfile('https://www.threads.com/@gittrend.io','threads').username,'gittrend.io');
  assert.equal(normalizeProfile('https://www.tiktok.com/@gittrend.io','tiktok').url,'https://www.tiktok.com/@gittrend.io');
});
test('rejects post URLs as profile inputs',()=>{
  assert.throws(()=>normalizeProfile('https://www.instagram.com/reel/ABC123/','instagram'));
  assert.throws(()=>normalizeProfile('https://www.threads.com/@a/post/ABC123','threads'));
  assert.throws(()=>normalizeProfile('https://www.tiktok.com/@a/video/12345','tiktok'));
});
test('extracts direct GitHub links and bare owner/repo candidates',()=>{
  const c=extractGitHubCandidates('See https://github.com/Tencent/teamai-cli and 0xK3vin/MegaMemory.');
  assert.equal(c.length,2);
  assert.equal(c.find(x=>x.full_name==='Tencent/teamai-cli').direct,true);
});
test('scan phase returns selectable posts without GitHub enrichment',async()=>{
  const collectors={
    threads:async()=>({username:'gittrend.io',full_name:'GitTrend',media_count:2,provider:'fixture',posts:[
      {id:'A',url:'https://www.threads.com/@gittrend.io/post/A',date_utc:'2026-09-01T00:00:00Z',text:'Repo Tencent/teamai-cli'},
      {id:'B',url:'https://www.threads.com/@gittrend.io/post/B',date_utc:'2026-09-02T00:00:00Z',text:'No repository here'}
    ]})
  };
  const r=await scanProfile('@gittrend.io',{platform:'threads',maxPosts:10,collectors});
  assert.equal(r.posts.length,2);
  assert.deepEqual(r.posts[0].github_candidates,['Tencent/teamai-cli']);
  assert.equal(r.scan.provider,'fixture');
});
test('analysis phase only analyzes selected posts and enriches repos',async()=>{
  const fetchImpl=async url=>{
    const name=decodeURIComponent(new URL(url).pathname.split('/').slice(-2).join('/'));
    const ok=['Tencent/teamai-cli','0xK3vin/MegaMemory'].includes(name);
    return {ok,status:ok?200:404,headers:{get:()=>null},json:async()=>({full_name:name,html_url:'https://github.com/'+name,description:name.includes('teamai')?'AI coding team':'agent memory',language:'TypeScript',stargazers_count:10,forks_count:2,open_issues_count:1,topics:['ai'],archived:false,fork:false,updated_at:'2026-09-01T00:00:00Z',pushed_at:'',license:{spdx_id:'MIT'}})};
  };
  const r=await analyzeSelectedPosts({
    platform:'threads',
    profile:{username:'gittrend.io'},
    posts:[
      {id:'A',url:'https://www.threads.com/@gittrend.io/post/A',text:'https://github.com/Tencent/teamai-cli is an AI coding team.'},
      {id:'B',url:'https://www.threads.com/@gittrend.io/post/B',text:'0xK3vin/MegaMemory stores agent memory.'}
    ]
  },{fetchImpl});
  assert.equal(r.repos.length,2);
  assert.equal(r.posts.length,2);
  assert.equal(r.summary_provider,'local-extractive');
  assert.match(r.csv,/AI coding team/);
});
test('analysis rejects selected URL from another platform',async()=>{
  await assert.rejects(analyzeSelectedPosts({platform:'instagram',posts:[{id:'x',url:'https://www.tiktok.com/@x/video/1',text:'hello'}]}),{code:'INVALID_SELECTION'});
});
test('CSV escapes quotes',()=>assert.match(reposToCsv([{full_name:'a/b',url:'x',description:'say "hi"'}]),/say ""hi""/));
