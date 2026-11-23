#!/usr/bin/env node
/*
 * 2026-11-23 — GPT-6 coding agent, under Jean Hugues Noel Robert.
 * FBF historical failing probe, now a green root-construction regression.
 * Do not conflate successful root creation with cancel/scheduler behavior;
 * those separate unresolved operations have their own red diagnostics.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const probes=[
  ['low-level task object allocation', 'to p task/ make{ "root" :label } .label out. p', 'root'],
  ['L9 root task is an initialized object', 'l9-root .label out', 'root'],
  ['L9 registered maker constructs a task', 'to p _ false false make.task/ as-verb run .label out. p', 'root'],
];
let passed=0;
for(const [name,source,expected] of probes){
  const r=spawnSync(process.execPath,['bin/inox.js','-e',source],{
    cwd:root,encoding:'utf8',timeout:8000,maxBuffer:1024*1024,
    env:{...process.env,INOX_WITH_L9:'1',INOX_FULL:'0',INOX_L9:'0'}
  });
  const stdout=r.stdout??'';
  const ok=r.status===0&&!r.error&&!/FATAL:|Assert failure|missing-verb|AssertionError/.test(stdout+(r.stderr??''))&&stdout===expected;
  console.log(`${ok?'PASS':'FAIL'}: ${name}${ok?'':` (exit=${r.status}, sample=${JSON.stringify(stdout.slice(0,150))})`}`);
  if(ok)passed++;
}
console.log(`L9 root/task maker: ${passed}/${probes.length} probes passed`);
process.exitCode=passed===probes.length?0:1;
