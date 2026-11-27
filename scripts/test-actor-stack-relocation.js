// 2026-11-26 — GPT-6.2 under JHR, #42. Real VM stack relocation.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('..',import.meta.url));
const cases=[
 ['control stack moves while locals survive','to p control-stack-base >old 42 >x 2000 reserve-control-stack $old control-stack-base not= out 1 actor stack.fetch value-of control-stack-base = out $x out. p','1142'],
 ['data stack moves with live reference','to p data-stack-base >old "payload" 2000 reserve-data-stack $old data-stack-base not= out 0 actor stack.fetch value-of data-stack-base = out out. p','11payload'],
 ['guard data boundary rebased','to p 17 try: { 42 2000 reserve-data-stack /boom raise } catch: { >e $e out }; out. p','boom17'],
 ['pending nonlocal jump rebased','to t 0 >tries /repeat sentinel if: $tries 0 = then: { 1 >tries! scope finally{ 2000 reserve-control-stack "F" out } "A" out /repeat long-jump "BAD" out }; "B" out. t','AFB'],
 ['actor switch preserves relocated stacks','to worker "value" >x 2000 reserve-control-stack 2000 reserve-data-stack l9-root .resume l9-dispatch-next $x out 0 actor stack.fetch value-of data-stack-base = out 1 actor stack.fetch value-of control-stack-base = out. to p l9-root .spawn( worker/ as-verb definition ) >kid $kid .resume l9-dispatch-next "R" out $kid .resume l9-dispatch-next $kid .done? out. p','Rvalue111'],
 ['bulk duplicate preflight','to p "payload" 1000 dups data-depth out clear-data data-depth out. p','10010'],
 ['direct literal evaluation grows data stack','1 '.repeat(1000)+'data-depth out clear-data data-depth out','10000'],
 ['deep non-tail recursion grows control stack','to descend >n if: ( $n > 0 ) then: { $n 1 - descend $n drop };. to p control-stack-limit control-stack-base - >before 0 >entry-depth control-depth >entry-depth! 500 descend control-stack-limit control-stack-base - >after if: ( $after > $before ) then: { "G" out }; if: ( control-depth = ( $entry-depth + 1 ) ) then: { "D" out };. p','GD'],
];
for(const [name,source,expected] of cases){
 const r=spawnSync(process.execPath,['bin/inox.js','-e',source],{cwd,encoding:'utf8',timeout:20000,env:{...process.env,INOX_WITH_L9:'1',INOX_FULL:'0',INOX_L9:'0'}});
 assert.equal(r.status,0,`${name}: ${r.stdout} ${r.stderr}`); assert.doesNotMatch(r.stdout+r.stderr,/FATAL:|Assert failure|AssertionError|missing-verb|Invalid return/);assert.equal(r.stdout,expected,name);console.log('PASS '+name);
}
console.log(`Actor stack relocation: ${cases.length}/${cases.length}`);
