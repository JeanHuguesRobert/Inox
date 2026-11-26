// 2026-11-26 — GPT-6.2 under JHR, Inox #42.
// A reusable step description creates independent one-shot executions.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('..',import.meta.url));
const cases=[
 ['multiple values survive typed invocation','to p make.parole-template >t { >next >event $event .values array.length out $event $next .settle drop } $t .will drop array[] >xs $xs 7 array.push $xs 9 array.push false _ $xs make.outcome $t .invoke .value >v 0 $v array.get out 1 $v array.get out. p','279'],
 ['100 sequential invocations return their own result','to p make.parole-template >t { >next >v $v 1 + $next .resolve drop } $t .may drop 0 >sum from: 1 to: 100 do: { $sum ii $t .submit .value + >sum! }; $sum out. p','5150'],
 ['repeated submissions have independent results','to p make.parole-template >t { >next >v $v 2 * $next .resolve drop } $t .may drop 7 $t .submit >a 9 $t .submit >b $a .value out "," out $b .value out. p','14,18'],
 ['empty template passes through input','to p make.parole-template >t 7 $t .submit .value out 9 $t .submit .value out. p','79'],
 ['fresh instances may remain deferred','to p make.parole-template >t { >next >v $v 1 + $next .resolve drop } $t .may drop $t .instantiate >a $t .instantiate >b $a .settled? out $b .settled? out 7 $a .resolve drop $b .settled? out 9 $b .resolve drop $a .value out $b .value out. p','000810'],
 ['simultaneous suspended invocations settle independently in reverse order','global: first-next/ is: _; global: second-next/ is: _; to p make.parole-template >t { >next >v if: ( $v 1 = ) then: { $next first-next! } else: { $next second-next! }; } $t .may drop { >next >v $v 2 * $next .resolve drop } $t .may drop 1 $t .submit >a 2 $t .submit >b $a .settled? out $b .settled? out 7 second-next .resolve drop $a .settled? out $b .value out "," out 9 first-next .resolve drop $a .value out. p','00014,18'],
 ['typed rejection preserved and recovered independently','to p make.parole-template >t { >next >v "BAD" out } $t .may drop { >next >event $event .failed? out $event .error out 42 $next .resolve drop } $t .will drop true false array[] make.outcome $t .invoke .value out. p','1042'],
 ['later template edits do not alter an existing execution','to p make.parole-template >t { >next >v $v 1 + $next .resolve drop } $t .may drop $t .instantiate >old { >next >v $v 2 * $next .resolve drop } $t .may drop 7 $old .resolve drop $old .value out "," out 7 $t .submit .value out. p','8,16'],
 ['execution errors do not poison later runs','to p make.parole-template >t { >next >v if: ( $v 0 = ) then: { /bad raise }; $v $next .resolve drop } $t .may drop 0 $t .submit .outcome .error out 7 $t .submit .value out. p','bad7'],
];
for(const [name,source,expected] of cases){
 const r=spawnSync(process.execPath,['bin/inox.js','-e',source],{cwd,encoding:'utf8',timeout:20000,env:{...process.env,INOX_WITH_L9:'1',INOX_L9:'0',INOX_FULL:'0'}});
 assert.equal(r.status,0,`${name}: ${r.stdout} ${r.stderr}`);
 assert.doesNotMatch(r.stdout+r.stderr,/FATAL:|missing-verb|Assert failure|Invalid return/);
 assert.equal(r.stdout,expected,name);console.log('PASS '+name);
}
console.log(`L9 Parole reusable template: ${cases.length}/${cases.length}`);
