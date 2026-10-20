/**
 * Screenshot harness for the README.
 *
 * Drives the REAL shipped bundle (`dist/client.js`) through the real
 * `__ModuleLoader__` contract and the real vendored engine chunk, against a
 * stand-in for the dsh shell that carries the shell's own design tokens.
 * Nothing about the plugin is re-implemented here: `scan`, the settle timer,
 * the render queue, `configure()`, `mermaid.render()` and the card chrome are
 * all the shipped code.
 */
import { SCENES, buildThread } from './scenes.mjs'

const params = new URLSearchParams(location.search)
const scheme = params.get('scheme') === 'dark' ? 'dark' : 'light'
const scene = params.get('scene') ?? SCENES[0].id
const PHOTO = params.get('photo') === '1'

if (scheme === 'dark') document.body.setAttribute('data-ds-dark-theme', '')
document.documentElement.dataset.photo = PHOTO ? '1' : ''

/** Load the shipped bundle the way the shell does. */
const loadPlugin = async () => {
  let plugin = null
  window.__ModuleLoader__ = {
    load ({ id, factory }) {
      if (typeof factory !== 'function') throw new TypeError('factory missing')
      plugin = factory(() => { throw new Error(`unexpected require() from ${id}`) })
    },
  }
  await new Promise((done, fail) => {
    const script = document.createElement('script')
    script.src = '/dist/client.js'
    script.onload = done
    script.onerror = () => fail(new Error('dist/client.js failed to load'))
    document.head.append(script)
  })
  if (plugin === null) throw new Error('module loader was never called')
  return plugin
}

/** The smallest Cordis context the plugin touches. */
const makeContext = () => ({
  effect (fn) {
    const dispose = fn()
    return typeof dispose === 'function' ? dispose : () => {}
  },
  get (name) {
    return name === 'theme' ? { getTheme: () => ({ active: { colorScheme: scheme } }) } : undefined
  },
  on () { return () => {} },
})

/** Wait until every code card the plugin touched reports done. */
const settle = async (blocks, timeoutMs = 90000) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const states = blocks.map((block) => block.dataset.dshMermaid)
    if (states.every((state) => state === 'done' || state === 'failed')) return states
    await new Promise((done) => setTimeout(done, 60))
  }
  throw new Error(`timed out; states=${blocks.map((b) => b.dataset.dshMermaid).join(',')}`)
}

/** Preload the engine so the plugin reuses it (the shell's chunk route). */
const preloadEngine = async () => {
  await new Promise((done, fail) => {
    const script = document.createElement('script')
    script.src = '/dist/client.mermaid.js'
    script.onload = done
    script.onerror = () => fail(new Error('engine chunk failed to load'))
    document.head.append(script)
  })
}

try {
  const [plugin] = await Promise.all([loadPlugin(), preloadEngine()])
  const thread = document.getElementById('thread')
  const blocks = buildThread(thread, SCENES.find((entry) => entry.id === scene))
  // The plugin renders on visibility; everything is above the fold here, but a
  // scroll into view is what makes the observer fire in a headless viewport.
  for (const block of blocks) block.scrollIntoView({ block: 'center' })
  plugin.apply(makeContext())
  const states = await settle(blocks)
  if (typeof document.fonts?.ready?.then === 'function') await document.fonts.ready
  await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
  document.title = `ready ${scene} ${scheme} ${states.join(',')}`
  window.__SHOT_READY__ = { scene, scheme, states }
} catch (error) {
  window.__SHOT_ERROR__ = String(error?.stack ?? error)
  document.title = `error ${String(error?.message ?? error)}`
}
