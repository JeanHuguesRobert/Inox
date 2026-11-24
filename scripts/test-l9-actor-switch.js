#!/usr/bin/env node
/*
 * 2026-11-24 — GPT-6 coding agent under Jean Hugues Noel Robert.
 * FBF: actor switching must save the outgoing registers *after* consuming
 * the incoming actor operand, then restore the incoming registers/stacks.
 * This exercises real TS function bodies with a mocked memory model.
 * It does not claim that the complete L9 task scheduler works.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const cwd=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(cwd,'lib/inox.ts'),'utf8');
function extract(name){
  const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const r=new RegExp(`function\\s+${escaped}\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}`);
  const m=source.match(r);
  assert.ok(m,`${name} not found`);
  return m[0].replace(/\s*:\s*Cell(?=\s*[,)])/g,'');
}
const sourceFunctions=[extract('actor_save_context'),extract('actor_restore_context'),extract('primitive_switch_actor')].join('\n');
const slots=new Map();
for (const [a,ds,cs,ip,tos,csp,task] of [
  [1000,1100,1200,11,22,33,7001],
  [2000,2100,2200,515,616,717,7002],
]) {
  slots.set(a+1,ds); slots.set(a+2,cs);slots.set(a+4,ip);
  slots.set(a+5,tos);slots.set(a+6,csp);slots.set(a+7,task);
}
const calls=[];
const context={
  ONE:1,check_de:true,ACTOR:1000,IP:107,TOS:113,CSP:119,
  ACTOR_data_stack:1100,ACTOR_control_stack:1200,
  ACTOR_data_stack_limit:1110,ACTOR_control_stack_limit:1210,
  mand_actor:(a)=>{calls.push('mand:'+a);return true},
  set_value:(a,v)=>{slots.set(a,v);calls.push('save:'+a)},
  get_integer:(a)=>slots.get(a),reference_of:(a)=>slots.get(a),
  stack_capacity:(a)=>a%100===0?100:10,
  pop_reference:()=>{calls.push('pop');context.TOS--;return 2000;},
  area_free:(a)=>{calls.push('release:'+a);},
};
const result=vm.runInNewContext(`${sourceFunctions}\nprimitive_switch_actor();\n({actor:ACTOR,ip:IP,tos:TOS,csp:CSP,data:ACTOR_data_stack,control:ACTOR_control_stack})`,context,{timeout:1200});
// The source actor is suspended with registers saved AFTER the pop.
assert.equal(slots.get(1004),107,'outgoing IP was not saved');
assert.equal(slots.get(1005),112,'outgoing TOS must exclude consumed target actor');
assert.equal(slots.get(1006),119,'outgoing control-stack pointer was not saved');
assert.equal(slots.get(1007),7001,'outgoing task reference was overwritten');
assert.equal(slots.get(2007),7002,'incoming task reference was overwritten');
assert.equal(result.actor,2000);
assert.equal(result.ip,515);assert.equal(result.tos,616);assert.equal(result.csp,717);
assert.equal(result.data,2100);assert.equal(result.control,2200);
assert.equal(calls[0],'pop','pop incoming actor before saving source context');
assert.ok(calls.indexOf('save:1004')>calls.indexOf('pop'));
assert.equal(calls.at(-1),'release:1000','VM must release outgoing actor pin after restoring destination');
console.log('L9 actor context-switch invariant: saved outgoing registers and restored incoming registers (1/1)');
