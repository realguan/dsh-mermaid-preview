#!/usr/bin/env node
/**
 * build-client-bundle.mjs — produce the NATIVE bundle client half.
 *
 * dsh installs this package two ways, and they need different artifacts:
 *
 *   1. Dynamic runner (session-internal, `cordis_define`/`cordis_run`): wants
 *      the raw plugin as a function body — `dist/dsh-mermaid-preview.client.js`
 *      (built by build-dynamic.mjs). NOT used by `dsh plugin add`.
 *
 *   2. Native profile bundle (`dsh plugin --profile web add <pkg>`): the web
 *      profile's `client-modules` loader discovers the package by resolving
 *      `./package.json`, then serves `/plugins/<id>/client.js` and executes it
 *      in the browser. Every such bundle MUST call
 *      `window.__ModuleLoader__.load({ id, factory })` with a CommonJS factory
 *      `(require) => { ... return module.exports }` — this is the exact shape
 *      tsdown's `clientBundle()` emits in the dsh monorepo (see
 *      @deepseek-ai/dsh-client-modules and packages/client/tsdown.client.ts).
 *
 * `src/client.js` is a dependency-free ESM module (`export default {apply}`); it
 * imports nothing and only touches Cordis `ctx`. This script therefore bundles
 * it by wrapping: it rewrites the module body so `module.exports` carries the
 * plugin object (named `apply`, mirroring how dsh's own native client plugins
 * export apply), and stamps the `__ModuleLoader__.load` wrapper on top.
 *
 * Usage:
 *   node scripts/build-client-bundle.mjs            # write dist/client.js (+ map next to it if srcmap off)
 *   node scripts/build-client-bundle.mjs --verify   # write + node --check the artifact
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(root, 'src', 'client.js')
const OUT = join(root, 'dist', 'dsh-mermaid-preview.bundle.js')
const PLUGIN_ID = 'dsh-mermaid-preview'

const source = readFileSync(SRC, 'utf8')

// Verify the source still has the shape this bundler expects. `export default`
// must appear exactly once and be a plain object literal (it is today).
const exportMatch = /\nexport default\s*(\{)/.exec(source)
if (exportMatch === null) {
  throw new Error(`${SRC}: could not locate the \`export default\` object literal this bundler wraps`)
}

// 1. Replace the `export default` keyword with the module-level constant that
//    becomes the plugin record. The object literal body and its closing `}`
//    are untouched.
const body = source.replace('export default', 'const __plugin = ')

// 2. Emit the plugin record's `apply` behind the SAME factory shape Cordis's
//    browser loader consumes: module.exports carries named `apply` (+ `inject`
//    when present on the plugin object), plus the __esModule interop marker so
//    `unwrapExports` returns the object tree unchanged.
const tail = `
// ---- native client-modules handoff ----
module.exports.__esModule = true
if (__plugin.apply !== undefined) module.exports.apply = __plugin.apply
if (__plugin.inject !== undefined) module.exports.inject = __plugin.inject
if (__plugin.name !== undefined) module.exports.name = __plugin.name
`

const moduleCore = `${body}\n${tail}`

// 3. Wrap in the __ModuleLoader__.load factory (byte-for-byte the banner/footer
//    tsdown.client.ts emits). Null-require shim keeps any accidental bare
//    require from throwing a distant ReferenceError — a real miss would still
//    be caught by the module table at cordis mount.
const banner = `window.__ModuleLoader__.load({ id: ${JSON.stringify(PLUGIN_ID)}, factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
`
const footer = `
return module.exports; } });
`

const bundle = banner + moduleCore + footer

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, bundle)
console.log(`✓ wrote ${OUT} (${bundle.length} bytes, id=${PLUGIN_ID})`)

if (process.argv.includes('--verify')) {
  const result = spawnSync(process.execPath, ['--check', OUT], { encoding: 'utf8' })
  if (result.status !== 0) {
    console.error(`✗ syntax check failed: ${OUT}`)
    console.error(result.stderr)
    process.exit(1)
  }
  console.log(`✓ syntax ok: ${OUT}`)
}
