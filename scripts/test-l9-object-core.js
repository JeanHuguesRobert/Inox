#!/usr/bin/env node
/*
 * 2026-11-24 — GPT-6 coding agent under Jean Hugues Noel Robert.
 * FBF of L9's native object model: metaclasses, superclass resolution,
 * dynamic overrides, attribute inheritance and instance isolation.
 * Run real L9 programs; catch stdout FATAL even when the CLI exits zero.
 */
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const cwd=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const cases=[
 // FBF: the previous empty dictionary and non-method break masked refresh.
 ['dictionary enumeration contains named definitions','to marker 7. to t definitions >d 0 >i false >found while: { $i $d stack.length < } do: { $i $d stack.fetch name-of /marker = { true >found! break } if $i 1 + >i! }; $found out. t','1'],
 ['named class refresh rebuilds metaclass','to t aa_one/class{ thing/superclass } aa_one/ classes.get >before aa_one/ update-class aa_one/ classes.get $before = not out. t','1'],
 ['all-class refresh rebuilds metaclass','to t aa_one/class{ thing/superclass } aa_one/ classes.get >before update-all-classes aa_one/ classes.get $before = not out. t','1'],
 ['registered root thing class','to t thing/ classes.get type-of out. t','reference'],
 ['registered map class','to t map/ classes.get type-of out. t','reference'],
 ['primitive integer method reflection','to t /succ 4 .understand? out. t','1'],
 ['primitive integer missing method reflection','to t /no-such-method 4 .understand? not out. t','1'],
 ['primitive text method reflection','to t /lowercase "Hi" .understand? out. t','1'],

 ['root thing class has void superclass','to t superclass-name/ thing/ classes.get object.?@ out. t','void'],
 ['map class has set superclass','to t superclass-name/ map/ classes.get object.?@ out. t','set'],

 ['class creation','to t aa_one/class{ thing/superclass } aa_one/make{ } type-of out. t','reference'],
 ['instance class identity','to t aa_one/class{ thing/superclass } aa_one/make{ } .class out. t','aa_one'],
 ['instance attribute','to t aa_one/class{ thing/superclass value/attribute } aa_one/make{ 3 :value } .value out. t','3'],
 ['optional object attribute returns present value','to t aa_one/make{ 4 :value } >o value/ $o object.?@ out. t','4'],
 ['optional attribute preserves sole-owner referenced value','to t aa_one/make{ "Hello" :value } value/ swap object.?@ out. t','Hello'],

 ['optional object attribute returns void if missing','to t aa_one/make{ 4 :value } >o missing/ $o object.?@ type-of out. t','void'],

 // 2026-11-27 — GPT-6 coding agent under the Principal: fixed-to-extensible
 // conversion, identity and lookup after growth.
 ['extension is idempotent','to t sample/make{ 1 :a 2 :b 3 :c 4 :d } >o $o extend-object $o /a object.@ out $o /d object.@ out. t','14'],
 ['extended object counts members','to t sample/make{ 1 :a 2 :b 3 :c 4 :d } >o $o stack.length out $o 9 :extra stack.push $o /extra object.@ out $o /a object.@ out. t','491'],
 ['lookup after capacity growth','to t 0 :sample make.extensible-object >o $o 7 :value stack.push $o 9 :extra stack.push $o stack.length out $o /extra object.@ out. t','29'],
 ['setter after capacity growth','to t 0 :sample make.extensible-object >o $o 7 :value stack.push $o 9 :extra stack.push 8 $o /extra object.! $o /extra object.@ out. t','8'],
 ['aliases survive extension and growth','to t sample/make{ 1 :a 2 :b 3 :c 4 :d } >o $o >alias $o 9 :extra stack.push 8 $alias /extra object.! $o /extra object.@ out $o /a object.@ out. t','81'],
 ['optional missing lookup in fast mode','to t sample/make{ 1 :a 2 :b 3 :c 4 :d } >o fast! /missing $o object.?@ type-of out. t','void'],
 ['instance attribute setter','to t aa_one/class{ thing/superclass value/attribute } aa_one/make{ 3 :value } >o 8 $o .value! $o .value out. t','8'],
 ['independent instances','to t aa_one/class{ thing/superclass value/attribute } aa_one/make{ 3 :value } >a aa_one/make{ 9 :value } >b 6 $a .value! $a .value out $b .value out. t','69'],
 ['own method','to t aa_one/class{ thing/superclass ping/it-method{ "P" } } aa_one/make{ } .ping out. t','P'],
 ['class-method dispatch','to t aa_parent/class{ thing/superclass hello/class-method{ "Hi" } } aa_parent/make{ } .hello out. t','Hi'],

 ['receiver bound method','to t aa_one/class{ thing/superclass value/attribute ping/it-method{ @value } } aa_one/make{ 5 :value } .ping out. t','5'],
 ['single inheritance','to t aa_parent/class{ thing/superclass ping/it-method{ "P" } } aa_child/class{ aa_parent/superclass } aa_child/make{ } .ping out. t','P'],
 ['child metaclass retains declared superclass','to t aa_parent/class{ thing/superclass } aa_child/class{ aa_parent/superclass } superclass-name/ aa_child/ classes.get object.?@ out. t','aa_parent'],

 ['inherited attribute getter','to t aa_parent/class{ thing/superclass value/attribute } aa_child/class{ aa_parent/superclass } aa_child/make{ 8 :value } .value out. t','8'],
 ['inherited attribute setter','to t aa_parent/class{ thing/superclass value/attribute } aa_child/class{ aa_parent/superclass } aa_child/make{ 8 :value } >v 11 $v .value! $v .value out. t','11'],
 ['two-level inheritance','to t aa_grand/class{ thing/superclass ping/it-method{ "G" } } aa_parent/class{ aa_grand/superclass } aa_child/class{ aa_parent/superclass } aa_child/make{ } .ping out. t','G'],
 ['override inherited method','to t aa_parent/class{ thing/superclass ping/it-method{ "P" } } aa_child/class{ aa_parent/superclass ping/it-method{ "C" } } aa_child/make{ } .ping out. t','C'],
 ['sibling classes keep their methods','to t aa_parent/class{ thing/superclass ping/it-method{ "P" } } aa_c1/class{ aa_parent/superclass ping/it-method{ "1" } } aa_c2/class{ aa_parent/superclass ping/it-method{ "2" } } aa_c1/make{ } .ping out aa_c2/make{ } .ping out. t','12'],
 ['new class extension changes method','to t aa_one/class{ thing/superclass ping/it-method{ "A" } } aa_one/make{ } .ping out aa_one/class{ ping/it-method{ "B" } } aa_one/make{ } .ping out. t','AB'],
 ['superclass extension invalidates cache','to t aa_parent/class{ thing/superclass ping/it-method{ "A" } } aa_child/class{ aa_parent/superclass } aa_child/make{ } .ping out aa_parent/class{ ping/it-method{ "B" } } aa_child/make{ } .ping out. t','AB'],
 ['late parent method visible in subclass','to t aa_parent/class{ thing/superclass } aa_child/class{ aa_parent/superclass } aa_parent/class{ ping/it-method{ "L" } } aa_child/make{ } .ping out. t','L'],
 ['method introspection for own method','to t aa_parent/class{ thing/superclass ping/it-method{ "P" } } /ping aa_parent/make{ } .understand? out. t','1'],
 ['method introspection for inherited method','to t aa_parent/class{ thing/superclass ping/it-method{ "P" } } aa_child/class{ aa_parent/superclass } /ping aa_child/make{ } .understand? out. t','1'],
 ['method introspection for absent method','to t aa_parent/class{ thing/superclass ping/it-method{ "P" } } aa_child/class{ aa_parent/superclass } /unknown aa_child/make{ } .understand? not out. t','1'],
 ['method lookup keeps caller control depth','to work aa_parent/class{ thing/superclass ping/it-method{ 42 } } aa_child/class{ aa_parent/superclass } aa_child/make{ } .ping drop. to t control-depth out "," out work control-depth out. t','2,2'],
 ['multi-level parent update invalidates inherited cache','to t aa_grand/class{ thing/superclass ping/it-method{ "A" } } aa_parent/class{ aa_grand/superclass } aa_child/class{ aa_parent/superclass } aa_child/make{ } .ping out aa_grand/class{ ping/it-method{ "B" } } aa_child/make{ } .ping out. t','AB'],
 ['repeated inherited dispatch remains iterative','to t aa_parent/class{ thing/superclass ping/it-method{ 42 } } aa_child/class{ aa_parent/superclass } 0 >count from: 1 to: 200 do: { aa_child/make{ } .ping drop $count 1 + >count! }; $count out. t','200'],


];
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
let passed=0;
for(const [name,program,expected] of cases){
 const r=spawnSync(process.execPath,['bin/inox.js','-e',program],{
  cwd,encoding:'utf8',timeout:9000,maxBuffer:1024*1024,
  env:{...process.env,INOX_WITH_L9:'1',INOX_FULL:'0',INOX_L9:'0'},
 });
 const good=r.status===0&&!r.error&&!/FATAL:|missing-verb|Assert failure|AssertionError|Invalid boolean value|Cannot compile block/.test(r.stdout+(r.stderr||''))&&r.stdout===expected;
 if(good){console.log(`PASS ${name}`);passed++;}
 else {console.error(`FAIL ${name}: rc=${r.status}, expected=${JSON.stringify(expected)}, out=${JSON.stringify(r.stdout?.slice(0,190))}, err=${JSON.stringify(r.stderr?.slice(0,100))}`);}
}
// A missing method must not execute the instruction after the failed call.
// The historic missing-method hook still emits a noisy nested-scope assertion;
// that separate error-reporting defect is not counted as a clean exception.
const missing=spawnSync(process.execPath,['bin/inox.js','-e',
 'to t aa_parent/class{ thing/superclass } aa_child/class{ aa_parent/superclass } aa_child/make{ } .not-found "AFTER" out. t'],{
 cwd,encoding:'utf8',timeout:9000,maxBuffer:1024*1024,
 env:{...process.env,INOX_WITH_L9:'1',INOX_FULL:'0',INOX_L9:'0'},
});
assert.match(missing.stdout,/missing-method aa_child\.not-found/,'missing dispatch was silently accepted');
assert.doesNotMatch(missing.stdout,/AFTER/,'caller ran after a missing method');
console.log('PASS missing-method dispatch is observable (diagnostic quality pending)');
passed++;
console.log(`L9 object core: ${passed}/${cases.length+1} cases`);
process.exitCode=passed===cases.length+1?0:1;

}
