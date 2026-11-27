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
    this.tokenPositions = [];
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
  nextToken({definitionBoundary=false} = {}) {
    if (this.cursor >= this.tokens.length) throw new Error('unexpected end of definition');
    const token=this.tokens[this.cursor];
    // Only the outer compile loop may synthesize a terminator. Nested
    // structured syntax still consumes its explicit closing punctuation.
    if(definitionBoundary && this.definition?.body.length && token!=='.'){
      const pos=this.tokenPositions[this.cursor];
      if(pos?.columnOne && (pos.dedent || token==='to'))return '.';
    }
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
  static sourceTag(token) {
    if(token==='with')return 'with';
    if(token==='/!')return '!';
    const match=/^\/([A-Za-z_][A-Za-z0-9_.?!-]*)$/.exec(token)
      || /^([A-Za-z_][A-Za-z0-9_.?!-]*)\/$/.exec(token);
    return match?match[1]:null;
  }
  // Shared punctuation normalization for both experimental readers.
  // This is a deliberately bounded subset of the historical tokenizer.
  static normalizeTokens(tokens) {
    return tokens.flatMap(token => {
      // A final dot is a delimiter, even after a numeric literal.
      // Internal decimal points and dots in names are not delimiters.
      if (token.length>1 && token.endsWith('.') && !token.endsWith('..')
          && !token.startsWith('"')) {
        return [...VM.normalizeTokens([token.slice(0,-1)]),'.'];
      }
      if (VM.literal(token) || token.startsWith('"')) return [token];
      return token.split(/([>/]\{|[{};(),])/u).filter(Boolean);
    });
  }
  // The two scanners already supply token boundaries. Recover only source
  // coordinates from the intervening whitespace, not a second lexical scan.
  setSourceTokens(raw,source) {
    this.tokens=[];this.tokenPositions=[];
    let end=0, scanEnd=0, commentEnd=0, lineStart=0, indent=null;
    for(const token of raw){
      const start=source.indexOf(token,scanEnd);
      if(start<0)throw Error('scanner token has no source span');
      scanEnd=start+token.length;
      if(start<commentEnd)continue;
      if(token==='~~'){
        const newline=source.indexOf('\n',scanEnd);
        commentEnd=newline<0?source.length:newline;
        continue;
      }
      const gap=source.slice(end,start);
      const newline=Math.max(gap.lastIndexOf('\n'),gap.lastIndexOf('\r'));
      const nextLineStart=newline<0?lineStart:end+newline+1;
      const first=indent===null||nextLineStart!==lineStart;
      const column=start-nextLineStart;
      const dedent=first&&column===0&&indent!==null&&indent>0;
      if(first){indent=column;lineStart=nextLineStart;}
      let consumed=0;
      for(const piece of VM.normalizeTokens([token])){
        this.tokens.push(piece);
        this.tokenPositions.push({start:start+consumed,columnOne:consumed===0&&column===0,dedent:consumed===0&&dedent});
        consumed+=piece.length;
      }
      end=start+token.length;
    }
  }
  // Structured control lowers to the existing relocatable branch primitives.
  // The compiler is still VM-invoked through def.emit. No JS runtime recursion.
  emitSourceToken(token) {
    if(token===',')return;
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
    // Parenthesized calls and the bounded left-associative text
    // concatenation expression used by L9's method-text-name.
    if(token==='(' || (this.tokens[this.cursor]==='(' &&
        this.tokenPositions[this.cursor-1].start+token.length===this.tokenPositions[this.cursor].start)){
      const callee=token==='('?null:token;
      if(callee!==null)expect('(');
      let pending=null,haveOperand=false;
      for(;;){
        const word=this.nextToken();
        if(word===')'||word===','){
          if(pending)throw new SyntaxError('missing right operand');
          if(word===')')break;
          haveOperand=false;continue;
        }
        if(word==='&'||word==='='){
          if(!haveOperand||pending)throw new SyntaxError('missing left operand');
          pending=word;continue;
        }
        this.emitSourceToken(word);
        if(pending){emit(pending);pending=null;}
        haveOperand=true;
      }
      if(callee==='break-if')this.emitSourceToken(callee);
      else if(callee!==null)emit(callee);
      return;
    }
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
    const followingBrace=this.tokens[this.cursor]==='{' &&
      this.tokenPositions[this.cursor-1].start+token.length===this.tokenPositions[this.cursor].start;
    if(followingBrace && /^[A-Za-z_][A-Za-z0-9_.?!-]*\/[A-Za-z_][A-Za-z0-9_.?!-]*$/.test(token)){
      const [name,callee]=token.split('/');
      emit(JSON.stringify(name));emit('tag.literal');
      expect('{');this.emitSourceToken('{');emit(callee+'{');
      return;
    }
    if(followingBrace && this.words.has(token+'{')){
      expect('{');this.emitSourceToken('{');emit(token+'{');
      return;
    }
    if(token==='{' || token==='>{' || token==='/{') {
      // Retain inline lowering of immediate conditionals to support loop breaks.
      let depth=1, end=this.cursor;
      for(;end<this.tokens.length && depth;end++){
        if(['{','>{','/{'].includes(this.tokens[end]))depth++;
        else if(this.tokens[end]==='}')depth--;
      }
      if(depth)throw new SyntaxError('unterminated block');
      if(token==='{' && this.tokens[end]==='if'){
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
      if(token==='>{')emit('run-with-it');
      if(token==='/{')emit('run-with-parameters');
      return;
    }
    // Dot-method notation lowers to a symbolic tag and ordinary dispatch.
    if(/^\.[A-Za-z_?!@][A-Za-z0-9_.?!@-]*$/.test(token)){
      emit(JSON.stringify(token.slice(1)));emit('tag.literal');emit('run-method');
      return;
    }
    if(/^:[A-Za-z_][A-Za-z0-9_.?!-]*$/.test(token)){
      emit(JSON.stringify(token.slice(1)));emit('tag.literal');emit('rename');
      return;
    }
    if(token==='_'){emit('void.literal');return;}
    // Ordinary name/verb syntax supplies a tag as the last operand.
    const taggedCall=/^([A-Za-z_][A-Za-z0-9_.?!-]*)\/([A-Za-z_][A-Za-z0-9_.?!-]*)$/.exec(token);
    if(taggedCall){
      emit(JSON.stringify(taggedCall[1]));emit('tag.literal');emit(taggedCall[2]);return;
    }
    // Single-component @method calls use the dynamically bound receiver.
    if(/^@[A-Za-z_][A-Za-z0-9_?!-]*$/.test(token)){
      emit('it');emit(JSON.stringify(token.slice(1)));emit('tag.literal');emit('run-method');return;
    }
    const tag = VM.sourceTag(token);
    if(tag!==null){
      emit(JSON.stringify(tag));emit('tag.literal');
      return;
    }
    if(token==='>control'||token==='control>'){emit(token);return;}
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
    if(frame!==undefined&&!this.frames.has(frame))throw Error('unbalanced control stack');
    this.IP=frame===undefined?null:this.cells[frame].value;
    this.frames.delete(frame);this.CSP=this.control.length;
  }
  scopes() {
    for(let i=this.control.length-1;i>=0;i--){
      const scopes=this.frames.get(this.control[i]);
      if(scopes)return scopes;
    }
    throw Error('local outside call frame');
  }
  findLocal(name) {
    for(let i=this.control.length-1;i>=0;i--){
      const scopes=this.frames.get(this.control[i]);
      if(!scopes)continue;
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
        case 'runtime-literal':
          this.push(cell.value);
          this.IP++;
          break;
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
    this.setSourceTokens(this.tokens,source);
    this.cursor = 0;
    while (this.cursor < this.tokens.length) {
      const token = this.nextToken();
      if(token==='global:'){
        const name=VM.sourceTag(this.nextToken());
        if(name===null||this.nextToken()!=='is:')throw Error('expected global: name/ is:');
        const d={name:'',body:[],loops:[],scopeDepth:0};
        this.definition=d;
        try{
          d.body.push(this.resolve(JSON.stringify(name)),this.resolve('tag.literal'));
          for(;;){
            const word=this.nextToken();
            if(word===';')break;
            this.emitSourceToken(word);
          }
          d.body.push(this.resolve('make.global'));
          const entry=this.cells.length;
          for(const cell of d.body)this.alloc(cell);
          this.alloc({name:'',type:'return',value:null});
          this.definition=null;
          this.invoke(entry);
        }finally{this.definition=null;}
        continue;
      }
      const lit = VM.literal(token);
      if (lit) this.push(lit);
      else {
        const tag=VM.sourceTag(token);
        if(tag!==null)this.push({name:tag,type:'tag',value:tag});
        else if(/^\.[A-Za-z_?!@][A-Za-z0-9_.?!@-]*$/.test(token)){
          const name=token.slice(1);
          this.push({name,type:'tag',value:name});this.invoke('run-method');
        } else this.invoke(token);
      }
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
    p('duplicate',vm=>vm.push(vm.peek()));
    p('top',vm=>vm.push(vm.peek()));
    p('>control',vm=>{
      vm.control.push(vm.alloc(vm.pop()));vm.CSP=vm.control.length;
    });
    p('control>',vm=>{
      const address=vm.control.at(-1);
      if(address===undefined||vm.frames.has(address))throw Error('no saved control value');
      vm.control.pop();vm.CSP=vm.control.length;vm.push(vm.cells[address]);
    });
    const isWith=cell=>cell.type==='tag'&&cell.name==='with'&&cell.value==='with';
    p('with?',vm=>pushValue(vm,isWith(vm.pop())));
    p('data-index',vm=>{
      const key=vm.pop();
      if(key.type!=='tag')throw Error('expected tag');
      for(let i=vm.DSP-1;i>=0;i--){
        if(vm.cells[vm.data[i]].name===key.value){pushValue(vm,vm.DSP-i);return;}
      }
      throw Error('Data variable not found, named '+key.value);
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
    p('void.literal',vm=>vm.push({name:'',type:'void',value:null}));
    p('something?',vm=>pushValue(vm,vm.pop().type!=='void'));
    p('nothing?',vm=>pushValue(vm,vm.pop().type==='void'));
    p('=',vm=>{
      const b=vm.pop(),a=vm.pop();
      pushValue(vm,a.type===b.type&&a.value===b.value);
    });
    p('scope.enter',vm=>vm.scopes().push(new Map()));
    p('scope.leave',vm=>{
      const scopes=vm.scopes();if(scopes.length<2)throw Error('scope underflow');scopes.pop();
    });
    p('local.create',vm=>{
      const name=vm.pop().value;vm.scopes().at(-1).set(name,{...vm.pop(),name});
    });
    p('local.read',vm=>{
      const name=vm.pop().value;vm.push(vm.findLocal(name).get(name));
    });
    p('local.write',vm=>{
      const name=vm.pop().value;vm.findLocal(name).set(name,{...vm.pop(),name});
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
    // A symbolic verb resolves the current dictionary entry; a bound
    // verb retains the code address captured by tag.to-verb.
    // All calls go through the VM, never a nested host invoke().
    const callName=(vm,name)=>{
      const entry=vm.words.get(name);
      if(entry!==undefined)vm.call(entry);
    };
    const callVerb=(vm,cell)=>{
      if(cell.type!=='verb')throw Error('expected verb');
      if(cell.value===null)callName(vm,cell.name);
      else vm.call(cell.value);
    };
    const textName=cell=>{
      if(cell.type==='tag'||(cell.type==='literal'&&typeof cell.value==='string'))
        return cell.value;
      throw Error('expected text or tag');
    };
    const pushVerb=(vm,name,bound=false)=>{
      const entry=vm.words.get(name);
      vm.push(entry===undefined
        ? {name:'',type:'void',value:null}
        : {name,type:'verb',value:bound?entry:null});
    };
    p('run',vm=>{
      const cell=vm.peek();
      if(cell.type==='void'||(cell.type==='literal'&&typeof cell.value==='boolean'))return;
      if(cell.type==='tag'){vm.pop();callName(vm,cell.name);return;}
      if(cell.type==='verb'){vm.pop();callVerb(vm,cell);return;}
      runBlock(vm,vm.pop());
    });
    p('tag.run',vm=>{
      const cell=vm.pop();
      if(cell.type!=='tag')throw Error('expected tag');
      callName(vm,cell.value);
    });
    p('text.run',vm=>{
      const name=textName(vm.pop());
      if(!vm.words.has(name))throw Error('undefined verb: '+name);
      callName(vm,name);
    });
    p('&',vm=>{
      const right=textName(vm.pop()),left=textName(vm.pop());
      pushValue(vm,left+right);
    });
    const runtimeLiteral=cell=>({name:'',type:'runtime-literal',value:{...cell}});
    // Captured runtime values are Cells, not host closures. The existing
    // image encoder deliberately rejects this runtime-only instruction.
    const runnableCode=(vm,instructions)=>{
      const entry=vm.cells.length;
      for(const instruction of instructions)vm.alloc(instruction);
      vm.alloc({name:'',type:'return',value:null});
      return entry;
    };
    p('attach',vm=>{
      const target=vm.pop(),value=vm.pop();
      if(target.type!=='block')throw Error('expected block');
      const instructions=[runtimeLiteral(value)];
      // In the historical threaded code, a verb Cell is an executable
      // instruction, not a quoted value. Preserve late or bound invocation.
      if(value.type==='verb')instructions.push(vm.resolve('run'));
      instructions.push(runtimeLiteral(target),vm.resolve('run'));
      const entry=runnableCode(vm,instructions);
      vm.push({name:'attach',type:'block',value:entry});
    });
    p('define-verb',vm=>{
      const code=vm.pop(),name=vm.pop();
      if(name.type!=='tag'||code.type!=='block')throw Error('expected tag and block');
      const entry=runnableCode(vm,[runtimeLiteral(code),vm.resolve('run')]);
      vm.words.set(name.value,entry);
    });
    p('definitions',vm=>{
      const fields=Array.from(vm.words,([name,value])=>({name,type:'literal',value}));
      vm.push({name:'definitions',type:'object',value:{klass:'stack',fields,extensible:true}});
    });
    p('verb.exist?',vm=>pushValue(vm,vm.words.has(textName(vm.pop()))));
    p('definition',vm=>{
      const cell=vm.pop();
      const name=cell.type==='verb'?cell.name:textName(cell);
      const entry=vm.words.get(name);
      if(entry===undefined)throw Error('undefined definition: '+name);
      pushValue(vm,entry);
    });
    // The current dictionary lookup is uncached. These historical cache
    // hints need not create a second source of truth for inherited dispatch.
    p('update-method-cache',vm=>{
      const entry=vm.pop(),method=vm.pop(),klass=vm.pop();
      if(!Number.isInteger(entry.value)||!vm.cells[entry.value]||
          method.type!=='tag'||klass.type!=='tag')throw Error('invalid method cache hint');
    });
    p('clear-method-cache',vm=>{
      const method=vm.pop(),klass=vm.pop();
      if(method.type!=='tag'||klass.type!=='tag')throw Error('invalid method cache clear');
    });
    p('missing-method',vm=>{throw Error('missing-method '+textName(vm.pop()));});
    p('global.write',vm=>{
      const address=vm.pop();
      if(address.type!=='global-address'||vm.cells[address.value]?.type!=='runtime-literal')
        throw Error('invalid global address');
      vm.cells[address.value].value={...vm.pop(),name:vm.cells[address.value].value.name};
    });
    p('make.global',vm=>{
      const value=vm.pop(),name=vm.pop();
      if(name.type!=='tag')throw Error('expected global name');
      const entry=runnableCode(vm,[runtimeLiteral({...value,name:name.value})]);
      const setter=runnableCode(vm,[runtimeLiteral({name:'',type:'global-address',value:entry}),
        vm.resolve('global.write')]);
      vm.words.set(name.value,entry);vm.words.set(name.value+'!',setter);
    });
    p('as-tag',vm=>vm.push({name:'tag',type:'tag',value:textName(vm.pop())}));
    p('as-verb',vm=>pushVerb(vm,textName(vm.pop())));
    p('text.as-verb',vm=>{
      const name=textName(vm.pop());
      if(vm.words.has(name))pushVerb(vm,name);
      else vm.push({name:'noop',type:'verb',value:null});
    });
    p('tag.to-verb',vm=>{
      const cell=vm.pop();
      if(cell.type!=='tag')throw Error('expected tag');
      pushVerb(vm,cell.value,true);
    });
    // Direct historical class-qualified lookup, without a parallel
    // JavaScript class hierarchy or a premature method cache.
    const receiverClass=cell=>{
      if(cell.type==='object')return cell.value.klass;
      if(['tag','verb','void','block'].includes(cell.type))return cell.type;
      if(cell.type==='literal'){
        if(typeof cell.value==='number')return Number.isInteger(cell.value)?'integer':'float';
        if(typeof cell.value==='string')return 'text';
        if(typeof cell.value==='boolean')return 'boolean';
        if(cell.value===null)return 'void';
      }
      throw Error('unsupported method receiver');
    };
    p('type-of',vm=>{
      const cell=vm.pop(),klass=receiverClass(cell);
      const name=cell.type==='object'||klass==='text'||klass==='block'?'reference':klass;
      vm.push({name:'type',type:'tag',value:name});
    });
    p('block.run',vm=>runBlock(vm,vm.pop()));
    p('control-depth',vm=>pushValue(vm,vm.CSP));
    p('class-of',vm=>vm.push({name:'class',type:'tag',value:receiverClass(vm.pop())}));
    p('name-of',vm=>vm.push({name:'name',type:'tag',value:vm.pop().name}));
    const tagValue=cell=>{
      if(cell.type!=='tag')throw Error('expected tag');
      return cell.value;
    };
    p('rename',vm=>{
      const name=tagValue(vm.pop());
      vm.push({...vm.pop(),name});
    });
    // The fixed-object length includes its class/length descriptor.
    // Fields are Cells in top-to-bottom stack order; references share
    // the native payload even when their Cell names change.
    p('make.object',vm=>{
      const header=vm.peek(),length=header.value;
      if(header.type!=='literal'||!Number.isInteger(length)||length<1||length>vm.DSP)
        throw Error('invalid object length');
      vm.pop();
      const fields=[];
      for(let i=1;i<length;i++)fields.push({...vm.pop()});
      vm.push({name:header.name,type:'object',value:{klass:header.name,fields,extensible:false}});
    });
    p('make.extensible-object',vm=>{
      const header=vm.pop();
      if(header.type!=='literal'||!Number.isInteger(header.value)||header.value<0)
        throw Error('invalid object capacity');
      vm.push({name:header.name,type:'object',
        value:{klass:header.name,fields:[],extensible:true}});
    });
    const objectPayload=cell=>{
      if(cell.type!=='object')throw Error('expected Inox object');
      return cell.value;
    };
    p('extend-object',vm=>{objectPayload(vm.pop()).extensible=true;});
    p('stack.length',vm=>{
      const payload=objectPayload(vm.pop());
      // Historical fixed header includes itself; extended length does not.
      pushValue(vm,payload.fields.length+(payload.extensible?0:1));
    });
    p('stack.fetch',vm=>{
      const payload=objectPayload(vm.pop());
      let index=vm.pop().value;
      if(!Number.isInteger(index))throw Error('invalid stack index');
      if(index<0)index+=payload.fields.length;
      if(index<0||index>=payload.fields.length)throw Error('stack.fetch, index out of range');
      vm.push(payload.fields[index]);
    });
    p('stack.push',vm=>{
      const value=vm.pop(),payload=objectPayload(vm.pop());
      if(!payload.extensible)throw Error("Can't extend a non extensible stack");
      payload.fields.push({...value});
    });
    const field=(obj,key)=>{
      if(obj.type==='void')return undefined;
      if(obj.type!=='object')throw Error('expected Inox object');
      return obj.value.fields.find(c=>c.name===key);
    };
    p('object.@',vm=>{
      const key=tagValue(vm.pop()),obj=vm.pop(),found=field(obj,key);
      if(found)vm.push(found);
      else if(obj.type==='void')vm.push(obj);
      else throw Error('Object variable not found, named '+key);
    });
    p('object.?@',vm=>{
      const obj=vm.pop(),key=tagValue(vm.pop());
      vm.push(field(obj,key)??{name:'',type:'void',value:null});
    });
    p('object.!',vm=>{
      const key=tagValue(vm.pop()),obj=vm.pop(),value=vm.pop();
      const found=field(obj,key);
      if(!found)throw Error('Object variable not found, named '+key);
      Object.assign(found,value,{name:key});
    });
    // Maps reuse the ordinary ordered Cell payload, not a separate
    // JavaScript class registry.
    p('map.!',vm=>{
      const map=vm.pop(),key=tagValue(vm.pop()),value=vm.pop();
      const payload=objectPayload(map),found=field(map,key);
      if(found)Object.assign(found,value,{name:key});
      else{
        if(!payload.extensible)throw Error("Can't extend a non extensible map");
        payload.fields.push({...value,name:key});
      }
    });
    p('map.?@',vm=>{
      const map=vm.pop(),key=vm.pop();
      const found=map.type==='object'&&key.type==='tag'?field(map,key.value):undefined;
      vm.push(found??{name:'',type:'void',value:null});
    });
    const dispatchMethod=(vm,name)=>{
      const klass=receiverClass(vm.peek()),qualified=klass+'.'+name;
      const entry=vm.words.get(qualified);
      if(entry!==undefined){vm.call(entry);return;}
      const fallback=vm.words.get(klass)??vm.words.get('thing');
      if(fallback===undefined)throw Error('unresolved method: '+qualified);
      vm.push({name:klass,type:'tag',value:klass});
      vm.push({name,type:'tag',value:name});
      vm.call(fallback);
    };
    p('run-method',vm=>{
      const method=vm.pop();
      if(method.type!=='tag')throw Error('expected method tag');
      dispatchMethod(vm,method.value);
    });
    p('run-method-by-name',vm=>dispatchMethod(vm,textName(vm.pop())));
    p('class-method-tag',vm=>{
      const klass=vm.pop(),method=vm.pop();
      if(klass.type!=='tag'||method.type!=='tag')throw Error('expected class and method tags');
      const name=klass.value+'.'+method.value;
      vm.push({name,type:'tag',value:name});
    });
    // Historical verb.run does not consume the verb Cell.
    p('verb.run',vm=>callVerb(vm,vm.peek()));
    // Like the reference runtime, bind the target in the called block's
    // dynamic frame; nested calls can read it, and return restores outer it.
    p('run-with-it',vm=>{
      const block=vm.pop(),target=vm.pop();
      runBlock(vm,block);
      vm.scopes().at(-1).set('it',{...target,name:'it'});
    });
    // The image stores scalar names plus a symbolic primitive, not native
    // tags or binary Cells. At runtime tags carry their own name.
    p('tag.literal',vm=>{
      const name=vm.pop().value;
      if(typeof name!=='string'||!name)throw Error('expected tag name');
      vm.push({name,type:'tag',value:name});
    });
    // One formal-binding protocol for the current frame (parameters)
    // and a new block frame (run-with-parameters).
    const bindParameters=(vm,end,enter)=>{
      const at=i=>vm.cells[vm.data[i]];
      let sentinel=end-1;
      while(sentinel>=0){
        const cell=at(sentinel);
        if(cell.type!=='tag')throw Error('expected formal parameter tag or with');
        if(isWith(cell))break;
        sentinel--;
      }
      if(sentinel<0)throw Error('missing with sentinel');
      const count=end-sentinel-1,first=sentinel-count;
      if(first<0)throw Error('insufficient actual arguments');
      if(enter)enter();
      const locals=vm.scopes().at(-1);
      for(let i=0;i<count;i++){
        const name=at(sentinel+1+i).name;
        locals.set(name,{...at(first+i),name});
      }
      vm.data.length=first;vm.DSP=first;
    };
    p('parameters',vm=>bindParameters(vm,vm.DSP));
    p('run-with-parameters',vm=>{
      const block=vm.peek();
      if(block.type!=='block'||!Number.isInteger(block.value))throw Error('expected block');
      bindParameters(vm,vm.DSP-1,()=>runBlock(vm,block));
    });
    p('it',vm=>vm.push(vm.findLocal('it').get('it')));
    p('it!',vm=>vm.findLocal('it').set('it',{...vm.pop(),name:'it'}));

    p('if',vm=>{
      const block=vm.pop(),condition=vm.pop().value;if(condition)runBlock(vm,block);
    });
    p('block.return',vm=>vm.returnFrame());
    p('assert-checker',vm=>{
      if(vm.pop().value!==true)throw Error('Assertion failed');
    });
    const assertBlock=vm=>{
      const block=vm.pop();
      if(block.type!=='block')throw Error('expected assertion block');
      vm.call(vm.words.get('assert-checker'));
      runBlock(vm,block);
    };
    p('assert',assertBlock);
    p('assert{',assertBlock); // historical bootstrap alias


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
      vm.push({ name: '', type: 'literal', value: vm.nextToken({definitionBoundary:true}) }));
    p('def.begin', vm => {
      if (vm.definition) throw new Error('nested definition not supported');
      let name = vm.pop().value;
      if(vm.tokens[vm.cursor]==='{' &&
          vm.tokenPositions[vm.cursor-1].start+name.length===vm.tokenPositions[vm.cursor].start){
        vm.nextToken();name+='{';
      }
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
