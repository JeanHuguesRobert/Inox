#!/usr/bin/env node
/*
 * 2026-11-24 - GPT-6 coding agent under Jean Hugues Noel Robert.
 * FixBugsFirst: language-level FATAL inside a callback must unwind to the
 * nearest actor-local exception guard, preserve its caller, and deliver a
 * typed reason. Unhandled exceptions remain visible failures.
 */
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const cwd=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cases=[
 ['success resumes caller','to t { "OK" out } { >e "BAD" out } run-guarded "AFTER" out. t','OKAFTER'],
 ['error reaches guard, skips failing callback tail','to t { "BROKEN" FATAL "WRONG" out } { >e "HANDLED:" out $e out } run-guarded "AFTER" out. t','HANDLED:BROKENAFTER'],
 ['successful callback returns its value','to t { 42 } { >e 0 } run-guarded out. t','42'],
 ['nested nearest guard catches error','to t { { "BROKEN" FATAL } { >e "INNER" out } run-guarded "OUTER" out } { >e "WRONG" out } run-guarded "END" out. t','INNEROUTEREND'],
 ['nested guard can propagate a second error','to t { { "FIRST" FATAL } { >e "SECOND" FATAL } run-guarded "BAD" out } { >e $e out } run-guarded "END" out. t','SECONDEND'],
 ['subsequent calls are unaffected by a caught failure','to t { "A" FATAL } { >e "C" out } run-guarded { "B" out } { >e "WRONG" out } run-guarded. t','CB'],
 ['100 caught errors leave no extra return frames','to work from: 1 to: 100 do: { { "ERR" FATAL } { >e } run-guarded };. to t control-depth out "," out work control-depth out. t','2,2'],
 ['100 successful guarded runs leave no extra frames','to work from: 1 to: 100 do: { { 42 } { >e } run-guarded drop };. to t control-depth out "," out work control-depth out. t','2,2'],
 ['guard survives actual child/root context switching','to worker { "W1" out l9-root .resume l9-dispatch-next "ERR" FATAL "BAD" out } { >e "C" out } run-guarded l9-dispatch-next. to p l9-root .spawn( worker/ as-verb definition ) >kid $kid .resume l9-dispatch-next "R1" out l9-dispatch-next "R2" out. p','W1R1CR2'],

];
let passed=0;
for(const [name,source,expected] of cases){
 const r=spawnSync(process.execPath,['bin/inox.js','-e',source],{
  cwd,encoding:'utf8',timeout:8000,maxBuffer:1024*1024,
  env:{...process.env,INOX_WITH_L9:'1',INOX_FULL:'0',INOX_L9:'0'},
 });
 const ok=r.status===0&&!r.error&&!/FATAL:|Assert failure|AssertionError|missing-verb|Invalid return|Invalid boolean value/.test(r.stdout+r.stderr)&&r.stdout===expected;
 if(!ok)console.error(`FAIL ${name}: exit=${r.status} stdout=${JSON.stringify((r.stdout||'').slice(0,180))} stderr=${JSON.stringify((r.stderr||'').slice(0,100))}`);
 else {console.log(`PASS ${name}`);passed++;}
}
// The same guard must work in the minimal bootstrap. The established
// minimal CLI prints a startup banner, followed by the program output.
const minimalCases=[
 ['minimal-mode guarded failure','to t { "ERR" FATAL } { >e $e out } run-guarded "OK" out. t','ERROK'],
 ['minimal-mode successful guarded call','to t { "READY" out } { >e "BAD" out } run-guarded "OK" out. t','READYOK'],
];
for(const [name,source,expected] of minimalCases){
 const r=spawnSync(process.execPath,['bin/inox.js','-e',source],{
  cwd,encoding:'utf8',timeout:8000,maxBuffer:1024*1024,
  env:{...process.env,INOX_WITH_L9:'0',INOX_FULL:'0',INOX_L9:'0'},
 });
 const ok=r.status===0&&!r.error&&!/FATAL:|Assert failure|AssertionError|missing-verb|Invalid return|Invalid boolean value/.test(r.stdout+r.stderr)&&r.stdout.endsWith(expected);
 if(!ok)console.error(`FAIL ${name}: exit=${r.status}, output=${JSON.stringify(r.stdout?.slice(0,160))}`);
 else {console.log(`PASS ${name}`);passed++;}
}
// Unhandled root errors are reported with nonzero host exit status,
// while guarded callback errors and isolated child failures remain handled.
const unhandled=spawnSync(process.execPath,['bin/inox.js','-e',
 'to t "ROOT_FAILURE" FATAL "AFTER" out. t'],{
 cwd,encoding:'utf8',timeout:8000,maxBuffer:1024*1024,
 env:{...process.env,INOX_WITH_L9:'1',INOX_FULL:'0',INOX_L9:'0'},
});
assert.notEqual(unhandled.status,0,'unhandled root FATAL must be a failed process');
assert.match(unhandled.stdout,/FATAL: ROOT_FAILURE/);
assert.doesNotMatch(unhandled.stdout,/AFTER/);
console.log('PASS unhandled root FATAL returns failure status and stops its caller');
passed++;
console.log(`Inox guarded callbacks: ${passed}/${cases.length+minimalCases.length+1}`);
process.exitCode=passed===cases.length+minimalCases.length+1?0:1;
