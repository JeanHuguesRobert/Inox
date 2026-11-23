#!/usr/bin/env node
/*
 * 2026-11-23: GPT-6 coding agent, under Jean Hugues Noel Robert.
 * FBF regression: real L9 task maker/root/children and collection semantics.
 * Distinct from the still incomplete task scheduler, cancel and promises.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const cwd = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cases = [
  ['startup has no fake stub', '1 out', '1'],
  ['root is an object reference', 'l9-root type-of out', 'reference'],
  ['root has correct label', 'l9-root .label out', 'root'],
  ['root has id 1', 'l9-root .id out', '1'],
  ['root begins paused', 'l9-root .paused? out', '1'],
  ['root begins unfinished', 'l9-root .done? out', '0'],
  ['root begins uncanceled', 'l9-root .canceled? out', '0'],
  ['root is current L9 task', 'to p l9-root l9 = out. p', '1'],
  ['stop updates should-stop flag', 'to p l9-root .stop l9-root .should-stop? out. p', '1'],
  ['registered maker constructs a root', 'to p _ false false make.task/ as-verb run .label out. p', 'root'],
  ['registered maker returns reference', 'to p _ false false make.task/ as-verb run type-of out. p', 'reference'],
  ['child receives id 2', 'to p l9-root false false make.task/ as-verb run .id out. p', '2'],
  ['child parent points to root', 'to p l9-root true false make.task/ as-verb run parent/ object.@ l9-root = out. p', '1'],
  ['child is registered in subtasks', 'to p l9-root false false make.task/ as-verb run drop l9-root .tasks array.length out. p', '1'],
  ['fork flags are not hardcoded', 'to p l9-root true false make.task/ as-verb run .a-fork? out. p', '1'],
  ['spawn flags are not hardcoded', 'to p l9-root false true make.task/ as-verb run .a-spawn? out. p', '1'],
  ['ordinary task is not spawned', 'to p l9-root false false make.task/ as-verb run .a-spawn? out. p', '0'],
  ['fork also registers in forks array', 'to p l9-root true false make.task/ as-verb run drop l9-root .tasks array.length out l9-root forks/ object.@ array.length out. p', '11'],
  ['spawn not registered as fork', 'to p l9-root false true make.task/ as-verb run drop l9-root .tasks array.length out l9-root forks/ object.@ array.length out. p', '10'],
  ['extensible object setter', 'to p task/ make{ "root" :label } >v "OK" $v .label! $v .label out. p', 'OK'],
  ['direct object setter', 'to p task/ make{ "root" :label } >v "OK" $v label/ object.! $v .label out. p', 'OK'],
  ['array push stores length', 'to p array[] >xs $xs 1 array.push $xs 2 array.push $xs array.length out. p', '2'],
  ['array get preserves retrieved values', 'to p array[] >xs $xs 1 array.push $xs 2 array.push 0 $xs array.get out 1 $xs array.get out. p', '12'],
  ['empty array iterator is a no-op', 'to p array[] .each{ "X" out } "Z" out. p', 'Z'],
  ['array iteration yields its items', 'to p array[] >xs $xs 1 array.push $xs 2 array.push $xs .each{ out } "Z" out. p', '12Z'],
  ['array iteration preserves text values', 'to p array[] >xs $xs "hi" array.push $xs "there" array.push $xs .each{ out } "Z" out. p', 'hithereZ'],
  ['stack fetch uses index after header', 'to p stack[] >xs $xs 5 stack.push $xs 7 stack.push 0 $xs stack.fetch out 1 $xs stack.fetch out. p', '57'],
  ['array grows to 100 elements', 'to p array[] >xs from: 1 to: 100 do: { $xs ii array.push }; 0 $xs array.get out 99 $xs array.get out $xs array.length out. p', '1100100'],
  ['stack grows to 100 elements', 'to p stack[] >xs from: 1 to: 100 do: { $xs ii stack.push }; 0 $xs stack.fetch out 99 $xs stack.fetch out $xs stack.length out. p', '1100100'],
];
const diagnostics=/FATAL:|Assert failure|missing-verb|AssertionError|Cannot compile block|Invalid return/;
let passed=0;
for(const [name,source,expected] of cases){
  const r=spawnSync(process.execPath,['bin/inox.js','-e',source],{
    cwd,encoding:'utf8',timeout:8000,maxBuffer:1024*1024,
    env:{...process.env,INOX_WITH_L9:'1',INOX_L9:'0',INOX_FULL:'0'},
  });
  assert.equal(r.status,0,`${name}: rc ${r.status}, ${(r.stderr||r.error?.message||'').slice(0,800)}`);
  assert.doesNotMatch(r.stdout+r.stderr,diagnostics,`${name}: hidden runtime failure`);
  assert.equal(r.stdout,expected,`${name}: incorrect behavior`);
  passed++;
}
console.log(`L9 task structure and collection primitives: ${passed}/${passed} passed`);
