// 2026-11-26 — GPT-6.2 under JHR, Inox #42.
// One-shot step chains, explicit continuation and local Whisper adapter.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('..',import.meta.url));
const cases=[
 ['will starts first step, may transforms successful value','to p make.parole >p { >next >event 7 $next .resolve drop } $p .will drop { >next >v $v 2 * $next .resolve drop } $p .may drop $p .value out. p','14'],
 ['from defers first step until explicit input','to p make.parole .from >p { >next >v "W" out $v 1 + $next .resolve drop } $p .may drop $p .settled? out 7 $p .resolve drop $p .settled? out $p .value out. p','0W18'],
 ['returning a value does not advance a step or leak data','to p data-depth >before make.parole >p { >next >event 123 } $p .will drop { >next >event "BAD" out } $p .will drop $p .settled? out data-depth $before - out. p','00'],
 ['saved continuation settles later exactly once','global: saved/ is: _; to p make.parole >p { >next >event $next saved! } $p .will drop { >next >v "M" out $v 2 * $next .resolve drop } $p .may drop $p .settled? out 7 saved .resolve drop 9 saved .resolve drop $p .value out. p','0M14'],
 ['may skips error and will can recover','to p make.parole .from >p { >next >v "BAD" out } $p .may drop { >next >event $event .error out 42 $next .resolve drop } $p .will drop /bad $p .reject drop $p .value out. p','bad42'],
 ['step exception rejects its continuation','to p make.parole >p { >next >event /bad raise } $p .will drop { >next >event $event .error out 17 $next .resolve drop } $p .will drop $p .value out. p','bad17'],
 ['then waits for tail and transforms result','to p make.parole .from >p { >next >v $v 2 * $next .resolve drop } $p .may drop { >v $v 1 + } _ $p .then >q $q .resolved? out 7 $p .resolve drop $q resolve-value/ object.@ out. p','015'],
 ['whisper adopts pending promise','to p make.promise >source $source parole-whisper >p { >next >v $v 2 * $next .resolve drop } $p .may drop $p .settled? out 7 $source .resolve $p .settled? out $p .value out. p','0114'],
 ['whisper preserves typed rejection','to p make.boxon >b $b parole-whisper >p false $b .reject drop $p .outcome .failed? out $p .outcome .error out. p','10'],
 ['whisper preserves an existing parole','to p make.parole >p $p parole-whisper >q 8 $p .resolve drop $q .value out. p','8'],
 ['empty completion is typed outcome','to p make.parole .from >p { >next >event $event .values array.length out $next .complete drop } $p .will drop $p .complete drop $p .settled? out. p','01'],
 ['late observer sees tail settlement','to p make.parole >p { >next >event 9 $next .resolve drop } $p .will drop { >ctx >event $event .value out } $p .on drop. p','9'],
 ['200 pending steps drain at constant control depth','global: fd/ is: _; global: ld/ is: _; to p make.parole .from >p from: 1 to: 200 do: { { >next >v control-depth >d if: ( $v 0 = ) then: { $d fd! }; $d ld! $v 1 + $next .resolve drop } $p .may drop }; 0 $p .resolve drop $p .value out fd ld = out. p','2001'],
 // FBF: the former 100-cell control-stack overflow in a child actor.
 ['continuation settled by another actor','global: pp/ is: _; to worker 7 pp .resolve drop. to p make.parole .from pp! { >next >v $v 2 * $next .resolve drop } pp .may drop l9-root .spawn( worker/ as-verb definition ) >w $w .resume l9-root .join drop pp .value out. p','14'],
];
let passed=0;
for(const [name,source,expected] of cases){
 const r=spawnSync(process.execPath,['bin/inox.js','-e',source],{cwd,encoding:'utf8',timeout:20000,env:{...process.env,INOX_WITH_L9:'1',INOX_L9:'0',INOX_FULL:'0'}});
 assert.equal(r.status,0,`${name}: ${r.stdout} ${r.stderr}`);
 assert.doesNotMatch(r.stdout+r.stderr,/FATAL:|missing-verb|Assert failure|Invalid return/);
 assert.equal(r.stdout,expected,name); console.log('PASS '+name); passed++;
}
console.log(`L9 Parole: ${passed}/${cases.length}`);
