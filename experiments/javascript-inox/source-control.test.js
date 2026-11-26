import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {VM} from './toy-runner.js';
import {captureDefinitions,loadDefinitions} from './definition-image.js';
const root=fileURLToPath(new URL('../..',import.meta.url));
const compiler=JSON.parse(readFileSync(new URL('./compiler-image.json',import.meta.url),'utf8'));
const lexer=JSON.parse(readFileSync(new URL('./lexer-image.json',import.meta.url),'utf8'));
const cases=[
 ['precondition','0 while: { dup 3 < } do: { 1 + };','3'],
 ['zero iterations','4 while: { dup 3 < } do: { 1 + };','4'],
 ['postcondition','0 do: { 1 + } while: { dup 3 < };','3'],
 ['postcondition false','0 do: { 1 + } while: { dup 0 < };','1'],
 ['until','0 do: { 1 + } until: { dup 3 equal? };','3'],
 ['break-if','0 while: { dup 10 < } do: { dup 3 equal? break-if 1 + };','3'],
 ['break','0 while: { dup 10 < } do: { 1 + break };','1'],
 ['conditional true','3 true { 2 + } if','5'],
 ['conditional false','3 false { 2 + } if','3'],
 ['prefix if true','3 if: dup 4 < then: { 2 + };','5'],
 ['prefix if false','3 if: dup 2 < then: { 2 + };','3'],
 ['prefix if else true','3 if: dup 4 < then: { 2 + } else: { 1 + };','5'],
 ['prefix if else false','3 if: dup 2 < then: { 2 + } else: { 1 + };','4'],
 ['nested conditional','3 if: dup 4 < then: { if: dup 3 equal? then: { 2 + } else: { 7 + }; } else: { 1 + };','5'],
 ['conditional inside loop','0 while: { dup 10 < } do: { if: dup 3 equal? then: { break }; 1 + };','3'],
 ['nested','0 while: { dup 3 < } do: { 0 while: { dup 5 < } do: { dup 2 equal? break-if 1 + }; drop 1 + };','3'],
 ['resume after loop','0 while: { dup 3 < } do: { 1 + }; 2 +','5'],
 ['bounded control stack','0 while: { dup 1000 < } do: { 1 + };','1000']
];
function historical(source){
 const r=spawnSync(process.execPath,['bin/inox.js','-e',source],{cwd:root,encoding:'utf8',timeout:8000,env:{...process.env,INOX_WITH_L9:'0',INOX_FULL:'0',INOX_L9:'0'}});
 assert.equal(r.status,0,r.error?.message||r.stderr||r.stdout);
 assert.doesNotMatch(r.stdout+r.stderr,/FATAL|Assert failure|Undefined verb|premature end/);
 assert.ok(r.stdout.startsWith('cli-stdlib.nox (basic old-school) loaded'));
 return r.stdout.slice('cli-stdlib.nox (basic old-school) loaded'.length);
}
function fresh(imageReader=false){
 const vm=new VM({bootstrapCompiler:!imageReader});
 if(imageReader){loadDefinitions(vm,compiler);loadDefinitions(vm,lexer);vm.lexWithInox=true;}
 return vm;
}
for(const [name,body,expected] of cases)test('same source: '+name,()=>{
 // Exact same source including output word; output is a test host primitive.
 const source='to p '+body+' out. p';
 assert.equal(historical(source),expected);
 for(const imageReader of [false,true]){
  const vm=fresh(imageReader),output=[];
  vm.primitive('out',v=>output.push(String(v.pop().value)));
  let maxDepth=0;
  const alloc=vm.alloc.bind(vm);
  vm.alloc=cell=>{maxDepth=Math.max(maxDepth,vm.CSP);return alloc(cell);};
  vm.evaluate(source);
  assert.equal(output.join(''),expected);assert.equal(vm.CSP,0);assert.equal(vm.DSP,0);assert.ok(maxDepth<=4);
  const target=fresh(),replay=[];
  target.primitive('out',v=>replay.push(String(v.pop().value)));
  loadDefinitions(target,JSON.parse(JSON.stringify(captureDefinitions(vm,['p']))));
  target.invoke('p');assert.equal(replay.join(''),expected);
 }
});
test('malformed structured source does not publish definition',()=>{
 for(const source of ['to p break-if .','to p 0 while: { true } do: { 1 + } .','to p true { 1 } unknown .','to p 0 do: { 1 + } bogus .','to p if: true then: { 1 } else: { 2 } .','to p if: true then: { 1 } unknown .']){
  const vm=fresh();assert.throws(()=>vm.evaluate(source));assert.equal(vm.words.has('p'),false);assert.equal(vm.CSP,0);assert.equal(vm.IP,null);
 }
});
