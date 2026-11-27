import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {VM} from './toy-runner.js';
import {installZeroBrowser} from './zero-browser.js';
import {captureDefinitions,loadDefinitions} from './definition-image.js';
const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const base=JSON.parse(read('browser-fields-image.json'));
const image=JSON.parse(read('browser-unique-field-image.json'));
const build=installZeroBrowser(new VM(),[]);
loadDefinitions(build,base);
build.evaluate(read('browser-unique-field.nox'));
test('unique-field image reproducible',()=>assert.deepEqual(captureDefinitions(build,['eligible-input?','unique-field']),image));
const plain={tag:'input',type:'text',disabled:false,readonly:false};
function select(fields,type='text'){
 const vm=installZeroBrowser(new VM({maxSteps:100000}),fields);
 loadDefinitions(vm,base);loadDefinitions(vm,image);
 const result=vm.evaluate(JSON.stringify(type)+' unique-field');
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
  }
 }
});
