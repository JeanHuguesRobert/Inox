/* JavascriptInox stage-0, Inox#41.
 * GPT-6 coding agent, directed by Jean Hugues Noël Robert, 2026-11-23.
 * Independent from historical TS runtime and from .xnx.
 */
export class VM {
  constructor({ maxSteps = 100000, bootstrapCompiler = true } = {}) {
    this.bootstrapCompiler = bootstrapCompiler;
    this.cells = []; // One logical address space for code and stack Cells
    this.words = new Map(); // name -> entry address
    this.primitiveEntries = new Set();
    this.IP = null;
    this.CSP = 0;
    this.DSP = 0;
    this.control = []; // addresses of return-address Cells
    this.data = []; // addresses of value Cells
    this.tokens = [];
    this.cursor = 0;
    this.definition = null;
    this.maxSteps = maxSteps;
    this.steps = 0;
    this.install();
  }
  alloc(cell) {
    if (!cell || !('name' in cell) || !('type' in cell) || !('value' in cell))
      throw new TypeError('Cell must have name, type, value');
    return this.cells.push({ name: cell.name, type: cell.type, value: cell.value }) - 1;
  }
  push(cell) {
    this.data.push(this.alloc(cell)); // copy Cell container, not its JS value
    this.DSP = this.data.length;
  }
  pop() {
    if (!this.DSP) throw new Error('data stack underflow');
    const address = this.data.pop();
    this.DSP = this.data.length;
    return this.cells[address];
  }
  peek() {
    if (!this.DSP) throw new Error('data stack underflow');
    return this.cells[this.data[this.DSP - 1]];
  }
  values() { return this.data.map(address => this.cells[address].value); }
  nextToken() {
    if (this.cursor >= this.tokens.length) throw new Error('unexpected end of definition');
    return this.tokens[this.cursor++];
  }
  static lex(source) {
    // Stage-0 reader only: NOT the historic Inox tokenizer.
    return source.match(/"(?:\\.|[^"\\])*"|\S+/g) ?? [];
  }
  static literal(token) {
    if (/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(token))
      return { name: '', type: 'literal', value: Number(token) };
    if (token === 'true' || token === 'false')
      return { name: '', type: 'literal', value: token === 'true' };
    if (token === 'null') return { name: '', type: 'literal', value: null };
    if (token.startsWith('"') && token.endsWith('"')) {
      try { return { name: '', type: 'literal', value: JSON.parse(token) }; }
      catch { throw new SyntaxError('bad string literal: ' + token); }
    }
    return null;
  }
  resolve(token) {
    const lit = VM.literal(token);
    if (lit) return lit;
    if (!this.words.has(token)) throw new Error('undefined word: ' + token);
    const address = this.words.get(token);
    const cell = this.cells[address];
    return this.primitiveEntries.has(address)
      ? { name: token, type: 'primitive', value: cell.value }
      : { name: token, type: 'verb', value: address };
  }
  primitive(name, fn) {
    const entry = this.alloc({ name, type: 'primitive', value: fn });
    this.alloc({ name: '', type: 'return', value: null });
    this.primitiveEntries.add(entry);
    this.words.set(name, entry);
    return entry;
  }
  bootstrapWord(name, instructions) {
    // ONLY for the initial defining verb; user definitions run inside VM.
    const entry = this.cells.length;
    for (const cell of instructions) this.alloc(cell);
    this.alloc({ name: '', type: 'return', value: null });
    this.words.set(name, entry);
    return entry;
  }
  invoke(nameOrAddress) {
    const address = typeof nameOrAddress === 'number'
      ? nameOrAddress : this.words.get(nameOrAddress);
    if (address === undefined) throw new Error('undefined entry: ' + nameOrAddress);
    if (this.IP !== null) throw new Error('already running');
    // An explicit return boundary even when the target is a primitive.
    this.IP = this.alloc({ name: '', type: 'verb', value: address });
    this.alloc({ name: '', type: 'return', value: null });
    this.steps = 0;
    this.run();
  }
  run() {
    while (this.IP !== null) {
      if (++this.steps > this.maxSteps) throw new Error('instruction budget exceeded');
      const cell = this.cells[this.IP];
      if (!cell) throw new Error('invalid IP: ' + this.IP);
      switch (cell.type) {
        case 'literal':
          this.push(cell);
          this.IP++;
          break;
        case 'primitive':
          this.IP++;
          cell.value(this); // FFI: direct JS function
          break;
        case 'verb':
          this.control.push(this.alloc({
            name: '', type: 'return-address', value: this.IP + 1
          }));
          this.CSP = this.control.length;
          this.IP = cell.value;
          break;
        case 'return':
          this.IP = this.CSP ? this.cells[this.control.pop()].value : null;
          this.CSP = this.control.length;
          break;
        default: throw new Error('unexecutable cell type: ' + cell.type);
      }
    }
  }
  evaluate(source) {
    this.tokens = VM.lex(source);
    this.cursor = 0;
    while (this.cursor < this.tokens.length) {
      const token = this.nextToken();
      const lit = VM.literal(token);
      if (lit) this.push(lit);
      else this.invoke(token);
    }
    if (this.definition !== null) throw new Error('unfinished definition');
    return this.values();
  }
  install() {
    const p = (name, fn) => this.primitive(name, fn);
    p('dup', vm => vm.push(vm.peek()));
    p('drop', vm => vm.pop());
    p('swap', vm => { const a = vm.pop(), b = vm.pop(); vm.push(a); vm.push(b); });
    p('+', vm => {
      const b = vm.pop().value, a = vm.pop().value;
      vm.push({ name: '', type: 'literal', value: a + b });
    });
    p('*', vm => {
      const b = vm.pop().value, a = vm.pop().value;
      vm.push({ name: '', type: 'literal', value: a * b });
    });
    p('next-token', vm =>
      vm.push({ name: '', type: 'literal', value: vm.nextToken() }));
    p('def.begin', vm => {
      if (vm.definition) throw new Error('nested definition not supported');
      const name = vm.pop().value;
      if (typeof name !== 'string' || !name || name === '.')
        throw new Error('bad definition name');
      vm.definition = { name, body: [] };
    });
    p('token.end?', vm => {
      const token = vm.pop().value;
      vm.push({ name: '', type: 'literal', value: token === '.' });
    });
    p('def.emit', vm => {
      if (!vm.definition) throw new Error('no active definition');
      vm.definition.body.push(vm.resolve(vm.pop().value));
    });
    p('def.finish', vm => {
      if (!vm.definition) throw new Error('no active definition');
      const { name, body } = vm.definition;
      const entry = vm.cells.length;
      for (const cell of body) vm.alloc(cell);
      vm.alloc({ name: '', type: 'return', value: null });
      vm.words.set(name, entry);
      vm.definition = null;
    });
    p('branch-if', vm => {
      const target = vm.pop().value, condition = vm.pop().value;
      if (condition) vm.IP = target;
    });
    p('jump', vm => { vm.IP = vm.pop().value; });
    // Relative branches are independent of a definition's loaded address.
    p('branch-relative-if', vm => {
      const offset = vm.pop().value, condition = vm.pop().value;
      if (!Number.isInteger(offset)) throw new Error('non-integer branch offset');
      if (condition) vm.IP += offset;
    });
    p('jump-relative', vm => {
      const offset = vm.pop().value;
      if (!Number.isInteger(offset)) throw new Error('non-integer jump offset');
      vm.IP += offset;
    });
    if (!this.bootstrapCompiler) return;
    // Stage-0 assembles only 'to': its compile loop EXECUTES inside the VM.
    const entry = this.cells.length;
    const next = name => ({
      name, type: 'primitive', value: this.cells[this.words.get(name)].value
    });
    const lit = value => ({ name: '', type: 'literal', value });
    const code = [
      next('next-token'), next('def.begin'),
      next('next-token'), next('dup'), next('token.end?'),
      lit(entry + 10), next('branch-if'),
      next('def.emit'), lit(entry + 2), next('jump'),
      next('drop'), next('def.finish')
    ];
    this.bootstrapWord('to', code);
  }
}
export const createVM = options => new VM(options);
