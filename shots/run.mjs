/**
 * Render the README screenshots.
 *
 * Every shot is a real plugin render: the shipped bundle, the vendored engine,
 * the shell's own design tokens. Playwright opens the page per (scene, scheme)
 * pair, waits for the plugin's own `done` marker, then captures either the
 * conversation column (context shots) or just the diagram card (close-ups).
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Playwright is not a dependency of this package (see shots/README.md). Resolve it
// from wherever it is installed: PLAYWRIGHT_PATH wins, then a plain import.
const HERE = dirname(fileURLToPath(import.meta.url))
const PKG = join(HERE, '..')
const OUT = join(PKG, 'assets')
const { chromium } = await import(process.env.PLAYWRIGHT_PATH ?? 'playwright')

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
}

/** Assemble page.html with the shell's two token layers inlined. */
const page = async () => {
  const html = await readFile(join(HERE, 'page.html'), 'utf8')
  const light = await readFile(join(HERE, 'tokens-light.css'), 'utf8')
  const dark = await readFile(join(HERE, 'tokens-dark.css'), 'utf8')
  return html.replace('/* LIGHT_TOKENS */', light).replace('/* DARK_TOKENS */', dark)
}

const server = createServer(async (req, res) => {
  const path = new URL(req.url ?? '/', 'http://x').pathname
  try {
    if (path === '/' || path === '/page.html') {
      res.writeHead(200, { 'Content-Type': TYPES['.html'] })
      res.end(await page())
      return
    }
    let file = null
    if (path === '/shot.js') file = join(HERE, 'shot.js')
    else if (path === '/scenes.mjs') file = join(HERE, 'scenes.mjs')
    else if (path === '/dist/client.js') file = join(PKG, 'dist/client.js')
    else if (path === '/dist/client.mermaid.js') file = join(PKG, 'dist/client.mermaid.js')
    if (file === null || !existsSync(file)) { res.writeHead(404); res.end('not found'); return }
    res.writeHead(200, { 'Content-Type': TYPES[path.slice(path.lastIndexOf('.'))] ?? 'application/octet-stream' })
    res.end(await readFile(file))
  } catch (error) {
    res.writeHead(500)
    res.end(String(error?.message ?? error))
  }
})
await new Promise((done) => server.listen(0, '127.0.0.1', done))
const { port } = server.address()

/**
 * What to capture.
 *   `context` — the conversation column with the composer, drawn to fit.
 *   `card`    — the diagram card alone, cropped to its own box.
 */
const SHOTS = [
  { scene: 'overview', scheme: 'light', file: 'shot-overview-light.png', mode: 'context', width: 1120, height: 900 },
  { scene: 'overview', scheme: 'dark', file: 'shot-overview-dark.png', mode: 'context', width: 1120, height: 900 },
  { scene: 'sequence', scheme: 'light', file: 'shot-sequence.png', mode: 'context', width: 1120, height: 980 },
  { scene: 'gantt', scheme: 'light', file: 'shot-gantt.png', mode: 'card', width: 1120, height: 900 },
  { scene: 'timeline', scheme: 'light', file: 'shot-timeline.png', mode: 'card', width: 1120, height: 900 },
  { scene: 'class', scheme: 'dark', file: 'shot-class.png', mode: 'card', width: 1120, height: 900 },
  { scene: 'journey', scheme: 'light', file: 'shot-journey.png', mode: 'card', width: 1120, height: 900 },
  { scene: 'mindmap', scheme: 'light', file: 'shot-mindmap.png', mode: 'card', width: 1120, height: 900 },
  { scene: 'pie', scheme: 'light', file: 'shot-pie.png', mode: 'card', width: 1120, height: 900 },
  { scene: 'error', scheme: 'light', file: 'shot-error.png', mode: 'context', width: 1120, height: 700 },
]

const browser = await chromium.launch()
let failed = 0

for (const shot of SHOTS) {
  const context = await browser.newContext({
    viewport: { width: shot.width, height: shot.height },
    deviceScaleFactor: 2,
  })
  const tab = await context.newPage()
  const errors = []
  tab.on('pageerror', (error) => errors.push(String(error)))
  tab.on('console', (message) => { if (message.type() === 'error') errors.push('console: ' + message.text()) })
  await tab.goto(`http://127.0.0.1:${port}/?scene=${shot.scene}&scheme=${shot.scheme}`, { waitUntil: 'load' })
  try {
    await tab.waitForFunction(
      () => window.__SHOT_READY__ !== undefined || window.__SHOT_ERROR__ !== undefined,
      { timeout: 120_000 },
    )
    const result = await tab.evaluate(() => ({ ready: window.__SHOT_READY__, error: window.__SHOT_ERROR__ }))
    if (result.error !== undefined) throw new Error(result.error)

    const out = join(OUT, shot.file)
    if (shot.mode === 'card') {
      // The card's own box, including its border: an element screenshot
      // scrolls the element into view and captures exactly that box.
      const card = tab.locator('.md-code-block').first()
      await card.scrollIntoViewIfNeeded()
      await tab.waitForTimeout(120)
      await card.screenshot({ path: out })
    } else {
      // The whole window, the way a reader sees it: rail, thread, composer.
      await tab.evaluate(() => { document.getElementById('scroll').scrollTop = 0 })
      await tab.waitForTimeout(80)
      await tab.screenshot({ path: out })
    }
    const states = result.ready.states.join(',')
    const size = (await readFile(out)).length
    console.log(`✓ ${shot.file.padEnd(26)} ${shot.scene}/${shot.scheme} ${shot.mode.padEnd(8)} ${states}  ${(size / 1024).toFixed(0)}KB`)
  } catch (error) {
    failed += 1
    console.error(`✗ ${shot.file}: ${String(error?.message ?? error).split('\n')[0]}`)
    if (errors.length > 0) console.error('   ' + errors.slice(0, 4).join('\n   '))
  }
  await context.close()
}

await browser.close()
server.close()
process.exit(failed === 0 ? 0 : 1)
