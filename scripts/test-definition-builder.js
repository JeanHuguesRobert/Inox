#!/usr/bin/env node
/*
 * 2026-11-22 — GPT-6 coding agent, under Jean Hugues Robert's direction.
 * Regression probes for dynamic Inox definitions and Cell metadata.
 * Run after `npm run build`: node scripts/test-definition-builder.js
 * Tests the minimal runtime; the separate l9 bootstrap remains incomplete (#16).
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cases = [
  ['arithmetic', 'out( 3 + 4 )', '7'],
  ['source definition', 'to add_two 2 +. 40 add_two out', '42'],
  ['verb registration', '/new "succ" verb.from define-verb 41 new out', '42'],
  ['constant definition', '/fortytwo 42 make.constant fortytwo out', '42'],
  ['constant inspection', '/two 2 make.constant "two" definition definition-as-text out', '( 1 )'],
  ['block execution', '40 "succ" verb.from as-block block.run out', '41'],
  ['block composition', '40 "succ" verb.from as-block "succ" verb.from as-block block.join block.run out', '42'],
  ['literal and primitive composition', '/two 2 make.constant 40 "two" verb.from as-block "+" as-tag primitive.from as-block block.join block.run out', '42'],
  ['repeated as-block', '40 "succ" verb.from as-block as-block block.run out', '41'],
  ['repeated as-block type', '"succ" verb.from as-block as-block type-of out', 'reference'],
  ['register converted block', '/one "succ" verb.from as-block define-verb 40 one out', '41'],
  ['register joined blocks', '/twice "succ" verb.from as-block "succ" verb.from as-block block.join define-verb 40 twice out', '42'],
  ['register mixed blocks', '/two 2 make.constant /add_two "two" verb.from as-block "+" primitive.from as-block block.join define-verb 40 add_two out', '42'],
  ...['void', 'boolean', 'integer', 'float', 'tag', 'verb', 'primitive', 'reference']
    .map(type => [`pack-info ${type}`, `/${type} /hello pack-info unpack-type out`, type]),
  ['pack-info name', '/integer /hello pack-info unpack-name out', 'hello'],
];

let passed = 0;
for (const [name, program, expected] of cases) {
  const execution = spawnSync(process.execPath, ['bin/inox.js', '-e', program], {
    cwd: root,
    encoding: 'utf8',
    timeout: 5000,
    maxBuffer: 256 * 1024,
    env: { ...process.env, INOX_WITH_L9: '0' },
  });
  assert.equal(execution.status, 0, `${name}: ${execution.stderr || execution.error}`);
  assert.ok(execution.stdout.trimEnd().endsWith(expected),
    `${name}: expected end ${JSON.stringify(expected)}, got ${JSON.stringify(execution.stdout)}`);
  passed++;
}

// Non-type symbols must not silently become Cell type tags.
const invalid = spawnSync(process.execPath,
  ['bin/inox.js', '-e', '/whatever /hello pack-info unpack-type out'],
  { cwd: root, encoding: 'utf8', timeout: 5000, env: { ...process.env, INOX_WITH_L9: '0' } });
assert.notEqual(invalid.status, 0, 'pack-info must reject invalid type tags');
passed++;

console.log(`Definition/Cell regression tests: ${passed}/${passed} passed`);
