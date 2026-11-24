#!/usr/bin/env node
/*
 * 2026-11-24 — GPT-6 coding agent under Jean Hugues Noel Robert.
 * FBF: an actor has seven payload slots AFTER its stack length header.
 * Slot +6 is the saved CSP (integer, name /csp), and +7 is a
 * non-owning task id (integer, name /l9-task), resolved through the local
 * registry. The public actor is a typed reference, not an integer address.
 * This tests actual VM memory via typed actor, stack.fetch and name-of.
 */
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const cwd=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cases=[
  ['saved CSP slot has its reserved name','to t 5 actor stack.fetch name-of as-text out. t','csp'],
  ['saved CSP slot contains an integer','to t 5 actor stack.fetch type-of out. t','integer'],
  ['L9 task slot has its reserved name','to t 6 actor stack.fetch name-of as-text out. t','l9-task'],
  ['L9 task slot holds a non-owning integer id','to t 6 actor stack.fetch type-of out. t','integer'],
  ['L9 task slot identifies the current task','to t 6 actor stack.fetch l9 .id = out. t','1'],
  ['L9 current task is still the root','to t l9 l9-root = out. t','1'],
  ['current actor is a typed owning reference','to t actor type-of out. t','reference'],
];
let passed=0;
for(const [name,program,expected] of cases){
  const r=spawnSync(process.execPath,['bin/inox.js','-e',program],{
    cwd,encoding:'utf8',timeout:9000,maxBuffer:1024*1024,
    env:{...process.env,INOX_WITH_L9:'1',INOX_L9:'0',INOX_FULL:'0'},
  });
  const ok=r.status===0&&!r.error&&!/FATAL:|AssertionError|Assert failure|missing-verb/.test(r.stdout+r.stderr)&&r.stdout===expected;
  if(!ok){console.error(`FAIL ${name}: rc=${r.status}, output=${JSON.stringify(r.stdout.slice(0,150))}`)}
  else {console.log(`PASS ${name}`);passed++}
}
console.log(`L9 actor memory layout: ${passed}/${cases.length}`);
process.exitCode=passed===cases.length?0:1;
