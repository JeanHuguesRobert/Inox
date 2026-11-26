import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createVM } from './toy-runner.js';
import { captureDefinitions, loadDefinitions } from './definition-image.js';
const source=readFileSync(new URL('./lexer.nox',import.meta.url),'utf8');
const image=JSON.parse(readFileSync(new URL('./lexer-image.json',import.meta.url),'utf8'));
const compiler=JSON.parse(readFileSync(new URL('./compiler-image.json',import.meta.url),'utf8'));
const vmNew=()=>{
  const vm=createVM({bootstrapCompiler:false});
  loadDefinitions(vm,compiler);
  loadDefinitions(vm,image);
  vm.lexWithInox=true;
  return vm;
};
test('Inox lexer image loads with no JavaScript compiler bootstrap',()=>{
 const vm=vmNew();
 assert.equal(vm.bootstrapCompiler,false);
 assert.equal(vm.primitiveEntries.has(vm.words.get('to')),false);
 assert.deepEqual(vm.evaluate('to double dup + . to quadruple double double . 21 quadruple'),[84]);
});
test('lexer is written in Inox and capture is deterministic',()=>{
 const vm=createVM();
 vm.evaluate(source);
 assert.deepEqual(captureDefinitions(vm,['scan-token']),image);
});
test('lexical handling whitespace and EOF is done by Inox',()=>{
 const vm=vmNew();
 assert.deepEqual(vm.evaluate('\n\t 12 \t 30 + \n'),[42]);
 assert.deepEqual(vm.evaluate('  '),[42]);
 assert.equal(vm.sourceOffset,2);
});
test('lexer image can be relocated after additional primitives',()=>{
 const vm=createVM({bootstrapCompiler:false});
 vm.primitive('extra',()=>{});
 loadDefinitions(vm,compiler);
 loadDefinitions(vm,image);
 vm.lexWithInox=true;
 assert.deepEqual(vm.evaluate('compile tripled 3 * . 14 tripled'),[42]);
});
test('lexer handles long token and long program without JS lex',()=>{
 const vm=vmNew();
 const original=vm.constructor.lex;
 vm.constructor.lex=()=>{throw new Error('Host lexer must not run');};
 try {
   const token='a'.repeat(256);
   assert.throws(()=>vm.evaluate(token),/undefined entry/);
   const other=vmNew();
   assert.deepEqual(other.evaluate(new Array(200).fill('1').join(' ')+' '+
      new Array(199).fill('+').join(' ')),[200]);
 } finally {vm.constructor.lex=original;}
});
