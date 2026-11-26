import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {VM} from './toy-runner.js';
import {installZeroBrowser} from './zero-browser.js';
import {captureDefinitions,loadDefinitions} from './definition-image.js';
const source=readFileSync(new URL('./browser-fields.nox',import.meta.url),'utf8');
const image=JSON.parse(readFileSync(new URL('./browser-fields-image.json',import.meta.url),'utf8'));
const names=['sensitive-field?','eligible-field','first-field'];
const types=['text','email','search','tel','url','number'];
const b={tag:'input',disabled:false,readonly:false};
const build=installZeroBrowser(new VM(),[]);build.evaluate(source);
test('generalized image reproducible',()=>assert.deepEqual(captureDefinitions(build,names),image));
for(const type of types)test('selection '+type,()=>{
 const fields=[null,{...b,type,autocomplete:'USERNAME'},{...b,type,disabled:true},{...b,type,readonly:true},{...b,type:'password'},{...b,type}];
 for(const list of [[],fields,fields.slice(0,-1),[...Array(79).fill({...b,type,autocomplete:'cc-csc'}),{...b,type}]]){
  const expected=list.findIndex(f=>f?.tag==='input'&&f.type===type&&f.disabled===false&&f.readonly===false&&!/username|password|one-time-code|cc-number|cc-csc/i.test(String(f.autocomplete||'')));
  const vm=installZeroBrowser(new VM(),list);loadDefinitions(vm,image);
  assert.deepEqual(vm.evaluate(JSON.stringify(type)+' first-field'),[expected]);assert.equal(vm.CSP,0);
 }
});
test('generic primitives available without browser',()=>{
 const vm=new VM();assert.deepEqual(vm.evaluate('2 3 over 2 equal? 2 pick 3 < and not'),[2,3,false]);
});
