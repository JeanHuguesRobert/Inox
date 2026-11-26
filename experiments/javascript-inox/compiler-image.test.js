import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createVM } from './toy-runner.js';
import { captureDefinitions, loadDefinitions } from './definition-image.js';

const source = readFileSync(new URL('./compiler.nox', import.meta.url), 'utf8');
const imageText = readFileSync(new URL('./compiler-image.json', import.meta.url), 'utf8');
const image = JSON.parse(imageText);

test('compiler is authored as Inox verb and compiled by stage-0 VM', () => {
  const build = createVM();
  build.evaluate(source);
  assert.deepEqual(captureDefinitions(build, ['compile','to']), image);
  assert.ok(image.definitions[0].cells.some(c => c.name === 'jump-relative'));
  assert.ok(image.definitions[0].cells.some(c => c.name === 'branch-relative-if'));
});

test('a VM without stage-0 to loads compiler image and defines double and quadruple', () => {
  const vm = createVM({ bootstrapCompiler: false });
  assert.equal(vm.words.has('to'), false);
  assert.equal(vm.words.has('compile'), false);
  const entry = loadDefinitions(vm, image).get('compile');
  assert.equal(vm.cells[entry].type, 'primitive');
  assert.deepEqual(vm.evaluate(
    'compile double dup + . compile quadruple double double . 21 double 21 quadruple'
  ), [42, 84]);
  assert.equal(vm.CSP, 0);
  assert.equal(vm.DSP, 2);
});

test('compiler image relocates correctly despite different primitive address layout', () => {
  const vm = createVM({ bootstrapCompiler: false });
  vm.primitive('host.extra', () => {});
  vm.primitive('host.another', () => {});
  loadDefinitions(vm, JSON.parse(JSON.stringify(image)));
  assert.deepEqual(vm.evaluate('compile inc 1 + . 41 inc'), [42]);
});

test('compiled compiler itself can be exported from target runner without bootstrap', () => {
  const vm = createVM({ bootstrapCompiler: false });
  loadDefinitions(vm, image);
  assert.deepEqual(captureDefinitions(vm, ['compile','to']), image);
});

test('compiler relative backward branch does not accumulate control-stack frames', () => {
  const vm = createVM({ bootstrapCompiler: false, maxSteps: 100000 });
  loadDefinitions(vm, image);
  const body = new Array(1000).fill('1').join(' ');
  const result = vm.evaluate('compile many ' + body + ' . many');
  assert.equal(result.length, 1000);
  assert.ok(result.every(x => x === 1));
  assert.equal(vm.CSP, 0);
});

test('bad relative offset is rejected', () => {
  const vm = createVM({ bootstrapCompiler: false });
  vm.push({name:'',type:'literal',value:1.2});
  assert.throws(() => vm.invoke('jump-relative'), /non-integer/);
});

test('compiler can be loaded in multiple independent VMs', () => {
  const a = createVM({ bootstrapCompiler: false });
  const b = createVM({ bootstrapCompiler: false });
  loadDefinitions(a, image);
  loadDefinitions(b, image);
  assert.deepEqual(a.evaluate('compile plus-one 1 + . 41 plus-one'), [42]);
  assert.equal(b.words.has('plus-one'), false);
  assert.deepEqual(b.evaluate('compile times-two dup + . 21 times-two'), [42]);
});

test('loaded compiler recompiles its own unchanged source without bootstrap to', () => {
  const vm=createVM({bootstrapCompiler:false});
  assert.equal(vm.words.has('to'),false);
  loadDefinitions(vm,image);
  assert.equal(vm.cells[vm.words.get('to')].type,'verb');
  vm.evaluate(source);
  assert.deepEqual(captureDefinitions(vm,['compile','to']),image);
  assert.deepEqual(vm.evaluate('to double dup +. 21 double'),[42]);
});
