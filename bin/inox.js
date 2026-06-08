#!/usr/bin/env node
/*
 * bin/inox.js — Inox CLI launcher (ESM)
 *
 *   inox              minimal REPL (bootstrap + forth core)
 *   inox file.nox     Run script (sync, minimal core, exits after)
 *   inox -e "code"    Eval one-liner (sync)
 *   inox --version
 *   inox --help
 *
 * For the full l9+stdlib (WIP/buggy): INOX_WITH_L9=1 inox ...
 *
 * This thin launcher chdirs to the package root (so lib/*.nox resolve)
 * then uses the public API. For the lowest-level sync CLI behaviour you can
 * also invoke directly: node builds/inox.js file.nox
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const args = process.argv.slice( 2 );

function has_flag( name ) { return args.includes( name ); }
function flag_value( name ) {
  const i = args.indexOf( name );
  return (i >= 0 && i + 1 < args.length) ? args[ i + 1 ] : null;
}

if ( has_flag( "--help" ) || has_flag( "-h" ) ) {
  process.stdout.write(
`Usage: inox [options] [file.nox | -e CODE]

  inox                 Start minimal REPL (core only, no l9).
  inox file.nox        Run the .nox script to completion (synchronous).
  inox -e "code"       Evaluate code then exit.
  inox --version
  inox --help

Environment:
  INOX_WITH_L9=1       Try full bootstrap (l9.nox + stdlib; currently crashes).
  INOX_L9_FILE=foo.nox With WITH_L9: load custom l9 file instead (for
                       selective testing of e.g. class hierarchy building
                       by providing a minimal .nox containing only the
                       relevant prefix + class{ sections; bypasses full l9).
  INOX_TEST=1          Legacy alias for minimal + default to lib/test.nox.
  INOX_VERBOSE=1       Do not suppress bootstrap traces.
`);
  process.exit( 0 );
}

if ( has_flag( "--version" ) || has_flag( "-v" ) ) {
  const pkgPath = path.join( __dirname, "..", "package.json" );
  const pkg = JSON.parse( fs.readFileSync( pkgPath, "utf8" ) );
  process.stdout.write( "inox " + (pkg.version || "0.4.0") + " (minimal CLI)\n" );
  process.exit( 0 );
}

const expr = flag_value( "-e" ) || flag_value( "--eval" );
const file_arg = args.find( ( a, i ) => !a.startsWith( "-" ) && args[ i - 1 ] !== "-e" && args[ i - 1 ] !== "--eval" );
const file_abs = file_arg ? path.resolve( file_arg ) : null;

// Suppress bootstrap banner unless verbose.
let original_write;
if ( ! process.env.INOX_VERBOSE ) {
  original_write = process.stdout.write.bind( process.stdout );
  process.stdout.write = () => true;
}

// Must chdir so that eval_file("lib/xxx.nox") inside the runtime finds them.
const project_root = path.join( __dirname, ".." );
process.chdir( project_root );

// Dynamic import because builds/inox.js is ESM (package "type":"module").
// On Windows absolute paths for import() must be file:// URLs.
const { inox } = await import( pathToFileURL( path.join( project_root, "builds", "inox.js" ) ).href );

if ( original_write ) {
  process.stdout.write = original_write;
}

const I = inox();

if ( expr !== null ) {
  // One liner: use processor for sync behaviour consistent with file runs.
  // (evaluate also works but the new run path is preferred for CLI.)
  const code = "~~\n" + expr;  // literate friendly
  I.processor( "{}", "{}", code );
  process.exit( 0 );
}

if ( file_abs ) {
  const src = fs.readFileSync( file_abs, "utf8" );
  I.processor( "{}", "{}", src );
  process.exit( 0 );
}

// No target: minimal REPL.
if ( typeof I.repl === "function" ) {
  I.repl();
} else {
  console.error( "REPL not available in this build" );
  process.exit( 1 );
}
