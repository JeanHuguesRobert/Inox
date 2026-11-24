#!/usr/bin/env node
/*
 * 2026-11-24 — GPT-6 coding agent under Jean Hugues Noel Robert.
 * Local cooperative scheduler: real VM ready FIFO, deduplicated wakeups,
 * pause/resume and eligibility filtering. This does not by itself prove
 * that a runnable actor has executed its own instruction stream.
 */
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const cwd=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cases=[
 ['initial queue empty','to t l9-ready-queue queue.length out. t','0'],
 ['root resume marks unpaused','to t l9-root .resume l9-root .paused? out. t','0'],
 ['root resume enqueues exactly once','to t l9-root .resume l9-ready-queue queue.length out. t','1'],
 ['duplicate resume does not duplicate ready entry','to t l9-root .resume l9-root .resume l9-root .schedule l9-ready-queue queue.length out. t','1'],
 ['next ready is the root','to t l9-root .resume l9-next-ready .id out. t','1'],
 ['picking a task drains its queue entry','to t l9-root .resume l9-next-ready drop l9-ready-queue queue.length out. t','0'],
 ['empty ready queue returns void','to t l9-next-ready type-of out. t','void'],
 ['paused task is ineligible','to t l9-root .resume l9-root .pause l9-next-ready type-of out l9-ready-queue queue.length out. t','void0'],
 ['resume after pause and dequeue is a new wake','to t l9-root .resume l9-root .pause l9-next-ready drop l9-root .resume l9-next-ready .id out. t','1'],
 ['FIFO across two spawned child tasks','to t l9-root .spawn( 0 ) >a l9-root .spawn( 0 ) >b $a .resume $b .resume l9-next-ready .id out l9-next-ready .id out. t','23'],
 ['duplicate child wake does not starve sibling','to t l9-root .spawn( 0 ) >a l9-root .spawn( 0 ) >b $a .resume $a .resume $b .resume l9-next-ready .id out l9-next-ready .id out l9-ready-queue queue.length out. t','230'],
 ['pause skips first and lets next run','to t l9-root .spawn( 0 ) >a l9-root .spawn( 0 ) >b $a .resume $b .resume $a .pause l9-next-ready .id out. t','3'],
 ['ready task retains its own actor','to t l9-root .spawn( 0 ) >a $a .resume l9-next-ready .actor type-of out. t','reference'],
 ['canceled task is not dispatched','to t l9-root .resume l9-root .cancel l9-next-ready type-of out. t','void'],
 ['live cooperative two-actor dispatch and root continuation', 'to a "A" out l9-dispatch-next. to b "B" out l9-dispatch-next. to p l9-root .spawn( a/ as-verb definition ) >a-task l9-root .spawn( b/ as-verb definition ) >b-task $a-task .resume $b-task .resume l9-root .resume l9-dispatch-next "R" out. p', 'ABR'],
 ['live actor-local L9 identity on each stack', 'to a "A" out l9 .id out l9-dispatch-next. to b "B" out l9 .id out l9-dispatch-next. to p l9-root .spawn( a/ as-verb definition ) >a-task l9-root .spawn( b/ as-verb definition ) >b-task $a-task .resume $b-task .resume l9-root .resume l9-dispatch-next "R" out l9 .id out. p', 'A2B3R1'],
 ['resume suspended actor with its local state intact', 'to a 41 >mark "A" out l9-root .resume l9-dispatch-next $mark out l9-root .resume l9-dispatch-next. to p l9-root .spawn( a/ as-verb definition ) >kid $kid .resume l9-dispatch-next "R" out $kid .resume l9-dispatch-next "r" out. p', 'AR41r'],
 ['worker auto-completion unregisters from active registry', 'to a "W" out. to p l9-root .spawn( a/ as-verb definition ) >kid $kid .id >id $kid .resume l9-dispatch-next $kid .done? out $id 1 - l9-task-registry array.get type-of out. p', 'W1void'],
 ['quiescent scheduler yields to host without executing paused root','to worker-one "W" out. to p l9-root .spawn( worker-one/ as-verb definition ) >kid $kid .resume l9-root .pause l9-dispatch-next "AFTER" out. p','W'],

 ['two workers auto-complete without leaving registry owners', 'to a "A" out. to b "B" out. to p l9-root .spawn( a/ as-verb definition ) >ta l9-root .spawn( b/ as-verb definition ) >tb $ta .resume $tb .resume l9-dispatch-next "R" out $ta .done? out $tb .done? out $ta .id 1 - l9-task-registry array.get type-of out $tb .id 1 - l9-task-registry array.get type-of out. p', 'ABR11voidvoid'],
 ['cooperative round robin preserves FIFO across three actors', 'to a "A" out l9-dispatch-next "a" out l9-dispatch-next. to b "B" out l9-dispatch-next "b" out l9-dispatch-next. to p l9-root .spawn( a/ as-verb definition ) >ta l9-root .spawn( b/ as-verb definition ) >tb $ta .resume $tb .resume l9-dispatch-next "R" out l9-dispatch-next "r" out l9-dispatch-next "Q" out. p', 'ABRabrQ'],


];
let count=0;
for(const [name,program,expected] of cases){
 const r=spawnSync(process.execPath,['bin/inox.js','-e',program],{
  cwd,encoding:'utf8',timeout:9000,maxBuffer:1024*1024,
  env:{...process.env,INOX_WITH_L9:'1',INOX_FULL:'0',INOX_L9:'0'},
 });
 const ok=r.status===0&&!r.error&&!/FATAL:|missing-verb|Assert failure|AssertionError|Invalid boolean value|Invalid return|Cannot compile/.test(r.stdout+r.stderr)&&r.stdout===expected;
 if(ok){console.log('PASS '+name);count++;}
 else{console.error(`FAIL ${name}: rc=${r.status}, out=${JSON.stringify(r.stdout?.slice(0,220))}, err=${JSON.stringify(r.stderr?.slice(0,120))}`)}
}
console.log(`L9 local ready queue: ${count}/${cases.length} cases`);
process.exitCode=count===cases.length?0:1;
