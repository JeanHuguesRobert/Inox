// 2026-11-27 — GPT-6.2 under JHR, Inox #42.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('..',import.meta.url));
const cases=[
 ['ordered aggregation after reverse settlement','to p make.promise >a make.boxon >b array[] >xs $xs $a array.push $xs $b array.push $xs aggregator >all 9 $b .resolve drop $all .settled? out 7 $a .resolve $all .value >r 0 $r array.get .value out 1 $r array.get .value out. p','079'],
 ['typed false rejection distinct from false success','to p make.boxon >a false $a .reject drop array[] >xs $xs $a array.push $xs false array.push $xs aggregator .value >r 0 $r array.get .failed? out 0 $r array.get .error out 1 $r array.get .failed? out 1 $r array.get .value out. p','1000'],
 ['and waits for all and returns last declared successful value','to p make.promise >a make.promise >b array[] >xs $xs $a array.push $xs $b array.push $xs aggregator-and >r 9 $b .resolve $r .settled? out 7 $a .resolve $r .value out. p','09'],
 ['and first false and rejection precedence','to p array[] >xs $xs 0 array.push $xs false array.push $xs aggregator-and .value out make.boxon >b /bad $b .reject drop $xs $b array.push $xs aggregator-and .value out. p','00'],
 ['selector retains typed error and does not reject outer box','to p make.boxon >a false $a .reject drop array[] >xs $xs $a array.push $xs 7 array.push $xs selector >r $r .outcome .failed? out $r .value .failed? out $r .value .error out. p','010'],
 ['or skips false zero empty text and void','to p array[] >xs $xs false array.push $xs 0 array.push $xs "" array.push $xs _ array.push $xs 7 array.push $xs selector-or .value out. p','7'],
 ['float truth preserves zero negative zero NaN and nonzero values','to p "0" as-float combinator-truth? out "1.5" as-float combinator-truth? out "-0" as-float combinator-truth? out "NaN" as-float combinator-truth? out array[] >xs $xs "0" as-float array.push $xs "1.5" as-float array.push $xs selector-or .value float.as-text out. p','01001.5'],
 ['or all false returns final delivered value','to p make.promise >a array[] >xs $xs $a array.push $xs "" array.push $xs selector-or >r $r .settled? out 0 $a .resolve $r .settled? out $r .value out. p','010'],
 ['or rejects with original reason and keeps winner','to p make.promise >a make.promise >b array[] >xs $xs $a array.push $xs $b array.push $xs selector-or >r false $b .reject 7 $a .resolve $r .outcome .failed? out $r .outcome .error out. p','10'],
 ['empty inputs preserve historical identities','to p array[] aggregator .value array.length out array[] aggregator-and .value array.length out array[] selector .settled? out array[] selector .value void? out array[] selector-or .settled? out. p','00111'],
 ['explicit thunk and thrown error and nested thunk','to p array[] >xs $xs { { 7 } make.combinator-thunk } make.combinator-thunk array.push $xs { /bad raise } make.combinator-thunk array.push $xs aggregator .value >r 0 $r array.get .value out 1 $r array.get .error out. p','7bad'],
 ['selector does not start later thunk','to p array[] >xs $xs 7 array.push $xs { "BAD" out 9 } make.combinator-thunk array.push $xs selector .value .value out $xs selector-or .value out. p','77'],
 ['cycle of explicit thunk is a failure','global: cyc/ is: _; to p { cyc } make.combinator-thunk cyc! array[] >xs $xs cyc array.push $xs aggregator .value >r 0 $r array.get .error out. p','cyclic-combinator-input'],
 ['Parole and direct Outcome preserve typed multi-value vector','to p make.parole .from >a array[] >vs $vs 7 array.push $vs 9 array.push false _ $vs make.outcome >event array[] >xs $xs $a array.push $xs $event array.push $xs aggregator >r $r .settled? out $event $a .fill drop $r .value >v 0 $v array.get .values array.length out 1 $v array.get .values array.length out. p','022'],
 ['adapter calls consume inputs and retain only outputs','to p data-depth >before 7 boxon-normalize drop make.boxon boxon? drop make.promise boxon-cast drop 7 parole-whisper drop make.parole parole-whisper drop array[] >xs $xs 7 array.push $xs aggregator drop $xs selector drop $xs aggregator-and drop $xs selector-or drop data-depth $before - out. p','0'],
 ['another actor can settle pending aggregate','global: pp/ is: _; to worker 7 pp .resolve. to p make.promise pp! array[] >xs $xs pp array.push $xs aggregator >r l9-root .spawn( worker/ as-verb definition ) >w $w .resume l9-root .join drop $r .value >v 0 $v array.get .value out. p','7'],
];
for(const [name,source,expected] of cases){
 const r=spawnSync(process.execPath,['bin/inox.js','-e',source],{cwd,encoding:'utf8',timeout:20000,env:{...process.env,INOX_WITH_L9:'1',INOX_L9:'0',INOX_FULL:'0'}});
 assert.equal(r.status,0,`${name}: ${r.stdout} ${r.stderr}`);
 assert.doesNotMatch(r.stdout+r.stderr,/FATAL:|missing-verb|Assert failure|Invalid return/);
 assert.equal(r.stdout,expected,name);console.log('PASS '+name);
}
console.log(`L9 Aggregator/Selector: ${cases.length}/${cases.length}`);
