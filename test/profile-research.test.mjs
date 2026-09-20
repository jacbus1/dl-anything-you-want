// SPDX-License-Identifier: MIT
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeInstagramProfile, extractGitHubCandidates, runProfileResearch, reposToCsv } from '../lib/profile-research.mjs';

test('normalizes Instagram profile URL and strips tracking parameters',()=>{
  const p=normalizeInstagramProfile('https://www.instagram.com/gittrend.io?stkn=abc');
  assert.equal(p.username,'gittrend.io');
  assert.equal(p.url,'https://www.instagram.com/gittrend.io/');
});
test('accepts @username and rejects post URLs',()=>{
  assert.equal(normalizeInstagramProfile('@gittrend.io').username,'gittrend.io');
  assert.throws(()=>normalizeInstagramProfile('https://www.instagram.com/reel/ABC123/'));
});
test('extracts direct GitHub links and bare owner/repo candidates',()=>{
  const c=extractGitHubCandidates('See https://github.com/Tencent/teamai-cli and 0xK3vin/MegaMemory.');
  assert.equal(c.length,2);
  assert.equal(c.find(x=>x.full_name==='Tencent/teamai-cli').direct,true);
});
test('profile research verifies, deduplicates and describes repositories',async()=>{
  const collector=async()=>({username:'gittrend.io',full_name:'GitTrend',biography:'',external_url:'',media_count:2,truncated:false,authenticated:false,posts:[
    {shortcode:'A',url:'https://www.instagram.com/p/A/',date_utc:'2026-09-01Z',caption:'https://github.com/Tencent/teamai-cli'},
    {shortcode:'B',url:'https://www.instagram.com/p/B/',date_utc:'2026-09-02Z',caption:'Tencent/teamai-cli and 0xK3vin/MegaMemory'}
  ]});
  const fetchImpl=async url=>{
    const name=decodeURIComponent(new URL(url).pathname.split('/').slice(-2).join('/'));
    const ok=['Tencent/teamai-cli','0xK3vin/MegaMemory'].includes(name);
    return {ok,status:ok?200:404,headers:{get:()=>null},json:async()=>({full_name:name,html_url:'https://github.com/'+name,description:name.includes('teamai')?'AI coding team':'agent memory',language:'TypeScript',stargazers_count:10,forks_count:2,open_issues_count:1,topics:['ai'],archived:false,fork:false,updated_at:'2026-09-01T00:00:00Z',pushed_at:'',license:{spdx_id:'MIT'}})};
  };
  const r=await runProfileResearch('@gittrend.io',{collector,fetchImpl,maxPosts:100});
  assert.equal(r.repos.length,2);
  assert.equal(r.repos.find(x=>x.full_name==='Tencent/teamai-cli').source_posts.length,2);
  assert.match(r.csv,/AI coding team/);
});
test('CSV escapes quotes',()=>assert.match(reposToCsv([{full_name:'a/b',url:'x',description:'say "hi"'}]),/say ""hi""/));
