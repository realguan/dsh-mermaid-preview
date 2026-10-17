#!/usr/bin/env node
/**
 * check.mjs — the repository's single verification entry point (`npm run check`).
 *
 * It answers, without a browser:
 *   1. Does the canonical source and every built artifact parse?
 *   2. Is the manifest one dsh 0.2.x actually accepts (exports, bundle patch,
 *      client declaration, icon, locale)?
 *   3. Is `dist/` in sync with `src/` (a stale build is the classic silent
 *      failure of a client plugin)?
 *   4. Does the Mermaid detection heuristic behave?
 *   5. Do the docs and the demo pin the same Mermaid release as the plugin?
 *   6. Do the package version and the latest CHANGELOG release agree?
 *
 * It does NOT prove what a user sees; see docs/install.md § 验证.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from './build.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const failures = []

/** Record a check result. */
const check = (label, ok, detail = '') => {
  if (ok) {
    console.log(`✓ ${label}`)
    return true
  }
  console.error(`✗ ${label}${detail === '' ? '' : ` — ${detail}`}`)
  failures.push(label)
  return false
}

const read = (rel) => readFileSync(join(root, rel), 'utf8')
const parseJson = (rel) => JSON.parse(read(rel))

// ---- 1. syntax -------------------------------------------------------------
/** `node --check` one file; the dynamic payload is a function body, so wrap it. */
const syntax = (file, wrap = false) => {
  const target = wrap ? join(mkdtempSync(join(tmpdir(), 'dsh-mermaid-')), 'payload.mjs') : join(root, file)
  if (wrap) writeFileSync(target, `const __payload = () => {\n${read(file)}\n}\n`)
  const result = spawnSync(process.execPath, ['--check', target], { encoding: 'utf8' })
  check(`syntax: ${file}`, result.status === 0, result.stderr.trim().split('\n')[0] ?? '')
  if (wrap) rmSync(dirname(target), { recursive: true, force: true })
}
syntax('src/client.js')
syntax('src/theme.js')
syntax('index.js')
syntax('dist/client.js')
syntax('dist/dsh-mermaid-preview.client.js', true)
syntax('scripts/build.mjs')
syntax('scripts/check.mjs')

// ---- 2. manifest -----------------------------------------------------------
const pkg = parseJson('package.json')
check('manifest: name is the module identity', pkg.name === 'dsh-mermaid-preview', pkg.name)
check('manifest: type is module', pkg.type === 'module')
check('manifest: exports "."', pkg.exports?.['.'] === './index.js', String(pkg.exports?.['.']))
check('manifest: exports "./client"', typeof pkg.exports?.['./client'] === 'string', String(pkg.exports?.['./client']))
check('manifest: exports "./package.json"', pkg.exports?.['./package.json'] === './package.json')
check('manifest: exports locale files', pkg.exports?.['./locale/*.json'] === './locale/*.json')
check('manifest: client platform is web', pkg.dsh?.client?.platform === 'web')
check('manifest: bundle patch declared', typeof pkg.dsh?.bundle?.patch === 'string', String(pkg.dsh?.bundle?.patch))
check('manifest: no legacy dsh.client.external drift', pkg.dsh?.client?.external === undefined)
check('manifest: icon declared', pkg.icon === './icon.svg')

const clientExport = pkg.exports?.['./client']
check(`client artifact exists: ${clientExport}`, existsSync(join(root, clientExport)))
check('host half exists: index.js', existsSync(join(root, 'index.js')))

// The native bundle must register the module identity the boot graph dispatches
// on: `window.__ModuleLoader__.load({ id: <package name>, factory })`.
const bundle = read(clientExport)
check('client bundle registers via __ModuleLoader__', bundle.includes('window.__ModuleLoader__.load('))
check('client bundle inlines src/theme.js', bundle.includes("theme: 'base'") && !bundle.includes('export const FONT_STACK'))
check('bundle pins mermaid strict security', bundle.includes("securityLevel: 'strict'"))
check('bundle suppresses mermaid error diagrams', bundle.includes('suppressErrorRendering: true'))
check('bundle ships the in-card theme menu', bundle.includes('dsh-mermaid-theme-item') && bundle.includes('dsh-mermaid-theme-menu'))
check(
  'bundle ships every theme variant',
  ['radix', 'apple', 'github', 'carbon', 'atlassian', 'material', 'polaris', 'quiet']
    .every((variant) => bundle.includes(`id: '${variant}'`)),
)
check('bundle persists the theme choice', bundle.includes('THEME_STORAGE_KEY') && bundle.includes('localStorage.setItem'))
check(`client bundle id is ${pkg.name}`, bundle.includes(`id: ${JSON.stringify(pkg.name)}`))
const dynamic = read('dist/dsh-mermaid-preview.client.js')
check('dynamic payload is a function body', dynamic.startsWith('/*') && !dynamic.includes('__ModuleLoader__'))

