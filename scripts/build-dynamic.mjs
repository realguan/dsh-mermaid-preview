#!/usr/bin/env node
/**
 * build-dynamic.mjs — derive the paste-ready dynamic plugin payload.
 *
 * `src/client.js` is the canonical plugin source as an ES module
 * (`export default { apply(ctx) { … } }`). The dsh dynamic Cordis runner,
 * however, wants the body of a function that RETURNS the plugin — that is the
 * exact text you paste as `code.client` when calling `cordis_define`.
 *
 * This script strips the `export default` prefix and prepends `return`, which
 * is the only transformation needed. The output is written to
 * `dist/dsh-mermaid-preview.client.js` and committed, so visitors can paste
 * without building anything.
 *
 * Usage:
 *   node scripts/build-dynamic.mjs            # write dist payload
 *   node scripts/build-dynamic.mjs --verify   # write + syntax-check both files
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'src', 'client.js')
const out = join(root, 'dist', 'dsh-mermaid-preview.client.js')

const source = readFileSync(src, 'utf8')

// Strip the leading `export default` (the first occurrence anywhere — header
// comments precede it and never contain the token) and turn the module into a
// function body that returns the plugin.
const payload = `${source.replace('export default', 'return').trimStart()}\n`

mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, payload)
console.log(`✓ wrote ${out} (${payload.length} bytes)`)

if (process.argv.includes('--verify')) {
  const check = (file) => {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' })
    if (result.status !== 0) {
      console.error(`✗ syntax check failed: ${file}`)
      console.error(result.stderr)
      process.exit(1)
    }
    console.log(`✓ syntax ok: ${file}`)
  }
  check(src)
  // The payload is a function body, not a script: `node --check` on it would
  // fail on the bare `return`. Wrap it for the check, in the OS temp dir so a
  // killed run never leaves a file inside the repo.
  const tmp = join(tmpdir(), `dsh-mermaid-check-${process.pid}.mjs`)
  writeFileSync(tmp, `const __payload = () => {\n${payload}\n}\n`)
  try {
    check(tmp)
  } finally {
    rmSync(tmp, { force: true })
  }
}
