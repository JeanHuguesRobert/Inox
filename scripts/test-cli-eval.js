// 2026-11-24: GPT-6 under Jean Hugues Noel Robert's direction.
// One-shot compilation, not an interactive evaluator fix.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const cases = [
 ['1 2 + out','3'], ['out( 1 + 2 )','3'], ['( 1 + 2 ) out','3'],
 ['1 2 + out.','3'], ['1 2 + out ~~ comment','3'], ['1\n2 + out','3'],
 ['"to" out','to'], ['"a\nb" out','a b'], ['"a\\nb" out','a\nb'],
 ['~~ comment\nto p 1 2 + out. p','3'], ['to p 1 2 + out. p','3'],
 ['~~ comment only',''], ['', ''],
];
let passed=0;
for(const mode of ['0','1']) for(const [source,expected] of cases){
 const r=spawnSync(process.execPath,['bin/inox.js','-e',source],{encoding:'utf8',timeout:10000,env:{...process.env,INOX_WITH_L9:mode,INOX_FULL:'0',INOX_L9:'0'}});
 assert.equal(r.status,0,source+' '+r.stderr); assert.doesNotMatch(r.stdout+r.stderr,/Assert failure|FATAL:|premature end/);
 assert.equal(r.stdout.replace(/^cli-stdlib\.nox \(basic old-school\) loaded/,''),expected,source); passed++;
}
for(const entry of ['bin/inox.js','builds/inox.js']){
 const r=spawnSync(process.execPath,[entry,'--eval','1 2 + out'],{encoding:'utf8',timeout:10000,env:{...process.env,INOX_WITH_L9:'1',INOX_FULL:'0',INOX_L9:'0'}});
 assert.equal(r.status,0,r.stderr); assert.ok(r.stdout.endsWith('3'),r.stdout); passed++;
 const failure=spawnSync(process.execPath,[entry,'-e','"ERR" raise'],{encoding:'utf8',timeout:10000,env:{...process.env,INOX_WITH_L9:'1',INOX_FULL:'0',INOX_L9:'0'}});
 assert.equal(failure.status,1); assert.match(failure.stdout,/FATAL: ERR/); passed++;
}
console.log(`CLI expression compilation: ${passed}/${passed}`);
