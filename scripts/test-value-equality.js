// 2026-11-27 — GPT-6.2 under JHR, Inox #42.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('..',import.meta.url));
const cases=[
 ['different text','"alpha" "beta" =','F'],
 ['separate equal texts','"alpha" "alpha" =','T'],
 ['different equal-length text','"abc" "abd" =','F'],
 ['empty versus nonempty','"" "x" =','F'],
 ['both empty','"" "" =','T'],
 ['difference after first Cell','"abcdefghijk" "abcdefghijl" =','F'],
 ['equal across Cell boundary','"abcdefghijk" "abcdefghijk" =','T'],
 ['exact Cell length','"abcdefgh" "abcdefgi" =','F'],
 ['same prefix different length','"abcdefgh" "abcdefghi" =','F'],
 ['different UTF8 payload','"é" "è" =','F'],
 ['equal UTF8 payload','"é" "é" =','T'],
 ['different supplementary Unicode characters','"😀" "😁" =','F'],
 ['equal supplementary Unicode characters','"😀" "😀" =','T'],
 ['no Unicode normalization of distinct byte values','"é" "é" =','F'],
 ['different? distinct values','7 9 different?','T'],
 ['identical? equal integer values','7 7 identical?','T'],

 ['equal? alias','"alpha" "beta" equal?','F'],
 ['not= complement','"alpha" "beta" not=','T'],
 ['<> complement','"alpha" "alpha" <>','F'],
 ['inequal? alias','"alpha" "beta" inequal?','T'],
 ['mixed primitive types','"7" 7 =','F'],
 ['equal integers','7 7 =','T'],
 ['unequal integers','7 9 =','F'],
 ['different references','array[] array[] =','F',true],
 ['mixed references text first','"alpha" array[] =','F',true],
 ['mixed references text second','array[] "alpha" =','F',true],
 ['same reference','array[] dup =','T',true],
 ['same? distinct references','array[] array[] same?','F',true],
 ['same? same reference','array[] dup same?','T',true],
 ['different? same reference','array[] dup different?','F',true],
 ['identical? distinct references','array[] array[] identical?','F',true],
];
let passed=0;
for(const mode of ['0','1']) for(const [name,source,expected,l9Only] of cases){
 if(l9Only && mode==='0')continue;
 const code='to p '+source+' dup true? { "T" out } if dup false? { "F" out } if dup type-of out drop data-depth out. p';
 const r=spawnSync(process.execPath,['bin/inox.js','-e',code],{cwd,encoding:'utf8',timeout:20000,env:{...process.env,INOX_WITH_L9:mode,INOX_FULL:'0',INOX_L9:'0'}});
 assert.equal(r.status,0,name+' '+r.stderr);assert.doesNotMatch(r.stdout+r.stderr,/Assert failure|FATAL:|missing-verb|Invalid return/);
 assert.equal(r.stdout.replace(/^cli-stdlib\.nox \(basic old-school\) loaded/,''),expected+'boolean0',name+' mode='+mode);
 passed++;
}
for(const mode of ['0','1']){
 const source='to p "Égalité — Corse 😀" >x $x out "|" out "﻿a" out data-depth out. p';
 const r=spawnSync(process.execPath,['bin/inox.js','-e',source],{cwd,encoding:'utf8',timeout:20000,env:{...process.env,INOX_WITH_L9:mode,INOX_FULL:'0',INOX_L9:'0'}});
 assert.equal(r.status,0,r.stderr);
 assert.equal(r.stdout.replace(/^cli-stdlib\.nox \(basic old-school\) loaded/,''),'Égalité — Corse 😀|﻿a0');
 passed++;
}
console.log('Value equality and UTF-8: '+passed+'/'+passed);
