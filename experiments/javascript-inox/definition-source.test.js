import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {createVM} from './toy-runner.js';
import {captureDefinitions, loadDefinitions, FORMAT} from './definition-image.js';
import {definitionImageToInox} from './definition-source.js';

const compiler = JSON.parse(readFileSync(new URL('./compiler-image.json', import.meta.url), 'utf8'));
const lexer = JSON.parse(readFileSync(new URL('./lexer-image.json', import.meta.url), 'utf8'));
function target() {
 const vm=createVM({bootstrapCompiler:false});
 loadDefinitions(vm, compiler);
 loadDefinitions(vm, lexer);
 vm.lexWithInox = true;
 return vm;
}
test('compiler-image itself round trips through minimal Inox source',()=>{
 const src=definitionImageToInox(compiler);
 const vm=target();
 vm.evaluate(src);
 assert.deepEqual(captureDefinitions(vm,['compile']),compiler);
 assert.deepEqual(vm.evaluate('compile double dup + . 21 double'),[42]);
});
test('lexer-image itself round trips through minimal Inox source',()=>{
 const src=definitionImageToInox(lexer);
 const vm=target();
 vm.evaluate(src);
 assert.deepEqual(captureDefinitions(vm,['scan-token']),lexer);
 assert.deepEqual(vm.evaluate('"hello world"'),['hello world']);
});
test('named scalar cells survive source compilation, image loading and reassembly',()=>{
 const vm=target();
 vm.evaluate('compile named x:21 x:2 true null .');
 const image=captureDefinitions(vm,['named']);
 assert.deepEqual(image.definitions[0].cells.slice(0,2),[
  {type:'literal',value:21,name:'x'},
  {type:'literal',value:2,name:'x'}
 ]);
 const vm2=target();loadDefinitions(vm2,JSON.parse(JSON.stringify(image)));
 vm2.evaluate('named');
 assert.equal(vm2.cells[vm2.data[0]].name,'x');
 assert.equal(vm2.cells[vm2.data[1]].name,'x');
 assert.deepEqual(vm2.values(),[21,2,true,null]);
 const vm3=target();vm3.evaluate(definitionImageToInox(image));
 assert.deepEqual(captureDefinitions(vm3,['named']),image);
});
test('dependency sorter emits callees before callers and refuses cyclic definitions',()=>{
 const image={format:FORMAT,definitions:[
  {name:'first',cells:[{type:'verb',name:'second'}]},
  {name:'second',cells:[{type:'literal',value:42}]}
 ]};
 assert.equal(definitionImageToInox(image),'compile second 42 .\ncompile first second .\n');
 const vm=target();
 vm.evaluate(definitionImageToInox(image));
 assert.deepEqual(vm.evaluate('first'),[42]);
 assert.throws(()=>definitionImageToInox({format:FORMAT,definitions:[
  {name:'a',cells:[{type:'verb',name:'b'}]},
  {name:'b',cells:[{type:'verb',name:'a'}]}
 ]}),/cyclic definition/);
});
test('quoted scalars, exponents and empty verb are lossless',()=>{
 const vm=target();
 vm.evaluate('compile greeting "hello world" "\\\"quote\\\"" 1e+21 1e-12 . compile noop .');
 const image=captureDefinitions(vm,['greeting','noop']);
 const vm2=target();
 vm2.evaluate(definitionImageToInox(image));
 assert.deepEqual(captureDefinitions(vm2,['greeting','noop']),image);
 assert.deepEqual(vm2.evaluate('greeting'),['hello world','"quote"',1e21,1e-12]);
});
test('reject rather than corrupt unsupported named strings and nonportable scalars',()=>{
 assert.throws(()=>definitionImageToInox({format:FORMAT,definitions:[
  {name:'x',cells:[{type:'literal',name:'msg',value:'hello world'}]}
 ]}),/named text with whitespace/);
 assert.throws(()=>definitionImageToInox({format:FORMAT,definitions:[
  {name:'x',cells:[{type:'literal',value:-0}]}
 ]}),/not losslessly representable/);
});

test('image capture refuses negative zero before JSON serialization erases its sign',()=>{
 const vm=target();
 const entry=vm.cells.length;
 vm.alloc({name:'',type:'literal',value:-0});
 vm.alloc({name:'',type:'return',value:null});
 vm.words.set('negative-zero',entry);
 assert.throws(()=>captureDefinitions(vm,['negative-zero']),/nonportable literal/);
});
test('invalid literal Cell names are rejected before image load mutates VM',()=>{
 const vm=target();
 const length=vm.cells.length;
 const image={format:FORMAT,definitions:[{name:'bad',cells:[
  {type:'literal',name:'bad name',value:12}
 ]}]};
 assert.throws(()=>loadDefinitions(vm,image),/invalid literal Cell name/);
 assert.equal(vm.cells.length,length);
 assert.equal(vm.words.has('bad'),false);
});
