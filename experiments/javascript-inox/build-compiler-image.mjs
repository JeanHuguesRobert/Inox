/*
 * Stage-2 bootstrap fixture: compile an Inox-defined compiler verb with stage-0,
 * then emit its linkable image. GPT-6 under Jean Hugues Noël Robert, 2026-11-23.
 * This is not the production Image Zero builder or .xnx serializer.
 */
import { readFileSync } from 'node:fs';
import { createVM } from './toy-runner.js';
import { captureDefinitions } from './definition-image.js';

const source = readFileSync(new URL('./compiler.nox', import.meta.url), 'utf8');
const vm = createVM();
vm.evaluate(source);
const image = JSON.stringify(captureDefinitions(vm, ['compile','to']), null, 2) + '\n';
if (process.argv.includes('--check')) {
  const expected = readFileSync(new URL('./compiler-image.json', import.meta.url), 'utf8');
  if (image !== expected) {
    console.error('compiler-image.json differs from compiler.nox');
    process.exitCode = 1;
  }
} else {
  process.stdout.write(image);
}
