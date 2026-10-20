#!/usr/bin/env node
/**
 * verify-compat.mjs — per-DSH-version compatibility verification.
 *
 * The DSH STORE keeps a rolling window of the official latest three DSH
 * releases and refuses to list a plugin whose manifest carries no exact
 * `dsh.compatibility.dshReleases` record for any of them (range-only
 * declarations are not installable evidence). The window moves, so this check
 * has to be re-run whenever a new DSH release appears.
 *
 * For each version V this script installs *that version's own* published
 * client packages into a scratch project and verifies the five criteria
 * documented in docs/compatibility.md:
 *
 *   1. that version's own `@deepseek-ai/dsh-client-modules` scanner accepts
 *      this package (packageName / clientPath / immediately / external);
 *   2. the `dsh.client` contract still exists (platform / inject / external /
 *      immediately, and `exports["./client"]`);
 *   3. the `/plugins/<id>/client.js` bundle route and the `__DSH_BOOT__`
 *      injection still exist;
 *   4. the CodeBlock DOM contract still exists (`.md-code-block`,
 *      `[data-code-block-banner]`, `[data-code-block-content]`, and a plain
 *      `<pre>` body for an unhighlighted language);
 *   5. `dsh-client-locale` still provides `register()` / `bind()`, and the
 *      `inject` target `@deepseek-ai/dsh-client-ui-conversation` is still a
 *      `platform: web` client row.
 *
 * Usage:
 *   node scripts/verify-compat.mjs 0.2.1-rc.2
 *   node scripts/verify-compat.mjs 0.2.1-alpha.5 0.2.1-rc.1 0.2.1-rc.2
 *
 * It needs the network (npm) and writes only under a temporary directory.
 * A `compatible` declaration in package.json is a *source-contract* claim
 * produced by this script; it is not a runtime acceptance test.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const REGISTRY = process.env.DSH_NPM_REGISTRY ?? 'https://registry.npmjs.org'
const PKG = join(dirname(fileURLToPath(import.meta.url)), '..')
const VERSIONS = process.argv.slice(2)

if (VERSIONS.length === 0) {
  console.error('usage: node scripts/verify-compat.mjs <dsh-version> [...]')
  process.exit(2)
}

/**
 * Run a command and return its stdout.
 * @param {string} command - the executable.
 * @param {string[]} args - its arguments.
 * @param {string} cwd - the working directory.
 * @returns {string} the captured stdout.
 */
const sh = (command, args, cwd) => execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

/**
 * Install one DSH version's client packages into a scratch project.
 * @param {string} version - the DSH version.
 * @param {string} dir - the scratch directory.
 * @returns {string} the cordis range that version asks for.
 */
const install = (version, dir) => {
  mkdirSync(dir, { recursive: true })
  sh('npm', ['init', '-y'], dir)
  const meta = JSON.parse(sh('npm', ['view', `@deepseek-ai/dsh-client-modules@${version}`, '--json', '--registry', REGISTRY], dir))
  const cordis = meta.peerDependencies?.['@deepseek-ai/cordis'] ?? meta.dependencies?.['@deepseek-ai/cordis'] ?? 'latest'
  sh('npm', [
    'install', '--legacy-peer-deps', '--no-audit', '--no-fund', '--registry', REGISTRY,
    `@deepseek-ai/dsh-client-modules@${version}`,
    `@deepseek-ai/cordis@${cordis}`,
    `@deepseek-ai/dsh-client-ui-primitives@${version}`,
    `@deepseek-ai/dsh-client-locale@${version}`,
    `@deepseek-ai/dsh-client-ui-conversation@${version}`,
  ], dir)
  return cordis
}

/**
 * Put this package where the scanner can resolve it by name.
 * @param {string} dir - the scratch project.
 * @returns {string} the linked package directory.
 */
const linkPackage = (dir) => {
  const modules = join(dir, 'node_modules')
  mkdirSync(modules, { recursive: true })
  const target = join(modules, 'dsh-mermaid-preview')
  rmSync(target, { recursive: true, force: true })
  symlinkSync(PKG, target, 'dir')
  return target
}

/**
 * Read every JavaScript file of a package's lib directory.
 * @param {string} libDir - the lib directory.
 * @returns {string} the concatenated sources.
 */
