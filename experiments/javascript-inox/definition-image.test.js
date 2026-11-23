import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createVM } from './toy-runner.js';
import { captureDefinitions, loadDefinitions, FORMAT } from './definition-image.js';

test('compiled Cells relocate to a fresh VM without serializing JavaScript functions', () => {
  const build = createVM();
  build.evaluate('to double dup + . to quadruple double double .');
  const image = captureDefinitions(build, ['double', 'quadruple']);
  assert.equal(image.format, FORMAT);
  const wire = JSON.stringify(image);
  assert.ok(!wire.includes('function'));
  const target = createVM();
  const located = loadDefinitions(target, JSON.parse(wire));
  assert.equal(target.cells[located.get('quadruple')].value, located.get('double'));
  assert.deepEqual(target.evaluate('21 double 21 quadruple'), [42, 84]);
});

test('missing primitive import fails before changing memory or dictionary', () => {
  const vm = createVM();
  const before = vm.cells.length;
  assert.throws(() => loadDefinitions(vm, {
    format: FORMAT, definitions: [{name:'p',cells:[{type:'primitive',name:'posix.open'}]}]
  }), /missing primitive import/);
  assert.equal(vm.cells.length, before);
  assert.equal(vm.words.has('p'), false);
});

test('arbitrary JS values never leak into image serialization', () => {
  const vm = createVM();
  const addr = vm.cells.length;
  vm.alloc({name:'',type:'literal',value:{mutable:true}});
  vm.alloc({name:'',type:'return',value:null});
  vm.words.set('bad',addr);
  assert.throws(() => captureDefinitions(vm,['bad']), /nonportable literal/);
});

test('image preserves calls by address and rejects shadowed original definitions', () => {
  const vm = createVM();
  vm.evaluate('to double dup + . to quadruple double double . to double 2 * .');
  assert.throws(() => captureDefinitions(vm,['quadruple']), /shadowed definition/);
  assert.deepEqual(vm.evaluate('21 quadruple'), [84]);
});

test('image loader permits forward calls inside one image', () => {
  const image = {format:FORMAT,definitions:[
    {name:'first',cells:[{type:'verb',name:'second'}]},
    {name:'second',cells:[{type:'literal',value:7}]}
  ]};
  const vm=createVM();
  loadDefinitions(vm,image);
  assert.deepEqual(vm.evaluate('first'),[7]);
});

test('primitive import is rebound to the target host at load', () => {
  const vm=createVM();
  vm.evaluate('to calc 3 + .');
  const image = captureDefinitions(vm,['calc']);
  const target=createVM();
  // A different implementation of the primitive contract at the host boundary.
  target.primitive('+',host=>{const b=host.pop().value,a=host.pop().value;
    host.push({name:'',type:'literal',value:a+b});});
  loadDefinitions(target,image);
  assert.deepEqual(target.evaluate('4 calc'),[7]);
});

test('empty verb definition is a valid compiled image', () => {
  const vm=createVM(); vm.evaluate('to noop .');
  const image=captureDefinitions(vm,['noop']);
  const other=createVM();
  const relocated=loadDefinitions(other, JSON.parse(JSON.stringify(image)));
  assert.equal(other.cells[relocated.get('noop')].type,'return');
  assert.deepEqual(other.evaluate('7 noop'),[7]);
});

test('external dependency is required and rejected without mutation', () => {
  const vm=createVM();
  const before=vm.cells.length;
  assert.throws(()=>loadDefinitions(vm,{
    format:FORMAT, definitions:[{name:'first',cells:[{type:'verb',name:'second'}]}]
  }),/missing verb import/);
  assert.equal(vm.cells.length,before);
});
