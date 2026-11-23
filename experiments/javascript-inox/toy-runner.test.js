import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createVM } from './toy-runner.js';

test('VM-executed defining verb creates double and quadruple', () => {
  const vm = createVM();
  const prior = vm.cells.length;
  const output = vm.evaluate('to double dup + . to quadruple double double . 21 double 21 quadruple');
  assert.deepEqual(output, [42, 84]);
  const a = vm.words.get('double'), b = vm.words.get('quadruple');
  assert.ok(a >= prior && b > a);
  assert.deepEqual(vm.cells.slice(a, a + 3).map(x => x.type), ['primitive', 'primitive', 'return']);
  assert.deepEqual(vm.cells.slice(b, b + 3).map(x => x.name), ['double', 'double', '']);
  assert.equal(vm.cells[b].value, a);
  assert.equal(vm.cells[b + 1].value, a);
  assert.equal(vm.IP, null);
  assert.equal(vm.CSP, 0);
  assert.equal(vm.DSP, 2);
});

test('Cells retain JavaScript reference identity on shallow copy', () => {
  const vm = createVM();
  const obj = { values: [1] };
  vm.push({ name: 'obj', type: 'literal', value: obj });
  vm.invoke('dup');
  assert.equal(vm.cells[vm.data[0]].value, vm.cells[vm.data[1]].value);
  assert.notEqual(vm.data[0], vm.data[1]);
  assert.equal(vm.cells[vm.data[1]].name, 'obj');
});

test('nested definitions compile and run', () => {
  const vm = createVM();
  assert.deepEqual(vm.evaluate('to increment 1 + . to twice increment increment . 20 twice'), [22]);
  assert.equal(vm.CSP, 0);
});

test('compiled calls keep their original target after redefinition', () => {
  const vm = createVM();
  assert.deepEqual(
    vm.evaluate('to increment 1 + . to twice increment increment . to increment 2 + . 20 twice 20 increment'),
    [22, 22]
  );
});

test('VM state is independent', () => {
  const a = createVM(), b = createVM();
  a.evaluate('to custom 3 * .');
  assert.equal(b.words.has('custom'), false);
  assert.deepEqual(a.evaluate('10 custom'), [30]);
});

test('underflow is detected', () => {
  assert.throws(() => createVM().evaluate('+'), /underflow/);
});

test('invalid names and unterminated source are rejected', () => {
  assert.throws(() => createVM().evaluate('unknown'), /undefined entry/);
  assert.throws(() => createVM().evaluate('to x no-such-word .'), /undefined word/);
  assert.throws(() => createVM().evaluate('to x 1 +'), /unexpected end/);
});

test('instruction budget bounds looping primitives', () => {
  const vm = createVM({ maxSteps: 30 });
  vm.primitive('forever', x => { x.IP--; });
  assert.throws(() => vm.invoke('forever'), /budget exceeded/);
});

test('primitive can change IP without corrupting return stack', () => {
  const vm = createVM();
  vm.primitive('skip', x => { x.IP++; });
  assert.deepEqual(vm.evaluate('to example 2 skip 99 3 + . example'), [5]);
  assert.equal(vm.CSP, 0);
});

test('concatenative calculation does not use host object semantics', () => {
  const vm = createVM();
  assert.deepEqual(vm.evaluate('to cube dup dup * * . 3 cube'), [27]);
});
