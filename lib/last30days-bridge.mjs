// SPDX-License-Identifier: MIT
// Copyright (c) 2026 jacbus1 and DL Anything You Want contributors
import { spawn } from 'node:child_process';
import { AppError } from './core.mjs';

const AGENT_SCHEMA_MAJOR='1';
const DEFAULT_TIMEOUT_MS=5*60*1000;
const DEFAULT_MAX_BYTES=8*1024*1024;

function cleanTopic(value){
  if(typeof value!=='string')throw new AppError('INVALID_RESEARCH_TOPIC','Enter a research topic.');
  const topic=value.trim();
  if(!topic||topic.length>500||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(topic))
    throw new AppError('INVALID_RESEARCH_TOPIC','Enter a research topic up to 500 characters.');
  return topic;
}

function cleanSearch(value){
  if(value==null||value==='')return'';
  const raw=Array.isArray(value)?value.join(','):String(value);
  const parts=raw.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
  if(!parts.length||parts.length>24||parts.some(x=>!/^[a-z0-9_-]{1,32}$/.test(x)))
    throw new AppError('INVALID_RESEARCH_SOURCES','Choose valid last30days source names.');
  return[...new Set(parts)].join(',');
}

function assertSchemaVersion(value){
  if(typeof value!=='string'||!/^\d+\.\d+$/.test(value))
    throw new AppError('LAST30DAYS_BAD_OUTPUT','last30days returned an invalid schema version.',502);
  if(value.split('.')[0]!==AGENT_SCHEMA_MAJOR)
    throw new AppError('LAST30DAYS_SCHEMA_UNSUPPORTED',`Unsupported last30days agent schema ${value}.`,502);
}

function validateBaseReport(report){
  if(!report||typeof report!=='object'||Array.isArray(report))
    throw new AppError('LAST30DAYS_BAD_OUTPUT','last30days returned invalid JSON.',502);
  assertSchemaVersion(report.schema_version);
  if(typeof report.query!=='string'||typeof report.generated_at!=='string'||!Number.isInteger(report.window_days))
    throw new AppError('LAST30DAYS_BAD_OUTPUT','last30days returned an incomplete agent report.',502);
  if(!report.source_status||typeof report.source_status!=='object'||Array.isArray(report.source_status))
    throw new AppError('LAST30DAYS_BAD_OUTPUT','last30days source status is invalid.',502);
  for(const key of ['freshness_verdicts','clusters','results'])
    if(!Array.isArray(report[key]))
      throw new AppError('LAST30DAYS_BAD_OUTPUT',`last30days field ${key} is invalid.`,502);
  return report;
}

export function validateLast30DaysAgentReport(report){
  if(report?.comparison===true){
    assertSchemaVersion(report.schema_version);
    if(!Array.isArray(report.entities)||!Array.isArray(report.reports)||report.reports.length<2||report.reports.length>10)
      throw new AppError('LAST30DAYS_BAD_OUTPUT','last30days comparison output is invalid.',502);
    for(const entry of report.reports){
      if(!entry||typeof entry.entity!=='string')throw new AppError('LAST30DAYS_BAD_OUTPUT','last30days comparison entity is invalid.',502);
      validateBaseReport(entry.report);
    }
    return report;
  }
  return validateBaseReport(report);
}

export function normalizeLast30DaysAgentReport(report){
  validateLast30DaysAgentReport(report);
  if(report.comparison===true)return{provider:'last30days',comparison:true,...report};
  return{
    provider:'last30days',
    comparison:false,
    schema_version:report.schema_version,
    query:report.query,
    generated_at:report.generated_at,
    window_days:report.window_days,
    source_status:report.source_status,
    freshness_verdicts:report.freshness_verdicts,
    clusters:report.clusters,
    results:report.results
  };
}

async function spawnCapture(command,args,{env=process.env,timeoutMs=DEFAULT_TIMEOUT_MS,maxBytes=DEFAULT_MAX_BYTES}={}){
  return new Promise((resolve,reject)=>{
    let settled=false,stdout='',stderr='',bytes=0,timedOut=false,tooLarge=false;
    const child=spawn(command,args,{stdio:['ignore','pipe','pipe'],env,shell:false});
    const finish=(fn,value)=>{if(settled)return;settled=true;clearTimeout(timer);fn(value);};
    child.stdout.setEncoding('utf8');child.stderr.setEncoding('utf8');
    child.stdout.on('data',chunk=>{
      bytes+=Buffer.byteLength(chunk);
      if(bytes>maxBytes){tooLarge=true;child.kill('SIGKILL');return;}
      stdout+=chunk;
    });
    child.stderr.on('data',chunk=>{if(stderr.length<16384)stderr+=chunk;});
    child.once('error',err=>finish(reject,new AppError('LAST30DAYS_UNAVAILABLE',err.code==='ENOENT'?`${command} is not installed.`:'last30days could not start.',503)));
    child.once('close',code=>{
      if(timedOut)return finish(reject,new AppError('LAST30DAYS_TIMEOUT','last30days timed out.',504));
      if(tooLarge)return finish(reject,new AppError('LAST30DAYS_TOO_LARGE','last30days output exceeded the safety limit.',502));
      finish(resolve,{code,stdout,stderr});
    });
    const timer=setTimeout(()=>{timedOut=true;child.kill('SIGKILL');},timeoutMs);
  });
}

export async function researchLast30Days(topic,{
  pythonCommand=process.env.LAST30DAYS_PYTHON||'python3.12',
  scriptPath=process.env.LAST30DAYS_SCRIPT||'',
  search='',
  env=process.env,
  timeoutMs=DEFAULT_TIMEOUT_MS,
  maxBytes=DEFAULT_MAX_BYTES,
  runner=spawnCapture
}={}){
  topic=cleanTopic(topic);
  if(typeof scriptPath!=='string'||!scriptPath.trim())
    throw new AppError('LAST30DAYS_NOT_CONFIGURED','Set LAST30DAYS_SCRIPT to the upstream last30days.py path.',503);
  const args=[scriptPath.trim(),topic,'--emit=json','--json-profile=agent'];
  const sources=cleanSearch(search);
  if(sources)args.push('--search',sources);
  const result=await runner(pythonCommand,args,{env,timeoutMs,maxBytes});
  if(!result||result.code!==0){
    const detail=String(result?.stderr||'').replace(/\s+/g,' ').trim().slice(0,500);
    throw new AppError('LAST30DAYS_FAILED',detail||'last30days research failed.',502);
  }
  let parsed;
  try{parsed=JSON.parse(result.stdout);}catch{throw new AppError('LAST30DAYS_BAD_OUTPUT','last30days did not return valid JSON.',502);}
  return normalizeLast30DaysAgentReport(parsed);
}
