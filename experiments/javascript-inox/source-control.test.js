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
 ['bounded control stack','0 while: { dup 1000 < } do: { 1 + };','1000'],
 ['block invocation','{ 7 } run','7'],
 ['nested block','{ { 7 } } run run','7'],
 ['block reused','{ 2 + } dup 3 swap run swap run','7'],
 ['local read','7 >x $x','7'],
 ['postfix local read','7 >x x>','7'],
 ['block reads caller local','7 >x { $x } run','7'],
 ['block updates caller local','7 >x { 8 >x! } run $x','8'],
 ['block local shadows','7 >x { 8 >x $x out } run $x','87'],
 ['conditional local shadows','7 >x if: true then: { 8 >x $x out }; $x','87'],
 ['postfix conditional local shadows','7 >x true { 8 >x $x out } if $x','87'],
 ['with-it explicit','7 { it } run-with-it','7'],
 ['target block','7 >{ it }','7'],
 ['target local read','7 >{ $it }','7'],
 ['target update','7 >{ 9 it! it }','9'],
 ['nested target restoration','7 >{ it out 8 >{ it out } it }','787'],
 ['resume after target block','7 >{ it out } 9','79'],
 ['target scope inside conditional','7 true { >{ it } } if','7'],
 ['named parameters','7 8 with /left /right /{ $left out $right out } 9','789'],
 ['named parameters suffix','7 8 with a/ b/ /{ $a out $b out } 9','789'],
 ['explicit sentinel and invocation','7 8 /with /a /b { $a out $b out } run-with-parameters 9','789'],
 ['empty parameter list','with /{ 7 out } 9','79'],
 ['single parameter','7 with /x /{ $x }','7'],
 ['three parameters','1 2 3 with /x /y /z /{ $x out $y out $z out } 9','1239'],
 ['nested parameters','7 with /a /{ $a out 8 with /a /{ $a out } $a out } 9','7879'],
 ['duplicate parameter shadow','7 8 with /x /x /{ $x out } 9','89'],
 ['parameter update','7 with /a /{ 9 >a! $a out } 8','98'],
 ['parameter text values','"left" "right" with /first /second /{ $first out $second out } "!"','leftright!'],
 ['preserve caller data','4 7 8 with /a /b /{ $a $b + } +','19'],
 ['parameters inside conditional','7 true { with /a /{ $a } } if','7'],
 ['eleven parameters','1 2 3 4 5 6 7 8 9 10 11 with /a /b /c /d /e /f /g /h /i /j /k /{ $a $k + }','12'],
 ['primitive via tag','7 /dup run +','14'],
 ['primitive via tag.run','7 /dup tag.run +','14'],
 ['primitive via text.run','7 "dup" text.run +','14'],
 ['primitive via as-tag','7 "dup" as-tag tag.run +','14'],
 ['primitive via as-verb','7 /dup as-verb run +','14'],
 ['primitive via tag.to-verb','7 /dup tag.to-verb run +','14'],
 ['missing tag no-op','/missing-test-verb tag.run 9','9'],
 ['missing run tag no-op','/missing-test-verb run 9','9'],
 ['missing as-verb void','/missing-test-verb as-verb run drop 9','9'],
 ['missing tag.to-verb void','/missing-test-verb tag.to-verb run drop 9','9'],
 ['missing text.as-verb noop','"missing-test-verb" text.as-verb run 9','9'],
 ['verb.run retains handle','7 /dup as-verb verb.run drop drop drop 9','9'],
 ['stored block conditional','3 { 2 + } >b true $b if','5'],
 ['nested scope break','7 >x 0 while: { dup 3 < } do: { 8 >x if: true then: { 9 >x break }; 1 + }; drop $x','7'],
 ['stored block reused','{ 7 out } >b $b run $b run 0','770'],
 ['loop locals unwind on break','7 >x 0 while: { dup 3 < } do: { 8 >x break }; drop $x','7']
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
  assert.equal(output.join(''),expected);assert.equal(vm.CSP,0);assert.equal(vm.DSP,0);assert.ok(maxDepth<=5);assert.equal(vm.frames.size,0);
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

test('escaped block resolves local at invocation, not definition, including relocated image',()=>{
 const source='to maker 7 >x { $x }. to p 9 >x maker run out. p';
 assert.equal(historical(source),'9');
 for(const imageReader of [false,true]){
  const vm=fresh(imageReader),output=[];
  vm.primitive('out',v=>output.push(String(v.pop().value)));
  vm.evaluate(source);
  assert.deepEqual(output,['9']);assert.equal(vm.frames.size,0);
  const target=fresh(),replay=[];
  target.primitive('out',v=>replay.push(String(v.pop().value)));
  loadDefinitions(target,JSON.parse(JSON.stringify(captureDefinitions(vm,['maker','p']))));
  target.invoke('p');assert.deepEqual(replay,['9']);assert.equal(target.frames.size,0);
 }
});
test('local scope and call frames are cleaned after a failed invocation',()=>{
 const vm=fresh();vm.evaluate('to p 7 >x { $missing } run.');
 assert.throws(()=>vm.invoke('p'),/undefined local/);
 assert.equal(vm.frames.size,0);assert.equal(vm.CSP,0);
 assert.deepEqual(vm.evaluate('to q 9 >x $x. q'),[9]);
});

test('invalid parameter calls do not enter body or leave frames',()=>{
 for(const [body,error] of [
  ['7 with /a /b /{ 99 out }',/insufficient actual arguments/],
  ['7 /a /{ 99 out }',/missing with sentinel|expected formal/],
  ['7 with 8 /{ 99 out }',/expected formal/],
 ]){
  const vm=fresh(),output=[];
  vm.primitive('out',v=>output.push(v.pop().value));
  vm.evaluate('to p '+body+' .');
  assert.throws(()=>vm.invoke('p'),error);
  assert.deepEqual(output,[]);assert.equal(vm.CSP,0);assert.equal(vm.frames.size,0);
 }
});

test('dynamic invocation resolves current or captured definition, including relocated caller',()=>{
 const cases=[
  ['to foo.bar 7 . to p /foo.bar run out. p','7'],
  ['to q 7 . to save /q as-verb. save to q 8 . to p run out. p','8'],
  ['to q 7 . to save /q tag.to-verb. save to q 8 . to p run out. p','7'],
  ['to q 7 . to p /q as-verb verb.run out drop 9 out. p','79'],
  ['to q 7 . to p /q tag.to-verb >v $v run out. p','7'],
 ];
 for(const [source,expected] of cases){
  assert.equal(historical(source),expected);
  for(const imageReader of [false,true]){
   const vm=fresh(imageReader),output=[];
   vm.primitive('out',v=>output.push(String(v.pop().value)));
   vm.evaluate(source);assert.equal(output.join(''),expected);
   assert.equal(vm.CSP,0);assert.equal(vm.DSP,0);assert.equal(vm.frames.size,0);
  }
 }
 const source='to q 7 . to p /q run out.';
 const vm=fresh();vm.primitive('out',v=>v.pop());vm.evaluate(source);
 const target=fresh(),output=[];
 target.primitive('out',v=>output.push(v.pop().value));
 // The caller image uses a symbolic name; its callee is provided by target.
 target.evaluate('to q 8 .');
 loadDefinitions(target,JSON.parse(JSON.stringify(captureDefinitions(vm,['p']))));
 target.invoke('p');assert.deepEqual(output,[8]);
 assert.equal(target.CSP,0);assert.equal(target.DSP,0);
});
