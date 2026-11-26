#!/usr/bin/env node
/*
 * 2026-11-22: GPT-6 coding agent, under Jean Hugues Noel Robert.
 * FBF for the declared 80% threshold in both data/control stack growers.
 * Execute the actual functions from lib/inox.ts in isolated VM contexts with
 * mocked reservation, without pretending to validate actor-stack relocation.
 * Actual relocation is tested by test-actor-stack-relocation.js.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root,'lib/inox.ts'),'utf8');
const sizes = [
  [100,0,false], [100,79,false], [100,80,true], [100,99,true],
  [10,7,false], [10,8,true], [101,80,false], [101,81,true],
];
let passed=0;
for (const kind of ['data','control']) {
  const functionName=`primitive_grow_${kind}_stack`;
  const matched=source.match(new RegExp(`function\\s+${functionName}\\(\\)\\{[\\s\\S]*?\\n\\}`));
  assert.ok(matched,`${functionName}: implementation unavailable`);
  const body=matched[0];
  assert.ok(body.includes('( length * 80 ) / 100'),`${functionName}: missing threshold`);
  for (const [capacity, used, shouldGrow] of sizes) {
    const reservations=[];
    const vars={
      ONE:1,
      ACTOR_data_stack:1000, ACTOR_data_stack_limit:1000+capacity,
      ACTOR_control_stack:1000, ACTOR_control_stack_limit:1000+capacity,
      CSP:1000+used, TOS:1000+used,
      reserve_actor_stack:(control,spare)=>{reservations.push([control,spare]);return true;},
    };
    vm.runInNewContext(`${body}\n${functionName}();`,vars,{timeout:1000});
    assert.deepEqual(reservations,shouldGrow?[[kind==='control',capacity-used]]:[],
      `${kind}: used=${used}/${capacity} unexpected reservation decision`);
    passed++;
  }
}
assert.equal(80 < 100*100/80,true,'old 125% condition must explain the former failure');
console.log(`Inox stack growth 80% threshold: ${passed}/${passed} cases passed (isolated function tests)`);
