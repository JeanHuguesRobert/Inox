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
    this.frames = new Map(); // locals by control-frame address
    this.data = []; // addresses of value Cells
    this.tokens = [];
    this.sourceText = "";
    this.sourceOffset = 0;
    this.lexWithInox = false;
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
    // Minimal Inox subset: typed scalar literals, optionally named "x:42".
    // Keep the name as Cell metadata, not as a JS closure/environment.
    let name = '';
    const match = /^([a-zA-Z_][a-zA-Z0-9_-]*):(.+)$/.exec(token);
    if (match) { name = match[1]; token = match[2]; }
    if (/^-?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(token)) {
      const value = Number(token);
      if (!Number.isFinite(value)) throw new SyntaxError('nonfinite number literal: ' + token);
      return { name, type: 'literal', value };
    }
    if (token === 'true' || token === 'false')
      return { name, type: 'literal', value: token === 'true' };
    if (token === 'null') return { name, type: 'literal', value: null };
    if (token.startsWith('"') && token.endsWith('"')) {
      try { return { name, type: 'literal', value: JSON.parse(token) }; }
      catch { throw new SyntaxError('bad string literal: ' + token); }
    }
    return null;
  }
  // Shared punctuation normalization for both experimental readers.
  // This is a deliberately bounded subset of the historical tokenizer.
  static normalizeTokens(tokens) {
    return tokens.flatMap(token => {
      if (VM.literal(token) || token.startsWith('"')) return [token];
      return token.split(/([{};])/u).filter(Boolean).flatMap(part =>
        part.length > 1 && part.endsWith('.') && !VM.literal(part)
          ? [part.slice(0,-1), '.'] : [part]);
    });
  }
  // Structured control lowers to the existing relocatable branch primitives.
  // The compiler is still VM-invoked through def.emit. No JS runtime recursion.
  emitSourceToken(token) {
    const d = this.definition, body = d.body;
    const emit = word => body.push(this.resolve(word));
    const branch = word => {
      const index = body.length;
      body.push({name:'',type:'literal',value:0});
      emit(word);
      return index;
    };
    const patch = (index,target) => { body[index].value = target-index-2; };
    const expect = word => {
      const actual = this.nextToken();
      if(actual!==word)throw new SyntaxError('expected '+word+', got '+actual);
    };
    const block = () => {
      expect('{');
      emit('scope.enter'); d.scopeDepth++;
      for (;;) {
        const word = this.nextToken();
        if (word === '}') { d.scopeDepth--; emit('scope.leave'); return; }
        this.emitSourceToken(word);
      }
    };
    const conditionalExit = () => { emit('not'); return branch('branch-relative-if'); };
    if (token === 'if:') {
      // Historical keyword syntax: condition expression, then block,
      // optional else block, and terminating semicolon.
      for (;;) {
        const word = this.nextToken();
        if (word === 'then:') break;
        this.emitSourceToken(word);
      }
      const otherwise = conditionalExit();
      block();
      const tail = this.nextToken();
      if (tail === 'else:') {
        const end = branch('jump-relative');
        patch(otherwise,body.length);
        block();
        expect(';');
        patch(end,body.length);
      } else {
        if (tail !== ';') throw new SyntaxError('expected else: or ;, got '+tail);
        patch(otherwise,body.length);
      }
      return;
    }
    if (token === 'while:' || token === 'do:') {
      const start = body.length;
      const exits = [];
      d.loops.push({exits,depth:d.scopeDepth});
      if (token === 'while:') {
        block();
        exits.push(conditionalExit());
        expect('do:');
        block();
        patch(branch('jump-relative'),start);
      } else {
        block();
        const kind = this.nextToken();
        if (kind!=='while:' && kind!=='until:')throw new SyntaxError('expected while: or until:');
        block();
        if(kind==='until:')emit('not');
        patch(branch('branch-relative-if'),start);
      }
      expect(';');
      d.loops.pop();
      for(const index of exits)patch(index,body.length);
      return;
    }
    if(token==='break-if' || token==='break') {
      if(!d.loops.length)throw new SyntaxError(token+' outside loop');
      const loop=d.loops.at(-1);
      const skip=token==='break-if'?conditionalExit():null;
      for(let i=loop.depth;i<d.scopeDepth;i++)emit('scope.leave');
      loop.exits.push(branch('jump-relative'));
      if(skip!==null)patch(skip,body.length);
      return;
    }
    if(token==='{') {
      // Retain inline lowering of immediate conditionals to support loop breaks.
      let depth=1, end=this.cursor;
      for(;end<this.tokens.length && depth;end++){
        if(this.tokens[end]==='{')depth++;
        else if(this.tokens[end]==='}')depth--;
      }
      if(depth)throw new SyntaxError('unterminated block');
      if(this.tokens[end]==='if'){
        const exit=conditionalExit();
        emit('scope.enter');d.scopeDepth++;
        while(this.cursor<end-1)this.emitSourceToken(this.nextToken());
        expect('}');expect('if');
        d.scopeDepth--;emit('scope.leave');patch(exit,body.length);
        return;
      }
      // A relative block reference followed by a jump around its body.
      // All operands remain relocatable scalars; no JS closures in images.
      emit('2');emit('block.relative');
      const skip=branch('jump-relative');
      const oldLoops=d.loops, oldDepth=d.scopeDepth;
      d.loops=[];d.scopeDepth=0;
      while(this.cursor<end-1)this.emitSourceToken(this.nextToken());
      expect('}');emit('block.return');
      d.loops=oldLoops;d.scopeDepth=oldDepth;
      patch(skip,body.length);
      return;
    }
    const local=/^>([A-Za-z_][A-Za-z0-9_-]*)(!)?$/.exec(token);
    const read=/^\$([A-Za-z_][A-Za-z0-9_-]*)$/.exec(token)||/^([A-Za-z_][A-Za-z0-9_-]*)>$/.exec(token);
    if(local||read){
      emit(JSON.stringify((local||read)[1]));
      emit(read?'local.read':local[2]?'local.write':'local.create');
      return;
    }
    if(['}', ';', '.', 'then:', 'else:', 'until:'].includes(token))
      throw new SyntaxError('unexpected structured token '+token);
    emit(token);
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
    const initialDSP = this.DSP;
    try {
      this.run();
    } catch (error) {
      // A failed invocation must not leave a fake running frame behind.
      this.IP = null;
      this.control.length = 0;
      this.frames.clear();
      this.CSP = 0;
      this.data.length = Math.min(this.data.length, initialDSP);
      this.DSP = this.data.length;
      this.definition = null;
      throw error;
    }
  }
  call(address, resume=this.IP) {
    const frame=this.alloc({name:'',type:'return-address',value:resume});
    this.control.push(frame);this.frames.set(frame,[new Map()]);
    this.CSP=this.control.length;this.IP=address;
  }
  returnFrame() {
    const frame=this.control.pop();
    this.IP=frame===undefined?null:this.cells[frame].value;
    this.frames.delete(frame);this.CSP=this.control.length;
  }
  scopes() {
    const scopes=this.frames.get(this.control.at(-1));
    if(!scopes)throw Error('local outside call frame');
    return scopes;
  }
  findLocal(name) {
    for(let i=this.control.length-1;i>=0;i--){
      const scopes=this.frames.get(this.control[i]);
      for(let j=scopes.length-1;j>=0;j--)if(scopes[j].has(name))return scopes[j];
    }
    throw Error('undefined local: '+name);
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
          this.call(cell.value,this.IP+1);
          break;
        case 'return':
          this.returnFrame();
          break;
        default: throw new Error('unexecutable cell type: ' + cell.type);
      }
    }
  }
  evaluate(source) {
    if (this.lexWithInox) {
      this.sourceText = source;
      this.sourceOffset = 0;
      this.tokens = [];
      while (true) {
        this.invoke('scan-token');
        const token = this.pop().value;
        if (token === null) break;
        this.tokens.push(token);
      }
    } else this.tokens = VM.lex(source);
    this.tokens = VM.normalizeTokens(this.tokens);
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
    const pushValue = (vm, value) => vm.push({name:'',type:'literal',value});
    const binary = (name, f) => p(name, vm => {
      const b=vm.pop().value, a=vm.pop().value;
      pushValue(vm,f(a,b));
    });
    p('over', vm => {
      if(vm.DSP<2)throw Error('data stack underflow');
      vm.push(vm.cells[vm.data[vm.DSP-2]]);
    });
    p('pick', vm => {
      const n=vm.pop().value;
      if(!Number.isInteger(n)||n<0||n>=vm.DSP)throw Error('invalid pick index');
      vm.push(vm.cells[vm.data[vm.DSP-1-n]]);
    });
    binary('equal?', (a,b)=>a===b);
    binary('<', (a,b)=>a<b);
    binary('and', (a,b)=>Boolean(a&&b));
    p('not',vm=>pushValue(vm,!vm.pop().value));
    p('scope.enter',vm=>vm.scopes().push(new Map()));
    p('scope.leave',vm=>{
      const scopes=vm.scopes();if(scopes.length<2)throw Error('scope underflow');scopes.pop();
    });
    p('local.create',vm=>{
      const name=vm.pop().value;vm.scopes().at(-1).set(name,vm.pop());
    });
    p('local.read',vm=>{
      const name=vm.pop().value;vm.push(vm.findLocal(name).get(name));
    });
    p('local.write',vm=>{
      const name=vm.pop().value;vm.findLocal(name).set(name,vm.pop());
    });
    p('block.relative',vm=>{
      const offset=vm.pop().value;
      if(!Number.isInteger(offset))throw Error('invalid block offset');
      vm.push({name:'',type:'block',value:vm.IP+offset});
    });
    const runBlock=(vm,cell)=>{
      if(cell.type!=='block'||!Number.isInteger(cell.value))throw Error('expected block');
      vm.call(cell.value);
    };
    p('run',vm=>runBlock(vm,vm.pop()));
    p('if',vm=>{
      const block=vm.pop(),condition=vm.pop().value;if(condition)runBlock(vm,block);
    });
    p('block.return',vm=>vm.returnFrame());

    // Experimental host-projection and text operations, not a new binary ABI.
    binary('get',(a,b)=>a!=null&&Object.hasOwn(a,b)?a[b]:undefined);
    binary('text.matches-i?',(a,b)=>new RegExp(b,'i').test(String(a??'')));

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
      vm.definition = { name, body: [], loops: [], scopeDepth:0 };
    });
    p('token.end?', vm => {
      const token = vm.pop().value;
      vm.push({ name: '', type: 'literal', value: token === '.' });
    });
    p('def.emit', vm => {
      if (!vm.definition) throw new Error('no active definition');
      vm.emitSourceToken(vm.pop().value);
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
    // Stage-3 host boundary: raw character access; lexical loop runs in Inox.
    p('source.peek', vm => vm.push({
      name: '', type: 'literal', value:
        vm.sourceOffset < vm.sourceText.length ? vm.sourceText[vm.sourceOffset] : null
    }));
    p('source.consume', vm => { if (vm.sourceOffset < vm.sourceText.length) vm.sourceOffset++; });
    p('char.space?', vm => {
      const c = vm.pop().value;
      vm.push({ name: '', type: 'literal', value:
        typeof c === 'string' && /\s/u.test(c) });
    });
    p('char.end?', vm => vm.push({
      name: '', type: 'literal', value: vm.pop().value === null
    }));
    p('char.quote?', vm => vm.push({
      name: '', type: 'literal', value: vm.pop().value === '"'
    }));
    p('char.backslash?', vm => vm.push({
      name: '', type: 'literal', value: vm.pop().value === '\\'
    }));
    p('lex.error', vm => { throw new SyntaxError('unterminated string literal'); });
    p('text.concat', vm => {
      const c = vm.pop().value, a = vm.pop().value;
      vm.push({ name: '', type: 'literal', value: a + c });
    });
    p('text.empty-null', vm => {
      const text = vm.pop().value;
      vm.push({ name: '', type: 'literal', value: text === '' ? null : text });
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
