#!/usr/bin/env node
/* 2026-11-24: GPT-6 under Jean Hugues Robert's direction.
 * FBF: exceptions delivered from a different task must unwind the receiver's
 * ACTUAL actor stack, running finally before terminal notification.
 */
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const cwd=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cases=[
 ['external raise executes suspended finally', 'to worker scope finally{ "F" out } "A" out l9-root .resume l9-dispatch-next "B" out. to p l9-root .spawn( worker/ as-verb definition ) >kid $kid .resume l9-dispatch-next "R" out /oops $kid .raise l9-dispatch-next $kid .done? out $kid .failure? out. p', 'ARF11'],
 ['external cancel executes suspended finally', 'to worker scope finally{ "F" out } "A" out l9-root .resume l9-dispatch-next "B" out. to p l9-root .spawn( worker/ as-verb definition ) >kid $kid .resume l9-dispatch-next "R" out $kid .cancel l9-dispatch-next $kid .done? out $kid .canceled? out. p', 'ARF11'],
 ['cleanup sees suspended scope local', 'to worker scope "LOCAL" >x finally{ $x out } "A" out l9-root .resume l9-dispatch-next "B" out. to p l9-root .spawn( worker/ as-verb definition ) >kid $kid .resume l9-dispatch-next "R" out /kill $kid .raise l9-dispatch-next $kid .done? out. p', 'ARLOCAL1'],
 ['nested finalizers unwind LIFO', 'to worker scope finally{ "O" out } scope finally{ "I" out } "A" out l9-root .resume l9-dispatch-next "B" out. to p l9-root .spawn( worker/ as-verb definition ) >kid $kid .resume l9-dispatch-next "R" out $kid .cancel l9-dispatch-next $kid .failure? out. p', 'ARIO1'],
 ['external raise is catchable in receiving actor', 'to worker try: { scope finally{ "F" out } "A" out l9-root .resume l9-dispatch-next "B" out } catch: { >e "C" out }; "D" out. to p l9-root .spawn( worker/ as-verb definition ) >kid $kid .resume l9-dispatch-next "R" out /abort $kid .raise l9-dispatch-next $kid .done? out $kid .error type-of out. p', 'ARFCD1void'],
 ['unaffected sibling executes normally', 'to bad scope finally{ "F" out } "A" out l9-root .resume l9-dispatch-next "B" out. to good "G" out. to p l9-root .spawn( bad/ as-verb definition ) >b l9-root .spawn( good/ as-verb definition ) >g $b .resume l9-dispatch-next "R" out /stop $b .raise $g .resume l9-dispatch-next $b .done? out $g .done? out. p', 'ARFG11'],
 ['externally raised cleanup may yield and resume', 'to worker scope finally{ "F1" out l9-root .resume l9-dispatch-next "F2" out } "A" out l9-root .resume l9-dispatch-next "B" out. to p l9-root .spawn( worker/ as-verb definition ) >kid $kid .resume l9-dispatch-next "R" out /bad $kid .raise l9-dispatch-next "r" out l9-dispatch-next "s" out $kid .done? out. p', 'ARF1rF2s1'],
 ['externally canceled cleanup may yield and resume', 'to worker scope finally{ "F1" out l9-root .resume l9-dispatch-next "F2" out } "A" out l9-root .resume l9-dispatch-next "B" out. to p l9-root .spawn( worker/ as-verb definition ) >kid $kid .resume l9-dispatch-next "R" out $kid .cancel l9-dispatch-next "r" out l9-dispatch-next "s" out $kid .done? out. p', 'ARF1rF2s1'],
 ['duplicate raise while cleaning preserves first reason', 'to worker scope finally{ "F1" out l9-root .resume l9-dispatch-next "F2" out } "A" out l9-root .resume l9-dispatch-next "B" out. to p l9-root .spawn( worker/ as-verb definition ) >kid $kid .resume l9-dispatch-next "R" out /first $kid .raise l9-dispatch-next "r" out /second $kid .raise l9-dispatch-next "s" out $kid .error out $kid .done? out. p', 'ARF1rF2sfirst1'],
 ['failure before first instruction does not execute normal IP', 'to worker "BAD" out. to p l9-root .spawn( worker/ as-verb definition ) >kid /oops $kid .raise l9-dispatch-next $kid .done? out $kid .failure? out. p', '11'],
 ['typed tag exception reason survives uncaught delivery', 'to worker "A" out l9-root .resume l9-dispatch-next "B" out. to p l9-root .spawn( worker/ as-verb definition ) >kid $kid .resume l9-dispatch-next "R" out /problem $kid .raise l9-dispatch-next $kid .error type-of out $kid .error out. p', 'ARtagproblem'],
 ['typed integer exception reason survives uncaught delivery', 'to worker "A" out l9-root .resume l9-dispatch-next "B" out. to p l9-root .spawn( worker/ as-verb definition ) >kid $kid .resume l9-dispatch-next "R" out 42 $kid .raise l9-dispatch-next $kid .error type-of out $kid .error out. p', 'ARinteger42'],
 ['self task.raise unwinds finally immediately', 'to worker scope finally{ "F" out } "A" out /self l9 .raise "BAD" out. to p l9-root .spawn( worker/ as-verb definition ) >kid $kid .resume l9-dispatch-next "R" out $kid .done? out $kid .error out. p', 'AFR1self'],
 ['self task.cancel unwinds finally immediately', 'to worker scope finally{ "F" out } "A" out l9 .cancel "BAD" out. to p l9-root .spawn( worker/ as-verb definition ) >kid $kid .resume l9-dispatch-next "R" out $kid .done? out $kid .canceled? out. p', 'AFR11'],
 ['ready selection does not silently finalize an actor', 'to p l9-root .spawn( 0 ) >kid /oops $kid .raise l9-next-ready drop $kid .pending-error? out $kid .done? out. p', '10'],
 ['cooperative stop exits at explicit stable point', 'to worker scope finally{ "F" out } "A" out l9-root .resume l9-dispatch-next "B" out l9 .should-stop? return-if "BAD" out. to p l9-root .spawn( worker/ as-verb definition ) >kid $kid .resume l9-dispatch-next "R" out $kid .stop-because( /maintenance ) $kid .resume l9-dispatch-next "P" out $kid .done? out $kid .stopped? out. p', 'ARBFP11'],
];
let count=0;
for(const [name,code,expected] of cases){
 const r=spawnSync(process.execPath,['bin/inox.js','-e',code],{cwd,encoding:'utf8',timeout:9000,maxBuffer:1024*1024,
 env:{...process.env,INOX_WITH_L9:'1',INOX_L9:'0',INOX_FULL:'0'}});
 const diag=(r.stdout||'')+(r.stderr||'');
 const pass=r.status===0&&!r.error&&r.stdout===expected&&!/FATAL:|Assert failure|AssertionError|missing-verb|Invalid boolean value|Invalid return/.test(diag);
 if(pass){count++;console.log('PASS '+name)}
 else console.error('FAIL '+name+': rc='+r.status+', out='+JSON.stringify((r.stdout||'').slice(0,140))+', stderr='+JSON.stringify((r.stderr||'').slice(0,140))+', expected='+JSON.stringify(expected));
}
console.log(`L9 external exception unwinding: ${count}/${cases.length}`);
process.exitCode=count===cases.length?0:1;
