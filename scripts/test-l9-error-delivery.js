#!/usr/bin/env node
/*
 * 2026-11-24 — GPT-6 coding agent under Jean Hugues Noel Robert.
 * Verify scheduler-mediated exceptional delivery for L9 tasks. Selecting a
 * task is pure; a real actor dispatch injects the error into its VM context.
 * Ordinary catch/finally semantics are tested separately.
 */
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const cwd=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cases=[
 ['raise stores pending failure without prematurely finishing', 'to t l9-root .spawn( 0 ) >kid /problem $kid .raise $kid pending-error?/ object.@ out $kid .done? out. t','10'],
 ['raised task enters ready queue even if initially paused', 'to t l9-root .spawn( 0 ) >kid /problem $kid .raise l9-ready-queue queue.length out. t','1'],
 ['failure delivered when scheduler activates target actor', 'to t l9-root .spawn( 0 ) >kid /problem $kid .raise l9-dispatch-next $kid .done? out $kid .failure? out. t','11'],
 ['failed task keeps its reason', 'to t l9-root .spawn( 0 ) >kid /problem $kid .raise l9-dispatch-next $kid .error out. t','problem'],
 ['parent receives failure event', 'to t l9-root .spawn( 0 ) >kid /problem $kid .raise l9-dispatch-next l9-root failed-children/ object.@ array.length out. t','1'],
 ['parent event identifies failed child', 'to t l9-root .spawn( 0 ) >kid /problem $kid .raise l9-dispatch-next 0 l9-root failed-children/ object.@ array.get $kid = out. t','1'],
 ['failure clears registry owner on termination', 'to t l9-root .spawn( 0 ) >kid $kid .id >id /problem $kid .raise l9-dispatch-next $id 1 - l9-task-registry array.get type-of out. t','void'],
 ['failure event delivered exactly once', 'to t l9-root .spawn( 0 ) >kid /problem $kid .raise /again $kid .raise l9-dispatch-next l9-dispatch-next l9-root failed-children/ object.@ array.length out. t','1'],
 ['cancellation propagates an error event to child', 'to t l9-root .spawn( 0 ) >kid l9-root .cancel $kid .canceled? out $kid pending-error?/ object.@ out. t','11'],
 ['canceled child is marked done when delivered', 'to t l9-root .spawn( 0 ) >kid $kid .cancel l9-dispatch-next $kid .done? out $kid .canceled? out. t','11'],
 ['raising failure does not execute child normal IP','to work "BAD" out. to t l9-root .spawn( work/ as-verb definition ) >kid /problem $kid .raise l9-dispatch-next $kid .done? out. t','1'],
 ['failed task does not block runnable sibling', 'to a "BAD" out. to b "GOOD" out. to p l9-root .spawn( a/ as-verb definition ) >bad l9-root .spawn( b/ as-verb definition ) >good /problem $bad .raise $good .resume l9-dispatch-next "R" out $bad .failure? out $good .done? out. p', 'GOODR11'],
 // 2026-11-24: GPT-6 under Jean Hugues Noel Robert.
 // VM language exceptions without an immediate guard must use the same
 // task.raise/failure-delivery lifecycle as explicit task errors.
 // Their delivery is cooperative: a root actor can regain execution while
 // the child's pending error is still queued. A second dispatch consumes it.

 ['uncaught child FATAL fails task without killing sibling', 'to a "BAD" FATAL "WRONG" out. to b "GOOD" out. to p l9-root .spawn( a/ as-verb definition ) >bad l9-root .spawn( b/ as-verb definition ) >good $bad .resume $good .resume l9-dispatch-next "R" out $bad .failure? out $good .done? out $bad .error out. p', 'GOODR11BAD'],
 ['uncaught child error notifies parent on its next scheduler turn', 'to a "BOOM" FATAL. to p l9-root .spawn( a/ as-verb definition ) >bad $bad .id >id $bad .resume l9-dispatch-next l9-dispatch-next l9-root failed-children/ object.@ array.length out $id 1 - l9-task-registry array.get type-of out. p', '1void'],
 ['guarded child FATAL does not mark task failed', 'to a { "BOOM" FATAL } { >e "RECOVER" out } run-guarded. to p l9-root .spawn( a/ as-verb definition ) >kid $kid .resume l9-dispatch-next $kid .done? out $kid .error nothing? out. p', 'RECOVER11'],
 ['promise callback FATAL rejects dependent without failing actor', 'to a make.promise >v { >x "BOOM" FATAL } _ $v .then >next 7 $v .resolve $next .rejected? out $next reject-reason/ object.@ out. to p l9-root .spawn( a/ as-verb definition ) >kid $kid .resume l9-dispatch-next $kid .done? out $kid .error nothing? out. p', '1BOOM11'],


];
let passed=0;
for(const [name,program,expected] of cases){
 const r=spawnSync(process.execPath,['bin/inox.js','-e',program],{
  cwd,encoding:'utf8',timeout:9000,maxBuffer:1024*1024,
  env:{...process.env,INOX_WITH_L9:'1',INOX_FULL:'0',INOX_L9:'0'},
 });
 const ok=r.status===0&&!r.error&&!/FATAL:|missing-verb|Assert failure|AssertionError|Invalid boolean value|Invalid return|Cannot compile/.test(r.stdout+r.stderr)&&r.stdout===expected;
 if(ok){console.log('PASS '+name);passed++;}
 else{console.error(`FAIL ${name}: rc=${r.status}, out=${JSON.stringify(r.stdout?.slice(0,220))}, err=${JSON.stringify(r.stderr?.slice(0,130))}`)}
}
console.log(`L9 scheduler-delivered task errors: ${passed}/${cases.length} cases`);
process.exitCode=passed===cases.length?0:1;
