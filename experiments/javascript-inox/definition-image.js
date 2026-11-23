/*
 * Experimental compiled-definition image for JavascriptInox (Inox#41).
 * GPT-6 coding agent, under Jean Hugues Noël Robert's direction, 2026-11-23.
 * NOT the portable .xnx ABI; no raw JS values/functions are serialized.
 */
export const FORMAT = 'inox.stage1.definitions.v0';

function scalar(x) {
  return x === null || typeof x === 'string' || typeof x === 'boolean'
    || (typeof x === 'number' && Number.isFinite(x) && !Object.is(x, -0));
}
function fail(message) { throw new Error('Inox image: ' + message); }
function cellNameOk(name) { return typeof name === 'string' && !/[\s:]/u.test(name); }

export function captureDefinitions(vm, names) {
  if (vm.IP !== null || vm.definition !== null) fail('VM is executing or defining');
  if (!Array.isArray(names) || !names.length || names.some(x => typeof x !== 'string'))
    fail('expected nonempty definition names');
  const starts = new Map();
  // Address identity is significant: no silent retargeting on redefinition.
  for (const [name, address] of vm.words) {
    if (!vm.primitiveEntries.has(address)) starts.set(address, name);
  }
  const definitions = [];
  for (const name of names) {
    const entry = vm.words.get(name);
    if (entry === undefined || vm.primitiveEntries.has(entry)) fail('not a compiled verb: ' + name);
    const cells = [];
    let terminated = false;
    for (let i = entry; i < vm.cells.length; i++) {
      const cell = vm.cells[i];
      if (cell.type === 'return') { terminated = true; break; }
      if (cell.type === 'literal') {
        if (!scalar(cell.value)) fail('nonportable literal in ' + name);
        if (!cellNameOk(cell.name)) fail('invalid literal Cell name');
        cells.push({ type: 'literal', value: cell.value, ...(cell.name ? { name: cell.name } : {}) });
      } else if (cell.type === 'primitive') {
        if (!vm.primitiveEntries.has(vm.words.get(cell.name)))
          fail('unknown primitive import: ' + cell.name);
        if (vm.cells[vm.words.get(cell.name)].value !== cell.value)
          fail('primitive was rebound: ' + cell.name);
        cells.push({ type: 'primitive', name: cell.name });
      } else if (cell.type === 'verb') {
        const called = starts.get(cell.value);
        if (!called) fail('unreachable or shadowed definition address ' + cell.value);
        cells.push({ type: 'verb', name: called });
      } else fail('unsupported Cell type ' + cell.type);
    }
    if (!terminated) fail('unterminated definition ' + name);
    definitions.push({ name, cells });
  }
  if (new Set(names).size !== names.length) fail('duplicate definition names');
  return { format: FORMAT, definitions };
}

export function loadDefinitions(vm, image) {
  if (vm.IP !== null || vm.definition !== null) fail('VM is busy');
  if (!image || image.format !== FORMAT || !Array.isArray(image.definitions))
    fail('wrong image format');
  const names = new Set();
  const definitions = image.definitions;
  for (const d of definitions) {
    if (!d || typeof d.name !== 'string' || !d.name ||
      names.has(d.name) || !Array.isArray(d.cells)) fail('invalid definition');
    if (vm.words.has(d.name)) fail('definition collision: ' + d.name);
    names.add(d.name);
  }
  // Validate all imports and operands BEFORE mutating the target VM.
  for (const d of definitions) for (const c of d.cells) {
    if (!c || typeof c !== 'object') fail('invalid Cell');
    if (c.type === 'literal') {
      if (!scalar(c.value)) fail('nonportable literal');
      if (c.name !== undefined && !cellNameOk(c.name)) fail('invalid literal Cell name');
    } else if (c.type === 'primitive') {
      if (typeof c.name !== 'string' || !vm.primitiveEntries.has(vm.words.get(c.name)))
        fail('missing primitive import: ' + c.name);
    } else if (c.type === 'verb') {
      if (typeof c.name !== 'string' ||
        (!names.has(c.name) && !vm.words.has(c.name))) fail('missing verb import: ' + c.name);
      if (!names.has(c.name) && vm.primitiveEntries.has(vm.words.get(c.name)))
        fail('verb expected, primitive present: ' + c.name);
    } else fail('unsupported Cell type: ' + c.type);
  }
  const addresses = new Map();
  let cursor = vm.cells.length;
  for (const d of definitions) {
    addresses.set(d.name, cursor);
    cursor += d.cells.length + 1;
  }
  // Link symbolic calls to the current runner's native primitive functions.
  for (const d of definitions) {
    for (const c of d.cells) {
      if (c.type === 'literal') vm.alloc({ name: c.name ?? '', type: 'literal', value: c.value });
      else if (c.type === 'primitive') {
        const host = vm.cells[vm.words.get(c.name)];
        vm.alloc({ name: c.name, type: 'primitive', value: host.value });
      } else vm.alloc({
        name: c.name, type: 'verb', value: addresses.get(c.name) ?? vm.words.get(c.name)
      });
    }
    vm.alloc({ name: '', type: 'return', value: null });
  }
  for (const [name, address] of addresses) vm.words.set(name, address);
  return addresses;
}
