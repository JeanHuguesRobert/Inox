import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {VM} from './toy-runner.js';
import {installZeroBrowser} from './zero-browser.js';
import {captureDefinitions,loadDefinitions} from './definition-image.js';
const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const image=JSON.parse(read('browser-select-field-image.json'));
const build=installZeroBrowser(new VM(),[]);
build.evaluate(read('browser-select-field.nox'));
test('select-field image reproducible',()=>assert.deepEqual(captureDefinitions(build,['sensitive-field?','eligible-input?','select-field','plan-text-edit']),image));
const plain={tag:'input',type:'text',disabled:false,readonly:false};
function select(fields,type='text',selection='unique'){
 const vm=installZeroBrowser(new VM({maxSteps:100000}),fields);
 loadDefinitions(vm,image);
 const result=vm.evaluate(JSON.stringify(type)+' '+JSON.stringify(selection)+' select-field');
 assert.equal(vm.CSP,0);assert.equal(vm.frames.size,0);assert.equal(result.length,1);
 return {index:result[0],steps:vm.steps};
}
test('unique, missing, and ambiguous selections, including maximum field count',()=>{
 const rejected={...plain,autocomplete:'USERNAME'};
 for(const [fields,index] of [
  [[], -1], [[null,{},rejected],-1],
  [[rejected,{...plain,disabled:true},{...plain,readonly:true},plain],3],
  [[plain,plain],-2],
  [[plain,...Array(79).fill(rejected)],0],
  [[...Array(79).fill(rejected),plain],79],
  [[plain,...Array(78).fill(rejected),plain],-2],
  [[...Array(80).fill(rejected)],-1],
 ])assert.equal(select(fields).index,index);
});
test('strict metadata and no field values enter the native object',()=>{
 const vm=installZeroBrowser(new VM(),[{...plain,value:'not-projected',other:'not-projected'}]);
 vm.evaluate('0 field.object');
 const names=vm.peek().value.fields.map(x=>x.name);
 assert.deepEqual(names,['tag','type','disabled','readonly']);
 assert.throws(()=>select([{...plain,autocomplete:{}}]),/invalid field metadata/);
 assert.equal(select([{...plain,disabled:0}]).index,-1);
});
test('compiled behavior agrees with reference across deterministic mixed observations',()=>{
 let seed=73;const next=n=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)%n);
 for(const type of ['text','email','search','tel','url','number']){
  for(let i=0;i<20;i++){
   const fields=Array.from({length:next(81)},()=>next(6)===0?null:{
    tag:next(4)===0?'textarea':'input',type:next(3)===0?'password':type,
    disabled:next(4)===0,readonly:next(4)===0,
    autocomplete:['','username','CC-CSC','off',undefined][next(5)]
   });
   const hits=fields.flatMap((f,i)=>f?.tag==='input'&&f.type===type&&f.disabled===false&&f.readonly===false&&!/username|password|one-time-code|cc-number|cc-csc/i.test(String(f.autocomplete||''))?[i]:[]);
   assert.equal(select(fields,type).index,hits.length>1?-2:hits[0]??-1);
   assert.equal(select(fields,type,'first').index,hits[0]??-1);
  }
 }
});


test('source and image agree in both selection policies; historical first-text cases',()=>{
 const b={...plain,autocomplete:''};
 const cases=[[],[b],[{...b,autocomplete:'username'},b],
  [{...b,disabled:true},{...b,readonly:true},b],
  [{...b,type:'email'},b],[{...b,tag:'textarea'}],[null,b],
  [{...b,disabled:undefined},b],Array(80).fill({...b,autocomplete:'one-time-code'}),
  [...Array(79).fill({...b,autocomplete:'cc-csc'}),b],[b,b]];
 const expected=[-1,0,1,2,1,-1,1,1,-1,79,0];
 for(const [i,fields] of cases.entries()){
  const vm=installZeroBrowser(new VM(),fields);vm.evaluate(read('browser-select-field.nox'));
  assert.deepEqual(vm.evaluate('"text" "first" select-field'),[expected[i]]);
  assert.equal(select(fields,'text','first').index,expected[i]);
  assert.equal(vm.CSP,0);
 }
});
test('missing host imports reject before mutation',()=>{
 const vm=new VM(),before=vm.cells.length;
 assert.throws(()=>loadDefinitions(vm,image),/missing primitive import/);
 assert.equal(vm.cells.length,before);
});
test('generic comparisons remain available without browser',()=>{
 const vm=new VM();assert.deepEqual(vm.evaluate('2 3 over 2 equal? 2 pick 3 < and not'),[2,3,false]);
});

test('one native edit intent for both operations and all selection outcomes',()=>{
 for(const operation of ['replace-all','insert-at-selection']){
  for(const [fields,index] of [[[], -1],[[plain],0],[[plain,plain],-2]]){
   const vm=installZeroBrowser(new VM(),fields);loadDefinitions(vm,image);
   const [intent]=vm.evaluate('"text" "unique" '+JSON.stringify(operation)+' plan-text-edit');
   assert.equal(intent.klass,'text-edit');
   assert.deepEqual(Object.fromEntries(intent.fields.map(c=>[c.name,c.value])),{operation,index});
   assert.equal(vm.CSP,0);assert.equal(vm.frames.size,0);
  }
 }
});
