/**
 * Benchmark page — drives the plugin's REAL code path and times it.
 *
 * ## Strategy (a): the shipped bundle, the shipped MutationObserver
 *
 * This page does not re-implement `configure` + `paint`. It loads the built
 * artifact `dist/client.js` — the exact file a profile loads — captures its
 * module through a minimal `window.__ModuleLoader__` stub, and calls its
 * `apply(ctx)` with a stub Cordis context. Every measured render is therefore
 * produced by the plugin's own code: its `scan`, its settle timer, its serial
 * queue, its `configure()` + `mermaid.render()` + `innerHTML` + `fitReading`,
 * and its `data-dsh-mermaid="done"` marker. `assertRendered()` fails the run
 * if a canvas has no `<svg>` or the marker is missing, so a silent regression
 * to "no diagram" cannot masquerade as a fast run.
 *
 * The only thing faked is the *shell*: a `.md-code-block` root holding a
 * `[data-code-block-banner]` (first child's text is the language) and a
 * `[data-code-block-content] > pre` (the fence source). That is the DOM
 * contract the plugin documents and detects against.
 *
 * ## What is measured, and from where
 *
 * Every probe is a monkey-patch *around* the plugin, never inside it. One
 * `renderEntry` per `mermaid.render` call collects the segments; the hooks
 * write into `current`, the driver reads it.
 *
 *   init   wrapper around `mermaid.initialize` — the plugin's `configure()`
 *          calls it once per paint with `configForVariant(scheme, variant)`.
 *          The wrapper pairs the call with the render that follows it.
 *   render wrapper around `mermaid.render(id, code)`, the call `paint()` awaits.
 *   probe  `document.body.appendChild` / `insertBefore` is patched to notice
 *          mermaid's temporary host (`#d<id>` / `#i<id>`) appearing. At that
 *          moment the whole document's layout is dirty; the patch immediately
 *          reads `getBoundingClientRect()` on the 2400px card container and
 *          records what that forced layout costs. This forced layout is added
 *          by the *instrument*, not present in the plugin, so `render` is
 *          reported both with it and net of it (`renderNet`).
 *   insert the `Element.prototype.innerHTML` setter for
 *          `canvas.innerHTML = result.svg`: the DOM build cost.
 *   flush  the first `clientWidth` / `offsetHeight` read the plugin itself
 *          makes on the canvas (inside `fitReading`) — that read is the style
 *          and layout flush the insertion caused. `insertToLayout` spans from
 *          the innerHTML assignment to that read, so it bounds both the build
 *          and the flush.
 *   paint  double `requestAnimationFrame` after `data-dsh-mermaid="done"`.
 *   tasks  `PerformanceObserver({entryTypes:['longtask']})`, attributed to the
 *          window between injection and first frame.
 *
 * ## Flags (query string, set by bench.mjs)
 *
 *   variant=radix  scheme=light  reps=5  init=every|once  cv=0|1  burst=1  iso=0
 */

import { CORPUS, WARMUP } from './corpus.mjs'
import { configForVariant } from '/src/theme.js'

/** Same pinned release the plugin loads; see MERMAID_CDN in src/client.js. */
const MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.min.js'

const params = new URLSearchParams(location.search)
const CFG = {
  variant: params.get('variant') ?? 'radix',
  scheme: params.get('scheme') === 'dark' ? 'dark' : 'light',
  reps: Math.max(1, Number(params.get('reps') ?? 5)),
  /** 'every' = the plugin as shipped (initialize before every render).
   *  'once'  = every initialize after the first is dropped (the experiment). */
  initMode: ['once', 'paired'].includes(params.get('init')) ? params.get('init') : 'every',
  /** Benchmark-only: content-visibility:auto on the diagram canvas. */
  contentVisibility: params.get('cv') === '1',
  /** Also run the realistic "whole corpus appended at once" pass. */
  burst: params.get('burst') !== '0',
  /** Also run the direct-mode isolation-container micro-experiment. */
  isoContainer: params.get('iso') === '1',
  /** Disable the temp-host forced-layout probe (for clean A/B comparisons). */
  probe: params.get('probe') !== '0',
  /** Benchmark-only: contain: layout style paint on the diagram canvas. */
  contain: params.get('contain') === '1',
  /**
   * '1' keeps every injected fence's text identical, so the plugin's
   * rendered-SVG cache stays warm across reps — used to measure the cache
   * itself. Off by default: a cached paint calls no `mermaid.render` at all,
   * which would make every rep after the first free and incomparable with a
   * build that has no cache.
   */
  reuseCache: params.get('cache') === '1',
  /** Also run the long-conversation arm: diagrams that mount off screen. */
  park: params.get('park') === '1',
}

