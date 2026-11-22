#!/usr/bin/env node
/*
 * 2026-11-22 — GPT-6 coding agent, under Jean Hugues Noël Robert's direction.
 * Full L9 + synthesized stdlib bootstrap regression tests.
 * This tests actual evaluation, method dispatch, class extensions and the
 * repaired integer.times path (rather than successful startup alone).
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
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
  ['text lowercase', '"HeLLo" text.lowercase out', 'hello'],
  ['standalone definition', 'to add_two 2 +. 40 add_two out', '42'],
];

// An old diagnostic-only stub in make.task writes at full L9 startup.
// Its existence is reported separately: do not mistake successful bootstrap
// for complete task/actor implementation.
const startupDiagnostic = 'make.task stub (see task maker for real logic)';
let passed = 0;
for (const [name, program, expected] of cases) {
  const result = spawnSync(process.execPath, ['bin/inox.js', '-e', program], {
    cwd: root, encoding: 'utf8', timeout: 8000, maxBuffer: 1024 * 1024,
    env: { ...process.env, INOX_WITH_L9: '1', INOX_FULL: '0', INOX_L9: '0' },
  });
  assert.equal(result.status, 0, `${name}: ${result.error || result.stderr || result.stdout}`);
  assert.doesNotMatch(result.stdout, /missing-verb|FATAL:|Assert failure|Invalid boolean value|Cannot compile block/, `${name}: ${result.stdout}`);
  const stdout = result.stdout.replace(startupDiagnostic, '');
  assert.equal(stdout, expected, `${name}: wrong result`);
  passed++;
}
console.log(`L9 bootstrap and executable behavior: ${passed}/${passed} passed`);
