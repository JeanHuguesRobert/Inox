// 2026-11-24: GPT-6 coding agent under Jean Hugues Noel Robert. Inox #42.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('..',import.meta.url));
const cases=[
 ['initial count and acquisition','2 make.semaphore >s $s .count out $s .promise >a $a .resolved? { 1 } { 0 } if-else out $s .count out','211'],
 ['FIFO','0 make.semaphore >s $s .promise >a $s .promise >b $s .release drop $a .resolved? { 1 } { 0 } if-else out $b .resolved? { 1 } { 0 } if-else out $s .signal drop $b .resolved? { 1 } { 0 } if-else out $s .count out','1010'],
 ['accumulation','0 make.semaphore >s $s .release drop $s .release drop $s .count out $s .promise drop $s .count out','21'],
 ['closure','0 make.semaphore >s $s .promise >a $s .promise >b $s .close drop $a .rejected? out $b .rejected? out $s .closed? out $s .promise .rejected? out $s .close drop $s .release drop $s .count out','11110'],
 ['then and release','0 make.semaphore >s { >owner $owner .count } _ $s .then >p $s .release drop $p .resolved? out $p resolve-value/ object.@ out','10'],
 ['reentrant release FIFO','0 make.semaphore >s { >owner $owner .release drop 7 } _ $s .then >p $s .promise >b $s .release drop $b .resolved? out $p resolve-value/ object.@ out $s .count out','170'],
 ['reentrant close','0 make.semaphore >s { >owner $owner .close drop 7 } _ $s .then >p $s .promise >b $s .release drop $b .rejected? out $p resolve-value/ object.@ out $s .closed? out','171'],
 ['close callback','0 make.semaphore >s _ { >reason $s .promise .rejected? { 1 } { 0 } if-else } $s .then >p $s .close drop $p resolve-value/ object.@ out','1'],
];
for(const [name,body,expected] of cases){
 const r=spawnSync(process.execPath,['bin/inox.js','-e',`to probe ${body}. probe`],{cwd,encoding:'utf8',timeout:10000,env:{...process.env,INOX_WITH_L9:'1',INOX_FULL:'0',INOX_L9:'0'}});
 assert.equal(r.status,0,`${name}: ${r.stdout} ${r.stderr}`); assert.doesNotMatch(r.stdout+r.stderr,/FATAL:|missing-verb|Assert failure|Invalid return/); assert.equal(r.stdout,expected,name);
}
console.log(`L9 Semaphore: ${cases.length}/${cases.length}`);
