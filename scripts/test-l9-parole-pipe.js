// 2026-11-27 — GPT-6.2 under JHR, Inox #42.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('..',import.meta.url));
const cases=[
 ['sequential submissions and idle state','to p make.parole-template >t { >next >v $v 2 * $next .resolve drop } $t .may drop $t .pipe >q 7 $q .submit .value out 9 $q .submit .value out $q .active? out $q .pending-count out. p','141800'],
 ['pending input waits for previous completion','global: saved/ is: _; to p make.parole-template >t { >next >v $v out if: ( $v 1 = ) then: { $next saved! } else: { $v $next .resolve drop }; } $t .may drop $t .pipe >q 1 $q .submit >a 2 $q .submit >b 3 $q .submit >c $q .pending-count out $b .settled? out 7 saved .resolve drop $a .value out $b .value out $c .value out $q .pending-count out. p','120237230'],
 ['failed run does not stop queued runs','global: saved/ is: _; to p make.parole-template >t { >next >v if: ( $v 1 = ) then: { $next saved! } else: { $v $next .resolve drop }; } $t .may drop $t .pipe >q 1 $q .submit >a 2 $q .submit >b false saved .reject drop $a .outcome .failed? out $a .outcome .error out $b .value out $q .active? out. p','1020'],
 ['reentrant submission stays behind already queued input','global: saved/ is: _; global: pq/ is: _; to p make.parole-template >t { >next >v $v out if: ( $v 1 = ) then: { $next saved! } else: { $v $next .resolve drop }; } $t .may drop $t .pipe pq! 1 pq .submit >a 2 pq .submit >b { >ctx >event "R" out 3 pq .submit drop } $a .on drop 7 saved .resolve drop $b .value out pq .pending-count out. p','1R2320'],
 ['100 queued synchronous completions drain iteratively','global: saved/ is: _; global: first-depth/ is: _; global: last-depth/ is: _; to p make.parole-template >t { >next >v if: ( $v 0 = ) then: { $next saved! } else: { control-depth >d $d last-depth! if: ( $v 1 = ) then: { $d first-depth! }; $v $next .resolve drop }; } $t .may drop $t .pipe >q 0 $q .submit drop from: 1 to: 99 do: { ii $q .submit drop }; 100 $q .submit >last $q .pending-count out 0 saved .resolve drop $last .value out first-depth last-depth = out $q .pending-count out. p','10010010'],
 ['throwing result observer does not stall subsequent input','global: saved/ is: _; to p make.parole-template >t { >next >v if: ( $v 1 = ) then: { $next saved! } else: { $v $next .resolve drop }; } $t .may drop $t .pipe >q 1 $q .submit >a 2 $q .submit >b 3 $q .submit >c { >ctx >event /observer-failure raise } $b .on drop 7 saved .resolve drop $a .value out $b .value out $c .value out $q .active? out. p','7230'],
 ['typed multiple values survive queue','to p make.parole-template >t { >next >event $event $next .settle drop } $t .will drop $t .pipe >q array[] >xs $xs 7 array.push $xs 9 array.push false _ $xs make.outcome $q .invoke .outcome .values >v 0 $v array.get out 1 $v array.get out. p','79'],
 ['queued invocation captures current template steps','global: saved/ is: _; to p make.parole-template >t { >next >v if: ( $v 1 = ) then: { $next saved! } else: { $v $next .resolve drop }; } $t .may drop $t .pipe >q 1 $q .submit >a 2 $q .submit >b { >next >v $v 10 * $next .resolve drop } $t .may drop 3 $q .submit >c 7 saved .resolve drop $a .value out "," out $b .value out "," out $c .value out. p','7,2,30'],
 ['another actor may complete an active run','global: saved/ is: _; to worker 9 saved .resolve drop. to p make.parole-template >t { >next >v if: ( $v 1 = ) then: { $next saved! } else: { $v $next .resolve drop }; } $t .may drop $t .pipe >q 1 $q .submit >a 2 $q .submit >b l9-root .spawn( worker/ as-verb definition ) >w $w .resume l9-root .join drop $a .value out $b .value out $q .active? out. p','920'],
];
for(const [name,source,expected] of cases){
 const r=spawnSync(process.execPath,['bin/inox.js','-e',source],{cwd,encoding:'utf8',timeout:20000,env:{...process.env,INOX_WITH_L9:'1',INOX_L9:'0',INOX_FULL:'0'}});
 assert.equal(r.status,0,`${name}: ${r.stdout} ${r.stderr}`);
 assert.doesNotMatch(r.stdout+r.stderr,/FATAL:|missing-verb|Assert failure|Invalid return/);
 assert.equal(r.stdout,expected,name);console.log('PASS '+name);
}
console.log(`L9 Parole pipe: ${cases.length}/${cases.length}`);
