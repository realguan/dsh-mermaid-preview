#!/usr/bin/env node
/**
 * bench.mjs — render-cost benchmark for dsh-mermaid-preview.
 *
 * ## What this measures
 *
 * The plugin's real paint path, driven by its real MutationObserver:
 * `bench/page.js` loads `dist/client.js`, calls `apply(ctx)` with a stub
 * Cordis context, injects `.md-code-block` fences into a 2400px-tall card
 * container inside a few-hundred-node conversation, and waits for the plugin's
 * own `data-dsh-mermaid="done"` marker. See the header comment in `page.js`
 * for the full instrumentation map (strategy (a) of the harness brief).
 *
 * Each run reports, per diagram and in aggregate:
 *
 *   init     mermaid.initialize(), which the plugin calls once per paint
 *   render   mermaid.render(id, code) total, net of the forced-layout probe
 *   insert   innerHTML + the layout flush the new SVG forces (see page.js)
 *   total    init + render + insert, i.e. one diagram's paint cost
 *   paint    inject → first frame that can show the finished diagram
 *   wall     inject → the plugin's done marker (includes its 250 ms settle)
 *
 * ## Usage
 *
 *   node bench/bench.mjs                       # 5 reps, radix, light
 *   node bench/bench.mjs --label baseline
 *   node bench/bench.mjs --init-mode once --label init-once
 *   node bench/bench.mjs --variant quiet --scheme dark --reps 7
 *   node bench/bench.mjs --cv --label content-visibility
 *
 * Playwright is resolved from `BENCH_PLAYWRIGHT`, then from a normal import,
 * then from `/tmp/mm-bench`. It is deliberately NOT a dependency of this
 * package: the harness must never ship with the plugin.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'
import { existsSync } from 'node:fs'
import { startServer } from './serve.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))

// ---- flags ---------------------------------------------------------------
const parseArgs = (argv) => {
  const flags = {
    label: 'baseline',
    variant: 'radix',
    scheme: 'light',
    reps: 5,
    initMode: 'every',
    cv: false,
    iso: false,
    probe: true,
    contain: false,
    burst: true,
    json: true,
  }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    const value = () => {
      const next = argv[i + 1]
      if (next === undefined || next.startsWith('--')) throw new Error(`${arg} needs a value`)
      i += 1
      return next
    }
    if (arg === '--label') flags.label = value()
    else if (arg === '--variant') flags.variant = value()
    else if (arg === '--scheme') {
      const scheme = value()
      if (scheme !== 'light' && scheme !== 'dark') throw new Error('--scheme is light|dark')
      flags.scheme = scheme
    } else if (arg === '--reps') {
      flags.reps = Number(value())
      if (!Number.isInteger(flags.reps) || flags.reps < 1) throw new Error('--reps needs a positive integer')
    } else if (arg === '--init-mode') {
      const mode = value()
      if (!['every', 'once', 'paired'].includes(mode)) throw new Error('--init-mode is every|once|paired')
      flags.initMode = mode
    } else if (arg === '--cache') flags.cache = true
    else if (arg === '--park') flags.park = true
    else if (arg === '--artifact') {
      flags.artifact = value()
    } else if (arg === '--cv') flags.cv = true
    else if (arg === '--iso') flags.iso = true
    else if (arg === '--contain') flags.contain = true
    else if (arg === '--no-probe') flags.probe = false
    else if (arg === '--no-burst') flags.burst = false
    else if (arg === '--no-json') flags.json = false
    else if (arg === '--help' || arg === '-h') {
      process.stdout.write(`usage: node bench/bench.mjs [--label NAME] [--variant NAME] [--scheme light|dark]\n`
        + '                            [--reps N] [--init-mode every|once|paired] [--cv] [--contain]\n'
        + '                            [--iso] [--cache] [--park] [--artifact FILE] [--no-probe]\n'
        + '                            [--no-burst] [--no-json]\n')
      process.exit(0)
    } else {
      throw new Error(`unknown flag ${arg} (try --help)`)
    }
  }
  return flags
}

// ---- statistics ----------------------------------------------------------
const round = (n, digits = 2) => (Number.isFinite(n) ? Math.round(n * 10 ** digits) / 10 ** digits : Number.NaN)

/** Nearest-rank percentile on a copy; `p` in 0..1. */
const percentile = (values, p) => {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b)
  if (sorted.length === 0) return Number.NaN
  if (sorted.length === 1) return sorted[0]
  const rank = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1))
  return sorted[rank]
}

