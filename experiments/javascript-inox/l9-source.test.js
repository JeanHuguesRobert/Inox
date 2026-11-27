/* 2026-11-27: GPT-6 coding agent under Jean Hugues Noel Robert.
 * Execute the actual L9 definitions, not JS substitutes or rewritten copies. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {VM} from './toy-runner.js';
import {captureDefinitions,loadDefinitions} from './definition-image.js';
const root=fileURLToPath(new URL('../..',import.meta.url));
const l9=readFileSync(new URL('../../lib/l9.nox',import.meta.url),'utf8');
const names=['method-text-name','method-name','define-method'];
function extract(name){
 const lines=l9.split('\n'),start=lines.findIndex(line=>line.startsWith('to '+name+' '));
 assert.ok(start>=0,'missing canonical L9 verb '+name);
 let end=start+1;
 while(end<lines.length&&/^[ \t]+\S/.test(lines[end]))end++;
 return lines.slice(start,end).join('\n');
}
const sharedSource=names.map(extract).join('\n')+'\n';
function historical(source){
 const r=spawnSync(process.execPath,['bin/inox.js','-e',source],{
  cwd:root,encoding:'utf8',timeout:9000,
  env:{...process.env,INOX_WITH_L9:'1',INOX_FULL:'0',INOX_L9:'0'}
 });
 assert.equal(r.status,0,r.stdout+r.stderr);
 assert.doesNotMatch(r.stdout+r.stderr,/FATAL|Assert failure|Undefined verb/);
 return r.stdout;
}
function fresh(imageReader){
 const vm=new VM({bootstrapCompiler:!imageReader});
 if(imageReader){
  for(const name of ['compiler-image.json','lexer-image.json'])
   loadDefinitions(vm,JSON.parse(readFileSync(new URL('./'+name,import.meta.url),'utf8')));
  vm.lexWithInox=true;
 }
 return vm;
}
const cases=[
 ['canonical method text name','/integer /twice method-text-name out','integer.twice'],
 ['canonical method tag','/integer /twice method-name out','integer.twice'],
 ['canonical method definition','/integer /triple { 3 * } define-method 7 .triple out','21'],
 ['caller continues','/integer /triple { 3 * } define-method 7 .triple out 9 out','219'],
 ['method redefinition','/integer /triple { 3 * } define-method 7 .triple out /integer /triple { 2 * } define-method 7 .triple out','2114'],
 ['attach','7 { 2 + } attach run out','9'],
 ['attached block reused','7 { 2 + } attach >b $b run out $b run out','99'],
 ['define verb','/dyn { 7 } define-verb /dyn tag.run out','7'],
 ['attach receiver block','7 { it 2 + } { run-with-it } attach run out','9'],
];
for(const [name,body,expected] of cases)test(name,()=>{
 const source='to p '+body+'. p';
 assert.equal(historical(source),expected);
 for(const imageReader of [false,true]){
  const vm=fresh(imageReader),out=[];
  vm.primitive('out',v=>out.push(String(v.pop().value)));
  vm.evaluate(sharedSource+'to l9-end .');
  for(const name of names)assert.ok(vm.words.has(name));
  vm.evaluate(source);
  assert.equal(out.join(''),expected);assert.equal(vm.CSP,0);assert.equal(vm.DSP,0);
  assert.equal(vm.frames.size,0);
 }
});
test('canonical L9 definitions can be captured, relocated and used to define a method',()=>{
 const vm=fresh(false);
 vm.evaluate(sharedSource+'to l9-end .');
 const target=fresh(true);
 loadDefinitions(target,JSON.parse(JSON.stringify(captureDefinitions(vm,names))));
 assert.deepEqual(target.evaluate('to p /integer /triple { 3 * } define-method 7 .triple. p'),[21]);
 assert.throws(()=>captureDefinitions(target,['integer.triple']),/unsupported Cell type runtime-literal/);
 assert.equal(target.CSP,0);
});
