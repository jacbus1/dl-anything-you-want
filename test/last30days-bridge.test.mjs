// SPDX-License-Identifier: MIT
import test from 'node:test';
import assert from 'node:assert/strict';
import { researchLast30Days, validateLast30DaysAgentReport } from '../lib/last30days-bridge.mjs';

const sample={
  schema_version:'1.3',
  query:'AI coding agents',
  generated_at:'2026-09-20T18:00:00Z',
  window_days:30,
  source_status:{reddit:'ok',github:'ok'},
  freshness_verdicts:[],
  clusters:[{title:'Agent workflows',summary:'Example',sources:['reddit','github'],engagement_total:123}],
  results:[{candidate_id:'c1',title:'Example',source:'github',url:'https://github.com/example/repo',summary:'Example',engagement:{stars:10},relevance_score:0.9}]
};

test('accepts the documented 1.x agent JSON contract',()=>{
  assert.equal(validateLast30DaysAgentReport(sample),sample);
});

test('rejects an unsupported major schema',()=>{
  assert.throws(()=>validateLast30DaysAgentReport({...sample,schema_version:'2.0'}),e=>e.code==='LAST30DAYS_SCHEMA_UNSUPPORTED');
});

test('passes the topic as one argv item and parses normalized JSON',async()=>{
  let seen;
  const runner=async(command,args)=>{seen={command,args};return{code:0,stdout:JSON.stringify(sample),stderr:''};};
  const out=await researchLast30Days('AI agents; echo unsafe',{
    pythonCommand:'python3.12',
    scriptPath:'/opt/last30days/skills/last30days/scripts/last30days.py',
    search:['reddit','github'],
    runner
  });
  assert.equal(seen.command,'python3.12');
  assert.equal(seen.args[1],'AI agents; echo unsafe');
  assert.deepEqual(seen.args.slice(-2),['--search','reddit,github']);
  assert.equal(out.provider,'last30days');
  assert.equal(out.schema_version,'1.3');
  assert.equal(out.results.length,1);
});

test('fails closed when the engine is not configured',async()=>{
  await assert.rejects(()=>researchLast30Days('test',{scriptPath:''}),e=>e.code==='LAST30DAYS_NOT_CONFIGURED'&&e.status===503);
});

test('surfaces a bounded upstream failure',async()=>{
  const runner=async()=>({code:2,stdout:'',stderr:'missing key\n'.repeat(200)});
  await assert.rejects(()=>researchLast30Days('test',{scriptPath:'/x/last30days.py',runner}),e=>e.code==='LAST30DAYS_FAILED'&&e.message.length<=500);
});
