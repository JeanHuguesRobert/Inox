/* 2026-11-27: GPT-6 coding agent under Jean Hugues Noel Robert.
 * Execute the actual L9 definitions, not JS substitutes or rewritten copies. */
import {test} from 'node:test';
import {cases as objectCoreCases} from '../../scripts/test-l9-object-core.js';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {VM} from './toy-runner.js';
import {captureDefinitions,loadDefinitions} from './definition-image.js';
const root=fileURLToPath(new URL('../..',import.meta.url));
const l9=readFileSync(new URL('../../lib/l9.nox',import.meta.url),'utf8');
const names=['method-text-name','method-name','define-method','it-method{','attribute','drop-with','with-length','with-length{','make{'];
function extract(name){
 const lines=l9.split('\n'),start=lines.findIndex(line=>line==='to '+name||line.startsWith('to '+name+' '));
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
 ['canonical receiver method','/integer >it triple/it-method{ it 3 * } 7 .triple out it out','21integer'],
 ['receiver method reused','/integer >it triple/it-method{ it 3 * } 7 .triple out 8 .triple out','2124'],
 ['canonical attribute getter setter','/sample >it /value attribute 3 :value 2 :sample make.object >o $o .value out 8 $o .value! $o .value out','38'],
 ['object reference sharing','/sample >it /value attribute 3 :value 2 :sample make.object >o $o >alias 8 $alias .value! $o .value out','8'],
 ['object instance isolation','/sample >it /value attribute 3 :value 2 :sample make.object >a 9 :value 2 :sample make.object >b 8 $a .value! $a .value out $b .value out','89'],
 ['named field lookup','3 :value 2 :sample make.object >o /value $o object.?@ out','3'],
 ['object class versus Cell name','3 :value 2 :sample make.object >o $o name-of out $o class-of out','osample'],
 ['local name preserved on update','3 :a >x 4 :b >x! $x name-of out','x'],
 ['local name on postfix read','3 :a >x x> name-of out','x'],
 ['two fields','3 :first 4 :second 3 :sample make.object >o $o /first object.@ out $o /second object.@ out','34'],
 ['canonical make','/sample >it /value attribute sample/make{ 3 :value } >o $o .value out 8 $o .value! $o .value out','38'],
 ['make preserves caller data','99 sample/make{ 3 :value } >o $o /value object.@ out out','399'],
 ['independent maker instances','sample/make{ 3 :value } >a sample/make{ 4 :value } >b $a /value object.@ out $b /value object.@ out','34'],
 ['nested construction','sample/make{ 3 :first other/make{ 8 :v } :child } >o $o /child object.@ /v object.@ out','8'],
 ['empty object class','sample/make{ } class-of out','sample'],
 ['extend preserves aliases','3 :value 2 :sample make.object >a $a >b $a extend-object 8 $b /value object.! $a /value object.@ out','8'],
 ['repeat extend preserves fields','sample/make{ 1 :a 2 :b 3 :c 4 :d } >o $o extend-object $o /d object.@ out','4'],
 ['extend then grow','sample/make{ 1 :a 2 :b 3 :c 4 :d } >o $o stack.length out $o 9 :extra stack.push $o /extra object.@ out $o /a object.@ out','491'],
 ['alias observes grown object','sample/make{ 1 :a 2 :b 3 :c 4 :d } >o $o >alias $o 9 :extra stack.push 8 $alias /extra object.! $o /extra object.@ out $o /a object.@ out','81'],
 ['grow empty object','0 :sample make.extensible-object >o $o 7 :value stack.push $o 9 :extra stack.push $o stack.length out $o /extra object.@ out','29'],
 ['modify grown object','0 :sample make.extensible-object >o $o 7 :value stack.push $o 9 :extra stack.push 8 $o /extra object.! $o /extra object.@ out','8'],
 ['control data save','4 >control 7 control> out out','47'],
 ['with-length preserves fields','with 1 2 with-length out drop drop drop','3'],
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

test('fixed objects retain Cell names, identity and optional missing values',()=>{
 const vm=fresh(false);
 vm.evaluate('to p 3 :value 2 :sample make.object >o $o /missing object.@. ');
 assert.throws(()=>vm.invoke('p'),/Object variable not found/);
 assert.equal(vm.CSP,0);
 assert.deepEqual(vm.evaluate('to q 3 :value 2 :sample make.object >o /missing $o object.?@. q'),[null]);
 assert.equal(vm.peek().type,'void');
});


// Reuse the actual registry initializer and inheritance algorithm.
// A small fixture registers metaclasses directly; it does not replace
// the still-unported class{ declaration/update protocol.
const registryNames=['map[]','classes.get','resolve-method-name','understand?','thing.understand?','make.metaclass','thing','map'];
const registryDeclaration=l9.split('\n').find(line=>line.startsWith('global: classes/'));
assert.ok(registryDeclaration);
function loadRegistry(vm){
 vm.evaluate(extract('map[]')+'\nto l9-map-end .');
 vm.evaluate(registryDeclaration);
 vm.evaluate(sharedSource+registryNames.slice(1).map(extract).join('\n')+'\nto l9-registry-end .');
}
const parentChild='/parent make.metaclass drop /child make.metaclass >m /parent $m /superclass-name object.! ';
const parentMethod='/parent >it ping/it-method{ 7 } ';
const registryCases=[
 ['inherited dispatch',parentChild+parentMethod+'child/make{ } .ping out','7'],
 ['inherited method name',parentChild+parentMethod+'/child /ping resolve-method-name out','parent.ping'],
 ['override',parentChild+parentMethod+'/child >it ping/it-method{ 8 } child/make{ } .ping out parent/make{ } .ping out','87'],
 ['two-level inheritance',parentChild+'/grand make.metaclass >m /child $m /superclass-name object.! '+parentMethod+'grand/make{ } .ping out','7'],
 ['redefinition after cache clear',parentChild+parentMethod+'child/make{ } .ping out ping/it-method{ 8 } /parent /all clear-method-cache child/make{ } .ping out','78'],
 ['metaclass rebuild preserves parent',parentChild+'/child make.metaclass /superclass-name object.@ out','parent'],
 ['reflection on inherited method',parentChild+parentMethod+'if: /ping child/make{ } .understand? then: { 1 } else: { 0 }; out','1'],
 ['reflection on absent method','/parent make.metaclass drop if: /unknown parent/make{ } .understand? then: { 1 } else: { 0 }; out','0'],
 ['inherited attribute',parentChild+'/parent >it /value attribute child/make{ 3 :value } >o $o .value out 8 $o .value! $o .value out','38'],
 ['inherited dispatch resumes caller',parentChild+parentMethod+'child/make{ } .ping out 9 out','79'],
];
for(const [name,body,expected] of registryCases)test('L9 '+name,()=>{
 const source='to p '+body+'. p';
 assert.equal(historical(source),expected);
 for(const reader of [false,true]){
  const vm=fresh(reader),out=[];
  vm.primitive('out',v=>out.push(String(v.pop().value)));
  loadRegistry(vm);
  vm.evaluate(source);
  assert.equal(out.join(''),expected);
  assert.equal(vm.CSP,0);assert.equal(vm.DSP,0);assert.equal(vm.frames.size,0);
 }
});
test('L9 registry definition images relocate, registry state initialized separately',()=>{
 const vm=fresh(false);loadRegistry(vm);
 const target=fresh(true);
 loadDefinitions(target,JSON.parse(JSON.stringify(captureDefinitions(vm,['map[]']))));
 target.evaluate(registryDeclaration);
 loadDefinitions(target,JSON.parse(JSON.stringify(captureDefinitions(vm,[...names,...registryNames.slice(1)]))));
 const out=[];target.primitive('out',v=>out.push(String(v.pop().value)));
 target.evaluate('to p '+parentChild+parentMethod+'child/make{ } .ping out. p');
 assert.deepEqual(out,['7']);assert.equal(target.CSP,0);assert.equal(target.DSP,0);
});
test('global declaration and update use native Cells',()=>{
 const source='global: demo-global/ is: 7; to p demo-global out 8 demo-global! demo-global out. p';
 assert.equal(historical(source),'78');
 for(const reader of [false,true]){
  const vm=fresh(reader),out=[];
  vm.primitive('out',v=>out.push(String(v.pop().value)));
  vm.evaluate(source);
  assert.deepEqual(out,['7','8']);assert.equal(vm.CSP,0);assert.equal(vm.DSP,0);
 }
});
test('L9 missing inherited method remains observable',()=>{
 const vm=fresh(false);loadRegistry(vm);
 vm.evaluate('to p /parent make.metaclass drop parent/make{ } .absent 99.');
 assert.throws(()=>vm.invoke('p'),/missing-method parent.absent/);
 assert.equal(vm.CSP,0);assert.equal(vm.frames.size,0);
 assert.ok(!vm.values().includes(99));
});


// Use the actual class declarations, including canonical initialization.
const classNames=['update-classes','update-all-classes','update-class','extend-class{',
 'class{','superclass','class-method{','method{','getter','setter','initialize-classes'];
function loadClasses(vm){
 loadRegistry(vm);
 vm.evaluate(classNames.map(extract).join('\n')+'\nto l9-class-end .');
 vm.invoke('initialize-classes');
 assert.equal(vm.DSP,0);assert.equal(vm.CSP,0);
}
// The source suite is shared with the historical CLI. Explicitly keep
// unported contracts visible, not silently drop them.
const deferredCoreCases=new Map([
 ['primitive integer method reflection','stdlib class extensions not yet loaded'],
 ['primitive text method reflection','stdlib class extensions not yet loaded'],
 ['optional missing lookup in fast mode','no fast! mode in experiment'],
 ['method lookup keeps caller control depth','absolute packed control depth is representation-specific'],
 ['repeated inherited dispatch remains iterative','from: range syntax not yet ported'],
]);
for(const [name,source,expected] of objectCoreCases){
 test('shared object core: '+name,{skip:deferredCoreCases.get(name)},()=>{
  for(const reader of [false,true]){
   const vm=fresh(reader),out=[];
   vm.primitive('out',v=>{
    const cell=v.pop();
    out.push(cell.type==='void'?'':typeof cell.value==='boolean'?(cell.value?'1':''):String(cell.value));
   });
   loadClasses(vm);
   vm.evaluate(source);
   assert.equal(out.join(''),expected);
   assert.equal(vm.CSP,0);
   // These two historical methods deliberately leave the receiver.
   const remainder=['instance class identity','class-method dispatch'].includes(name)?1:0;
   assert.equal(vm.DSP,remainder);assert.equal(vm.frames.size,0);
  }
 });
}
test('shared object core: missing method prevents following code',()=>{
 const vm=fresh(false),out=[];
 vm.primitive('out',v=>out.push(String(v.pop().value)));
 loadClasses(vm);
 vm.evaluate('to t aa_parent/class{ thing/superclass } aa_child/class{ aa_parent/superclass } aa_child/make{ } .not-found "AFTER" out.');
 assert.throws(()=>vm.invoke('t'),/missing-method aa_child.not-found/);
 assert.deepEqual(out,[]);assert.equal(vm.CSP,0);
});

test('attach executes symbolic and bound captured verbs as historical threaded code',()=>{
 for(const conversion of ['as-verb','tag.to-verb']){
  const source='to q 7. to p /q '+conversion+' { 2 + } attach run out. p';
  assert.equal(historical(source),'9');
  for(const reader of [false,true]){
   const vm=fresh(reader),out=[];
   vm.primitive('out',v=>out.push(v.pop().value));
   vm.evaluate(source);
   assert.deepEqual(out,[9]);assert.equal(vm.CSP,0);assert.equal(vm.DSP,0);
  }
 }
});
test('initialized class definitions relocate and execute without a host class registry',()=>{
 const vm=fresh(false);vm.primitive('out',v=>v.pop());loadClasses(vm);
 const target=fresh(true),out=[];
 target.primitive('out',v=>out.push(String(v.pop().value)));
 loadDefinitions(target,JSON.parse(JSON.stringify(captureDefinitions(vm,['map[]']))));
 target.evaluate(registryDeclaration);
 loadDefinitions(target,JSON.parse(JSON.stringify(captureDefinitions(vm,[...names,...registryNames.slice(1),...classNames]))));
 target.invoke('initialize-classes');
 target.evaluate('to p aa_parent/class{ thing/superclass ping/it-method{ 7 } } aa_child/class{ aa_parent/superclass } aa_child/make{ } .ping out. p');
 assert.deepEqual(out,['7']);assert.equal(target.CSP,0);assert.equal(target.DSP,0);
});
test('class dispatch preserves control depth and repeats without host recursion',()=>{
 const vm=fresh(false),out=[];
 vm.primitive('out',v=>out.push(v.pop().value));loadClasses(vm);
 const source='to work aa_parent/class{ thing/superclass ping/it-method{ 42 } } aa_child/class{ aa_parent/superclass } 0 >count while: { $count 200 < } do: { aa_child/make{ } .ping drop $count 1 + >count! }; $count out. to t control-depth out work control-depth out. t';
 vm.evaluate(source);
 assert.equal(out[0],out[2]);assert.equal(out[1],200);
 assert.equal(vm.CSP,0);assert.equal(vm.DSP,0);
});
