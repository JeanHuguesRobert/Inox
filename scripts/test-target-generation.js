// 2026-11-27 — native extraction is not native compilation.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=fileURLToPath(new URL('..',import.meta.url));
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'inox-target-regression-'));
const env={...process.env,INOX_FULL:'0',INOX_WITH_L9:'0',INOX_L9:'0',INOX_TEST:'0'};
try{
 fs.symlinkSync(path.join(root,'lib'),path.join(tmp,'lib'),'dir');
 fs.mkdirSync(path.join(tmp,'builds'));
 const run=args=>spawnSync(process.execPath,[path.join(root,'builds/inox.js'),...args],{cwd:tmp,env,encoding:'utf8',input:'',timeout:20000});
 const repl=run([]);
 assert.equal(repl.status,0,repl.stderr);
 assert.match(repl.stdout,/ok /);
 assert.deepEqual(fs.readdirSync(path.join(tmp,'builds')),[]);
 const generated=run(['--build-targets']);
 assert.equal(generated.status,0,generated.stderr);
 assert.match(generated.stdout,/Code generated/);
 for(const f of ['inox.cpp','inox.as.ts','inox.html','inox.md'])assert.ok(fs.statSync(path.join(tmp,'builds',f)).size>0);
 const cpp=fs.readFileSync(path.join(tmp,'builds/inox.cpp'),'utf8');
 const cli=cpp.indexOf('static void run_program(');
 assert.ok(cli>0);
 const open=cpp.lastIndexOf('/*ts{',cli);
 assert.ok(open>0 && cpp.indexOf('*/',open)>cpp.indexOf('if( process.argv[ 1 ]',cli));
 console.log('Target generation and REPL separation: PASS (native compilation not asserted)');
}finally{fs.rmSync(tmp,{recursive:true,force:true})}