const libSource = (libDir) => {
  if (!existsSync(libDir)) return ''
  const files = execFileSync('find', [libDir, '-name', '*.js'], { encoding: 'utf8' })
    .trim().split('\n').filter(Boolean)
  return files.map((file) => readFileSync(file, 'utf8')).join('\n')
}

for (const version of VERSIONS) {
  const dir = join(tmpdir(), 'dsh-mermaid-compat', version)
  rmSync(dir, { recursive: true, force: true })
  console.log(`\n=== DSH ${version} ===`)
  try {
    install(version, dir)
    const pkgDir = linkPackage(dir)
    const modules = join(dir, 'node_modules')

    // 1 — that version's own scanner accepts this package.
    const registryPath = join(modules, '@deepseek-ai/dsh-client-modules/lib/index.js')
    const { ClientModuleRegistry } = await import(pathToFileURL(registryPath).href)
    const registry = Object.assign(Object.create(ClientModuleRegistry.prototype), {
      ctx: { loader: {} },
      pkgMeta: new Map(),
    })
    const meta = registry.resolveMeta('dsh-mermaid-preview', pathToFileURL(join(pkgDir, 'index.js')).href)
    const clientPath = meta?.meta?.clientPath
    const scanner = meta !== null && meta !== undefined
      && meta.packageName === 'dsh-mermaid-preview'
      && typeof clientPath === 'string' && existsSync(clientPath)
      && meta.meta.immediately === true
      && Array.isArray(meta.meta.external) && meta.meta.external.length === 0
    console.log(`  1 scanner accepts package : ${scanner ? '✓' : '✗'}`
      + ` (packageName=${meta?.packageName}, clientPath=${clientPath ? 'exists' : 'missing'}`
      + `, immediately=${meta?.meta?.immediately}, external=${JSON.stringify(meta?.meta?.external)})`)

    // 2 — the dsh.client contract in that version's scanner.
    const registrySrc = readFileSync(registryPath, 'utf8')
    const contract = ['platform', 'inject', 'external', 'immediately']
      .every((field) => registrySrc.includes(field)) && registrySrc.includes('"./client"')
    console.log(`  2 dsh.client contract     : ${contract ? '✓' : '✗'}`)

    // 3 — the bundle route and the boot injection.
    const route = registrySrc.includes('/plugins')
    const boot = registrySrc.includes('__DSH_BOOT__')
    console.log(`  3 bundle route + boot     : ${route && boot ? '✓' : '✗'} (route=${route}, boot=${boot})`)

    // 4 — the CodeBlock DOM contract. The markup lives in the primitives
    // package's lib bundle, and the class is emitted as the bare
    // "md-code-block" string (clsx(css.block, "md-code-block", …)).
    const primSrc = libSource(join(modules, '@deepseek-ai/dsh-client-ui-primitives/lib'))
    const dom = ['"md-code-block"', 'data-code-block-banner', 'data-code-block-content']
      .every((needle) => primSrc.includes(needle)) && primSrc.includes('<pre')
    console.log(`  4 CodeBlock DOM contract  : ${dom ? '✓' : '✗'}`
      + ` (md-code-block=${primSrc.includes('"md-code-block"')}`
      + `, banner=${primSrc.includes('data-code-block-banner')}`
      + `, content=${primSrc.includes('data-code-block-content')}, pre=${primSrc.includes('<pre')})`)

    // 5 — the locale service and the inject target.
    const localeSrc = libSource(join(modules, '@deepseek-ai/dsh-client-locale/lib'))
    const localeOk = localeSrc.includes('register') && localeSrc.includes('bind')
    const conversation = JSON.parse(readFileSync(join(modules, '@deepseek-ai/dsh-client-ui-conversation/package.json'), 'utf8'))
    const targetOk = conversation.dsh?.client?.platform === 'web'
    console.log(`  5 locale + inject target  : ${localeOk && targetOk ? '✓' : '✗'}`
      + ` (register/bind=${localeOk}, conversation platform=${conversation.dsh?.client?.platform})`)

    const ok = scanner && contract && route && boot && dom && localeOk && targetOk
    console.log(`  → DSH ${version}: ${ok ? 'compatible' : 'NOT compatible'}`)
  } catch (error) {
    console.log(`  ✗ verification failed: ${error?.message ?? error}`)
  }
}