const patchPath = pkg.dsh?.bundle?.patch
if (check(`bundle patch exists: ${patchPath}`, existsSync(join(root, patchPath)))) {
  const patch = read(patchPath)
  const row = /-\s*insert:\s*\n\s*-\s*id:\s*(\S+)\s*\n\s*name:\s*(\S+)/.exec(patch)
  check('bundle patch inserts a row', row !== null)
  check('bundle patch row names the package', row?.[2] === pkg.name, row?.[2])
}

// ---- display metadata ------------------------------------------------------
for (const locale of ['locale/en.json', 'locale/zh.json']) {
  if (!check(`${locale} exists`, existsSync(join(root, locale)))) continue
  const dict = parseJson(locale)
  check(`${locale}: meta.title`, typeof dict.meta?.title === 'string' && dict.meta.title !== '')
  check(`${locale}: meta.description`, typeof dict.meta?.description === 'string' && dict.meta.description !== '')
}
if (check('icon.svg exists', existsSync(join(root, 'icon.svg')))) {
  check('icon.svg within the 256 KiB manifest limit', statSync(join(root, 'icon.svg')).size <= 256 * 1024)
}

// ---- release consistency ---------------------------------------------------
// The release checklist bumps both files together; a half-updated version is
// the classic "tag says one thing, package says another" release bug.
const changelog = read('CHANGELOG.md')
const latestRelease = /^## \[([^\]]+)\] - /m.exec(changelog)?.[1]
check('CHANGELOG latest release matches package.json', latestRelease === pkg.version, `${latestRelease} vs ${pkg.version}`)

