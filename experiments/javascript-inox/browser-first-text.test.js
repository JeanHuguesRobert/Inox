import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { VM } from './toy-runner.js';
import { captureDefinitions, loadDefinitions } from './definition-image.js';
import { installZeroBrowser } from './zero-browser.js';
const source = readFileSync(new URL('./browser-first-text.nox', import.meta.url), 'utf8');
const names = ['eligible','first'];
const base = {tag:'input',type:'text',disabled:false,readonly:false,autocomplete:''};
const cases = [[],[base],[{...base,autocomplete:'username'},base],
  [{...base,disabled:true},{...base,readonly:true},base],
  [{...base,type:'email'},base],[{...base,tag:'textarea'}],[null,base],
  [{...base,disabled:undefined},base], Array(80).fill({...base,autocomplete:'one-time-code'}),
  [...Array(79).fill({...base,autocomplete:'cc-csc'}),base]];
const expected = [-1,0,1,2,1,-1,1,1,-1,79];
const build = installZeroBrowser(new VM(), []);
build.evaluate(source);
const wire = JSON.stringify(captureDefinitions(build,names));
for (const [i,fields] of cases.entries()) test(`recipe source and relocated image case ${i}`, () => {
  const direct = installZeroBrowser(new VM(), fields);
  direct.evaluate(source);
  const loaded = installZeroBrowser(new VM(), fields);
  loadDefinitions(loaded, JSON.parse(wire));
  assert.deepEqual(direct.evaluate('first'), [expected[i]]);
  assert.deepEqual(loaded.evaluate('first'), [expected[i]]);
  assert.equal(loaded.CSP,0);
  assert.equal(JSON.stringify(captureDefinitions(loaded,names)), wire);
});
test('missing host imports reject before mutation', () => {
  const vm = new VM();
  const before = vm.cells.length;
  assert.throws(() => loadDefinitions(vm, JSON.parse(wire)), /missing primitive import/);
  assert.equal(vm.cells.length,before);
});
test('checked-in image matches compiled source', () => {
  const saved = readFileSync(new URL('./browser-first-text-image.json', import.meta.url), 'utf8');
  assert.deepEqual(JSON.parse(saved), JSON.parse(wire));
});
