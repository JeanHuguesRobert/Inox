#!/usr/bin/env node
/*
 * 2026-11-23 — GPT-6 coding agent, under Jean Hugues Noel Robert.
 * FBF of L9's existing promise-handler, promise.then and scheduling code.
 * Local synchronous settlement behavior only; actor scheduling and
 * exception-to-rejection translation remain separate unfinished contracts.
 */
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const cwd=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cases=[
  ['registration returns a pending promise', 'to p make.promise >v { >x $x 5 + } _ $v .then >next $v handlers/ object.@ stack.length out $next .resolved? out $next .rejected? out. p', '100'],
  ['fulfillment transforms callback result', 'to p make.promise >v { >x $x 5 + } _ $v .then >next 7 $v .resolve $next .resolved? out $next resolve-value/ object.@ out. p', '112'],
  ['fulfillment passes through absent on-resolve', 'to p make.promise >v _ _ $v .then >next 7 $v .resolve $next .resolved? out $next resolve-value/ object.@ out. p', '17'],
  ['rejection passes through absent on-reject', 'to p make.promise >v _ _ $v .then >next 7 $v .reject $next .rejected? out $next reject-reason/ object.@ out. p', '17'],
  ['on-reject transforms into a resolved value', 'to p make.promise >v _ { >reason $reason 2 * } $v .then >next 7 $v .reject $next .resolved? out $next resolve-value/ object.@ out. p', '114'],
  ['on-resolve does not absorb a rejection', 'to p make.promise >v { >x $x 5 + } _ $v .then >next 7 $v .reject $next .rejected? out $next reject-reason/ object.@ out. p', '17'],
  ['on-reject does not intercept fulfillment', 'to p make.promise >v _ { >x $x 2 * } $v .then >next 7 $v .resolve $next .resolved? out $next resolve-value/ object.@ out. p', '17'],
  ['two-level promise chain', 'to p make.promise >v { >x $x 5 + } _ $v .then >p2 { >x $x 2 * } _ $p2 .then >p3 7 $v .resolve $p3 .resolved? out $p3 resolve-value/ object.@ out. p', '124'],
  ['two handlers on one promise', 'to p make.promise >v { >x $x 5 + } _ $v .then >a { >x $x 2 * } _ $v .then >b 7 $v .resolve $a resolve-value/ object.@ out $b resolve-value/ object.@ out $v handlers/ object.@ stack.length out. p', '12140'],
  ['late on-resolve callback is dispatched', 'to p make.promise >v 7 $v .resolve { >x $x 5 + } _ $v .then >next $next .resolved? out $next resolve-value/ object.@ out. p', '112'],
  ['late on-reject callback is dispatched', 'to p make.promise >v 7 $v .reject _ { >x $x 2 * } $v .then >next $next .resolved? out $next resolve-value/ object.@ out. p', '114'],
  ['settled promise retains its first result', 'to p make.promise >v { >x $x 5 + } _ $v .then >next 7 $v .resolve 9 $v .resolve $v resolve-value/ object.@ out $next resolve-value/ object.@ out. p', '712'],
  ['settled callback executes exactly once', 'to p 0 >ticks make.promise >v { >x $ticks 1 + >ticks! $x } _ $v .then >next 7 $v .resolve 9 $v .resolve $ticks out $next resolve-value/ object.@ out. p', '17'],
  ['resolved flag and drained handler list', 'to p make.promise >v { >x $x 5 + } _ $v .then >next 7 $v .resolve $next .resolved? out $v handlers/ object.@ stack.length out. p', '10'],
];
let passed=0;
for(const [name,source,expected] of cases){
  const r=spawnSync(process.execPath,['bin/inox.js','-e',source],{
    cwd,encoding:'utf8',timeout:10000,maxBuffer:1024*1024,
    env:{...process.env,INOX_WITH_L9:'1',INOX_L9:'0',INOX_FULL:'0'},
  });
  assert.equal(r.status,0,`${name}: exit=${r.status}; ${(r.stderr||r.error?.message||'').slice(0,800)}`);
  assert.doesNotMatch(r.stdout+r.stderr,/FATAL:|missing-verb|Assert failure|AssertionError|Invalid return|Bad type/,`${name}: hidden runtime failure`);
  assert.equal(r.stdout,expected,`${name}: incorrect result`);
  passed++;
}
const stackCases=[
  ['caller control stack restored after fulfillment', 'to t make.promise >v { >x $x 5 + } _ $v .then >next 7 $v .resolve. to p control-depth out "," out t control-depth out. p'],
  ['caller control stack restored after rejection', 'to t make.promise >v { >x $x 5 + } _ $v .then >next 7 $v .reject. to p control-depth out "," out t control-depth out. p'],
  ['caller control stack restored after two-level chain', 'to t make.promise >v { >x $x 5 + } _ $v .then >p2 { >x $x 2 * } _ $p2 .then >p3 7 $v .resolve. to p control-depth out "," out t control-depth out. p'],
];
for(const [name,source] of stackCases){
  const r=spawnSync(process.execPath,['bin/inox.js','-e',source],{
    cwd,encoding:'utf8',timeout:10000,maxBuffer:1024*1024,
    env:{...process.env,INOX_WITH_L9:'1',INOX_L9:'0',INOX_FULL:'0'},
  });
  assert.equal(r.status,0,`${name}: exit=${r.status}`);
  assert.doesNotMatch(r.stdout+r.stderr,/FATAL:|missing-verb|Assert failure|AssertionError|Invalid return|Bad type/);
  assert.match(r.stdout,/^-?\d+,-?\d+$/,`${name}: malformed depth observation`);
  const [before,after]=r.stdout.split(',').map(Number);
  assert.equal(after,before,`${name}: leaked or lost control frames`);
  passed++;
}
console.log(`L9 promise chain and callback settlement: ${passed}/${cases.length+stackCases.length} passed`);
