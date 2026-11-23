import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {createVM} from './toy-runner.js';
import {loadDefinitions,captureDefinitions} from './definition-image.js';
const lexImage=JSON.parse(readFileSync(new URL('./lexer-image.json',import.meta.url),'utf8'));
const cmpImage=JSON.parse(readFileSync(new URL('./compiler-image.json',import.meta.url),'utf8'));
function fresh() {
 const vm=createVM({bootstrapCompiler:false});
 loadDefinitions(vm,cmpImage);
 loadDefinitions(vm,lexImage);
 vm.lexWithInox=true;
 return vm;
}
test('lexer source is compiled in Inox to deterministic image',()=>{
 const build=createVM();build.evaluate(readFileSync(new URL('./lexer.nox',import.meta.url),'utf8'));
 assert.deepEqual(captureDefinitions(build,['scan-token']),lexImage);
});
test('quoted string containing spaces remains a single token',()=>{
 const vm=fresh();
 assert.deepEqual(vm.evaluate('"hello world"'),['hello world']);
 assert.deepEqual(vm.evaluate('compile identity dup . "hello world" identity'),['hello world','hello world','hello world']);
});
test('escaped double quote and backslash survive lexer and JSON literal decoding',()=>{
 const vm=fresh();
 assert.deepEqual(vm.evaluate(String.raw`"a \"quoted\" string and \\ slash"`),['a "quoted" string and \\ slash']);
});
test('incomplete quoted source throws a lexical error',()=>{
 const vm=fresh();
 assert.throws(()=>vm.evaluate('"hello world'),/unterminated string literal/);
 assert.throws(()=>vm.evaluate('"hello'+String.fromCharCode(92)),/unterminated string literal/);
});
test('non-quoted source keeps existing word, whitespace and number behavior',()=>{
 const vm=fresh();
 assert.deepEqual(vm.evaluate('   20\n22 +  '),[42]);
});
test('lexer can run with historical JS lex replaced by a failing stub',()=>{
 const vm=fresh();
 const orig=vm.constructor.lex;
 vm.constructor.lex=()=>{throw new Error('JS lex forbidden');};
 try {assert.deepEqual(vm.evaluate(' "hello world"'),['hello world']);}
 finally {vm.constructor.lex=orig;}
});

test('VM is reusable after lexical error and control stack is cleared',()=>{
 const vm=fresh();
 assert.throws(()=>vm.evaluate('"unfinished'),/unterminated string literal/);
 assert.equal(vm.IP,null);
 assert.equal(vm.CSP,0);
 assert.deepEqual(vm.evaluate('21 21 +'),[42]);
});
