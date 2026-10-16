#!/usr/bin/env node
/**
 * build.mjs — derive the two client artifacts from `src/client.js`.
 *
 * dsh consumes a client plugin in two different shapes, and both are generated
 * from the same canonical source:
 *
 *   1. Native bundle — what a profile loads. dsh-client-modules resolves the
 *      package's `exports["./client"]`, serves it at
 *      `/plugins/dsh-mermaid-preview/client.js`, and the page executes it as
 *      `window.__ModuleLoader__.load({ id, factory })` where the factory returns
 *      the plugin's CommonJS exports. Output: `dist/client.js`.
 *
 *   2. Dynamic payload — the text a session pastes as `code.client` for
 *      `cordis_define`, i.e. the body of a function that *returns* the plugin.
 *      Output: `dist/dsh-mermaid-preview.client.js`.
 *
 * Both artifacts are committed, so installing straight from GitHub never needs
 * a build step.
 *
 * Usage:
 *   node scripts/build.mjs                 # write dist/
 *   node scripts/build.mjs --out <dir>     # write somewhere else (used by check)
 *   node scripts/build.mjs --verify        # also syntax-check every artifact
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const PLUGIN_ID = 'dsh-mermaid-preview'

const TEST_ONLY = /[ \t]*\/\* dsh:test-only:start \*\/[\s\S]*?\/\* dsh:test-only:end \*\/\n?/

/**
 * Read the canonical source and split it into the parts both wrappers need.
 * @param root - package root.
 * @returns the plugin body (no `export default`) and the plugin record name.
 */
export function readSource(root) {
  const file = join(root, 'src', 'client.js')
  const source = readFileSync(file, 'utf8')
  const stripped = source.replace(TEST_ONLY, '')
  if (!stripped.includes('export default')) {
    throw new Error(`${file}: no \`export default\` object to wrap`)
  }
  const body = stripped.replace('export default', 'const __plugin = ')
  if (/^export[\s{]/m.test(body)) {
    throw new Error(`${file}: only the default export may survive; move test-only code between the dsh:test-only markers`)
  }
  return body
}

/** The native bundle: a `__ModuleLoader__` factory returning CommonJS exports. */
export function renderBundle(body) {
  return `window.__ModuleLoader__.load({
\tid: ${JSON.stringify(PLUGIN_ID)},
\tfactory: (require) => {
\t\tvar module = { exports: {} };
\t\tvar exports = module.exports;
${body}
\t\texports.name = __plugin.name;
\t\texports.apply = __plugin.apply;
\t\treturn module.exports;
\t}
});
`
}

/** The dynamic payload: a function body that returns the plugin. */
export function renderDynamic(body) {
  return `${body.trimStart().replace(/^const __plugin = /, 'return ')}\n`
}

/** Syntax-check one artifact (the dynamic payload is wrapped: it is a body). */
function check(file, wrap) {
  const target = wrap ? join(tmpdir(), `dsh-mermaid-check-${process.pid}.mjs`) : file
  if (wrap) writeFileSync(target, `const __payload = () => {\n${readFileSync(file, 'utf8')}\n}\n`)
  try {
    const result = spawnSync(process.execPath, ['--check', target], { encoding: 'utf8' })
    if (result.status !== 0) {
      console.error(`✗ syntax check failed: ${file}`)
      console.error(result.stderr.trim())
      process.exitCode = 1
      return false
    }
    console.log(`✓ syntax ok: ${file}`)
    return true
  } finally {
    if (wrap) rmSync(target, { force: true })
  }
}

/** Write both artifacts. Exported so `check.mjs` can build into a temp dir. */
export function build(root, outDir) {
  const body = readSource(root)
  const artifacts = [
    { name: 'client.js', text: renderBundle(body) },
    { name: `${PLUGIN_ID}.client.js`, text: renderDynamic(body) },
  ]
  mkdirSync(outDir, { recursive: true })
  for (const artifact of artifacts) {
    const file = join(outDir, artifact.name)
    writeFileSync(file, artifact.text)
    console.log(`✓ wrote ${file} (${Buffer.byteLength(artifact.text)} bytes)`)
  }
  return artifacts.map((artifact) => join(outDir, artifact.name))
}

const invokedDirectly = process.argv[1] !== undefined
  && pathToFileURL(resolve(process.argv[1])).href === import.meta.url

if (invokedDirectly) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..')
  const outIndex = process.argv.indexOf('--out')
  const outDir = outIndex === -1 ? join(root, 'dist') : resolve(process.argv[outIndex + 1])
  const files = build(root, outDir)
  if (process.argv.includes('--verify')) {
    check(join(root, 'src', 'client.js'), false)
    check(files[0], false)
    check(files[1], true)
  }
}
