// 2026-11-26: GPT-6.2 under Jean Hugues Noel Robert, Inox #42.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('..',import.meta.url));
const cases=[
 ['release of unheld Lock and Mutex is a no-op','to p 0 make.lock >m $m .release drop $m .count out false make.mutex >x $x .release drop $x .entered? out. p','00'],
 ['recursive acquisition and balanced release','to p 0 make.lock >m $m .promise .resolved? out $m .count out $m .promise .resolved? out $m .count out $m .release drop $m .count out $m .release drop $m .entered? out $m .owner-id out. p','1112100'],
 ['initial depth owned by creator','to p 2 make.lock >m $m .owner-id out $m .count out $m .promise .resolved? out $m .count out $m .release drop $m .release drop $m .release drop $m .entered? out. p','12130'],
 ['closure resets state and rejects future acquisition','to p 2 make.lock >m $m .close drop $m .count out $m .owner-id out $m .entered? out $m .promise .rejected? out $m .closed? out $m .release drop $m .close drop. p','00011'],
 ['signal aliases release','to p 1 make.lock >m $m .signal drop $m .count out $m .entered? out. p','00'],
 ['FIFO transfer waits for last release and new owner can reenter','global: lk/ is: _; to a lk .promise >p $p .resolved? out l9-dispatch-next $p .resolved? out lk .owner-id out lk .count out lk .promise .resolved? out lk .count out lk .release drop lk .count out lk .release drop. to b lk .promise >p $p .resolved? out l9-dispatch-next $p .resolved? out lk .owner-id out lk .count out lk .release drop. to p 2 make.lock lk! l9-root .spawn( a/ as-verb definition ) >ta l9-root .spawn( b/ as-verb definition ) >tb $ta .resume $tb .resume l9-dispatch-next lk .release drop lk .owner-id out lk .count out lk .release drop l9-dispatch-next lk .entered? out lk .owner-id out lk .count out. p','0011121121131000'],
 ['queued acquisitions rejected on closure','global: lk/ is: _; to a lk .promise >p l9-dispatch-next $p .rejected? out $p reject-reason/ object.@ out. to p 1 make.lock lk! l9-root .spawn( a/ as-verb definition ) >ta $ta .resume l9-dispatch-next lk .close drop l9-dispatch-next lk .count out lk .owner-id out. p','1closed00'],
 ['callback observes grant state before settlement','to p 0 make.lock >m { >lock $lock .count out $lock .owner-id out $lock .promise .resolved? out $lock .count out _ } _ $m .then drop $m .release drop $m .release drop $m .count out. p','11120'],
];
let passed=0;
for(const [name,source,expected] of cases){
 const r=spawnSync(process.execPath,['bin/inox.js','-e',source],{cwd,encoding:'utf8',timeout:15000,env:{...process.env,INOX_WITH_L9:'1',INOX_FULL:'0',INOX_L9:'0'}});
 assert.equal(r.status,0,`${name}: ${r.stdout} ${r.stderr}`);
 assert.doesNotMatch(r.stdout+r.stderr,/FATAL:|missing-verb|Assert failure|Invalid return/);
 assert.equal(r.stdout,expected,name); console.log('PASS '+name); passed++;
}
console.log(`L9 Lock: ${passed}/${cases.length}`);
