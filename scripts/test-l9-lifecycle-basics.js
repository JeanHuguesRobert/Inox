#!/usr/bin/env node
/*
 * 2026-11-23 — GPT-6 coding agent, under Jean Hugues Noel Robert.
 * FBF coverage: actual root cancellation, list iteration and elementary
 * promise settlement. Not evidence of task scheduling, child raise, or
 * promise callback/then/handler propagation.
 */
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const cwd=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cases=[
  ['empty list iteration preserves continuation','to p list[] .each{ "X" out } "Z" out. p','Z'],
  ['list iteration reads indexed stack entries','to p list[] >xs $xs 5 stack.push $xs 7 stack.push $xs .each{ out } "Z" out. p','57Z'],
  ['list iteration preserves text','to p list[] >xs $xs "hi" stack.push $xs "there" stack.push $xs .each{ out } "Z" out. p','hithereZ'],
  ['root cancellation changes state','to p l9-root .cancel l9-root .canceled? out. p','1'],
  ['root cancellation is idempotent','to p l9-root .cancel l9-root .cancel l9-root .canceled? out. p','1'],
  ['root remains unfinished when canceled','to p l9-root .cancel l9-root .done? out. p','0'],
  ['promise initially pending','to p make.promise >v $v .resolved? out $v .rejected? out. p','00'],
  ['promise resolve updates status','to p make.promise >v 42 $v .resolve $v .resolved? out $v .rejected? out. p','10'],
  ['promise resolve stores its actual value','to p make.promise >v 42 $v .resolve $v resolve-value/ object.@ out. p','42'],
  ['promise reject updates status','to p make.promise >v 42 $v .reject $v .resolved? out $v .rejected? out. p','01'],
  ['promise reject stores reason','to p make.promise >v 42 $v .reject $v reject-reason/ object.@ out. p','42'],
  ['promise cannot reject after resolution','to p make.promise >v 42 $v .resolve 99 $v .reject $v .resolved? out $v .rejected? out $v resolve-value/ object.@ out. p','1042'],
  ['promise cannot resolve after rejection','to p make.promise >v 42 $v .reject 99 $v .resolve $v .resolved? out $v .rejected? out $v reject-reason/ object.@ out. p','0142'],
  ['promise resolve is idempotent','to p make.promise >v 42 $v .resolve 55 $v .resolve $v resolve-value/ object.@ out. p','42'],
  ['promise reject is idempotent','to p make.promise >v 42 $v .reject 55 $v .reject $v reject-reason/ object.@ out. p','42'],
];
let passed=0;
for(const [name,code,expected] of cases){
  const r=spawnSync(process.execPath,['bin/inox.js','-e',code],{
    cwd,encoding:'utf8',timeout:8000,maxBuffer:1024*1024,
    env:{...process.env,INOX_WITH_L9:'1',INOX_L9:'0',INOX_FULL:'0'},
  });
  assert.equal(r.status,0,`${name}: status ${r.status}: ${r.stderr?.slice(-500)}`);
  assert.doesNotMatch(r.stdout+r.stderr,/FATAL:|missing-verb|Assert failure|AssertionError|Invalid return|Cannot compile/,`${name}: hidden failure`);
  assert.equal(r.stdout,expected,`${name}: wrong outcome`);
  passed++;
}
console.log(`L9 basic task/list/promise lifecycle: ${passed}/${passed} passed`);
