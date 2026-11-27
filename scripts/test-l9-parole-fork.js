// 2026-11-27 — GPT-6.2 under JHR, Inox #42.
// Local fork/join over typed Outcomes, independent of Task spawning.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('..',import.meta.url));
const cases=[
 ['two branches see same input and join in order','to p make.parole-template >a { >next >v $v 1 + $next .resolve drop } $a .may drop make.parole-template >b { >next >v $v 2 * $next .resolve drop } $b .may drop array[] >xs $xs $a array.push $xs $b array.push make.parole-template >t $xs $t .fork-join drop 7 $t .submit .value >r 0 $r array.get .value out "," out 1 $r array.get .value out. p','8,14'],
 ['all branches start before asynchronous completion and join retains order','global: na/ is: _; global: nb/ is: _; to p make.parole-template >a { >next >v "A" out $next na! } $a .may drop make.parole-template >b { >next >v "B" out $next nb! } $b .may drop array[] >xs $xs $a array.push $xs $b array.push make.parole-template >t $xs $t .fork-join drop 7 $t .submit >r $r .settled? out 9 nb .resolve drop $r .settled? out 8 na .resolve drop $r .value >v 0 $v array.get .value out 1 $v array.get .value out. p','AB0089'],
 ['typed failure and multiple results are both retained','to p make.parole-template >a { >next >v false $next .reject drop } $a .may drop make.parole-template >b { >next >v array[] >xs $xs 7 array.push $xs 9 array.push false _ $xs make.outcome $next .settle drop } $b .may drop array[] >xs $xs $a array.push $xs $b array.push make.parole-template >t $xs $t .fork-join drop 1 $t .submit .value >r 0 $r array.get .failed? out 0 $r array.get .error out 1 $r array.get .values array.length out 1 $r array.get .value >v 0 $v array.get out 1 $v array.get out. p','10279'],
 ['empty fork completes with empty outcome array','to p make.parole-template >t array[] $t .fork-join drop 7 $t .submit .value array.length out. p','0'],
 ['join output feeds the next step','to p make.parole-template >a { >next >v $v 1 + $next .resolve drop } $a .may drop array[] >xs $xs $a array.push $xs $a array.push make.parole-template >t $xs $t .fork-join drop { >next >r 0 $r array.get .value 1 $r array.get .value + $next .resolve drop } $t .may drop 7 $t .submit .value out 9 $t .submit .value out. p','1620'],
 ['branch list snapshot and nested fork','to p make.parole-template >a array[] >xs $xs $a array.push make.parole-template >b $xs $b .fork-join drop $xs $a array.push array[] >ys $ys $b array.push make.parole-template >t $ys $t .fork-join drop 7 $t .submit .value >r $r array.length out 0 $r array.get .value >inner $inner array.length out 0 $inner array.get .value out. p','117'],
 ['failed input reaches will branches and bypasses may branches','to p make.parole-template >a { >next >v "BAD" out } $a .may drop make.parole-template >b { >next >event $event .error out 7 $next .resolve drop } $b .will drop array[] >xs $xs $a array.push $xs $b array.push make.parole-template >t $xs $t .fork-join drop true /bad array[] make.outcome $t .invoke .value >r 0 $r array.get .error out 1 $r array.get .value out. p','badbad7'],
 ['another actor may finish a branch','global: na/ is: _; to worker 9 na .resolve drop. to p make.parole-template >a { >next >v $next na! } $a .may drop array[] >xs $xs $a array.push make.parole-template >t $xs $t .fork-join drop 7 $t .submit >r l9-root .spawn( worker/ as-verb definition ) >w $w .resume l9-root .join drop $r .value >v 0 $v array.get .value out. p','9'],
];
for(const [name,source,expected] of cases){
 const r=spawnSync(process.execPath,['bin/inox.js','-e',source],{cwd,encoding:'utf8',timeout:20000,env:{...process.env,INOX_WITH_L9:'1',INOX_L9:'0',INOX_FULL:'0'}});
 assert.equal(r.status,0,`${name}: ${r.stdout} ${r.stderr}`);
 assert.doesNotMatch(r.stdout+r.stderr,/FATAL:|missing-verb|Assert failure|Invalid return/);
 assert.equal(r.stdout,expected,name);console.log('PASS '+name);
}
console.log(`L9 Parole fork/join: ${cases.length}/${cases.length}`);