const median = (values) => percentile(values, 0.5)

const stdev = (values) => {
  const clean = values.filter(Number.isFinite)
  if (clean.length < 2) return 0
  const mean = clean.reduce((a, b) => a + b, 0) / clean.length
  return Math.sqrt(clean.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (clean.length - 1))
}

/** Median, p90, mean, CV and the raw samples — no filtering, no trimming. */
const describe = (values) => {
  const clean = values.filter(Number.isFinite)
  const mean = clean.length === 0 ? Number.NaN : clean.reduce((a, b) => a + b, 0) / clean.length
  const sd = stdev(clean)
  return {
    n: clean.length,
    median: round(median(clean)),
    p90: round(percentile(clean, 0.9)),
    mean: round(mean),
    sd: round(sd),
    cv: Math.abs(mean) > 0 ? round((sd / Math.abs(mean)) * 100) : 0,
    min: round(Math.min(...clean)),
    max: round(Math.max(...clean)),
    raw: clean.map((v) => round(v, 3)),
  }
}

const sum = (values) => values.filter(Number.isFinite).reduce((a, b) => a + b, 0)

// ---- playwright resolution ----------------------------------------------
const importPlaywright = async () => {
  const candidates = [
    process.env.BENCH_PLAYWRIGHT,
    null,
    '/tmp/mm-bench/node_modules/playwright',
    join(homedir(), '.cache', 'bench-playwright', 'node_modules', 'playwright'),
  ].filter((candidate) => candidate !== null)
  const errors = []
  for (const candidate of candidates) {
    try {
      const specifier = candidate === null ? 'playwright' : pathToFileURL(join(candidate, 'index.js')).href
      const module = await import(specifier)
      const playwright = module.default ?? module
      const chromium = playwright.chromium ?? module.chromium
      if (chromium === undefined) throw new Error('module has no chromium export')
      return { chromium, from: candidate ?? 'playwright' }
    } catch (error) {
      errors.push(`${candidate ?? 'playwright'}: ${error.message.split('\n')[0]}`)
    }
  }
  throw new Error(`cannot resolve playwright.\n  ${errors.join('\n  ')}\n`
    + 'Install it outside the package, e.g.:\n'
    + '  mkdir -p /tmp/mm-bench && cd /tmp/mm-bench && npm init -y && npm i playwright@1.63.0\n'
    + '  npx playwright install chromium\n'
    + 'then set BENCH_PLAYWRIGHT=/tmp/mm-bench/node_modules/playwright')
}

/** Launch headless Chromium; fall back to any cached build if the pin drifts. */
const launchChromium = async (chromium) => {
  try {
    return await chromium.launch({ headless: true })
  } catch (error) {
    const cache = join(homedir(), 'Library/Caches/ms-playwright')
    if (!existsSync(cache)) throw error
    const { readdirSync } = await import('node:fs')
    const candidates = []
    for (const dir of readdirSync(cache)) {
      if (!dir.startsWith('chromium')) continue
      for (const relative of [
        'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
        'chrome-mac/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
        'chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium',
        'chrome-mac/Chromium.app/Contents/MacOS/Chromium',
        'chrome-headless-shell-mac-arm64/chrome-headless-shell',
        'chrome-headless-shell-mac-x64/chrome-headless-shell',
      ]) {
        const candidate = join(cache, dir, relative)
        if (existsSync(candidate)) candidates.push(candidate)
      }
    }
    if (candidates.length === 0) throw error
    return await chromium.launch({ headless: true, executablePath: candidates[0] })
  }
}

