#!/usr/bin/env node
/* 2026-11-24 — GPT-6 coding agent under Jean Hugues Robert's direction.
 * Stop requests are cooperative, unlike task.raise or task.cancel.
 */
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const cwd=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const tests=[
 ['stop default true','to p l9-root .stop l9-root .should-stop? out l9-root .stop-reason out. p','11'],
 ['symbolic reason','to p l9-root .stop-because( /maintenance ) l9-root .stop-reason out l9-root .should-stop? out. p','maintenance1'],
 ['text reason','to p l9-root .stop-because( "reboot" ) l9-root .stop-reason out. p','reboot'],
 ['false reason is valid','to p l9-root .stop-because( false ) l9-root .stop-reason out l9-root .should-stop? out. p','01'],
 ['void reason is valid','to p l9-root .stop-because( _ ) l9-root .stop-reason type-of out l9-root .should-stop? out. p','void1'],
 ['first explicit reason wins','to p l9-root .stop-because( /first ) l9-root .stop-because( /second ) l9-root .stop-reason out. p','first'],
 ['default first wins','to p l9-root .stop l9-root .stop-because( /second ) l9-root .stop-reason out. p','1'],
 ['explicit first wins','to p l9-root .stop-because( /first ) l9-root .stop l9-root .stop-reason out. p','first'],
 ['no request initial','to p l9-root .stop-reason type-of out l9-root .should-stop? out. p','void0'],
 ['no implicit exception/cancel','to p l9-root .stop l9-root .pending-error? out l9-root .canceled? out l9-root .done? out l9-root .stopping? out. p','0001'],
 ['caller data stack intact','to p 17 l9-root .stop-because( /note ) out data-depth out. p','170'],
 ['raise independent from stop','to p l9-root .spawn( 0 ) >kid /failure $kid .raise $kid .should-stop? out $kid .pending-error? out. p','01'],
 ['normal completion is not stopped','to worker 1 drop. to p l9-root .spawn( worker/ as-verb definition ) >kid $kid .resume l9-dispatch-next $kid .done? out $kid .stopped? not out. p','11'],
 ['requested then done is stopped','to worker 1 drop. to p l9-root .spawn( worker/ as-verb definition ) >kid $kid .stop-because( /maintenance ) $kid .stopping? out $kid .resume l9-dispatch-next $kid .stopped? out $kid .stop-reason out. p','11maintenance'],
 ['late stop ignored','to worker 1 drop. to p l9-root .spawn( worker/ as-verb definition ) >kid $kid .resume l9-dispatch-next $kid .stop-because( /late ) $kid .should-stop? out. p','0'],
];let passed=0;for(const [name,program,expected] of tests){
const r=spawnSync(process.execPath,['bin/inox.js','-e',program],{cwd,encoding:'utf8',timeout:8000,maxBuffer:1024*1024,env:{...process.env,INOX_WITH_L9:'1',INOX_L9:'0',INOX_FULL:'0'}});
const diagnostics=(r.stdout||'')+(r.stderr||'');
if(r.status!==0||r.error||r.stdout!==expected||/FATAL:|Assert failure|AssertionError|missing-verb|Invalid return|Invalid boolean value/.test(diagnostics))console.error('FAIL '+name+': rc='+r.status+' stdout='+JSON.stringify(r.stdout)+' stderr='+JSON.stringify((r.stderr||'').slice(0,140))+' expected='+JSON.stringify(expected));
else{passed++;console.log('PASS '+name)}
}
console.log('L9 cooperative stop: '+passed+'/'+tests.length);
process.exitCode=passed===tests.length?0:1;
