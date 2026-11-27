// 2026-11-26 — GPT-6 under Jean Hugues Noel Robert's direction.
// FBF: parameter frames and optional checking, including fast dispatch.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const cases=[
 ['return address','7 8 with /a /b /{ $a out $b out } 9 out','789'],
 ['direct','7 8 with /left /right { $left out $right out } run-with-parameters 9 out','789'],
 ['zero','with /{ 7 out } 9 out','79'],
 ['one','7 with /x /{ $x out } 9 out','79'],
 ['three','1 2 3 with /x /y /z /{ $x out $y out $z out } 9 out','1239'],
 ['nested','7 with /a /{ $a out 8 with /a /{ $a out } $a out } 9 out','7879'],
 ['return','7 with /a /{ $a out return 8 out } 9 out','79'],
 ['return-if','7 with /a /{ $a out true return-if 8 out } 9 out','79'],
 ['return-unless','7 with /a /{ $a out false return-unless 8 out } 9 out','79'],
 ['text','"left" "right" with /first /second /{ $first out $second out } "!" out','leftright!'],
 ['preserve lower data','4 7 8 with /a /b /{ $a $b + } + out','19'],
 ['depth','control-depth out "," out 7 with /a /{ $a drop } control-depth out','2,2'],
 ['target control','7 >{ it out } 9 out','79'],
];
function invoke(source,mode){
 const r=spawnSync(process.execPath,['bin/inox.js','-e',source],{encoding:'utf8',timeout:8000,env:{...process.env,INOX_WITH_L9:mode,INOX_FULL:'0',INOX_L9:'0'}});
 assert.ok(!r.error,source+' '+r.error);
 return {...r,output:r.stdout.replace(/^cli-stdlib\.nox \(basic old-school\) loaded/,'')};
}
let passed=0;
for(const mode of ['0','1']){
 for(const [name,body,expected] of cases)for(const fast of [false,true]){
  const source='to p '+(fast?'true fast! drop ':'')+body+(fast?' false fast! drop':'')+'. p';
  const r=invoke(source,mode);assert.equal(r.status,0,mode+' '+name+' '+r.stderr);assert.equal(r.output,expected,mode+' '+name+' fast='+fast);passed++;
 }
 const transition=invoke('to p if: fast? then: { "F" out } else: { "N" out }; true fast! drop if: fast? then: { "F" out } else: { "N" out }; false fast! drop if: fast? then: { "F" out } else: { "N" out };. p',mode);
 assert.equal(transition.status,0);assert.equal(transition.output,'NFN');passed++;
 for(const prefix of ['', 'true fast! drop false fast! drop ']){
  const r=invoke('to p '+prefix+'7 with /a /b /{ "BODY" out } "AFTER" out. p',mode);
  assert.notEqual(r.status,0);assert.match(r.output+r.stderr,/Assert failure/);assert.doesNotMatch(r.output,/BODY|AFTER/);passed++;
 }
}
console.log('Parameter frames and optional checks: '+passed+'/'+passed);
