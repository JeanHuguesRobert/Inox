#!/usr/bin/env node
/*
 * 2026-11-22: GPT-6 coding agent, under Jean Hugues Noel Robert.
 * FBF for the declared 80% threshold in both data/control stack growers.
 * Execute the actual functions from lib/inox.ts in isolated VM contexts with
 * mocked allocators, without pretending to validate actor-stack relocation.
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
    const moved=[], freed=[], allocations=[];
    const vars={
      ONE:1, size_of_cell:8, tag_stack:1,
      ACTOR_data_stack:1000, ACTOR_data_stack_limit:1000+capacity,
      ACTOR_control_stack:1000, ACTOR_control_stack_limit:1000+capacity,
      CSP:1000+used, TOS:1000+used,
      allocate_area:(_tag, bytes)=>{allocations.push(bytes);return 2000;},
      move_cells:(...args)=>moved.push(args),
      area_free:(...args)=>freed.push(args),
      FATAL:(message)=>{throw new Error('unexpected '+message);},
    };
    const result=vm.runInNewContext(`${body}\n${functionName}();\n({base:ACTOR_${kind}_stack,limit:ACTOR_${kind}_stack_limit,top:${kind==='data'?'TOS':'CSP'}})`,vars,{timeout:1000});
    assert.equal(allocations.length,shouldGrow?1:0,`${kind}: used=${used}/${capacity} unexpected growth decision`);
    assert.equal(result.limit-result.base,capacity*(shouldGrow?2:1),`${kind}: capacity`);
    assert.equal(result.top-result.base,used,`${kind}: depth not preserved`);
    assert.equal(moved.length,shouldGrow?1:0,`${kind}: cells moved`);
    assert.equal(freed.length,shouldGrow?1:0,`${kind}: old area freed`);
    passed++;
  }
}
assert.equal(80 < 100*100/80,true,'old 125% condition must explain the former failure');
console.log(`Inox stack growth 80% threshold: ${passed}/${passed} cases passed (isolated function tests)`);
