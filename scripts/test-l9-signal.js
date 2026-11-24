// 2026-11-24: GPT-6 coding agent under Jean Hugues Noel Robert.
// L8 Signal port, Inox #42. A signal is an unbuffered rearmable event.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('..',import.meta.url));
const cases=[
 ['boolean control independent of text representation','true not { 1 } { 0 } if-else out false true or not { 1 } { 0 } if-else out false not { 1 } { 0 } if-else out','001'],
 ['initially inactive','make.signal >s $s .active? out $s .inactive? out $s .closed? out','010'],
 ['arm and settle','make.signal >s $s .promise >p $s .active? out 7 $s .signal drop $p .resolved? out $p resolve-value/ object.@ out $s .inactive? out','1171'],
 ['observers share pending generation','make.signal >s $s .promise >a $s .promise >b 7 $s .signal drop $a resolve-value/ object.@ out $b resolve-value/ object.@ out','77'],
 ['inactive events lost and rearm','make.signal >s 7 $s .signal drop $s .promise >a $a .resolved? out 8 $s .signal drop 9 $s .signal drop $s .promise >b $b .resolved? out $a resolve-value/ object.@ out 10 $s .signal drop $b resolve-value/ object.@ out','00810'],
 ['close pending','make.signal >s $s .promise >p $s .close drop $p .rejected? out $s .closed? out $s .inactive? out $s .promise .rejected? out $p reject-reason/ object.@ as-text out','1111closed'],
 ['close inactive and repeat','make.signal >s $s .close drop $s .close drop 7 $s .signal drop $s .promise .rejected? out $s .active? out','10'],
 ['then arms and delivers','make.signal >s { >x $x 2 * } _ $s .then >p 7 $s .signal drop $p resolve-value/ object.@ out','14'],
 ['then rearm inside handler','make.signal >s { >x $s .promise >next 8 $s .signal drop $next resolve-value/ object.@ } _ $s .then >p 7 $s .signal drop $p resolve-value/ object.@ out $s .inactive? out','81'],
 ['close inside handler','make.signal >s { >x $s .close drop $x } _ $s .then >p 7 $s .signal drop $p resolve-value/ object.@ out $s .promise .rejected? out','71'],
 ['rejection callback','make.signal >s _ { >reason $reason as-text } $s .then >p $s .close drop $p resolve-value/ object.@ out','closed'],
];
let passed=0;
for(const [name,body,expected] of cases){
 const r=spawnSync(process.execPath,['bin/inox.js','-e',`to probe ${body}. probe`],{cwd,encoding:'utf8',timeout:10000,env:{...process.env,INOX_WITH_L9:'1',INOX_FULL:'0',INOX_L9:'0'}});
 assert.equal(r.status,0,`${name}: ${r.stdout} ${r.stderr}`); assert.doesNotMatch(r.stdout+r.stderr,/FATAL:|missing-verb|Assert failure|Invalid return/); assert.equal(r.stdout,expected,name); passed++;
}
console.log(`L9 Signal: ${passed}/${cases.length}`);