// ---- formatting ----------------------------------------------------------
const fmt = (value, width = 9, digits = 2) => (
  Number.isFinite(value) ? value.toFixed(digits) : '—'
).padStart(width)

const rule = (char = '─') => char.repeat(96)

const printInitMicro = (micro) => {
  const same = describe(micro.same)
  const alternate = describe(micro.alternate)
  const config = describe(micro.configCost)
  process.stdout.write(`\n${rule()}\n`)
  process.stdout.write(`mermaid.initialize() in isolation — ${micro.rounds} calls each, real config `
    + `(${micro.configBytes} B JSON, ${micro.themeCssChars} CSS chars, ${micro.themeVariableCount} theme vars)\n`)
  process.stdout.write(`${rule()}\n`)
  process.stdout.write(`  same config         median ${fmt(same.median)} ms   p90 ${fmt(same.p90)} ms   cv ${fmt(same.cv, 7, 1)}%\n`)
  process.stdout.write(`  alternating config  median ${fmt(alternate.median)} ms   p90 ${fmt(alternate.p90)} ms   cv ${fmt(alternate.cv, 7, 1)}%\n`)
  process.stdout.write(`  configForVariant()  median ${fmt(config.median, 9, 3)} ms  (the plugin's own config build, outside initialize)\n`)
  const ratio = same.median > 0 ? (Math.max(same.median, alternate.median) / Math.min(same.median, alternate.median)) : 1
  if (ratio > 1.25) {
    process.stdout.write(`  ! alternating configs cost ${ratio.toFixed(2)}x the same config — re-initialisation is not free and not constant\n`)
  }
}

const printDiagramTable = (rows, aggregate) => {
  process.stdout.write(`\n${rule()}\n`)
  process.stdout.write('per-diagram render cost — medians in ms (raw = one paint of the plugin\'s real path)\n')
  process.stdout.write(`${rule()}\n`)
  process.stdout.write(`${'diagram'.padEnd(16)}${'init'.padStart(9)}${'render'.padStart(9)}`
    + `${'insert'.padStart(9)}${'total'.padStart(9)}${'firstPaint'.padStart(12)}${'wall'.padStart(10)}`
    + `${'  init%'.padStart(8)}\n`)
  process.stdout.write(`${rule('·')}\n`)
  for (const row of rows) {
    process.stdout.write(`${row.name.padEnd(16)}${fmt(row.init.median)}${fmt(row.render.median)}`
      + `${fmt(row.insert.median)}${fmt(row.total.median)}${fmt(row.firstPaint.median, 12)}`
      + `${fmt(row.wall.median, 10)}${fmt(row.initShare, 8, 1)}\n`)
  }
  process.stdout.write(`${rule('·')}\n`)
  process.stdout.write(`${'corpus total'.padEnd(16)}${fmt(aggregate.init.median)}${fmt(aggregate.render.median)}`
    + `${fmt(aggregate.insert.median)}${fmt(aggregate.total.median)}`
    + `${'—'.padStart(12)}${'—'.padStart(10)}`
    + `${fmt(aggregate.initShare, 8, 1)}\n`)
  process.stdout.write(`${rule()}\n`)
}

const printVariance = (rows, aggregate) => {
  const noisy = []
  for (const row of rows) {
    for (const [metric, label] of [['render', 'render'], ['total', 'total'], ['insert', 'insert']]) {
      if (row[metric].cv > 20) noisy.push(`${row.name}.${label} cv ${row[metric].cv}%`)
    }
  }
  if (aggregate.total.cv > 15) noisy.push(`corpus total cv ${aggregate.total.cv}%`)
  process.stdout.write(`variance: corpus total cv ${aggregate.total.cv}% `
    + `(min ${aggregate.total.min} / median ${aggregate.total.median} / max ${aggregate.total.max} ms)\n`)
  if (noisy.length === 0) {
    process.stdout.write('variance: no metric exceeded 20% cv — the medians are stable\n')
  } else {
    process.stdout.write(`variance: high-cv metrics — ${noisy.slice(0, 8).join(', ')}${noisy.length > 8 ? ` (+${noisy.length - 8} more)` : ''}\n`)
  }
}

