/*
 * Textual Cell-image reassembly subset for JavascriptInox Image Zero (#41).
 * Authored by GPT-6 under Jean Hugues Noël Robert's direction, 2026-11-23.
 *
 * This is a readable source projection of stage-1 definition images, not a
 * declaration of the historical Inox grammar or the production .xnx ABI.
 * Every emitted instruction is legal in the minimal "compile ... ." subset.
 */
import { FORMAT } from './definition-image.js';

const atom = value => typeof value === 'string' && value.length > 0 &&
  !/[\s"']/u.test(value) && value !== '.';

function literalToken(c) {
  if (c.name !== undefined && (typeof c.name !== 'string' ||
    (c.name && !/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(c.name))))
    throw new Error('image-source: unsupported Cell name');
  if (!('value' in c)) throw new Error('image-source: missing literal value');
  const value = c.value;
  if (typeof value === 'number' && (!Number.isFinite(value) || Object.is(value, -0)))
    throw new Error('image-source: number not losslessly representable');
  if (!(value === null || typeof value === 'string' ||
      typeof value === 'number' || typeof value === 'boolean'))
    throw new Error('image-source: unsupported literal');
  if (c.name && typeof value === 'string' && /\s/u.test(value))
    throw new Error('image-source: named text with whitespace needs richer lexical stage');
  const token = typeof value === 'string' ? JSON.stringify(value) : String(value);
  return (c.name || '') + (c.name ? ':' : '') + token;
}

export function definitionImageToInox(image, { definer = 'compile' } = {}) {
  if (!image || image.format !== FORMAT || !Array.isArray(image.definitions))
    throw new Error('image-source: unsupported definition image');
  if (!atom(definer)) throw new Error('image-source: unsupported definer');

  const definitions = new Map();
  for (const d of image.definitions) {
    if (!d || !atom(d.name) || !Array.isArray(d.cells) || definitions.has(d.name))
      throw new Error('image-source: unsupported or duplicate definition name');
    definitions.set(d.name, d);
  }

  const ordered = [], seen = new Set(), visiting = new Set();
  function visit(name) {
    if (seen.has(name)) return;
    if (visiting.has(name)) throw new Error('image-source: cyclic definition dependency');
    visiting.add(name);
    const d = definitions.get(name);
    for (const c of d.cells) {
      if (!c || typeof c !== 'object') throw new Error('image-source: invalid Cell');
      if (c.type === 'verb' && definitions.has(c.name)) visit(c.name);
    }
    visiting.delete(name);
    seen.add(name);
    ordered.push(d);
  }
  for (const name of definitions.keys()) visit(name);

  return ordered.map(d => {
    const tokens = d.cells.map(c => {
      if (c.type === 'literal') return literalToken(c);
      if ((c.type === 'primitive' || c.type === 'verb') && atom(c.name))
        return c.name;
      throw new Error('image-source: unrepresentable Cell');
    });
    // Explicitly keep each definition as a *single* valid Inox statement.
    return [definer, d.name, ...tokens, '.'].join(' ');
  }).join('\n') + '\n';
}
