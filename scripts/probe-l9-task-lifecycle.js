#!/usr/bin/env node
/*
 * 2026-11-23 — GPT-6 coding agent, under Jean Hugues Noel Robert.
 * FBF RED diagnostic for L9: child cancellation/raise, actor resume and promise callback-exception propagation remain unimplemented
 * or broken. Keep outside all green/CI suites until these functions actually
 * work. A process that exits 0 with "FATAL" in stdout is not a pass.
 */
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const cwd=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const tests=[
  ['child cancellation propagation and exception', 'to p l9-root false false make.task/ as-verb run >kid l9-root .cancel $kid .canceled? out. p', '1'],
  ['root resume and status', 'to p l9-root .resume l9-root .paused? out. p', '0'],
  ['promise callback failure becomes rejection', 'to p make.promise >v { >x "BROKEN" FATAL } _ $v .then >next 7 $v .resolve $next .rejected? out. p', '1'],
];
let passed=0;
for(const [name,program,expected] of tests){
  const r=spawnSync(process.execPath,['bin/inox.js','-e',program],{
    cwd,encoding:'utf8',timeout:8000,maxBuffer:1024*1024,
    env:{...process.env,INOX_WITH_L9:'1',INOX_L9:'0',INOX_FULL:'0'}
  });
  const okay=r.status===0&&!r.error&&!/FATAL:|Assert failure|missing-verb|AssertionError/.test(r.stdout+r.stderr)&&r.stdout===expected;
  console.log(`${okay?'PASS':'FAIL'}: ${name}${okay?'':` (rc=${r.status}; ${JSON.stringify((r.stdout||r.stderr).slice(0,115))})`}`);
  if(okay)passed++;
}
console.log(`L9 task lifecycle pending: ${passed}/${tests.length} passed`);
process.exitCode=passed===tests.length?0:1;