/**
 * The fence source to inject for one diagram.
 *
 * The plugin caches finished SVG strings keyed on the fence text, so injecting
 * the same corpus twice would make the second pass free. A trailing Mermaid
 * comment makes each fence unique while costing the parser nothing, which keeps
 * every rep a real render and the numbers comparable with the pre-cache
 * baseline. `?cache=1` keeps the text stable instead, to measure the cache.
 */
let bustCount = 0
const sourceFor = (entry) => (
  CFG.reuseCache ? entry.code : `${entry.code}\n%% bench ${(bustCount += 1)}`
)

const status = (text) => {
  const el = document.getElementById('bench-status')
  if (el !== null) el.textContent = text
}

// ---- frames --------------------------------------------------------------
const now = () => performance.now()
const nextFrame = () => new Promise((done) => requestAnimationFrame(() => done(now())))
/** Resolves in the frame *after* the one that paints what is currently dirty. */
const nextPaint = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => done(now()))))
const sleep = (ms) => new Promise((done) => setTimeout(done, ms))

// ---- scrolling -----------------------------------------------------------
/**
 * Put one card near the top of the viewport, deterministically.
 *
 * `scrollIntoView({block:'center'})` was centring a card whose box is still
 * header-sized (the canvas is empty until the diagram arrives) and drifting once
 * the page settled, which left the fence 500px above the viewport — and the
 * plugin, correctly, declined to render it. This writes the scroll position
 * directly instead, so "the reader is looking at the card" is a fact the
 * measurement can rely on.
 */
const presentCard = (block) => {
  const top = block.getBoundingClientRect().top + window.scrollY
  window.scrollTo({ top: Math.max(0, Math.round(top) - 120), behavior: 'instant' })
}

/** Sleep for a fixed time; used to let untriggered work NOT happen. */


// ---- the simulated shell DOM ---------------------------------------------
/**
 * A conversation of a few hundred nodes, so a forced style/layout recalc has
 * real work to do, plus non-mermaid fences the plugin's `scan` must reject
 * (that rejection is part of the real per-block cost of a long thread).
 */
const buildConversation = () => {
  const sidebar = document.querySelector('#sidebar .bench-sidebar-filler')
  for (let i = 0; i < 24; i += 1) {
    const row = document.createElement('div')
    row.className = i % 3 === 0 ? 'row short' : 'row'
    sidebar.append(row)
  }
  const conv = document.getElementById('bench-conversation')
  const frag = document.createDocumentFragment()
  for (let m = 0; m < 40; m += 1) {
    const msg = document.createElement('div')
    msg.className = 'msg'
    const role = document.createElement('div')
    role.className = 'msg-role'
    role.textContent = m % 2 === 0 ? 'You' : 'DeepSeek Harness'
    msg.append(role)
    const p = document.createElement('p')
    p.textContent = `Message ${m}: the panel renders a fence as a code card, and a diagram `
      + 'fence is taken over by the preview plugin. This paragraph exists to give the '
      + 'page a realistic amount of text to lay out.'
    msg.append(p)
    if (m % 4 === 1) {
      const ul = document.createElement('ul')
      for (let i = 0; i < 5; i += 1) {
        const li = document.createElement('li')
        li.textContent = `Bullet ${m}.${i} — a short line of supporting text.`
        ul.append(li)
      }
      msg.append(ul)
    }
    if (m % 8 === 3) {
      msg.append(makeBlock({ lang: 'ts', code: 'const answer: number = 42\nconsole.log(answer)' }))
    }
    if (m % 8 === 5) {
      const note = document.createElement('div')
      note.className = 'bench-note'
      const strong = document.createElement('strong')
      strong.textContent = 'Note '
      const span = document.createElement('span')
      span.textContent = `#${m} — a third inline node, so the thread is a few hundred nodes deep.`
      note.append(strong, span)
      msg.append(note)
    }
    frag.append(msg)
  }
  conv.append(frag)
}

/**
 * One fence card, in the shape the shell renders for an *unhighlighted*
 * language: `.md-code-block` > banner wrapper > `[data-code-block-banner]`, and
 * `[data-code-block-content] > pre`.
 */
