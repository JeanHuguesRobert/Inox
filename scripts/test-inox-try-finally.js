#!/usr/bin/env node
/* 2026-11-24 — GPT-6 coding agent under Jean Hugues Noel Robert.
 * L9/minimal FBF for the original 2023 try/catch/finally vocabulary.
 * End-to-end real VM behavior, not a greenwashed printing-only script.
 */
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const cwd=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cases=[
 ['bare try executes', 'to t try: { "T" out }; "A" out. t','TA'],
 ['try/catch normal', 'to t try: { "T" out } catch: { >e "BAD" out }; "A" out. t','TA'],
 ['try/catch error', 'to t try: { "ERR" FATAL "WRONG" out } catch: { >e $e out }; "A" out. t','ERRA'],
 ['try/catch local return value', 'to t try: { 42 } catch: { >e 0 }; out. t','42'],
 ['try/finally normal', 'to t try: { "T" out } finally: { "F" out }; "A" out. t','TFA'],
 ['try/finally error rethrown to outer catch', 'to inner try: { "X" FATAL } finally: { "F" out }. to t try: { inner } catch: { >e $e out }; "A" out. t','FXA'],
 ['try/catch/finally normal', 'to t try: { "T" out } catch: { >e "BAD" out } finally: { "F" out }; "A" out. t','TFA'],
 ['try/catch/finally error', 'to t try: { "X" FATAL } catch: { >e $e out } finally: { "F" out }; "A" out. t','XFA'],
 ['try/catch/finally catch itself errors', 'to inner try: { "X" FATAL } catch: { >e "Y" FATAL } finally: { "F" out }. to t try: { inner } catch: { >e $e out }; "A" out. t','FYA'],
 ['try/catch/finally finally errors', 'to inner try: { "T" out } catch: { >e "BAD" out } finally: { "F" FATAL }. to t try: { inner } catch: { >e $e out }; "A" out. t','TFA'],
 ['try with nested on-return normal', 'to t { scope finally{ "F" out } "T" out } { >e "BAD" out } run-guarded "A" out. t','TFA'],
 ['try with nested on-return exceptional', 'to t { scope finally{ "F" out } "X" FATAL "WRONG" out } { >e $e out } run-guarded "A" out. t','FXA'],
 ['nested on-return unwind LIFO', 'to t { scope finally{ "O" out } scope finally{ "I" out } "X" FATAL } { >e $e out } run-guarded "A" out. t','IOXA'],
 ['on-return sees local on exceptional exit', 'to t { scope "LOCAL" >x finally{ $x out } "E" FATAL } { >e $e out } run-guarded. t','LOCALE'],
 ['on-return error supersedes original', 'to t { scope finally{ "NEW" FATAL } "OLD" FATAL } { >e $e out } run-guarded "A" out. t','NEWA'],
 ['two exceptional calls leave caller stack unchanged', 'to work from: 1 to: 2 do: { { "ERR" FATAL } { >e } try:catch: };. to t control-depth out "," out work control-depth out. t','-2,-2'],
 ['early return runs on-return cleanup','to w scope finally{ "F" out } "T" out return "BAD" out. to t w "A" out. t','TFA'],
 ['break runs finally before continuation','to t from: 1 to: 3 do: { scope finally{ "F" out } "B" out break }; "A" out. t','BFA'],
 ['nonlocal break nested cleanup runs LIFO','to t from: 1 to: 3 do: { scope finally{ "O" out } scope finally{ "I" out } "B" out break }; "A" out. t','BIOA'],
 ['raised exception in child runs cleanup before task failure','to worker scope finally{ "C" out } "ERR" FATAL. to p l9-root .spawn( worker/ as-verb definition ) >kid $kid .resume l9-dispatch-next "R" out l9-dispatch-next $kid .failure? out. p','CR1'],
 ['exception guard retained through actor switch','to worker try: { "W" out l9-root .resume l9-dispatch-next "ERR" raise } catch: { >e "C" out }; l9-dispatch-next. to p l9-root .spawn( worker/ as-verb definition ) >kid $kid .resume l9-dispatch-next "R1" out l9-dispatch-next "R2" out. p','WR1CR2'],
 ['generic raise is recoverable','to t try: { "E" raise } catch: { >e $e out }; "A" out. t','EA'],
 ['missing method is catchable and runs finally','to t try: { 1 .not-real } catch: { >e $e out } finally: { "F" out }; "A" out. t','missing-method integer.not-realFA'],
 ['try/finally preserves normal returned value','to t try: { 42 } finally: { "F" out }; out. t','F42'],
 ['try/catch/finally preserves recovered value','to t try: { "E" raise } catch: { >e 42 } finally: { "F" out }; out. t','F42'],
 ['generic raise propagates an integer reason','to t try: { 42 raise } catch: { >e $e out }; "A" out. t','42A'],
 ['long-jump runs finalizers before transfer','to t 0 >tries /repeat sentinel if: $tries 0 = then: { 1 >tries! scope finally{ "F" out } "A" out /repeat long-jump "BAD" out }; "B" out. t','AFB'],
 ['long-jump runs nested finalizers in reverse order','to t 0 >tries /repeat sentinel if: $tries 0 = then: { 1 >tries! scope finally{ "O" out } scope finally{ "I" out } "A" out /repeat long-jump }; "B" out. t','AIOB'],
 ['promise callback finally precedes rejection','to t make.promise >p { >x scope finally{ "F" out } "BOOM" raise } _ $p .then >next 7 $p .resolve $next .rejected? out $next reject-reason/ object.@ out. t','F1BOOM'],
 ['promise callback cleanup error replaces prior reason','to t make.promise >p { >x scope finally{ "F" raise } "OLD" raise } _ $p .then >next 7 $p .resolve $next .rejected? out $next reject-reason/ object.@ out. t','1F'],
 ['repeated finally does not leak data or control cells','to work from: 1 to: 300 do: { try: { 42 } finally: { }; drop };. to t data-depth out "," out work data-depth out. t','0,0'],
 ['repeated caught errors restore both stack depths','to work from: 1 to: 300 do: { try: { "E" raise } catch: { >e } finally: { }; };. to t data-depth out "," out work data-depth out. t','0,0'],
 ['data-depth counts live values','to t 42 data-depth out drop. t','1'],
 ['clear-data actually empties nonempty stack','to t 42 clear-data data-depth out. t','0'],
 ['child failure finalizer does not block sibling actor','to bad scope finally{ "F" out } "E" raise. to good "G" out. to p l9-root .spawn( bad/ as-verb definition ) >b l9-root .spawn( good/ as-verb definition ) >g $b .resume $g .resume l9-dispatch-next "R" out l9-dispatch-next $b .failure? out $g .done? out. p','FGR11'],



];
let passed=0;
for(const [name,source,expected] of cases){
 const r=spawnSync(process.execPath,['bin/inox.js','-e',source],{
  cwd,encoding:'utf8',timeout:8500,maxBuffer:1024*1024,
  env:{...process.env,INOX_WITH_L9:'1',INOX_FULL:'0',INOX_L9:'0'},
 });
 const ok=r.status===0&&!r.error&&r.stdout===expected&&!/FATAL:|Assert failure|AssertionError|missing-verb|Invalid boolean value/.test(r.stdout+(r.stderr||''));
 if(ok){console.log('PASS '+name);passed++;}
 else console.error(`FAIL ${name}: rc=${r.status} stdout=${JSON.stringify((r.stdout||'').slice(0,160))} stderr=${JSON.stringify((r.stderr||'').slice(0,100))}`);
}
// Minimal bootstrap must implement identical language-level semantics without
// requiring the L9 object/promise layer. The minimal CLI emits a known banner.
const minimalCases=[
 ['minimal try/catch recovery','to t try: { "E" raise } catch: { >e $e out }; "A" out. t','EA'],
 ['minimal finally normal','to t try: { "T" out } finally: { "F" out }; "A" out. t','TFA'],
 ['minimal finally after error','to t try: { "E" raise } catch: { >e $e out } finally: { "F" out }; "A" out. t','EFA'],
 ['minimal break finally','to t from: 1 to: 3 do: { scope finally{ "F" out } "B" out break }; "A" out. t','BFA'],
 ['minimal nested finalizers','to t { scope finally{ "O" out } scope finally{ "I" out } "E" raise } { >e $e out } run-guarded "A" out. t','IOEA'],
 ['minimal repeated scoped finally does not leak','to work from: 1 to: 250 do: { try: { 42 } finally: { }; drop };. to t data-depth out "," out work data-depth out. t','0,0'],

];
for(const [name,source,expected] of minimalCases){
 const r=spawnSync(process.execPath,['bin/inox.js','-e',source],{
  cwd,encoding:'utf8',timeout:8500,maxBuffer:1024*1024,
  env:{...process.env,INOX_WITH_L9:'0',INOX_FULL:'0',INOX_L9:'0'},
 });
 const ok=r.status===0&&!r.error&&r.stdout.endsWith(expected)&&!/FATAL:|Assert failure|AssertionError|missing-verb|Invalid boolean value/.test(r.stdout+(r.stderr||''));
 if(ok){console.log('PASS '+name);passed++;}
 else console.error(`FAIL ${name}: rc=${r.status} stdout=${JSON.stringify((r.stdout||'').slice(0,190))}`);
}
console.log(`Inox try/catch/finally: ${passed}/${cases.length+minimalCases.length}`);
process.exitCode=passed===cases.length+minimalCases.length?0:1;
