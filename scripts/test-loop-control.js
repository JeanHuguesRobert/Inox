#!/usr/bin/env node
/*
 * 2026-11-22 — GPT-6 coding agent, under Jean Hugues Noel Robert's direction.
 * FBF: actual loop semantics, inclusive ranges and constant CSP depth.
 * Tests the previously broken primitives, not a recursive workaround.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// The historical inox-out uses synchronous writes; spawnSync stdout pipes
// can return EAGAIN under many small writes. Capture via a regular file.
const captureDir=fs.mkdtempSync(path.join(os.tmpdir(), 'inox-loop-regression-'));
const captureFile=path.join(captureDir, 'stdout');
process.on('exit',()=>fs.rmSync(captureDir,{recursive:true,force:true}));
const cases = [
  ['precondition while-do', 'to p 0 >n while: { $n 3 < } do: { $n out $n 1 + >n! };. p', '012'],
  ['do-while repeat true', 'to p 0 >n do: { $n out $n 1 + >n! } while: { $n 3 < };. p', '012'],
  ['do-while preserves subsequent instructions', 'to p "A" out 0 >n do: { $n out $n 1 + >n! } while: { $n 3 < }; "Z" out. p', 'A012Z'],
  ['loop-while direct preserves subsequent instructions', 'to p 0 >n { $n out $n 1 + >n! } { $n 3 < } loop-while "Z" out. p', '012Z'],
  ['do-while first condition false', 'to p 0 >n do: { $n out $n 1 + >n! } while: { $n 0 < };. p', '0'],
  ['loop-while direct', 'to p 0 >n { $n out $n 1 + >n! } { $n 3 < } loop-while. p', '012'],
  ['break-if exits do-while and resumes', 'to p 0 >n do: { $n out $n 2 >= break-if $n 1 + >n! } while: { $n 10 < }; "Z" out. p', '012Z'],
  ['do-until repeat false', 'to p 0 >n do: { $n out $n 1 + >n! } until: { $n 3 >= };. p', '012'],
  ['do-until preserves subsequent instructions', 'to p "A" out 0 >n do: { $n out $n 1 + >n! } until: { $n 3 >= }; "Z" out. p', 'A012Z'],
  ['loop-until direct preserves subsequent instructions', 'to p 0 >n { $n out $n 1 + >n! } { $n 3 >= } loop-until "Z" out. p', '012Z'],
  ['do-until immediate true', 'to p 0 >n do: { $n out $n 1 + >n! } until: { $n 0 >= };. p', '0'],
  ['loop-until direct', 'to p 0 >n { $n out $n 1 + >n! } { $n 3 >= } loop-until. p', '012'],
  ['break-if exits do-until and resumes', 'to p 0 >n do: { $n out $n 2 >= break-if $n 1 + >n! } until: { $n 10 >= }; "Z" out. p', '012Z'],
  ['range ascending inclusive', 'to p 1 3 { ii out } from:to:do:. p', '123'],
  ['range preserves subsequent instructions', 'to p "A" out 1 3 { ii out } from:to:do: "Z" out. p', 'A123Z'],
  ['range descending inclusive', 'to p 3 1 { ii out } from:down-to:do:. p', '321'],
  ['range ascending inverted', 'to p 3 1 { ii out } from:to:do:. p', ''],
  ['range descending inverted', 'to p 1 3 { ii out } from:down-to:do:. p', ''],
  ['range ascending equal', 'to p 1 1 { ii out } from:to:do:. p', '1'],
  ['range descending equal', 'to p 1 1 { ii out } from:down-to:do:. p', '1'],
  ['range ascending negative bounds', 'to p -2 2 { ii out } from:to:do:. p', '-2-1012'],
  ['range descending negative bounds', 'to p 2 -2 { ii out } from:down-to:do:. p', '210-1-2'],
  ['range positive step', 'to p 1 5 2 { ii out } from:to:by:do:. p', '135'],
  ['range negative step', 'to p 5 1 -2 { ii out } from:to:by:do:. p', '531'],
  ['range positive step +1', 'to p 1 5 1 { ii out } from:to:by:do:. p', '12345'],
  ['range positive step wrong direction', 'to p 5 1 1 { ii out } from:to:by:do:. p', ''],
  ['range negative step wrong direction', 'to p 1 5 -1 { ii out } from:to:by:do:. p', ''],
  ['range step equal endpoints', 'to p 1 1 2 { ii out } from:to:by:do:. p', '1'],
  ['nested ranges maintain it scope', 'to p 1 3 { 4 6 { ii out } from:to:do: } from:to:do:. p', '456456456'],
  ['postfix comparison local correctness', 'to p 3 >last 1 >first $first $last <= out. p', '1'],
];
const depthProbes = [
  ['do-while', 'to p 0 >n do: { control-depth out "," out $n 1 + >n! } while: { $n 1000 < };. p', 1000],
  ['do-until', 'to p 0 >n do: { control-depth out "," out $n 1 + >n! } until: { $n 1000 >= };. p', 1000],
  ['ascending', 'to p 1 1000 { control-depth out "," out } from:to:do:. p', 1000],
  ['descending', 'to p 1000 1 { control-depth out "," out } from:down-to:do:. p', 1000],
  ['positive step', 'to p 1 1999 2 { control-depth out "," out } from:to:by:do:. p', 1000],
  ['negative step', 'to p 1999 1 -2 { control-depth out "," out } from:to:by:do:. p', 1000],
  ['nested', 'to p 1 15 { 1 15 { control-depth out "," out } from:to:do: } from:to:do:. p', 225],
];
const resumptionProbes = [
  ['do-while restores caller control frame', 'to p 0 >n control-depth out "," out do: { $n 1 + >n! } while: { $n 1000 < }; control-depth out. p'],
  ['do-until restores caller control frame', 'to p 0 >n control-depth out "," out do: { $n 1 + >n! } until: { $n 1000 >= }; control-depth out. p'],
  ['ascending range restores caller control frame', 'to p control-depth out "," out 1 1000 { ii drop } from:to:do: control-depth out. p'],
];
const prefixes = {
  minimal: 'cli-stdlib.nox (basic old-school) loaded',
  // L9 now creates a real root task without the old diagnostic stub.
  l9: '',
};
const errors = /\bFATAL\b|Assert failure|Invalid boolean value|missing-verb|Parser\. Undefined verb|AssertionError|bad type/;
function invoke(program, mode){
  const fd=fs.openSync(captureFile,'w');
  let r;
  try {
    r=spawnSync(process.execPath, ['bin/inox.js', '-e', program], {
      cwd: root, encoding: 'utf8', timeout: 8000, maxBuffer: 1024*1024,
      stdio: ['ignore',fd,'pipe'],
      env: {...process.env, INOX_WITH_L9: mode==='l9'?'1':'0', INOX_FULL:'0', INOX_L9:'0'},
    });
  } finally { fs.closeSync(fd); }
  const stdout=fs.readFileSync(captureFile,'utf8');
  assert.equal(r.status, 0, `${mode}: exit=${r.status}, stderr=${r.stderr?.slice(-800) || r.error?.message}`);
  assert.doesNotMatch(stdout+r.stderr, errors, `${mode}: hidden VM failure`);
  assert.ok(stdout.startsWith(prefixes[mode]), `${mode}: unexpected startup banner ${stdout.slice(0,120)}`);
  return stdout.slice(prefixes[mode].length);
}
let passed=0;
for(const mode of ['minimal','l9']){
  for(const [name,program,expected] of cases){
    const actual=invoke(program,mode);
    assert.equal(actual,expected, `${mode}: ${name}`);
    passed++;
  }
  for(const [name,program] of resumptionProbes){
    const actual=invoke(program,mode);
    const m=actual.match(/^(-?\d+),(-?\d+)$/);
    assert.ok(m,`${mode}: ${name}: wrong return trace ${JSON.stringify(actual)}`);
    assert.equal(Number(m[1]),Number(m[2]),`${mode}: ${name}: caller control stack changed`);
    passed++;
  }
  for(const [name,program,count] of depthProbes){
    const actual=invoke(program,mode);
    // Inox currently reports control-depth as a negative offset from its base.
    const depths=actual.split(',').filter(Boolean).map(Number);
    assert.equal(depths.length,count,`${mode}: ${name} count`);
    assert.ok(depths.every(n=>Number.isInteger(n)&&Math.abs(n)>0&&Math.abs(n)<100), `${mode}: ${name}: control depth exceeded 100-cell capacity`);
    assert.equal(new Set(depths).size,1,`${mode}: ${name}: control stack grew between iterations`);
    passed++;
  }
}
// Unresolved historical FATAL-hook error formatting is tracked separately;
// keep a regression that invalid zero-step input does not run indefinitely
// or silently masquerade as a valid empty range.
for(const mode of ['minimal','l9']){
  const r=spawnSync(process.execPath, ['bin/inox.js', '-e',
    'to p 1 5 0 { ii out } from:to:by:do:. p'], {
    cwd:root,encoding:'utf8',timeout:8000,maxBuffer:1024*1024,
    env:{...process.env,INOX_WITH_L9:mode==='l9'?'1':'0',INOX_FULL:'0',INOX_L9:'0'},
  });
  assert.ok(r.status!==0 && !r.error,`${mode}: zero step should be rejected without timeout`);
  assert.match(r.stdout,/FATAL/,`${mode}: zero-step failure should not be silent`);
  passed++;
}
console.log(`Inox loop runtime and constant-depth regressions: ${passed}/${passed} passed`);
