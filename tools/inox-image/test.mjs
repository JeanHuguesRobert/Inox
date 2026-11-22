/* 2026-11-22 — GPT-6 coding agent, under Jean Hugues Noël Robert's direction. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { build, readImage, cachePut, cachePath, plan, compose, run } from './core.mjs';
const root = fs.mkdtempSync(path.join(os.tmpdir(),'inox-image-test-'));
process.on('exit',()=>fs.rmSync(root,{recursive:true,force:true}));
const fixtures=path.join(import.meta.dirname,'examples');
const baseInput=JSON.parse(fs.readFileSync(path.join(fixtures,'base.json'),'utf8'));
const deltaInput=JSON.parse(fs.readFileSync(path.join(fixtures,'extension.json'),'utf8'));
const base=build(baseInput), basePath=path.join(root,'base.xnx');fs.writeFileSync(basePath,base);
const delta=build(deltaInput,{baseFile:basePath}),deltaPath=path.join(root,'delta.xnx');fs.writeFileSync(deltaPath,delta);
const store=path.join(root,'cache');
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
function withHash(bytes){const result=Buffer.from(bytes);result.fill(0,64,96);Buffer.from(digest(result),'hex').copy(result,64);return result}
function crc32(buf){let c=~0;for(const value of buf){c^=value;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (~c)>>>0}
function withModifiedCell(buffer,transform){const b=Buffer.from(buffer);const sectionTable=128, sectionOffset=b.readUInt32LE(sectionTable+8), size=b.readUInt32LE(sectionTable+12);transform(b,sectionOffset);b.writeUInt32LE(crc32(b.subarray(sectionOffset,sectionOffset+size)),sectionTable+28);return withHash(b)}

test('XNX naming is canonical, binary magic and image format remain unchanged',()=>{
  const id=readImage(base).digest;
  assert.ok(basePath.endsWith('.xnx'));
  assert.ok(deltaPath.endsWith('.xnx'));
  assert.ok(cachePath(root,id).endsWith('.xnx'));
  assert.equal(base.subarray(0,8).toString('ascii'),'INOXIMG\0');
  const renamed=path.join(root,'unchanged-by-rename.xnx');
  fs.copyFileSync(basePath,renamed);
  assert.equal(readImage(renamed).digest,id);
  assert.ok(fs.readFileSync(renamed).equals(base));
});
test('deterministic base and delta bytes and digest',()=>{
  assert.ok(base.equals(build(baseInput)));assert.ok(delta.equals(build(deltaInput,{baseFile:basePath})));
  assert.equal(readImage(base).kind,'base');assert.equal(readImage(delta).kind,'delta');
  assert.equal(readImage(delta).base,readImage(base).digest);
  assert.ok(base.length<2048 && delta.length<2048);
  assert.equal(delta.readUInt32LE(16),2);
  assert.equal(delta.subarray(96,128).toString('hex'),readImage(base).digest);
});
test('M1 canonical Cell/profile vectors preserved',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(import.meta.dirname,'../../test/conformance/micro/manifest.json'),'utf8'));
  for(const v of manifest.vectors.filter(x=>x.operation==='pack_info')){
    const expected=(((v.input.type<<28)>>>0)|v.input.name)>>>0;
    assert.equal('0x'+expected.toString(16).padStart(8,'0'),v.expected_info_hex,v.id);
  }
  const ci=readImage(base).sections.get(1).data;
  assert.equal(ci.readUInt32LE(4),0x20000000,'literal Cell type must match micro-v0');
  assert.equal(ci.readUInt32LE(12),0x60000000,'primitive Cell type must match micro-v0');
});
test('cache misses only extensions when base is already installed',()=>{
  assert.equal(plan(deltaPath,store).missing.length,2);
  const one=cachePut(basePath,store);assert.equal(one.bytesAddedToCache,base.length);
  assert.deepEqual(plan(deltaPath,store).missing,[readImage(delta).digest]);
  const two=cachePut(deltaPath,store);assert.equal(two.bytesAddedToCache,delta.length);
  assert.equal(cachePut(deltaPath,store).bytesAddedToCache,0);
  assert.deepEqual(plan(deltaPath,store).missing,[]);
  assert.equal(plan(deltaPath,store).currentArtifactBytesToSend,0);
});
test('delta calls immutable definition in base, runs result 42',()=>{
  const combo=compose(deltaPath,store);
  assert.equal(combo.images.length,2);
  assert.equal(combo.definitions.size,2);
  assert.deepEqual(run(deltaPath,store).stack,[42]);
  assert.equal(run(deltaPath,store,{entry:'answer'}).result,42);
});
test('execution budget limits programs deterministically',()=>{
  assert.throws(()=>run(deltaPath,store,{budget:1}),/INOX_YIELDED_BUDGET/);
});
test('no compatible cached base means no activation',()=>{
  assert.throws(()=>compose(deltaPath,path.join(root,'no-cache')),/INOX_E_BASE_MISMATCH/);
});
test('container rejects bad magic, corrupt digest, invalid header',()=>{
  const b1=Buffer.from(delta);b1[0]=0;assert.throws(()=>readImage(b1),/INOX_E_BAD_IMAGE/);
  const b2=Buffer.from(delta);b2[64]^=1;assert.throws(()=>readImage(b2),/INOX_E_IMAGE_HASH/);
  const b3=Buffer.from(delta);b3.writeUInt32LE(33,24);assert.throws(()=>readImage(withHash(b3)),/INOX_E_BAD_IMAGE/);
});
test('container rejects corrupted section CRC even with legitimate hash',()=>{
  const b=Buffer.from(delta);b[b.readUInt32LE(136)]^=1;
  assert.throws(()=>readImage(withHash(b)),/CRC32/);
});
test('container rejects altered base digest even with correct file hash',()=>{
  const b=Buffer.from(delta);b[96]^=1;
  assert.throws(()=>readImage(withHash(b)),/BASE_MISMATCH/);
});
test('container rejects corrupt primitive binding under fresh hash/checksum',()=>{
  const b=withModifiedCell(delta,(bytes,offset)=>bytes.writeUInt32LE(999,offset+16));
  assert.throws(()=>readImage(b),/INOX_E_BAD_PRIMITIVE/);
});
test('image rejects invalid references, definitions, metadata & unknown primitives',()=>{
  assert.throws(()=>build({...deltaInput,definitions:[{name:'answer',instructions:[{call:'absent'}]}]},{baseFile:basePath}),/unresolved verb/);
  assert.throws(()=>build({...deltaInput,definitions:[{name:'answer',instructions:[{primitive:'network.fetch'}]}]},{baseFile:basePath}),/unsupported primitive/);
  assert.throws(()=>build({...deltaInput,definitions:[{name:'add_two',instructions:[{literal:1}]}]},{baseFile:basePath}),/overridden definition/);
  assert.throws(()=>build({...deltaInput,definitions:[{name:'answer',instructions:[{literal:2147483648}]}]},{baseFile:basePath}),/invalid integer literal/);
});
test('cache verifies present entries rather than trusting their filename',()=>{
  const bad=path.join(root,'corrupt-cache');fs.mkdirSync(bad);
  const fake=path.join(bad,`sha256-${readImage(delta).digest}.xnx`);
  fs.writeFileSync(fake,base);
  assert.throws(()=>plan(deltaPath,bad),/INOX_E_IMAGE_HASH/);
  assert.throws(()=>cachePut(deltaPath,bad),/INOX_E_IMAGE_HASH/);
});
test('absence of mutation in verified base',()=>{
  const original=Buffer.from(base);
  run(deltaPath,store);
  assert.ok(original.equals(fs.readFileSync(basePath)));
  assert.equal(readImage(fs.readFileSync(basePath)).digest,readImage(base).digest);
});
