#!/usr/bin/env node
/**
 * vendor-engine.mjs — write the offline Mermaid engine into `dist/client.mermaid.js`.
 *
 * The engine is *vendored*, not fetched at runtime: the plugin has to render a
 * diagram on a machine with no route to the internet, so the bytes travel with
 * the package. This script is the only place that touches the upstream file,
 * and it is run by hand when the pinned Mermaid release changes.
 *
 * Usage:
 *   node scripts/vendor-engine.mjs --from <path/to/mermaid.min.js>
 *   node scripts/vendor-engine.mjs --from node_modules/mermaid/dist/mermaid.min.js
 *   node scripts/vendor-engine.mjs --from <path> --version 11.17.2
 *
 * The output is a dsh *package-local client chunk*: a classic script that
 * defines `globalThis.mermaid` and then registers itself with the page's
 * module loader under `chunk: 'client.mermaid.js'`, so dsh-client-modules
 * serves it from `/plugins/<package>/client.mermaid.js?rev=…` on demand.
 * The file also works as a plain `<script>` (the demo page and the benchmark
 * harness load it that way), which is why the registration is guarded.
 */

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

/** The chunk file name; dsh only serves package-local chunks named `client.*.js`. */
export const CHUNK_FILE = 'client.mermaid.js'

/** The plugin that owns the chunk (the module identity). */
const PLUGIN_ID = 'dsh-mermaid-preview'

/** Markers the check script slices the file at, to re-hash the engine bytes. */
export const ENGINE_BEGIN = '/* --- engine begin --- */'
export const ENGINE_END = '/* --- engine end --- */'

/**
 * Find the Mermaid release inside an engine bundle.
 *
 * The bundle carries several `version:"…"` fields (one per bundled library),
 * so the Mermaid one is the field whose module also exports `getVersion` —
 * that is how Mermaid exposes its own release.
 * @param {string} source - the engine bundle.
 * @returns {string|null} the version, or null when it cannot be found.
 */
export const detectVersion = (source) => {
  const matches = [...source.matchAll(/version:"(\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?)"/g)]
  const exported = matches
    .filter((match) => source.slice(match.index, match.index + 240).includes('getVersion'))
    .map((match) => match[1])
  if (exported.length > 0) return exported[0]
  const unique = [...new Set(matches.map((match) => match[1]))].filter((version) => version !== '0.0.0')
  return unique.length === 1 ? unique[0] : null
}

/**
 * The header written above the engine bytes.
 * @param {string} version - the vendored Mermaid release.
 * @param {string} hash - sha256 of the engine bytes.
 * @returns {string} the header block.
 */
const header = (version, hash) => `/*!
 * dsh-mermaid-preview — vendored Mermaid engine (offline).
 *
 * Mermaid ${version} — MIT License — https://github.com/mermaid-js/mermaid
 * Upstream file: mermaid@${version}/dist/mermaid.min.js
 * sha256(engine) = ${hash}
 *
 * Do not edit: regenerate with \`node scripts/vendor-engine.mjs --from <engine>\`.
 * The bytes between the engine markers are the upstream file, unmodified.
 */
`

/**
 * The registration appended after the engine bytes.
 *
 * The engine defines `globalThis.mermaid` on its own; the registration only
 * tells dsh's module loader that this file is the plugin's package-local
 * chunk, so `require.async('./client.mermaid.js')` can fetch and materialize
 * it. A page without a module loader (the demo, the benchmark) still gets
 * the engine, and an older loader that does not know chunks cannot break the
 * engine that is already in place.
 * @returns {string} the registration block.
 */
const registration = () => `
;(function () {
  var loader = typeof window === 'undefined' ? undefined : window.__ModuleLoader__
  if (loader === undefined || typeof loader.load !== 'function') return
  try {
    loader.load({
      id: ${JSON.stringify(PLUGIN_ID)},
      chunk: ${JSON.stringify(CHUNK_FILE)},
      factory: function (require) {
        var module = { exports: {} }
        var exports = module.exports
        exports.mermaid = globalThis.mermaid
        return module.exports
      }
    })
  } catch (error) {
    // A loader without chunk support rejects the registration; the engine is
    // already loaded, so the failure is not worth breaking the page over.
    console.warn('dsh-mermaid-preview: engine chunk registration failed', error)
  }
})()
`

/**
 * The engine bytes inside a chunk file: everything between the two markers.
 * @param {string} chunk - the chunk file's text.
 * @returns {string|null} the engine region, or null when the markers are absent.
 */
export const engineRegion = (chunk) => {
  const start = chunk.indexOf(`${ENGINE_BEGIN}\n`)
  if (start === -1) return null
  const from = start + ENGINE_BEGIN.length + 1
  const end = chunk.indexOf(ENGINE_END)
  if (end === -1 || end < from) return null
  return chunk.slice(from, end)
}

/**
 * Write the chunk file.
 * @param {string} engine - the upstream engine bytes.
 * @param {string} version - the vendored Mermaid release.
 * @param {string} outFile - where to write the chunk.
 * @returns {{file: string, hash: string, bytes: number}} what was written.
 */
export const writeChunk = (engine, version, outFile) => {
  // The markers own their own lines, so the region is the upstream file
  // verbatim (plus the newline that ends it, if it lacked one).
  const payload = engine.endsWith('\n') ? engine : `${engine}\n`
  const hash = createHash('sha256').update(payload).digest('hex')
  const text = `${header(version, hash)}${ENGINE_BEGIN}\n${payload}${ENGINE_END}\n${registration()}`
  mkdirSync(dirname(outFile), { recursive: true })
  writeFileSync(outFile, text)
  return { file: outFile, hash, bytes: Buffer.byteLength(text) }
}

const invokedDirectly = process.argv[1] !== undefined
  && pathToFileURL(resolve(process.argv[1])).href === import.meta.url

if (invokedDirectly) {
  const fromIndex = process.argv.indexOf('--from')
  const versionIndex = process.argv.indexOf('--version')
  const from = fromIndex === -1 ? undefined : process.argv[fromIndex + 1]
  if (from === undefined) {
    console.error('usage: node scripts/vendor-engine.mjs --from <path/to/mermaid.min.js> [--version X.Y.Z]')
    process.exit(2)
  }
  const source = resolve(root, from)
  if (!existsSync(source)) {
    console.error(`vendor-engine: no such file: ${source}`)
    process.exit(2)
  }
  const engine = readFileSync(source, 'utf8')
  const version = versionIndex === -1 ? detectVersion(engine) : process.argv[versionIndex + 1]
  if (version === null) {
    console.error('vendor-engine: cannot detect the Mermaid version; pass --version X.Y.Z')
    process.exit(2)
  }
  if (!engine.includes(`"${version}"`)) {
    console.error(`vendor-engine: the engine does not mention version ${version}`)
    process.exit(2)
  }
  const written = writeChunk(engine, version, join(root, 'dist', CHUNK_FILE))
  console.log(`✓ wrote ${written.file} (${written.bytes} bytes, engine sha256 ${written.hash})`)
}