function makeBlock ({ lang, code }) {
  const block = document.createElement('div')
  block.className = 'md-code-block'

  const wrap = document.createElement('div')
  wrap.className = 'bench-banner-wrap'
  const banner = document.createElement('div')
  banner.setAttribute('data-code-block-banner', '')
  const label = document.createElement('span')
  label.textContent = lang
  const tools = document.createElement('span')
  tools.textContent = 'copy'
  banner.append(label, tools)
  wrap.append(banner)

  const content = document.createElement('div')
  content.setAttribute('data-code-block-content', '')
  const pre = document.createElement('pre')
  const codeEl = document.createElement('code')
  codeEl.textContent = code
  pre.append(codeEl)
  content.append(pre)

  block.append(wrap, content)
  return block
}

// ---- measurement state ---------------------------------------------------
/** code -> diagram name, so a render is attributed from its own input text. */
const nameByCode = new Map([...CORPUS, WARMUP].map((d) => [d.code, d.name]))
/** `sourceFor` appends a cache-busting comment; strip it before the lookup. */
const codeOf = (text) => (typeof text === 'string' ? text.replace(/\n%% bench \d+$/, '') : text)

/**
 * One measurement record. Created by the `mermaid.render` wrapper, and also
 * pre-made by a warm-cache run, where the plugin answers from its SVG cache and
 * no render call exists to attribute the insert to.
 */
const emptyEntry = (name, init) => ({
  name,
  phase: 'unassigned',
  init: Number.isFinite(init) ? init : 0,
  render: Number.NaN,
  probe: 0,
  probeCount: 0,
  probeMax: 0,
  build: Number.NaN,
  flush: Number.NaN,
  insertToLayout: Number.NaN,
  insertEnd: Number.NaN,
  svgLen: 0,
  viewBox: '',
})

/** Every mermaid.render call, in order, with its instrumented segments. */
const renderLog = []
/** The entry the insert/flush/probe hooks write into. */
let current = null
/** The initialize cost waiting to be paired with the next render. */
let pendingInit = null

let longTaskEntries = []
/** 'every' = mermaid.initialize on every paint (shipped); 'skip' = once only. */
let initPolicy = 'every'
let initialized = false

const collectLongTasks = () => {
  if (typeof PerformanceObserver !== 'function') return
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        longTaskEntries.push({ start: entry.startTime, duration: entry.duration })
      }
    })
    observer.observe({ entryTypes: ['longtask'] })
  } catch {
    /* longtask is Chromium-only; its absence is not a failure */
  }
}

const longTasksIn = (from, to) => longTaskEntries
  .filter((entry) => entry.start < to && entry.start + entry.duration > from)
  .map((entry) => Math.round(entry.duration * 10) / 10)

/** FNV-1a, hex. Cheap enough to run on a 170 KB SVG outside a timed window. */
const hash = (text) => {
  let value = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i)
    value = Math.imul(value, 0x01000193)
  }
  return (value >>> 0).toString(16)
}

/** Is this element the plugin's diagram canvas? */
const isCanvas = (element) => element?.classList?.contains('dsh-mermaid-canvas') === true

/**
 * Install every probe around an already-loaded mermaid. The plugin's
 * `loadMermaid()` resolves immediately from `window.mermaid`, so the CDN
 * fetch sits outside the measured window: it is a network variable, not a
 * render cost, and the plugin's own lazy-load path is still exercised by the
 * warmup pass.
 */
