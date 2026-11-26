// 2026-11-26 — GPT-6.2 under JHR, Inox #42.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('..',import.meta.url));
const cases=[
 ['pending read does not implicitly settle, explicit empty completion','to p make.boxon >b $b .value type-of out $b .settled? out $b .complete drop $b .settled? out $b .value type-of out $b .outcome .values array.length out. p','void01void0'],
 ['result vector shallow snapshot','to p array[] >a $a 7 array.push $a 8 array.push false _ $a make.outcome >o $a 0 99 array.put $o .values >v $v 1 77 array.put 0 $o .value array.get out 1 $o .value array.get out. p','78'],
 ['adopt pending boxon without consuming raw callback','to p make.boxon >b { >ctx >event "R" out } $b .on drop $b boxon-cast >adopted 7 $b .resolve drop $adopted .value out. p','R7'],
 ['adopt pending promise success','to p make.promise >p $p boxon-cast >b $b .settled? out 7 $p .resolve $b .settled? out $b .value out. p','017'],
 ['adopt pending promise false rejection','to p make.promise >p $p boxon-cast >b false $p .reject $b .outcome .failed? out $b .promise .rejected? out $b .outcome .error out. p','110'],
 ['all waits for actual outcomes preserves order and raw callbacks','to p make.boxon >a make.boxon >b { >ctx >event "R" out } $a .on drop array[] >xs $xs $a array.push $xs $b array.push $xs $a array.push $xs boxon-all >all 7 $a .resolve drop $all .settled? out /bad $b .reject drop $all .settled? out $all .value array.length out 0 $all .value array.get .value out 1 $all .value array.get .outcome .error out 2 $all .value array.get .value out. p','R0137bad7'],
 ['all accepts a raw value and a promise','to p make.promise >p array[] >xs $xs 5 array.push $xs $p array.push $xs boxon-all >all $all .settled? out 7 $p .resolve $all .settled? out 0 $all .value array.get .value out 1 $all .value array.get .value out. p','0157'],
 ['race returns winning rejected box, leaves loser intact','to p make.boxon >a make.boxon >b array[] >xs $xs $a array.push $xs $b array.push $xs boxon-race >win /bad $b .reject drop $win .settled? out $win .value .outcome .error out $a .settled? out 7 $a .resolve drop $win .value .outcome .error out. p','1bad0bad'],
 ['empty all resolves, empty race stays pending','to p array[] boxon-all >all $all .settled? out $all .value array.length out array[] boxon-race .settled? out. p','100'],
 ['observer failure does not starve other callbacks','to p make.moxon >b { >ctx >event /bad raise } $b .on drop { >ctx >event $event .value out } $b .on drop try: { 7 $b .resolve drop } catch: { >e $e out }; $b .settled? out. p','7bad1'],
 ['callback registers late observer reentrantly','to p make.moxon >b { >ctx >event "A" out { >c >e $e .value out } $ctx .on drop } $b .on drop { >ctx >event "B" out } $b .on drop 7 $b .resolve drop. p','A7B'],
 ['pending and single result','to p make.boxon >b $b .settled? out 7 $b .resolve drop $b .settled? out $b .value out $b .promise .resolved? out. p','0171'],
 ['first settlement wins','to p make.boxon >b 7 $b .resolve drop 9 $b .resolve drop /bad $b .reject drop $b .value out. p','7'],
 ['multiple results','to p make.boxon >b array[] >a $a 7 array.push $a 8 array.push false _ $a make.outcome $b .settle drop $b .value array.length out 1 $b .value array.get out. p','28'],
 ['error is raised on read','to p make.boxon >b /bad $b .reject drop try: { $b .value drop } catch: { >e $e out }; $b .promise .rejected? out. p','bad1'],
 ['explicit false error','to p make.boxon >b false $b .reject drop $b .outcome .failed? out $b .promise .rejected? out $b .outcome .error out. p','110'],
 ['callback registered before result','to p make.boxon >b { >ctx >event $event .value out $ctx .settled? out } $b .on drop 7 $b .resolve drop. p','71'],
 ['late callback and explicit context','to p make.boxon >b 7 $b .resolve drop { >ctx >event $event .value out $ctx out } 9 $b .on-context drop. p','79'],
 ['moxon notifies all callbacks','to p make.moxon >b { >ctx >event "A" out $event .value out } $b .on drop { >ctx >event "B" out $event .value out } $b .on drop 7 $b .resolve drop. p','A7B7'],
 ['boxon duplicate registration event','to p make.boxon >b { >ctx >event if: $event .failed? then: { $event .error .context out } else: { $event .value out }; } $b .on drop { >ctx >event "BAD" out } 9 $b .on-context drop 7 $b .resolve drop. p','97'],
 ['then works before and after settlement','to p make.boxon >b { >v $v 1 + } _ $b .then >next 7 $b .resolve drop $next resolve-value/ object.@ out { >v $v 2 * } _ $b .then resolve-value/ object.@ out. p','814'],
];
let passed=0;
for(const [name,source,expected] of cases){
 const r=spawnSync(process.execPath,['bin/inox.js','-e',source],{cwd,encoding:'utf8',timeout:15000,env:{...process.env,INOX_WITH_L9:'1',INOX_FULL:'0',INOX_L9:'0'}});
 assert.equal(r.status,0,`${name}: ${r.stdout} ${r.stderr}`);
 assert.doesNotMatch(r.stdout+r.stderr,/FATAL:|missing-verb|Assert failure|Invalid return/);
 assert.equal(r.stdout,expected,name); console.log('PASS '+name); passed++;
}
console.log(`L9 Boxon/Moxon/Outcome: ${passed}/${cases.length}`);
