#!/usr/bin/env node
/**
 * Observational probes for Inox issue #34. These are not a normative grammar:
 * they make the current minimal runtime's behaviour reproducible for the audit.
 */
import { spawnSync } from "node:child_process";

const cases = [
  ["definition-dot", 'to a "dot" out. a'],
  ["definition-semicolon", 'to a "semicolon" out; a'],
  ["implicit-top-level-to", 'to a "A" out\nto b "B" out.\na b'],
  ["indented-to", 'to a "A" out\n  to b "B" out.\na b'],
  ["prefix-infix", 'out( 1 + 2 )'],
  ["keyword-call", 'to say:to: >dest >msg, out( "Say: " $msg & " to " & $dest ). say: "Hello" to: "Bob";'],
  ["historical-tell-to-shorthand", 'to tell-to/ with /m /d /{ out( "Tell " & $m & " to " && $d }'],
  ["local-create-retrieve-update", 'to local-probe >x 8 >x! $x out. 7 local-probe'],
  ["local-dollar-update", 'to local-probe >x 8 $x! $x out. 7 local-probe'],
  ["data-create-retrieve-update", 'to data-probe 7 :x 8 _x! _x out. data-probe'],
  ["equality", 'out( 1 = 1 )'],
  ["inequality", 'out( 1 <> 2 )'],
  ["legacy-equality-spelling", 'out( 1 =? 1 )'],
  ["tag-slash-prefix", 'out( /x )'],
  ["tag-slash-postfix", 'out( x/ )'],
  ["tag-hash", 'out( #x )'],
  ["named-literal-colon", 'out( x:3 )'],
  ["comma-space", 'out( &( "a", "b" ) )'],
  ["comma-no-space", 'out( &( "a","b" ) )'],
];

for (const [id, source] of cases) {
  const result = spawnSync(process.execPath, ["builds/inox.js", "-e", source], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  console.log(JSON.stringify({
    id,
    source,
    exit_status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  }));
}
