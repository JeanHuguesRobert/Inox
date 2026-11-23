/* Experimental lexical loop image builder. GPT-6 under Jean Hugues Noël Robert, 2026-11-23. */
import { readFileSync } from 'node:fs';
import { createVM } from './toy-runner.js';
import { captureDefinitions } from './definition-image.js';
const source = readFileSync(new URL('./lexer.nox', import.meta.url), 'utf8');
const vm = createVM();
vm.evaluate(source);
const output = JSON.stringify(captureDefinitions(vm, ['scan-token']), null, 2) + '\n';
if (process.argv.includes('--check')) {
  const expected = readFileSync(new URL('./lexer-image.json', import.meta.url), 'utf8');
  if (output !== expected) {
    console.error('lexer-image.json differs from lexer.nox');
    process.exitCode = 1;
  }
} else process.stdout.write(output);
