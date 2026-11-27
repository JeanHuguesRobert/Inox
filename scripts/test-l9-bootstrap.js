#!/usr/bin/env node
/*
 * 2026-11-22 — GPT-6 coding agent, under Jean Hugues Noël Robert's direction.
 * Full L9 + synthesized stdlib bootstrap regression tests.
 * This tests actual evaluation, method dispatch, class extensions and the
 * repaired integer.times path (rather than successful startup alone).
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// The prior recursive workaround must not return as a hidden dependency.
assert.doesNotMatch(fs.readFileSync(path.join(root, 'lib/stdlib.nox'), 'utf8'), /stdlib\.times-loop/, 'legacy recursive workaround still present');
const cases = [
  ['full L9 bootstrap', '1 out', '1'],
  ['integer even?', '4 even? out', '1'],
  ['integer odd?', '5 odd? out', '1'],
  ['factorial recursion', '5 factorial out', '120'],
  ['gcd recursion', '24 18 gcd out', '6'],
  ['min', '5 8 min out', '5'],
  ['max', '5 8 max out', '8'],
  ['integer succ dispatch', '4 .succ out', '5'],
  ['integer even? method dispatch', '4 .even? out', '1'],
  ['integer negate dispatch', '5 .negate out', '-5'],
  ['integer times (0)', 'to t { "X" out } 0 .times. t', ''],
  ['integer times (1)', 'to t { "X" out } 1 .times. t', 'X'],
  ['integer times (3)', 'to t { "X" out } 3 .times. t', 'XXX'],
  ['integer times (100)', 'to t { "X" out } 100 .times. t', 'X'.repeat(100)],
  ['integer times negative count', 'to t { "X" out } -3 .times. t', ''],
  ['integer times 1000, bounded/iterative execution', 'to t 0 >n { $n 1 + >n! } 1000 .times $n out. t', '1000'],
  ['integer times leaves caller continuation intact', 'to t "A" out { "X" out } 3 .times "B" out. t', 'AXXXB'],
  ['integer times restores caller control-depth', 'to t control-depth out "," out { } 1000 .times control-depth out. t', '2,2'],
  ['nested integer times 2x2', 'to t { { "X" out } 2 .times "Y" out } 2 .times. t', 'XXYXXY'],
  ['nested integer times 4x3', 'to t 0 >n { { $n 1 + >n! } 3 .times } 4 .times $n out. t', '12'],

  ['text lowercase', '"HeLLo" text.lowercase out', 'hello'],
  ['standalone definition', 'to add_two 2 +. 40 add_two out', '42'],
];

// The early make.task stub has been removed. Bootstrap must not emit a
// diagnostic merely to disguise failure of real root task creation.
let passed = 0;
for (const [name, program, expected] of cases) {
  const result = spawnSync(process.execPath, ['bin/inox.js', '-e', program], {
    cwd: root, encoding: 'utf8', timeout: 8000, maxBuffer: 1024 * 1024,
    env: { ...process.env, INOX_WITH_L9: '1', INOX_FULL: '0', INOX_L9: '0' },
  });
  assert.equal(result.status, 0, `${name}: ${result.error || result.stderr || result.stdout}`);
  assert.doesNotMatch(result.stdout, /missing-verb|FATAL:|Assert failure|Invalid boolean value|Cannot compile block/, `${name}: ${result.stdout}`);
  assert.doesNotMatch(result.stdout,/make\.task stub/,`${name}: obsolete task stub is still active`);
  const stdout = result.stdout;
  assert.equal(stdout, expected, `${name}: wrong result`);
  passed++;
}
console.log(`L9 bootstrap and executable behavior: ${passed}/${passed} passed`);
