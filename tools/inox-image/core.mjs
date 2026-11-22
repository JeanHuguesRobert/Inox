/*
 * Host-only Inox Micro v0 image/definition-layer prototype.
 * 2026-11-22 — GPT-6 coding agent, under Jean Hugues Noël Robert's direction.
 * Implements the published 128-byte header, 32-byte section descriptors,
 * Cell layout, CRC32, SHA256, base-bound immutable definition extensions.
 * No change to the historical JS VM or the unimplemented C++/ESP32 runtime.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const HEADER = 128, ENTRY = 32, MAX = 64 * 1024 * 1024;
const ZERO = Buffer.alloc(32);
const TYPES = Object.freeze({ VOID: 0, INTEGER: 2, VERB: 5, PRIMITIVE: 6 });
const SECTIONS = Object.freeze({ CELLS: 1, MUTABLE: 2, SYMBOLS: 3, IMPORTS: 4, METADATA: 6 });
const magic = Buffer.from('INOXIMG\0');
export const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const primitiveNames = new Map([[2, 'halt'], [3, 'return'], [10, 'integer-add']]);
const primitiveIds = new Map([...primitiveNames].map(([id, name]) => [name, id]));
const uint = (n, msg) => { if (!Number.isSafeInteger(n) || n < 0 || n > 0xffffffff) throw Error(msg); return n >>> 0; };
const requireObject = (v, what) => { if (!v || Array.isArray(v) || typeof v !== 'object') throw Error(`invalid ${what}`); return v; };
const align8 = n => (n + 7) & ~7;
function crc32(buf) {
  let c = ~0;
  for (const value of buf) {
    c ^= value;
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0);
  }
  return (~c) >>> 0;
}
function cell(type, value, name = 0) {
  if (!Number.isInteger(type) || type < 0 || type > 15) throw Error('invalid Cell type');
  uint(name, 'invalid Cell name');
  if (name > 0x0fffffff) throw Error('Cell name too large');
  const b = Buffer.alloc(8);
  b.writeUInt32LE(uint(value, 'invalid Cell value'), 0);
  b.writeUInt32LE((((type << 28) >>> 0) | name) >>> 0, 4);
  return b;
}
const handle = offset => (0x10000000 | uint(offset, 'invalid Cell offset')) >>> 0;
function symbolsSection(symbols) {
  const strings = symbols.map(x => Buffer.from(x, 'utf8'));
  let bytes = 0;
  const b = Buffer.alloc(4 + 4 * (symbols.length + 1) + strings.reduce((n, s) => n + s.length, 0));
  b.writeUInt32LE(symbols.length, 0);
  strings.forEach((s, i) => { b.writeUInt32LE(bytes, 4 + 4*i); s.copy(b, 4 + 4*(symbols.length + 1) + bytes); bytes += s.length; });
  b.writeUInt32LE(bytes, 4 + 4*symbols.length);
  return Buffer.concat([b, Buffer.alloc(align8(b.length) - b.length)]);
}
function importsSection(usedIds, symbols) {
  const b = Buffer.alloc(usedIds.length * 8);
  usedIds.forEach((id, i) => {
    const symbol = symbols.indexOf(primitiveNames.get(id));
    if (symbol < 0) throw Error('primitive symbol missing');
    b.writeUInt32LE(id, i*8); b.writeUInt32LE(symbol, i*8+4);
  });
  return b;
}
export function readImage(fileOrBuffer) {
  const b = Buffer.isBuffer(fileOrBuffer) ? fileOrBuffer : fs.readFileSync(fileOrBuffer);
  if (b.length < HEADER + ENTRY || b.length > MAX || !b.subarray(0,8).equals(magic)) throw Error('INOX_E_BAD_IMAGE: header');
  if (b.readUInt16LE(8) !== 1 || b.readUInt16LE(10) !== 0 || b.readUInt32LE(12) !== HEADER || b.readUInt32LE(20) !== 8 || b.readUInt32LE(28) !== HEADER || b.readUInt32LE(36) !== 0x10000) throw Error('INOX_E_IMAGE_VERSION');
  const flags = b.readUInt32LE(16), count = b.readUInt32LE(24);
  if (![1,2].includes(flags) || count < 1 || count > 32 || b.readUInt32LE(32) !== b.length || b.readUInt32LE(60) !== 0) throw Error('INOX_E_BAD_IMAGE: header fields');
  const tableEnd = HEADER + count * ENTRY;
  if (tableEnd > b.length) throw Error('INOX_E_IMAGE_BOUNDS: table');
  const rawHash = Buffer.from(b); rawHash.fill(0,64,96);
  const digest = hash(rawHash);
  if (digest !== b.subarray(64,96).toString('hex')) throw Error('INOX_E_IMAGE_HASH');
  const base = b.subarray(96,128).toString('hex');
  if ((flags === 1 && base !== ZERO.toString('hex')) || (flags === 2 && base === ZERO.toString('hex'))) throw Error('INOX_E_BASE_MISMATCH: header');
  const ranges = [], sections = new Map();
  for (let i=0; i<count; i++) {
    const p=HEADER+i*ENTRY, type=b.readUInt32LE(p), sectionFlags=b.readUInt32LE(p+4), offset=b.readUInt32LE(p+8), stored=b.readUInt32LE(p+12), logical=b.readUInt32LE(p+16), region=b.readUInt32LE(p+20), cellOffset=b.readUInt32LE(p+24), checksum=b.readUInt32LE(p+28);
    if (sectionFlags!==0 || stored!==logical || offset < tableEnd || offset+stored > b.length || sections.has(type) || ranges.some(([a,z])=>offset<z && offset+stored>a)) throw Error('INOX_E_IMAGE_SECTION: bounds/flags');
    if ([1,2,8].includes(type) && (offset%8 || stored%8)) throw Error('INOX_E_IMAGE_SECTION: alignment');
    if (![1,2,3,4,5,6,7,8].includes(type) && type<0x80000000) throw Error('INOX_E_IMAGE_SECTION: unknown required');
    const data=b.subarray(offset,offset+stored);
    if (crc32(data)!==checksum) throw Error('INOX_E_IMAGE_SECTION: CRC32');
    sections.set(type,{type,offset,stored,region,cellOffset,data}); ranges.push([offset,offset+stored]);
  }
  for (const id of flags===1?[1,2,3,4,6]:[1,3,4,6]) if (!sections.has(id)) throw Error('INOX_E_IMAGE_SECTION: required '+id);
  const cells=sections.get(1);
  if(cells.region!==1 || sections.get(3).region!==0 || sections.get(4).region!==0) throw Error('INOX_E_IMAGE_SECTION: region');
  const meta = JSON.parse(sections.get(6).data.toString('utf8'));
  if (meta.schema!=='inox.definition-layer.v0' || meta.profile!=='inox-micro-v0' || !Array.isArray(meta.definitions) || meta.cell_offset!==cells.cellOffset || meta.cell_count*8!==cells.data.length) throw Error('INOX_E_BAD_IMAGE: metadata');
  if (meta.base_sha256 !== (flags===1?null:base)) throw Error('INOX_E_BASE_MISMATCH: metadata');
  if (b.readUInt32LE(40)!==handle(meta.entry_offset)) throw Error('INOX_E_BAD_IMAGE: entry');
  if(flags===1 && cells.cellOffset!==0) throw Error('INOX_E_BAD_IMAGE: base offset');
  // 2026-11-22 — GPT-6 under Jean Hugues Robert: verify semantic metadata,
  // not merely an honestly hashed but structurally invalid container.
  const declared = new Map();let cursor=cells.cellOffset;
  for(const d of meta.definitions){
    if(!d||typeof d.name!=='string'||!/^[a-zA-Z][\w.-]*$/.test(d.name)||declared.has(d.name)||d.offset!==cursor||!Number.isInteger(d.length)||d.length<1)throw Error('INOX_E_BAD_IMAGE: definition offsets');
    declared.set(d.name,d.offset);cursor+=d.length;
  }
  if(cursor!==cells.cellOffset+cells.data.length/8 || ![...declared.values()].includes(meta.entry_offset))throw Error('INOX_E_BAD_IMAGE: entry/definitions');
  const sd=sections.get(3).data,ic=sd.readUInt32LE(0);
  if(ic<1 || 4+4*(ic+1)>sd.length)throw Error('INOX_E_IMAGE_SECTION: symbols');
  const names=[];const pos=4+4*(ic+1),total=sd.readUInt32LE(4+4*ic);
  if(pos+total>sd.length||sd.readUInt32LE(4)!==0)throw Error('INOX_E_IMAGE_SECTION: symbol bounds');
  for(let i=0;i<ic;i++){const a=sd.readUInt32LE(4+i*4),z=sd.readUInt32LE(8+i*4);if(a>z||z>total)throw Error('INOX_E_IMAGE_SECTION: symbol order');names.push(sd.subarray(pos+a,pos+z).toString('utf8'))}
  if(names[0]!==''||new Set(names).size!==names.length)throw Error('INOX_E_IMAGE_SECTION: symbols unique');
  const imports=sections.get(4).data;
  if(imports.length%8)throw Error('INOX_E_IMAGE_SECTION: primitive imports');
  const imported=new Set();let last=-1;
  for(let i=0;i<imports.length;i+=8){const id=imports.readUInt32LE(i),symbol=imports.readUInt32LE(i+4);
    if(id<=last||symbol>=names.length||names[symbol]!==primitiveNames.get(id))throw Error('INOX_E_IMAGE_SECTION: primitive binding');
    imported.add(id);last=id;
  }
  const used=new Set();
  for(let i=0;i<cells.data.length;i+=8){const v=cells.data.readUInt32LE(i),t=cells.data.readUInt32LE(i+4)>>>28;
    if(t===TYPES.PRIMITIVE){if(!primitiveNames.has(v))throw Error('INOX_E_BAD_PRIMITIVE');used.add(v)}
    else if(t===TYPES.VERB){if((v>>>28)!==1 || (v&0x0fffffff)>=cells.cellOffset+cells.data.length/8)throw Error('INOX_E_BAD_HANDLE: verb')}
    else if(t!==TYPES.INTEGER)throw Error('INOX_E_INVALID_CELL: instruction');
  }
  if(used.size!==imported.size || [...used].some(id=>!imported.has(id)))throw Error('INOX_E_IMAGE_SECTION: import mismatch');
  return {bytes:b,digest,base:flags===1?null:base,kind:flags===1?'base':'delta',meta,sections,entry:meta.entry_offset,cellCount:cells.data.length/8,byteLength:b.length};
}
function packageImage({kind,baseDigest=null,absoluteOffset,compiled,meta,usedIds}) {
  const cellBytes=Buffer.concat(compiled);
  const symbols=['',...new Set([...meta.definitions.map(x=>x.name),...usedIds.map(id=>primitiveNames.get(id))])].sort((a,b)=>a===''?-1:b===''?1:a<b?-1:a>b?1:0);
  const used=usedIds.toSorted((a,b)=>a-b);
  const imports=importsSection(used,symbols);
  const entries=[
    {type:1,data:cellBytes,region:1,cellOffset:absoluteOffset},
    ...(kind==='base'?[{type:2,data:Buffer.alloc(8),region:2,cellOffset:0}]:[]),
    {type:3,data:symbolsSection(symbols),region:0,cellOffset:0},
    {type:4,data:imports,region:0,cellOffset:0},
    {type:6,data:Buffer.from(JSON.stringify(meta)),region:0,cellOffset:0},
  ];
  let offset=align8(HEADER+entries.length*ENTRY);
  for(const e of entries){e.offset=offset;offset=align8(offset+e.data.length)}
  if(offset>MAX)throw Error('INOX_E_BAD_IMAGE: too large');
  const b=Buffer.alloc(offset);
  magic.copy(b,0);b.writeUInt16LE(1,8);b.writeUInt16LE(0,10);b.writeUInt32LE(128,12);b.writeUInt32LE(kind==='base'?1:2,16);b.writeUInt32LE(8,20);b.writeUInt32LE(entries.length,24);b.writeUInt32LE(128,28);b.writeUInt32LE(b.length,32);b.writeUInt32LE(0x10000,36);b.writeUInt32LE(handle(meta.entry_offset),40);
  b.writeUInt32LE(8,44);b.writeUInt32LE(32,48);b.writeUInt32LE(32,52);b.writeUInt32LE(1,56);
  if(baseDigest) Buffer.from(baseDigest,'hex').copy(b,96);
  entries.forEach((e,i)=>{const p=HEADER+i*ENTRY;b.writeUInt32LE(e.type,p);b.writeUInt32LE(e.offset,p+8);b.writeUInt32LE(e.data.length,p+12);b.writeUInt32LE(e.data.length,p+16);b.writeUInt32LE(e.region,p+20);b.writeUInt32LE(e.cellOffset,p+24);b.writeUInt32LE(crc32(e.data),p+28);e.data.copy(b,e.offset)});
  const c=Buffer.from(b);c.fill(0,64,96);Buffer.from(hash(c),'hex').copy(b,64);
  readImage(b);return b;
}
export function build(source, {baseFile=null}={}) {
  requireObject(source,'definition source');
  const parent=baseFile?readImage(baseFile):null;
  if(parent && parent.kind!=='base')throw Error('first prototype accepts an immutable base, not a delta chain');
  const kind=parent?'delta':'base';
  if(!Array.isArray(source.definitions) || source.definitions.length===0 || !source.definitions.every(d=>d&&typeof d.name==='string'&&/^[a-zA-Z][\w.-]*$/.test(d.name)&&Array.isArray(d.instructions)&&d.instructions.length>0))throw Error('invalid definitions');
  const defs=source.definitions.toSorted((a,b)=>a.name<b.name?-1:a.name>b.name?1:0);
  const parentDefs=parent?.meta.definitions||[];
  const allNames=new Set(parentDefs.map(x=>x.name));
  for (const d of defs){if(allNames.has(d.name))throw Error('duplicate/overridden definition '+d.name);allNames.add(d.name)}
  const offset=parent?parent.meta.cell_offset+parent.cellCount:0;
  let start=offset; const entries=[];
  for(const d of defs){const len=d.instructions.length+1;entries.push({name:d.name,offset:start,length:len});start+=len}
  const index=new Map([...parentDefs,...entries].map(x=>[x.name,x.offset]));
  const output=[],used=new Set();
  for(const d of defs){
    for(const ins of d.instructions){requireObject(ins,'instruction');
      if (Object.keys(ins).length!==1)throw Error('one instruction opcode required');
      if('literal' in ins){const v=ins.literal;if(!Number.isInteger(v)||v<-2147483648||v>2147483647)throw Error('invalid integer literal');output.push(cell(TYPES.INTEGER,v>>>0))}
      else if('primitive' in ins){const id=primitiveIds.get(ins.primitive);if(id===undefined)throw Error('unsupported primitive '+ins.primitive);used.add(id);output.push(cell(TYPES.PRIMITIVE,id))}
      else if('call' in ins){const to=index.get(ins.call);if(to===undefined)throw Error('unresolved verb '+ins.call);output.push(cell(TYPES.VERB,handle(to)))}
      else throw Error('unknown instruction form');
    }
    used.add(3);output.push(cell(TYPES.PRIMITIVE,3));
  }
  const entryName=source.entry||defs[0].name;
  const entryOffset=index.get(entryName);
  if(entryOffset===undefined)throw Error('invalid entry');
  const meta={schema:'inox.definition-layer.v0',profile:'inox-micro-v0',name:source.name||'definitions',base_sha256:parent?.digest||null,cell_offset:offset,cell_count:output.length,entry_offset:entryOffset,definitions:entries};
  return packageImage({kind,baseDigest:parent?.digest,absoluteOffset:offset,compiled:output,meta,usedIds:[...used]});
}
export function cachePath(directory,digest){if(!/^[0-9a-f]{64}$/.test(digest))throw Error('invalid hash');return path.join(directory,`sha256-${digest}.inoximg`)}
export function cachePut(file,directory){const img=readImage(file);fs.mkdirSync(directory,{recursive:true});const dest=cachePath(directory,img.digest);if(fs.existsSync(dest)){if(readImage(dest).digest!==img.digest)throw Error('INOX_E_IMAGE_HASH: corrupted cache');return {digest:img.digest,bytesAddedToCache:0,path:dest}}fs.writeFileSync(dest,img.bytes,{flag:'wx'});return {digest:img.digest,bytesAddedToCache:img.byteLength,path:dest}}
function cached(directory,digest){const p=cachePath(directory,digest);if(!fs.existsSync(p))return false;if(readImage(p).digest!==digest)throw Error('INOX_E_IMAGE_HASH: corrupted cache');return true}
export function plan(imageFile,directory){const img=readImage(imageFile),missing=[];if(img.base && !cached(directory,img.base))missing.push(img.base);if(!cached(directory,img.digest))missing.push(img.digest);return {image:img.digest,base:img.base,missing,currentArtifactBytesToSend:cached(directory,img.digest)?0:img.byteLength};}
export function compose(imageFile,directory){const img=readImage(imageFile);if(img.kind==='base')return {images:[img],definitions:new Map(img.meta.definitions.map(d=>[d.name,d])),cells:[...splitCells(img)]};const baseFile=cachePath(directory,img.base);if(!fs.existsSync(baseFile))throw Error('INOX_E_BASE_MISMATCH: missing base in cache');const base=readImage(baseFile);if(base.digest!==img.base || base.kind!=='base'||img.meta.cell_offset!==base.cellCount)throw Error('INOX_E_BASE_MISMATCH: composition');const definitions=new Map([...base.meta.definitions,...img.meta.definitions].map(d=>[d.name,d]));const targets=new Set([...definitions.values()].map(d=>d.offset));for(const x of splitCells(img)){if(x.type===TYPES.VERB && !targets.has(x.value&0x0fffffff))throw Error('INOX_E_BAD_HANDLE: unresolved cross-image call')}return {images:[base,img],definitions,cells:[...splitCells(base),...splitCells(img)]};}
function* splitCells(img){const b=img.sections.get(1).data;for(let p=0;p<b.length;p+=8)yield {value:b.readUInt32LE(p),type:b.readUInt32LE(p+4)>>>28,name:b.readUInt32LE(p+4)&0x0fffffff}}
export function run(imageFile,directory,{entry=null,budget=1000}={}){
  const co=compose(imageFile,directory),img=co.images.at(-1),start=entry?co.definitions.get(entry)?.offset:img.entry;
  if(start===undefined)throw Error('entry definition missing');
  const data=[],returns=[];let ip=start,steps=0;
  while(steps++<budget){const ins=co.cells[ip];if(!ins)throw Error('INOX_E_BAD_HANDLE: instruction');ip++;
    if(ins.type===2){data.push(ins.value|0);continue}
    if(ins.type===5){returns.push(ip);ip=ins.value&0x0fffffff;continue}
    if(ins.type!==6)throw Error('INOX_E_INVALID_INSTRUCTION: cell type '+ins.type);
    if(ins.value===3){if(!returns.length)return {result:data.at(-1)??null,stack:data,executed:steps,sourceDigest:img.digest};ip=returns.pop();continue}
    if(ins.value===2)return {result:data.at(-1)??null,stack:data,executed:steps,sourceDigest:img.digest};
    if(ins.value===10){if(data.length<2)throw Error('INOX_E_STACK_UNDERFLOW');const y=data.pop(),x=data.pop(),r=x+y;if(r>2147483647||r< -2147483648)throw Error('INOX_E_INTEGER_OVERFLOW');data.push(r);continue}
    throw Error('INOX_E_BAD_PRIMITIVE: '+ins.value);
  }
  throw Error('INOX_YIELDED_BUDGET: '+budget);
}