// ---- compatibility declaration ---------------------------------------------
// DSH STORE (and any consumer of the same convention) reads an exact per-release
// matrix: `dsh.compatibility.dshReleases`. A range alone is not installable
// evidence, so the shape is enforced here; the evidence method for each
// `compatible` entry lives in docs/compatibility.md.
const compat = pkg.dsh?.compatibility
if (check('manifest: dsh.compatibility present', typeof compat === 'object' && compat !== null)) {
  check('compatibility.dsh is a range string', typeof compat.dsh === 'string' && compat.dsh !== '', String(compat.dsh))
  check('compatibility.node matches engines.node', compat.node === pkg.engines?.node, `${compat.node} vs ${pkg.engines?.node}`)
  const RELEASE_KEY = /^(?:rc\.(?:7|8)|[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)$/
  const releases = compat.dshReleases
  if (check('compatibility.dshReleases present', typeof releases === 'object' && releases !== null)) {
    const entries = Object.entries(releases)
    check('dshReleases uses full SemVer keys', entries.every(([key]) => RELEASE_KEY.test(key)), entries.map(([key]) => key).find((key) => !RELEASE_KEY.test(key)))
    check('dshReleases values are known statuses', entries.every(([, value]) => ['compatible', 'incompatible', 'unknown'].includes(value)))
    check('dshReleases declares at least one compatible release', entries.some(([, value]) => value === 'compatible'))
    console.log(`  (declared: ${entries.filter(([, value]) => value === 'compatible').length} compatible of ${entries.length})`)
  }
}

// ---- 3. dist is in sync with src -------------------------------------------
const outDir = mkdtempSync(join(tmpdir(), 'dsh-mermaid-dist-'))
try {
  build(root, outDir)
  for (const name of ['client.js', 'dsh-mermaid-preview.client.js']) {
    const committed = readFileSync(join(root, 'dist', name), 'utf8')
    const rebuilt = readFileSync(join(outDir, name), 'utf8')
    check(`dist/${name} matches src/client.js`, committed === rebuilt, 'run `npm run build`')
  }
} finally {
  rmSync(outDir, { recursive: true, force: true })
}

// ---- 4. the artifacts dsh actually loads --------------------------------
// Load the native bundle the way the page does: it must call
// `window.__ModuleLoader__.load({ id, factory })` exactly once, under the
// package name, and its factory must produce the plugin without needing any
// module from the browser table.
const registered = []
const previousWindow = globalThis.window
globalThis.window = { __ModuleLoader__: { load: (mod) => registered.push(mod) } }
try {
  await import(pathToFileURL(join(root, clientExport)).href)
} finally {
  if (previousWindow === undefined) delete globalThis.window
  else globalThis.window = previousWindow
}
check('bundle registers exactly one module', registered.length === 1, `got ${registered.length}`)
check('bundle id matches the package name', registered[0]?.id === pkg.name, String(registered[0]?.id))
const required = []
const plugin = registered[0]?.factory?.((spec) => {
  required.push(spec)
  throw new Error(`unexpected require(${spec})`)
})
check('bundle factory needs no browser module', required.length === 0, required.join(', '))
check('bundle factory exports apply()', typeof plugin?.apply === 'function')
check('bundle factory exports the plugin name', plugin?.name === pkg.name, String(plugin?.name))

const host = await import(pathToFileURL(join(root, 'index.js')).href)
check('host half exports apply()', typeof host.apply === 'function')

// ---- 5. detection heuristic ------------------------------------------------
const { __test } = await import(pathToFileURL(join(root, 'src', 'client.js')).href)
const cases = [
  ['flowchart LR\n  A --> B', true],
  ['graph TD\n  A --> B', true],
  ['sequenceDiagram\n  A->>B: hi', true],
  ['classDiagram\n  class A', true],
  ['classDiagram-v2\n  class A', true],
  ['stateDiagram-v2\n  [*] --> A', true],
  ['erDiagram\n  A ||--o{ B : has', true],
  ['gantt\n  title X', true],
  ['pie title Pets\n  "Dogs" : 3', true],
  ['gitGraph\n  commit', true],
  ['mindmap\n  root', true],
  ['timeline\n  2026 : x', true],
  ['xychart-beta\n  line [1,2]', true],
  ['sankey-beta\n  A,B,10', true],
  ['sankey\n  A,B,10', true],
  ['block\n  columns 1', true],
  ['packet\n  0-15: "x"', true],
  ['treemap-beta\n  "Root"', true],
  ['treemap\n  "Root"', true],
  ['radar-beta\n  axis A, B, C', true],
  ['kanban\n  todo[T]', true],
  ['flowchart-elk\n  A --> B', true],
  ['C4Context\n  Person(a, "b")', true],
  ['%% a comment\nflowchart TD\n  A --> B', true],
  ['%%{init: {"theme":"dark"}}%%\nflowchart TD\n  A --> B', true],
  ['---\ntitle: X\n---\nflowchart TD\n  A --> B', true],
  ['   \n\tflowchart LR\n  A --> B', true],
  ['const answer = 42', false],
  ['graphite is not a diagram', false],
  ['Graph TD\n  A --> B', false],
  ['radar\n  axis A, B, C', false],
  ['architecture\n  group api', false],
  ['SELECT * FROM t', false],
  ['', false],
  ['%% only a comment', false],
]
for (const [code, expected] of cases) {
  const actual = __test.opensDiagram(code)
  check(`detect ${JSON.stringify(code.slice(0, 32))} → ${expected}`, actual === expected, `got ${actual}`)
}

// ---- 6. one Mermaid pin across the repo ------------------------------------
const pinned = /mermaid@([\d.]+)\/dist\/mermaid\.min\.js/.exec(read('src/client.js'))?.[1]
check('src pins a Mermaid release', typeof pinned === 'string')
for (const file of ['demo/demo.js', 'README.md', 'README.en.md', 'docs/install.md', 'docs/architecture.md']) {
  if (!existsSync(join(root, file))) continue
  const text = read(file)
  if (!text.includes('mermaid@')) continue
  check(`${file} pins mermaid@${pinned}`, text.includes(`mermaid@${pinned}`))
}

// ---- verdict ---------------------------------------------------------------
if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed.`)
  process.exit(1)
}
console.log('\nAll checks passed.')
