// 2026-11-27 — GPT-6.2 under JHR, Inox #42. Float payload is a Cell value word.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('..',import.meta.url));
const cases=[
 ['copied local preserves float','to p "1.5" as-float >x $x float.as-text out. p','1.5'],
 ['integer conversion is numeric not a reinterpretation','to p 7 as-float float.as-text out. p','7'],
 ['conversion of existing float is idempotent','to p "-1.5" as-float as-float float.as-text out. p','-1.5'],
 ['arithmetic preserves both operands','to p "1.5" as-float "2.25" as-float float.add float.as-text out. p','3.75'],
 ['copy and relocation preserve live float payloads','to p "1.5" as-float >x "2.25" as-float 2000 reserve-data-stack 2000 reserve-control-stack float.as-text out "," out $x float.as-text out. p','2.25,1.5'],
 ['array stores real float bits','to p array[] >xs $xs "1.5" as-float array.push $xs "-2.25" as-float array.push 0 $xs array.get float.as-text out "," out 1 $xs array.get float.as-text out. p','1.5,-2.25'],
 ['conversions and arithmetic leave no data cells','to p data-depth >before "1.5" as-float "2.25" as-float float.add float.as-text drop data-depth $before - out. p','0'],
 ['generic output decodes float','to p "1.5" as-float out. p','1.5'],
];
for(const [name,source,expected] of cases){
 const r=spawnSync(process.execPath,['bin/inox.js','-e',source],{cwd,encoding:'utf8',timeout:20000,env:{...process.env,INOX_WITH_L9:'1',INOX_L9:'0',INOX_FULL:'0'}});
 assert.equal(r.status,0,`${name}: ${r.stdout} ${r.stderr}`);
 assert.doesNotMatch(r.stdout+r.stderr,/FATAL:|missing-verb|Assert failure|Invalid return/);
 assert.equal(r.stdout,expected,name);console.log('PASS '+name);
}
console.log(`Float Cells: ${cases.length}/${cases.length}`);
