#!/usr/bin/env node
/* 2026-11-22 — GPT-6 coding agent, under Jean Hugues Noël Robert's direction. */
import fs from 'node:fs';
import { build, readImage, cachePut, plan, run } from './core.mjs';
const [action,...argv]=process.argv.slice(2);
const arg=(name)=>{const i=argv.indexOf('--'+name);return i<0?null:argv[i+1]};
function needed(name){const v=arg(name);if(!v)throw Error('missing --'+name);return v}
try {
  let result;
  if(action==='build') {
    const source=JSON.parse(fs.readFileSync(needed('source'),'utf8'));
    const b=build(source,{baseFile:arg('base')});
    const output=needed('output');fs.writeFileSync(output,b);
    const img=readImage(b);result={path:output,digest:img.digest,kind:img.kind,bytes:b.length,base:img.base};
  }else if(action==='inspect'||action==='verify') {
    const img=readImage(needed('image'));
    result={valid:true,kind:img.kind,digest:img.digest,bytes:img.byteLength,base:img.base,entry:img.entry,definitions:img.meta.definitions,sections:[...img.sections.values()].map(s=>({type:s.type,bytes:s.stored,offset:s.offset}))};
    if(action==='verify')result={valid:true,digest:img.digest};
  }else if(action==='cache-put')result=cachePut(needed('image'),needed('cache'));
  else if(action==='plan')result=plan(needed('image'),needed('cache'));
  else if(action==='run')result=run(needed('image'),needed('cache'),{entry:arg('entry'),budget:arg('budget')?Number(arg('budget')):1000});
  else throw Error('Usage: build --source JSON --output IMG [--base IMG] | inspect/verify --image IMG | cache-put/plan --image IMG --cache DIR | run --image IMG --cache DIR [--entry NAME]');
  console.log(JSON.stringify(result));
}catch(e){console.error('inox-image:',e.message);process.exitCode=1;}
