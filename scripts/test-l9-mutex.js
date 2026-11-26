// 2026-11-24: GPT-6 under Jean Hugues Noel Robert, Inox #42.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('..',import.meta.url));
const cases=[
 ['free acquisition and recursive rejection','to p false make.mutex >m $m .promise .resolved? out $m .owner-id out $m .promise .rejected? out $m .release drop $m .entered? out $m .owner-id out. p','11100'],
 ['initially entered FIFO','to p true make.mutex >m $m .promise >a $m .promise >b $m .release drop $a .resolved? out $b .resolved? out $m .release drop $b .resolved? out $m .release drop $m .entered? out. p','1010'],
 ['closed rejection','to p true make.mutex >m $m .promise >a $m .close drop $a .rejected? out $m .promise .rejected? out $m .closed? out $m .owner-id out $m .close drop $m .release drop. p','1110'],
 ['actual actor FIFO ownership','global: mx/ is: _; to a mx .promise >p $p .resolved? out l9-dispatch-next $p .resolved? out mx .owner-id out mx .promise .rejected? out mx .release drop. to b mx .promise >p $p .resolved? out l9-dispatch-next $p .resolved? out mx .owner-id out mx .release drop. to p false make.mutex mx! mx .promise drop l9-root .spawn( a/ as-verb definition ) >ta l9-root .spawn( b/ as-verb definition ) >tb $ta .resume $tb .resume l9-dispatch-next mx .owner-id out mx .release drop l9-dispatch-next mx .entered? out mx .owner-id out. p','0011211300'],
];
for(const [name,source,expected] of cases){const r=spawnSync(process.execPath,['bin/inox.js','-e',source],{cwd,encoding:'utf8',timeout:10000,env:{...process.env,INOX_WITH_L9:'1',INOX_FULL:'0',INOX_L9:'0'}});assert.equal(r.status,0,`${name}: ${r.stdout} ${r.stderr}`);assert.doesNotMatch(r.stdout+r.stderr,/FATAL:|missing-verb|Assert failure|Invalid return/);assert.equal(r.stdout,expected,name);}
console.log(`L9 Mutex: ${cases.length}/${cases.length}`);
