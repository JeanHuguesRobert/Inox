#!/usr/bin/env node
/*
 * bin/inox.js — minimal Inox CLI
 *
 *   inox              REPL
 *   inox file.nox     Evaluate the file
 *   inox -e "code"    Evaluate a one-line expression
 *   inox --version    Print version
 *   inox --help       Show usage
 *
 *   INOX_SMOKE=1      Run lib/test/smoke.nox after bootstrap
 *   INOX_VERBOSE=1    Don't suppress the bootstrap traces
 */

"use strict";

const fs   = require( "fs" );
const path = require( "path" );

const args = process.argv.slice( 2 );

function has_flag( name ) {
  return args.includes( name );
}

function flag_value( name ) {
  const i = args.indexOf( name );
  return i >= 0 && i + 1 < args.length ? args[ i + 1 ] : null;
}

if ( has_flag( "--help" ) || has_flag( "-h" ) ) {
  process.stdout.write(
`Usage: inox [options] [file.nox]

  inox                Start interactive REPL.
  inox file.nox       Evaluate the file, then exit.
  inox -e "code"      Evaluate one expression, then exit.
  inox --version      Print version and exit.
  inox --help         Show this message and exit.

Environment:
  INOX_SMOKE=1        Run lib/test/smoke.nox after bootstrap.
  INOX_VERBOSE=1      Don't suppress the bootstrap traces.
` );
  process.exit( 0 );
}

if ( has_flag( "--version" ) ) {
  const pkg = require( path.join( __dirname, "..", "package.json" ) );
  process.stdout.write( "inox " + ( pkg.version || "unknown" ) + "\n" );
  process.exit( 0 );
}

// Resolve user-supplied file path BEFORE chdir.
const expr      = flag_value( "-e" );
const file_arg  = args.find( ( a, i ) => ! a.startsWith( "-" ) && args[ i - 1 ] !== "-e" );
const file_abs  = file_arg ? path.resolve( file_arg ) : null;

// Suppress bootstrap traces unless INOX_VERBOSE=1.
let original_write;
if ( ! process.env.INOX_VERBOSE ) {
  original_write = process.stdout.write.bind( process.stdout );
  process.stdout.write = () => true;
}

// eval_file in inox.ts uses fs.readFileSync( "lib/" + name ), so the runtime
// must be loaded from the project root for bootstrap.nox / forth.nox / l9.nox
// to resolve. We have to chdir before requiring inox.js.
const project_root = path.join( __dirname, ".." );
process.chdir( project_root );

const { inox } = require( path.join( project_root, "builds", "lib", "inox.js" ) );

if ( original_write ) {
  process.stdout.write = original_write;
}

const I = inox();

if ( expr !== null ) {
  const result = I.evaluate( "~~\n" + expr );
  if ( result ) process.stdout.write( result + "\n" );
  process.exit( 0 );
}

if ( file_abs ) {
  const src    = fs.readFileSync( file_abs, "utf8" );
  const result = I.evaluate( "~~\n" + src );
  if ( result ) process.stdout.write( result + "\n" );
  process.exit( 0 );
}

// No args: REPL.
inox.repl();