const printOutliers = (rows) => {
  const totals = rows.map((row) => ({ name: row.name, total: row.total.median, init: row.init.median, render: row.render.median }))
  const cheapest = totals.reduce((a, b) => (a.total <= b.total ? a : b))
  process.stdout.write('\noutliers vs the cheapest diagram (') 
  process.stdout.write(`${cheapest.name} ${cheapest.total} ms):\n`)
  const sorted = [...totals].sort((a, b) => b.total - a.total)
  for (const row of sorted.slice(0, 4)) {
    process.stdout.write(`  ${row.name.padEnd(16)} ${fmt(row.total)} ms  ${(row.total / cheapest.total).toFixed(1)}x`
      + `   (render ${fmt(row.render)} ms)\n`)
  }
}

// ---- main ----------------------------------------------------------------
const main = async () => {
  const flags = parseArgs(process.argv.slice(2))
  const { chromium, from } = await importPlaywright()
  const server = await startServer({ artifact: flags.artifact })
  const query = new URLSearchParams({
    variant: flags.variant,
    scheme: flags.scheme,
    reps: String(flags.reps),
    init: flags.initMode,
    cv: flags.cv ? '1' : '0',
    burst: flags.burst ? '1' : '0',
    iso: flags.iso ? '1' : '0',
    probe: flags.probe ? '1' : '0',
    contain: flags.contain ? '1' : '0',
    cache: flags.cache ? '1' : '0',
    park: flags.park ? '1' : '0',
  })

  const startedAt = new Date().toISOString()
  const started = performance.now()
  const browser = await launchChromium(chromium)
  const browserVersion = browser.version()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  const consoleErrors = []
  page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(`console: ${message.text()}`)
  })

  let result
  try {
    await page.goto(`${server.url}/?${query}`, { waitUntil: 'load' })
    await page.waitForFunction('window.__benchReady === true', null, { timeout: 60_000 })
    result = await page.evaluate('window.__benchRun()')
  } finally {
    await page.close()
    await browser.close()
    await server.close()
  }

  // ---- fold the raw renders into per-diagram statistics -----------------
  const pairedMode = flags.initMode === 'paired'
  const rows = result.diagrams.map((diagram) => {
    const everyArm = diagram.renders.filter((r) => r.arm !== 'skip')
    const renders = pairedMode ? (everyArm.length > 0 ? everyArm : diagram.renders) : diagram.renders
    if (renders.length === 0) throw new Error(`no renders recorded for ${diagram.name}`)
    const init = renders.map((r) => r.init)
    const renderNet = renders.map((r) => r.render - r.probe)
    const insert = renders.map((r) => r.insertToLayout)
    // A build that configures mermaid once up front never calls it inside a
    // paint, so `init` is legitimately absent there rather than unknown: count
    // it as zero so the total stays a number and the saving stays visible.
    const initCost = init.map((value) => (Number.isFinite(value) ? value : 0))
    const total = renders.map((r, i) => initCost[i] + renderNet[i] + insert[i])
    const shares = renders.map((r, i) => (total[i] > 0 ? (initCost[i] / total[i]) * 100 : Number.NaN))
    return {
      name: diagram.name,
      note: diagram.note,
      svgLen: diagram.renders.at(-1)?.svgLen ?? 0,
      viewBox: diagram.renders.at(-1)?.viewBox ?? '',
      svgHash: diagram.renders.at(-1)?.svgHash ?? '',
      svgColors: diagram.renders.at(-1)?.svgColors ?? [],
      init: describe(init),
      render: describe(renderNet),
      renderWithProbe: describe(renders.map((r) => r.render)),
      probe: describe(renders.map((r) => r.probe)),
      domBuild: describe(renders.map((r) => r.build)),
      layoutFlush: describe(renders.map((r) => r.flush)),
      insert: describe(insert),
      total: describe(total),
      firstPaint: describe(renders.map((r) => r.firstPaint)),
      wall: describe(renders.map((r) => r.wall)),
      longTaskMs: describe(renders.map((r) => sum(r.longTasks))),
      initShare: median(shares.filter(Number.isFinite)) ?? Number.NaN,
    }
  })

  const reps = flags.reps

  // ---- paired initialize comparison (--init-mode paired) -----------------
  let paired = null
  if (pairedMode) {
    const perRep = []
    for (let rep = 0; rep < reps; rep += 1) {
      const armTotal = { every: 0, skip: 0 }
      const armInit = { every: 0, skip: 0 }
      for (const diagram of result.diagrams) {
        for (const arm of ['every', 'skip']) {
          const r = diagram.renders.filter((x) => x.arm === arm)[rep]
          if (r === undefined) continue
          armTotal[arm] += r.init + (r.render - r.probe) + r.insertToLayout
          armInit[arm] += r.init
        }
      }
      perRep.push({ every: armTotal.every, skip: armTotal.skip, initEvery: armInit.every })
    }
    const diffs = perRep.map((p) => p.skip - p.every)
    const perDiagram = result.diagrams.map((diagram) => {
      const every = diagram.renders.filter((r) => r.arm !== 'skip')
      const skip = diagram.renders.filter((r) => r.arm === 'skip')
      const n = Math.min(every.length, skip.length)
      const diffsByRep = []
      for (let i = 0; i < n; i += 1) {
        const a = every[i].init + (every[i].render - every[i].probe) + every[i].insertToLayout
        const b = skip[i].init + (skip[i].render - skip[i].probe) + skip[i].insertToLayout
        diffsByRep.push(b - a)
      }
      return {
        name: diagram.name,
        everyTotal: median(every.map((r) => r.init + (r.render - r.probe) + r.insertToLayout)),
        skipTotal: median(skip.map((r) => r.init + (r.render - r.probe) + r.insertToLayout)),
        initEvery: median(every.map((r) => r.init)),
        delta: median(diffsByRep),
        pairedDiffs: diffsByRep.map((d) => round(d)),
      }
    })
    paired = {
      reps,
      everyTotal: describe(perRep.map((p) => p.every)),
      skipTotal: describe(perRep.map((p) => p.skip)),
      initTotal: describe(perRep.map((p) => p.initEvery)),
      delta: describe(diffs),
      perDiagram,
    }
  }

  const corpusTotals = []
  const corpusInit = []
  const corpusRender = []
  const corpusInsert = []
  for (let rep = 0; rep < reps; rep += 1) {
    let total = 0
    let init = 0
    let render = 0
    let insert = 0
    for (const diagram of result.diagrams) {
      const r = diagram.renders[rep]
      if (r === undefined) continue
      const net = r.render - r.probe
      init += r.init
      render += net
      insert += r.insertToLayout
      total += r.init + net + r.insertToLayout
    }
    corpusTotals.push(total)
    corpusInit.push(init)
    corpusRender.push(render)
    corpusInsert.push(insert)
  }

  const aggregate = {
    init: describe(corpusInit),
    render: describe(corpusRender),
    insert: describe(corpusInsert),
    total: describe(corpusTotals),
    initShare: median(corpusTotals.map((total, i) => (total > 0 ? (corpusInit[i] / total) * 100 : Number.NaN))),
    burstWall: result.burst === null ? null : round(result.burst.wall),
    burstFirstPaint: result.burst === null ? null : round(result.burst.firstPaint),
    // the burst total is what the nine diagrams cost together, so it is a sum
    // per pass (one pass only), not a distribution over diagrams
    burstWork: result.burst === null ? null : round(sum(result.burst.perDiagram.map(
      (d) => sum([d.init, d.render, d.insertToLayout]),
    ))),
    burstRender: result.burst === null ? null : round(sum(result.burst.perDiagram.map((d) => d.render))),
  }

  // ---- report ----------------------------------------------------------
  printInitMicro(result.init)
  printDiagramTable(rows, aggregate)
  printVariance(rows, aggregate)
  printOutliers(rows)
  if (result.parked !== null && result.parked !== undefined) {
    process.stdout.write(`\nparked (${result.parked.diagrams} fences mounted off screen, settle fired, viewport elsewhere):\n`)
    process.stdout.write(`  mermaid.render calls   ${result.parked.renders}`
      + `   (${result.parked.settled} card(s) marked done)\n`)
    if (result.parked.renderedNames.length > 0) {
      process.stdout.write(`  rendered               ${result.parked.renderedNames.join(', ')}\n`)
    }
  }

  if (result.burst !== null) {
    process.stdout.write(`\nburst (all ${result.burst.diagrams} fences injected in one tick, plugin serializes the renders):\n`)
    process.stdout.write(`  wall inject→all done   ${fmt(result.burst.wall)} ms`
      + `   (${result.burst.failures.length} failure(s))\n`)
    process.stdout.write(`  first frame            ${fmt(result.burst.firstPaint)} ms\n`)
    process.stdout.write(`  measured paint work    ${fmt(aggregate.burstWork)} ms`
      + ` (init + render + insert for all ${result.burst.diagrams}; render alone ${fmt(aggregate.burstRender)} ms)\n`)
    process.stdout.write(`  long tasks             ${result.burst.longTasks.length}`
      + `    longest ${fmt(Math.max(0, ...result.burst.longTasks))} ms\n`)
  }
  if (paired !== null) {
    process.stdout.write(`\n${rule('=')}\n`)
    process.stdout.write(`EXPERIMENT: initialize once instead of before every render — paired design, ${paired.reps} reps\n`)
    process.stdout.write('both arms measured inside one run, order flipped per rep, so machine drift cannot favour either\n')
    process.stdout.write(`${rule('=')}\n`)
    process.stdout.write(`  ${'diagram'.padEnd(16)}${'init every'.padStart(12)}${'every-arm'.padStart(11)}`
      + `${'once-arm'.padStart(10)}${'paired delta'.padStart(14)}\n`)
    for (const row of paired.perDiagram) {
      process.stdout.write(`  ${row.name.padEnd(16)}${fmt(row.initEvery, 12)}${fmt(row.everyTotal, 11)}`
        + `${fmt(row.skipTotal, 10)}${fmt(row.delta, 14)}\n`)
    }
    process.stdout.write(`  ${''.padEnd(16)}${fmt(paired.initTotal.median, 12)}${fmt(paired.everyTotal.median, 11)}`
      + `${fmt(paired.skipTotal.median, 10)}${fmt(paired.delta.median, 14)}\n`)
    const share = paired.everyTotal.median > 0 ? (paired.initTotal.median / paired.everyTotal.median) * 100 : 0
    const pctDelta = paired.everyTotal.median > 0 ? (paired.delta.median / paired.everyTotal.median) * 100 : 0
    process.stdout.write(`${rule('·')}\n`)
    process.stdout.write(`  initialize() is ${paired.initTotal.median.toFixed(2)} ms of ${paired.everyTotal.median.toFixed(2)} ms`
      + ` = ${share.toFixed(2)}% of the corpus pass\n`)
    process.stdout.write(`  dropping it moves the corpus pass by ${paired.delta.median.toFixed(2)} ms`
      + ` (${pctDelta.toFixed(2)}%), paired median of ${paired.reps} reps\n`)
    process.stdout.write(`  per-rep paired deltas: ${paired.delta.raw.join(', ')} ms`
      + `  (min ${paired.delta.min}, max ${paired.delta.max}, cv ${paired.delta.cv}%)\n`)
    process.stdout.write(`${rule('=')}\n`)
  }
  process.stdout.write(`\nprobe: the forced layout at mermaid's temp-host insertion costs a median of `
    + `${fmt(median(rows.map((row) => row.probe.median)))} ms per diagram `
    + `(instrument-added; excluded from "render" above)\n`)
  if (result.isoContainer !== null) {
    process.stdout.write(`\n${rule()}\n`)
    process.stdout.write('micro-experiment: mermaid.render(id, code, container) into a contained, offscreen\n'
      + 'container — the plugin does NOT pass that 3rd argument, so this is a direct-mode\n'
      + 'comparison of the same mermaid call, not a measurement of the plugin path.\n')
    process.stdout.write(`${rule()}\n`)
    process.stdout.write(`  ${'diagram'.padEnd(16)}${'plugin path'.padStart(13)}`
      + `${'body host'.padStart(11)}${'offscreen'.padStart(11)}${'delta'.padStart(9)}\n`)
    let pathSum = 0
    let bodySum = 0
    let offSum = 0
    for (const entry of result.isoContainer) {
      const row = rows.find((candidate) => candidate.name === entry.name)
      const bodyHost = median(entry.samples.body)
      const offscreen = median(entry.samples.offscreen)
      const path = row.render.median
      pathSum += path
      bodySum += bodyHost
      offSum += offscreen
      const pct = bodyHost > 0 ? ((offscreen - bodyHost) / bodyHost) * 100 : 0
      process.stdout.write(`  ${entry.name.padEnd(16)}${fmt(path, 13)}${fmt(bodyHost, 11)}${fmt(offscreen, 11)}`
        + `${(pct >= 0 ? '+' : '')}${pct.toFixed(1)}%`.padStart(9) + '\n')
    }
    const pct = (value, base) => (base > 0 ? `${((value - base) / base * 100).toFixed(1)}%` : 'n/a')
    process.stdout.write(`  ${''.padEnd(16)}${fmt(pathSum, 13)}${fmt(bodySum, 11)}${fmt(offSum, 11)}`
      + `${pct(offSum, bodySum)}`.padStart(9) + '\n')
    process.stdout.write(`  direct-mode body-host arm vs the plugin path: ${pct(bodySum, pathSum)} (sanity: same call, same page)\n`)
    process.stdout.write(`${rule()}\n`)
  }
  if (consoleErrors.length > 0) {
    process.stdout.write(`\npage errors (${consoleErrors.length}):\n`)
    for (const error of consoleErrors.slice(0, 10)) process.stdout.write(`  ${error}\n`)
  }

  // ---- JSON ------------------------------------------------------------
  if (flags.json) {
    const payload = {
      meta: {
        label: flags.label,
        startedAt,
        durationMs: Math.round(performance.now() - started),
        node: process.version,
        platform: `${process.platform}/${process.arch}`,
        chromium: browserVersion,
        playwrightFrom: from,
        config: { ...result.config, burst: flags.burst, iso: flags.iso },
        warmup: result.warmup,
        renderCount: result.renderCount,
        longTaskCount: result.longTaskCount,
        consoleErrors,
        metrics: {
          init: 'mermaid.initialize() as called by the plugin\'s configure()',
          render: 'mermaid.render(id, code), net of the forced-layout probe',
          insert: 'canvas.innerHTML = svg through the first layout read in fitReading',
          total: 'init + render + insert = one diagram\'s paint cost',
          firstPaint: 'fence injection → the frame after data-dsh-mermaid="done"',
          wall: 'fence injection → the plugin\'s done marker (includes the 250 ms settle)',
        },
      },
      initMicro: result.init,
      diagrams: rows,
      aggregate,
      pairedInit: paired,
      burst: result.burst,
      isoContainer: result.isoContainer,
    }
    const file = join(HERE, `results-${flags.label}.json`)
    await mkdir(HERE, { recursive: true })
    await writeFile(file, `${JSON.stringify(payload, null, 2)}\n`)
    process.stdout.write(`\nwrote ${file}\n`)
  }
}

main().catch((error) => {
  process.stderr.write(`bench failed: ${error?.stack ?? error}\n`)
  process.exit(1)
})