const installHooks = (target) => {
  const rawInitialize = target.initialize.bind(target)
  const rawRender = target.render.bind(target)

  target.initialize = (config) => {
    // `initPolicy === 'skip'` is the experiment arm: the plugin's `configure()`
    // still runs and still builds the config object, only mermaid's own
    // re-initialisation is dropped. Legitimate here because the config is
    // identical for every paint in a run (one variant, one scheme).
    if (initPolicy === 'skip' && initialized) {
      pendingInit = 0
      return undefined
    }
    const t0 = now()
    const result = rawInitialize(config)
    initialized = true
    pendingInit = now() - t0
    return result
  }

  target.render = async (id, text, container) => {
    const entry = emptyEntry(nameByCode.get(codeOf(text)) ?? null, pendingInit)
    pendingInit = null
    renderLog.push(entry)
    current = entry
    const t0 = now()
    let svg = null
    try {
      const result = await rawRender(id, text, container)
      svg = result?.svg ?? ''
      return result
    } finally {
      entry.render = now() - t0
      entry.svgLen = svg?.length ?? 0
      entry.viewBox = (svg?.match(/viewBox="([^"]+)"/) ?? [])[1] ?? ''
      // A fingerprint of the produced SVG, computed *after* the render timing
      // closed: it proves which theme actually drew the diagram (a variant
      // change must change the hash) without inflating the measured window.
      entry.svgHash = hash(svg ?? '')
      entry.svgColors = [...new Set((svg ?? '').match(/#[0-9a-f]{6}/gi) ?? [])].slice(0, 4)
    }
  }

  // ---- innerHTML setter: the DOM build cost ------------------------------
  const innerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML')
  Object.defineProperty(Element.prototype, 'innerHTML', {
    configurable: true,
    enumerable: innerHTML.enumerable,
    get: innerHTML.get,
    set (value) {
      if (current === null || !isCanvas(this)) {
        innerHTML.set.call(this, value)
        return
      }
      const t0 = now()
      innerHTML.set.call(this, value)
      const ms = now() - t0
      current.build = ms
      current.insertEnd = now()
    },
  })

  // ---- geometry getters: the forced style/layout flush -------------------
  // `fitReading()` reads `canvas.clientWidth` right after the insertion; that
  // read is the first point at which the browser has to lay the new SVG out.
  const hookGeometry = (proto, property) => {
    const descriptor = Object.getOwnPropertyDescriptor(proto, property)
    if (descriptor === null || typeof descriptor.get !== 'function') return
    Object.defineProperty(proto, property, {
      configurable: true,
      enumerable: descriptor.enumerable,
      get () {
        if (current === null || !Number.isNaN(current.flush) || !isCanvas(this)
          || Number.isNaN(current.insertEnd)) {
          return descriptor.get.call(this)
        }
        const t0 = now()
        const value = descriptor.get.call(this)
        current.flush = now() - t0
        current.insertToLayout = now() - current.insertEnd
        return value
      },
      set: descriptor.set,
    })
  }
  hookGeometry(Element.prototype, 'clientWidth')
  hookGeometry(HTMLElement.prototype, 'offsetHeight')

  // ---- temp-host probe: a forced layout at mermaid's insertion ----------
  // mermaid appends its temporary SVG host to <body> as an *anonymous* div and
  // only then sets `id="d<renderId>"`, so the detection cannot key on the id:
  // any element appended to <body> while a render is in flight is mermaid's.
  // Each such append dirties the document's layout; the probe immediately
  // reads the 2400px card container, which forces that layout to be redone.
  const body = document.body
  const probeTempHost = () => {
    if (current === null) return
    const t0 = now()
    document.getElementById('cards').getBoundingClientRect()
    const ms = now() - t0
    current.probe += ms
    current.probeCount += 1
    if (ms > current.probeMax) current.probeMax = ms
  }
  const onBodyInsert = (parent, node) => {
    if (!CFG.probe) return
    if (current === null) return
    if (parent !== body && parent !== document.documentElement) return
    if (node === null || typeof node !== 'object' || node.nodeType !== 1) return
    probeTempHost()
  }
  const appendChild = Node.prototype.appendChild
  Node.prototype.appendChild = function (node) {
    const result = appendChild.call(this, node)
    onBodyInsert(this, node)
    return result
  }
  const insertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function (node, reference) {
    const result = insertBefore.call(this, node, reference)
    onBodyInsert(this, node)
    return result
  }
}

/**
 * `init=once`: drop every `mermaid.initialize` after the first. Wrapped around
 * the recording wrapper, so the recording still sees the (near-zero) cost of
 * the dropped call and the plugin's `configure()` still runs and still builds
 * the config object — only mermaid's own re-initialisation is skipped.
 */
const limitInitialize = (target) => {
  const recording = target.initialize
  let calls = 0
  target.initialize = (config) => {
    calls += 1
    if (calls === 1) return recording(config)
    // Record the dropped call as 0 rather than leaving it unset: the point of
    // the experiment is that this cost disappears, and a NaN would poison the
    // per-diagram total instead of showing the saving.
    pendingInit = 0
    return undefined
  }
}

// ---- plugin loading ------------------------------------------------------
/** Load `dist/client.js` the way the shell does: through the module loader. */
const loadBundle = async () => {
  let plugin = null
  window.__ModuleLoader__ = {
    load ({ id, factory }) {
      if (typeof factory !== 'function') throw new TypeError('factory missing')
      plugin = factory(() => {
        throw new Error(`unexpected require() from ${id}`)
      })
    },
  }
  await new Promise((done, fail) => {
    const script = document.createElement('script')
    script.src = '/dist/client.js'
    script.onload = done
    script.onerror = () => fail(new Error('dist/client.js failed to load'))
    document.head.append(script)
  })
  if (plugin === null) throw new Error('__ModuleLoader__.load was not called')
  return plugin
}

/** The smallest Cordis stand-in the plugin actually touches. */
const makeContext = () => {
  const disposers = []
  const themeService = { getTheme: () => ({ active: { colorScheme: CFG.scheme } }) }
  return {
    effect (fn) {
      const dispose = fn()
      if (typeof dispose === 'function') disposers.push(dispose)
      return dispose
    },
    get (name) {
      // The shell provides a theme service; the plugin tolerates `undefined`
      // for every other service (`locale` included).
      return name === 'theme' ? themeService : undefined
    },
    on (event, fn) {
      return () => fn
    },
    listeners: [],
  }
}

// ---- waiting -------------------------------------------------------------
/** Resolve when the plugin stamps this block, reject if it gives up. */
const waitSettled = (block, timeoutMs = 120_000) => new Promise((done, fail) => {
  const name = block.dataset.benchName ?? 'block'
  const state = block.dataset.dshMermaid
  if (state === 'done') {
    done('done')
    return
  }
  if (state === 'failed') {
    fail(new Error(`plugin reported failure for ${name}`))
    return
  }
  const observer = new MutationObserver(() => {
    const value = block.dataset.dshMermaid
    if (value === 'done') {
      observer.disconnect()
      clearTimeout(timer)
      done('done')
    } else if (value === 'failed') {
      observer.disconnect()
      clearTimeout(timer)
      fail(new Error(`plugin reported failure for ${name}`))
    }
  })
  observer.observe(block, { attributes: true, attributeFilter: ['data-dsh-mermaid'] })
  const timer = setTimeout(() => {
    observer.disconnect()
    const rect = block.getBoundingClientRect()
    const canvas = block.querySelector('.dsh-mermaid-canvas')
    fail(new Error(`timeout waiting for ${name} — dataset=${block.dataset.dshMermaid}`
      + ` holder=${block.querySelector('[data-dsh-mermaid-holder]') !== null}`
      + ` canvasHidden=${canvas === null ? 'n/a' : canvas.hidden}`
      + ` rect=${Math.round(rect.top)}..${Math.round(rect.bottom)}`
      + ` vh=${window.innerHeight} scrollY=${Math.round(window.scrollY)}`
      + ` cardsTop=${Math.round(document.getElementById('cards').getBoundingClientRect().top)}`))
  }, timeoutMs)
})

/** The plugin really rendered: an SVG in the canvas and the done marker. */
const assertRendered = (block) => {
  const canvas = block.querySelector('.dsh-mermaid-canvas')
  if (canvas === null) throw new Error('plugin did not create a canvas')
  if (canvas.querySelector('svg') === null) throw new Error('canvas has no <svg>')
  if (block.dataset.dshMermaid !== 'done') throw new Error('block is not marked done')
}

/**
 * One measured diagram: inject the fence, wait for the plugin, wait for the
 * frame that paints it, and stamp the block-level numbers onto its entry.
 */
const measureOne = async (entry, container, arm = 'every') => {
  const block = makeBlock({ lang: 'mermaid', code: sourceFor(entry) })
  block.dataset.benchName = entry.name
  current = null
  // The card container sits below a ~5000px conversation, so without this the
  // new diagram would never be painted and "time to first paint" would be a
  // fiction. Aligning the region with the viewport top is also what the shell
  // looks like when a new message streams in at the bottom. The scroll happens
  // before the measured window opens.
  window.scrollTo({ top: container.offsetTop, behavior: 'instant' })
  await nextFrame()
  const injectedAt = now()
  container.append(block)
  // The plugin renders a diagram on visibility, so the fence has to actually be
  // presented to the viewport — the shell scrolls to a newly streamed message
  // for the same reason.
  presentCard(block)
  // Warm-cache arm: the plugin answers from its rendered-SVG cache, so there is
  // no `mermaid.render` call to attribute the DOM build to. Prime a record; a
  // real render, when one happens, replaces it.
  if (CFG.reuseCache && current === null) {
    current = emptyEntry(entry.name, 0)
    current.render = 0
    current.cached = true
    renderLog.push(current)
  }
  await waitSettled(block)
  const doneAt = now()
  const frameAt = await nextPaint()
  assertRendered(block)
  const render = current
  if (render === null) throw new Error(`no mermaid.render observed for ${entry.name}`)
  render.phase = 'single'
  render.arm = arm
  render.injectedAt = injectedAt
  render.doneAt = doneAt
  render.wall = doneAt - injectedAt
  render.firstPaint = frameAt - injectedAt
  render.longTasks = longTasksIn(injectedAt, frameAt)
  return render
}

// ---- init micro-benchmark ------------------------------------------------
/**
 * `mermaid.initialize()` on its own, with the plugin's real config object:
 * N calls with the same values, then N calls alternating between the two
 * schemes — the shape a theme switch produces, and the case where a single
 * shared initialize would be wrong. Uses the *raw* mermaid call.
 */
const initMicro = (target, rounds = 30) => {
  const raw = target.__rawInitialize
  const base = { startOnLoad: false, securityLevel: 'strict', suppressErrorRendering: true }
  const light = () => ({ ...base, ...configForVariant('light', CFG.variant) })
  const dark = () => ({ ...base, ...configForVariant('dark', CFG.variant) })
  const active = () => (CFG.scheme === 'dark' ? dark() : light())
  const other = () => (CFG.scheme === 'dark' ? light() : dark())

  const same = []
  const alternate = []
  const configCost = []
  let sink = 0
  raw(active())
  for (let i = 0; i < rounds; i += 1) {
    const t0 = now()
    raw(active())
    same.push(now() - t0)
  }
  for (let i = 0; i < rounds; i += 1) {
    const t0 = now()
    raw(i % 2 === 0 ? active() : other())
    alternate.push(now() - t0)
  }
  for (let i = 0; i < rounds; i += 1) {
    const t0 = now()
    // Touch the result: an unused allocation of a 37 KB object is a candidate
    // for dead-code elimination, which would report a fake zero.
    sink += configForVariant(CFG.scheme, CFG.variant).themeCSS.length
    configCost.push(now() - t0)
  }
  raw(active())
  const config = configForVariant(CFG.scheme, CFG.variant)
  return {
    rounds,
    sink,
    same,
    alternate,
    configCost,
    configBytes: JSON.stringify(config).length,
    themeCssChars: (config.themeCSS ?? '').length,
    themeVariableCount: Object.keys(config.themeVariables ?? {}).length,
  }
}

// ---- direct-mode micro-experiment ---------------------------------------
/**
 * NOT the plugin's path. `mermaid.render(id, text, container)` with a
 * style-isolated container measures what passing the third argument would buy;
 * the plugin currently does not pass it. Reported separately and labelled.
 */
const isoContainerProbe = async (target, rounds = 3) => {
  const raw = target.__rawRender
  // Same mermaid call, two hosts, interleaved per diagram so thermal/load drift
  // cannot favour one of them:
  //   body      — no container argument, i.e. exactly the plugin's call. mermaid
  //               appends its temporary SVG host to <body>, inside this page's
  //               5900px conversation + 2400px card container flow.
  //   offscreen — an offscreen absolute <div> passed as `mermaid.render`'s third
  //               argument, where mermaid's temporary host lands instead.
  // Both arms wait SETTLE_MS before each render, because the plugin renders
  // after a 250ms settle and starting a cold render immediately after a 250ms
  // idle is a different measurement than starting one back-to-back.
  const GAP_MS = 250
  const conditions = [
    { id: 'body', useContainer: false },
    { id: 'offscreen', useContainer: true },
  ]
  const host = document.createElement('div')
  host.style.cssText = 'position:absolute;left:-100000px;top:0;width:860px;'
  document.body.append(host)
  const out = []
  for (const entry of CORPUS) {
    const samples = { body: [], offscreen: [] }
    for (let i = 0; i < rounds; i += 1) {
      for (const condition of conditions) {
        await new Promise((done) => setTimeout(done, GAP_MS))
        const iso = condition.useContainer ? document.createElement('div') : null
        if (iso !== null) host.append(iso)
        const t0 = now()
        try {
          if (iso === null) await raw(`iso-body-${entry.name}-${i}`, entry.code)
          else await raw(`iso-off-${entry.name}-${i}`, entry.code, iso)
          samples[condition.id].push(now() - t0)
        } catch {
          samples[condition.id].push(Number.NaN)
        } finally {
          iso?.remove()
        }
      }
    }
    out.push({ name: entry.name, samples })
  }
  host.remove()
  return out
}

// ---- the run -------------------------------------------------------------
const run = async () => {
  status('booting…')
  buildConversation()
  collectLongTasks()
  document.documentElement.dataset.benchCv = CFG.contentVisibility ? 'on' : 'off'
  document.documentElement.dataset.benchContain = CFG.contain ? 'on' : 'off'
  if (CFG.scheme === 'dark') document.body.dataset.dsDarkTheme = ''

  // The theme variant is a *reader preference* the plugin reads from
  // localStorage in `apply()`, so this is how the real plugin is put into a
  // variant — no source is touched.
  try {
    window.localStorage.setItem('dsh-mermaid-preview:theme', CFG.variant)
  } catch {
    /* storage is optional for the plugin; the default variant still runs */
  }

  status('loading mermaid…')
  const mermaid = await new Promise((done, fail) => {
    const script = document.createElement('script')
    script.src = MERMAID_CDN
    script.async = true
    script.onload = () => (window.mermaid === undefined
      ? fail(new Error('window.mermaid is missing after the CDN script'))
      : done(window.mermaid))
    script.onerror = () => fail(new Error(`failed to load ${MERMAID_CDN}`))
    document.head.append(script)
  })
  mermaid.__rawInitialize = mermaid.initialize.bind(mermaid)
  mermaid.__rawRender = mermaid.render.bind(mermaid)
  installHooks(mermaid)
  if (CFG.initMode === 'once') limitInitialize(mermaid)

  const init = initMicro(mermaid)

  status('applying plugin…')
  const plugin = await loadBundle()
  if (typeof plugin.apply !== 'function') throw new Error('bundle exports no apply()')
  plugin.apply(makeContext())

  const container = document.getElementById('cards')
  if (typeof document.fonts?.ready?.then === 'function') await document.fonts.ready

  // ---- warmup: discarded, and documented as discarded -------------------
  status('warmup…')
  const warmup = { discarded: 2, note: 'JIT + first-layout + font warmup, never reported' }
  for (let i = 0; i < warmup.discarded; i += 1) {
    const block = makeBlock({ lang: 'mermaid', code: sourceFor(WARMUP) })
    block.dataset.benchName = 'warmup'
    container.append(block)
    // The plugin renders on visibility, and #cards sits at the end of the
    // simulated thread, so the card has to be brought into view or it would
    // (correctly) stay unrendered.
    presentCard(block)
    await waitSettled(block)
    if (current !== null) current.phase = 'warmup'
    await nextPaint()
    block.remove()
    await nextFrame()
  }
  warmup.observedRenders = renderLog.filter((e) => e.phase === 'warmup').length
  longTaskEntries = []

  // ---- per-diagram, one at a time --------------------------------------
  status('measuring…')
  // 'paired' runs both initialize arms inside one run, back to back per rep and
  // with the order flipped on odd reps, so machine drift and CPU-frequency
  // changes cannot favour either arm. That is the only design that can resolve
  // a cost this small against this machine's noise.
  const paired = CFG.initMode === 'paired'
  for (let rep = 0; rep < CFG.reps; rep += 1) {
    const order = paired && rep % 2 === 1 ? ['skip', 'every'] : (paired ? ['every', 'skip'] : ['every'])
    for (const arm of order) {
      initPolicy = arm
      for (const entry of CORPUS) {
        // A clean container per diagram keeps the layout baseline constant: the
        // 2400px card container plus the fixed conversation, never a growing
        // pile of earlier diagrams. The burst pass covers the growing case.
        container.replaceChildren()
        await nextFrame()
        await measureOne(entry, container, arm)
        status(`measuring… rep ${rep + 1}/${CFG.reps} ${paired ? arm + ' ' : ''}· ${entry.name}`)
      }
    }
  }
  initPolicy = 'every'
  container.replaceChildren()
  const single = renderLog.filter((e) => e.phase === 'single')

  // ---- park: the long-conversation case --------------------------------
  // A thread whose whole history mounts while the reader sits at the bottom.
  // Every fence is in the DOM and every settle timer fires, but nothing is near
  // the viewport. A build that renders on sight does nine Mermaid renders here;
  // a build that renders on visibility does none, which is the entire point of
  // the visibility gate.
  let parked = null
  if (CFG.park) {
    status('parked (off-screen) diagrams…')
    container.replaceChildren()
    await nextFrame()
    // #cards sits at the very end of #thread, so the top of the page keeps the
    // whole card region far outside the visibility margin.
    window.scrollTo({ top: 0, behavior: 'instant' })
    await nextFrame()
    const from = renderLog.length
    const blocks = CORPUS.map((entry) => {
      const block = makeBlock({ lang: 'mermaid', code: sourceFor(entry) })
      block.dataset.benchName = entry.name
      return block
    })
    for (const block of blocks) container.append(block)
    // Long enough for the 250ms settle of every fence to fire several times
    // over, so "no render" means "declined", not "not yet scheduled".
    await sleep(1500)
    parked = {
      diagrams: blocks.length,
      renders: renderLog.length - from,
      renderedNames: renderLog.slice(from).map((e) => e.name),
      settled: blocks.filter((b) => b.dataset.dshMermaid === 'done').length,
    }
    container.replaceChildren()
  }

  // ---- burst: the whole corpus appended in one tick --------------------
  // The realistic shape: one assistant message with many diagrams. The plugin
  // serializes the renders, so each diagram's segments stay attributable.
  let burst = null
  if (CFG.burst) {
    status('burst…')
    container.replaceChildren()
    await nextFrame()
    const from = renderLog.length
    const blocks = CORPUS.map((entry) => {
      const block = makeBlock({ lang: 'mermaid', code: sourceFor(entry) })
      block.dataset.benchName = entry.name
      return block
    })
    window.scrollTo({ top: container.offsetTop, behavior: 'instant' })
    await nextFrame()
    const injectedAt = now()
    for (const block of blocks) container.append(block)
    // The burst is a message with every diagram in it, so every card has to be
    // rendered for the run to mean what it did before visible-first scheduling;
    // otherwise the plugin correctly skips the ones below the fold and the
    // comparison measures two different things. Each card is therefore brought
    // into view and held there until the plugin finishes it — one scroll frame
    // is not enough, because the browser samples intersections once per frame
    // and a card that flashes past between two samples is (correctly) treated as
    // unseen.
    const results = []
    for (const block of blocks) {
      presentCard(block)
      results.push(await waitSettled(block, 60_000).then(
        () => ({ status: 'fulfilled' }),
        (reason) => ({ status: 'rejected', reason }),
      ))
    }
    const doneAt = now()
    const frameAt = await nextPaint()
    const failures = results.filter((r) => r.status === 'rejected').map((r) => String(r.reason))
    const entries = renderLog.slice(from)
    for (const entry of entries) entry.phase = 'burst'
    burst = {
      diagrams: blocks.length,
      failures,
      wall: doneAt - injectedAt,
      firstPaint: frameAt - injectedAt,
      longTasks: longTasksIn(injectedAt, frameAt),
      perDiagram: entries.map((e) => ({
        name: e.name,
        render: e.render,
        init: e.init,
        build: e.build,
        flush: e.flush,
        insertToLayout: e.insertToLayout,
      })),
    }
    container.replaceChildren()
  }

  // ---- direct-mode isolation-container probe ---------------------------
  let isoContainer = null
  if (CFG.isoContainer) {
    status('isolation container…')
    isoContainer = await isoContainerProbe(mermaid, 3)
  }

  status('done')
  const geometry = (() => {
    const cards = document.getElementById('cards')
    return {
      conversationHeight: document.getElementById('bench-conversation').offsetHeight,
      cardsTop: cards.offsetTop,
      cardsHeight: cards.offsetHeight,
      documentHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
      conversationNodes: document.querySelectorAll('#bench-conversation *').length,
      scrollY: window.scrollY,
    }
  })()
  return {
    config: { ...CFG, mermaid: MERMAID_CDN },
    geometry,
    warmup,
    parked,
    init,
    diagrams: CORPUS.map((entry) => ({
      name: entry.name,
      note: entry.note ?? '',
      renders: single.filter((e) => e.name === entry.name).map((e) => ({
        arm: e.arm,
        init: e.init,
        render: e.render,
        probe: e.probe,
        probeCount: e.probeCount,
        probeMax: e.probeMax,
        build: e.build,
        flush: e.flush,
        insertToLayout: e.insertToLayout,
        wall: e.wall,
        firstPaint: e.firstPaint,
        svgLen: e.svgLen,
        viewBox: e.viewBox,
        svgHash: e.svgHash,
        svgColors: e.svgColors,
        longTasks: e.longTasks,
      })),
    })),
    burst,
    isoContainer,
    renderCount: renderLog.length,
    longTaskCount: longTaskEntries.length,
  }
}

window.__benchRun = run
window.__benchReady = true
status('ready')
