/**
 * dsh-mermaid-preview — Client (browser) half.
 *
 * Renders `mermaid` fenced code blocks as diagrams in every DeepSeek Harness
 * (dsh) Web Markdown surface: chat messages, the trajectory view, plan review,
 * compaction summaries — anywhere the shared `MarkdownText` renderer draws a
 * fence.
 *
 * ## How it works
 *
 * 1. `MarkdownText` renders a fence as a `.md-code-block` root holding a
 *    `[data-code-block-banner]` header and a `[data-code-block-content]` body.
 *    A language the shiki grammar table does not know (which includes
 *    `mermaid`) renders **plain**: the body's first child is a `<pre>`. A
 *    highlighted language renders shiki output inside a `<div>` instead, so
 *    "the body's first child is a `<pre>`" is the plugin's cheap, stable
 *    "unhighlighted fence" test.
 * 2. The header is a `CodeToolbar`, which prints the *generic* code label for an
 *    unsupported language — the info string `mermaid` is therefore **not** in
 *    the DOM on current dsh. Detection is content-based: the first Mermaid
 *    statement of the fence (`flowchart`, `sequenceDiagram`, …) decides. A
 *    surface that does print the info string (older layouts, the demo page) is
 *    still honored directly.
 * 3. The plugin appends its own holder as the block's **trailing** child and
 *    leaves every React-owned node in place. CSS lays the card out as a column
 *    with the holder first, so one plugin-owned header serves both views: the
 *    diagram card shows a type label and copy / source / zoom controls, and the
 *    source view is the original `<pre>` with the hidden attribute lifted. The
 *    shell's generic code banner is hidden with a reversible attribute (never
 *    by removing the node), so React always keeps its own DOM.
 * 4. Mermaid 11 (UMD, jsDelivr) is fetched once, lazily, only when the first
 *    candidate fence appears. Renders are serialized so a message full of
 *    diagrams cannot block the main thread with parallel work.
 * 5. A diagram is always fit to the card's width: a wide one is scaled down
 *    until the whole diagram is visible instead of being cropped or scrolled
 *    sideways; a small-and-short one grows up to MAX_READING_SCALE; a tall one
 *    keeps 1:1 and lets the card grow taller. The canvas is not a scroll
 *    container, so the wheel always scrolls the message list even when the
 *    pointer is over a chart. Readability of a very wide diagram comes from the
 *    viewer: click the diagram — or the zoom control in the header — to open a
 *    full-window viewer with a framed paper on a blurred mask, a floating
 *    toolbar, wheel zoom, drag-to-pan, fit-to-window, double-click 1:1, arrow
 *    keys and Esc.
 * 6. A render failure is never final. Streaming cuts a fence mid-statement
 *    whenever the model pauses for longer than the settle window, and a
 *    half-written diagram is a parse error, not a user error: the block retries
 *    with backoff, and only a fence whose text has stopped changing and still
 *    fails earns the note. That note is a calm inline panel with a human
 *    summary; the parser's own message stays one click away. New text on the
 *    same block clears the note and starts over — a block is never poisoned by
 *    one bad snapshot of itself.
 * 7. Theme switches repaint through `ctx.on('theme/change')`; UI copy comes from
 *    the Client locale service (`ctx.get('locale')`), so it follows the
 *    interface language. A repaint closes the viewer, which would otherwise
 *    keep showing the previous theme's picture.
 * 8. Diagrams are drawn with a hand-built Mermaid theme (`THEMES` below): the
 *    shell's own palette, type stack, and hairline geometry, so a diagram reads
 *    as part of dsh rather than a pasted widget.
 * 9. Every side effect — styles, observer, listeners, timers, script tag,
 *    injected DOM, the viewer — is owned by the plugin fiber and removed on
 *    stop/update.
 *
 * This module is the canonical plugin source; the diagram theme lives in
 * `src/theme.js` and is inlined by the build (the plugin ships as one wrapped
 * source, with no bundler). `scripts/build.mjs` derives `dist/client.js` (the
 * native bundle a profile loads) and `dist/dsh-mermaid-preview.client.js` (the
 * paste-ready dynamic payload).
 *
 * MIT License — see LICENSE.
 */

/** Package name. It is the browser module identity, so it must equal `name`. */
const PLUGIN_ID = 'dsh-mermaid-preview'

/** Locale namespace for this plugin's own interface copy. */
const NS = PLUGIN_ID

/** Fence language this plugin takes over. */
const LANGUAGE = 'mermaid'

/**
 * The vendored Mermaid engine.
 *
 * The engine is *not* fetched at runtime: it ships inside the package, as
 * `dist/client.mermaid.js`, so a diagram renders on a machine that has no
 * route to the internet. dsh serves that file through its package-local chunk
 * route (`/plugins/dsh-mermaid-preview/client.mermaid.js?rev=…`), and the
 * page's module loader reaches it with `require.async`.
 */
const ENGINE_CHUNK = './client.mermaid.js'

/** The chunk's file name inside the package. */
const ENGINE_FILE = 'client.mermaid.js'

/** The Mermaid release vendored into `dist/client.mermaid.js`. */
const MERMAID_VERSION = '11.17.2'

/** Quiet period before a fence is considered settled and worth rendering. */
const SETTLE_MS = 250

/**
 * Backoff after a failed render, in milliseconds. A fence that fails while it
 * is still being streamed usually fails because it is half-written, so the
 * plugin stays quiet and tries again; only a fence that keeps failing after
 * these retries — one whose text has stopped changing — earns the error note.
 */
const RETRY_MS = [400, 900, 1800]

/**
 * How far outside the viewport a diagram may start rendering, in pixels.
 *
 * A Mermaid render costs 20-190ms of main thread and is 95% of this plugin's
 * work; a diagram the reader never scrolls to is work nobody sees. So a card
 * below the fold waits for the visibility observer instead of rendering at
 * mount — a conversation with thirty diagrams in its history now renders the
 * two or three that are actually on screen. The margin is generous on purpose:
 * the work starts while the card is still off screen, so it is normally ready
 * before the reader arrives.
 */
const VISIBLE_MARGIN_PX = 400

/** The same margin as CSS `rootMargin` accepts it. */
const VISIBLE_MARGIN = `${VISIBLE_MARGIN_PX}px 0px`

/**
 * Bounds of the rendered-diagram cache. A cache entry is one SVG string
 * (20-80KB for the diagrams measured); 40 entries keeps the worst case around
 * 3MB, and the byte bound keeps that true if a message contains one huge chart.
 */
const CACHE_ENTRIES = 40
const CACHE_BYTES = 4 * 1024 * 1024

/** Padding left around the diagram by the viewer's fit-to-window scale. */
const ZOOM_PAD = 40

/** Scale bounds of the viewer; `ZOOM_MAX` covers a diagram of a few nodes. */
const ZOOM_MIN = 0.1
const ZOOM_MAX = 8

/**
 * Upper bound of the viewer's fit scale. The full-window viewer is the place
 * where a small diagram may be magnified to use the window, but a 14px Mermaid
 * label should never turn into a poster: 2.5x keeps it at about 35px even on a
 * 1920px-wide window, and normal-sized diagrams never reach the cap.
 */
const ZOOM_FIT_MAX = 2.5

/** One press of the viewer's +/- buttons. */
const ZOOM_STEP = 1.25

/** Breathing room around the diagram on the viewer's paper. */
const ZOOM_PAPER_PAD = 22

/** Travel, in pixels, below which a pointer gesture is a click, not a pan. */
const ZOOM_DRAG_MIN = 4

/** How far one arrow key moves the diagram. */
const ZOOM_ARROW_PX = 80

/** Highest sane stacking order: the viewer must clear anything the shell draws. */
const ZOOM_Z_INDEX = 2147483000

/** The theme menu sits just under the viewer (the two are never open together). */
const THEME_Z_INDEX = ZOOM_Z_INDEX - 1

/** localStorage key holding the reader's diagram theme choice. */
const THEME_STORAGE_KEY = `${PLUGIN_ID}:theme`
/** Local layout preference: 'scroll' (default) or 'grow'. */
const FIT_STORAGE_KEY = `${PLUGIN_ID}:fit-mode`

/**
 * Diagram themes offered in the card header, in reading order. The system names
 * stay untranslated; `quiet` is the plugin's own neutral theme and follows the
 * interface language through `themeNeutral`.
 */
const THEME_CHOICES = [
  { id: 'radix', label: 'Radix Colors' },
  { id: 'apple', label: 'Apple HIG' },
  { id: 'github', label: 'GitHub Primer' },
  { id: 'carbon', label: 'IBM Carbon' },
  { id: 'atlassian', label: 'Atlassian' },
  { id: 'material', label: 'Material Design' },
  { id: 'polaris', label: 'Shopify Polaris' },
  { id: 'quiet', key: 'themeNeutral' },
]

/**
 * The reader's stored theme choice, when it still names a shipped variant.
 * Storage can be unavailable (private mode, disabled cookies), in which case
 * the plugin simply starts from `THEME_VARIANT`.
 */
const storedFitMode = () => {
  try {
    return window.localStorage.getItem(FIT_STORAGE_KEY) === 'grow' ? 'grow' : 'scroll'
  } catch {
    return 'scroll'
  }
}

const storeFitMode = (mode) => {
  try {
    window.localStorage.setItem(FIT_STORAGE_KEY, mode)
  } catch {
    /* storage unavailable: the choice lasts for this session */
  }
}

const storedTheme = () => {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY)
    return typeof value === 'string' && THEME_SWATCHES[value] !== undefined ? value : null
  } catch {
    return null
  }
}

/** Remember a theme choice; a failed write must never cost the switch itself. */
const storeTheme = (variant) => {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, variant)
  } catch {
    /* private mode or a full quota: the choice still applies to this session */
  }
}

/**
 * Largest upscale the card applies to a diagram that already fits. 1.5x keeps
 * a 14px Mermaid label at 21px — larger than body text, still readable as a
 * figure; filling the card would need 2.5-4.7x and turn the card into a poster,
 * which is what the full-window viewer is for.
 */
const MAX_READING_SCALE = 1.5

/**
 * Diagrams naturally taller than this keep their 1:1 size and let the card grow
 * taller instead of being magnified: a 14px label on a long sequence/C4 diagram
 * does not need to become a poster, and the page can scroll past the card.
 * Everything else may grow up to MAX_READING_SCALE.
 */
const TALL_DIAGRAM_HEIGHT = 600

/** Attribute marking the body we hide while the diagram is shown. */
const HIDDEN = 'data-dsh-mermaid-hidden'

/**
 * Attribute hiding the shell's own code banner (label, collapse, copy) while a
 * diagram stands in for the code. Toggled on the banner's wrapper, which React
 * owns — an attribute write is reversible, a node replacement is not.
 */
const BANNER_HIDDEN = 'data-dsh-mermaid-banner'

/**
 * Icon artwork for the plugin's own controls. 16px viewBox, `currentColor`,
 * 1px strokes — the same grammar as the shell's product icon set, so the card
 * toolbar reads as native chrome. Paths are derived from the DeepSeek Harness
 * icon set (MIT): code brackets, fullscreen, copy, check, close, plus, minus,
 * warning triangle.
 */
const ICONS = {
  source: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" stroke-width="1"><path d="M4.67398 4.25061L1.36094 7.86484C1.29085 7.9413 1.29085 8.05866 1.36094 8.13513L4.67398 11.7494" stroke="currentColor"/><path d="M11.3262 4.25061L14.6392 7.86484C14.7093 7.9413 14.7093 8.05866 14.6392 8.13513L11.3262 11.7494" stroke="currentColor"/><path d="M9.56222 3.62573L6.43774 12.3743" stroke="currentColor"/></svg>',
  expand: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" stroke-width="1"><path d="M2.33154 9.40576V13.1685C2.3318 13.4444 2.55556 13.6685 2.83154 13.6685H6.49463V14.6685H2.83154C2.00328 14.6685 1.3318 13.9967 1.33154 13.1685V9.40576H2.33154ZM13.1685 1.33154C13.9964 1.33199 14.6683 2.00352 14.6685 2.83154V6.40576H13.6685V2.83154C13.6683 2.5558 13.4441 2.33199 13.1685 2.33154H9.49463V1.33154H13.1685Z" fill="currentColor"/><path d="M9.4292 6.57077L13.914 2.08594" stroke="currentColor"/><path d="M6.57077 9.4292L2.08594 13.914" stroke="currentColor"/></svg>',
  copy: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" stroke-width="1"><rect x="1.52075" y="4.07373" width="10.3932" height="10.3932" rx="2" stroke="currentColor"/><path d="M11.9792 1.53296C13.36 1.53296 14.4792 2.65225 14.4792 4.03296V9.42847C14.4792 10.3756 13.9521 11.1987 13.1755 11.6228V10.3298C13.3652 10.0787 13.4792 9.7674 13.4792 9.42847V4.03296C13.4792 3.20453 12.8077 2.53296 11.9792 2.53296H6.58374C6.27966 2.53301 5.99684 2.6235 5.7605 2.77905H4.42358C4.85652 2.03463 5.66056 1.53304 6.58374 1.53296H11.9792Z" fill="currentColor"/></svg>',
  check: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" stroke-width="1"><path d="M2.5 8.5L6 12L13.5 4.5" stroke="currentColor"/></svg>',
  palette: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" stroke-width="1"><path d="M8 1.75a6.25 6.25 0 1 0 0 12.5c.9 0 1.55-.7 1.55-1.55 0-.4-.15-.77-.42-1.05a1.48 1.48 0 0 1-.43-1.04c0-.84.68-1.52 1.52-1.52h1.32a3.92 3.92 0 0 0 3.71-5.2C14.4 2.7 11.6 1.75 8 1.75Z" stroke="currentColor"/><circle cx="5.1" cy="6.1" r=".85" fill="currentColor" stroke="none"/><circle cx="8.1" cy="4.6" r=".85" fill="currentColor" stroke="none"/><circle cx="4.3" cy="9.3" r=".85" fill="currentColor" stroke="none"/></svg>',
  close: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" stroke-width="1"><path d="M2.5 2.5L13.5 13.5" stroke="currentColor"/><path d="M13.5 2.5L2.5 13.5" stroke="currentColor"/></svg>',
  layout: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="1.5" width="11" height="13" rx="2" stroke="currentColor"/><path d="M8 4.25v3M8 8.75v3M6.1 6.15 8 4.25l1.9 1.9M6.1 9.85 8 11.75l1.9-1.9" stroke="currentColor"/></svg>',
  plus: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" stroke-width="1"><path d="M8 2.5V13.5" stroke="currentColor"/><path d="M2.5 8H13.5" stroke="currentColor"/></svg>',
  minus: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" stroke-width="1"><path d="M2.5 8H13.5" stroke="currentColor"/></svg>',
  warning: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M6.87 2.6a1.33 1.33 0 0 1 2.26 0l5.34 9.33A1.33 1.33 0 0 1 13.33 14H2.67a1.33 1.33 0 0 1-1.14-2.07Z" stroke="currentColor"/><path d="M8 6v3m0 2.33h.01" stroke="currentColor"/></svg>',
}

/**
 * The fence keyword shown in the card header. Prefer the diagram's own
 * statement (`sequenceDiagram`, `gantt`, …) over the fence language: the
 * header then tells the reader what they are looking at, the way a code card
 * prints its language.
 */
const OPENERS = [
  [/^(?:graph|flowchart)(?:-elk)?\b/, 'flowchart'],
  [/^sequenceDiagram\b/, 'sequenceDiagram'],
  [/^classDiagram(?:-v2)?\b/, 'classDiagram'],
  [/^stateDiagram(?:-v2)?\b/, 'stateDiagram'],
  [/^erDiagram\b/, 'erDiagram'],
  [/^journey\b/, 'journey'],
  [/^gantt\b/, 'gantt'],
  [/^pie\b/, 'pie'],
  [/^quadrantChart\b/, 'quadrantChart'],
  [/^requirementDiagram\b/, 'requirementDiagram'],
  [/^gitGraph\b/, 'gitGraph'],
  [/^mindmap\b/, 'mindmap'],
  [/^timeline\b/, 'timeline'],
  [/^sankey(?:-beta)?\b/, 'sankey'],
  [/^xychart(?:-beta)?\b/, 'xychart'],
  [/^block(?:-beta)?\b/, 'block'],
  [/^packet(?:-beta)?\b/, 'packet'],
  [/^treemap(?:-beta)?\b/, 'treemap'],
  [/^radar-beta\b/, 'radar'],
  [/^architecture-beta\b/, 'architecture'],
  [/^kanban\b/, 'kanban'],
  [/^C4(Context|Container|Component|Dynamic|Deployment)\b/, 'C4'],
  [/^zenuml\b/, 'zenuml'],
  [/^info\b/, 'info'],
]

/** Copy for the built-in locales; `en` is the fallback. */
const DICT = {
  en: {
    showSource: 'Show source',
    showDiagram: 'Show diagram',
    copySource: 'Copy source',
    copied: 'Copied',
    zoom: 'Zoom',
    zoomViewer: 'Diagram viewer',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    zoomFit: 'Fit',
    zoomClose: 'Close',
    zoomHint: 'Scroll to zoom · Drag to pan · Esc to close',
    theme: 'Theme',
    themeNeutral: 'dsh neutral',
    layoutGrowAction: 'Full expand: the card follows the diagram height',
    layoutScrollAction: 'Scroll container: tall diagrams scroll inside the card',
    loadFailed: 'Mermaid engine not found',
    loadFailedNote: 'The bundled diagram engine could not be loaded. Reinstall the plugin — the engine ships with it — and try again.',
    renderFailed: 'Mermaid syntax error',
    renderFailedNote: 'The source is kept below — fix it and the diagram renders again.',
    details: 'Details',
  },
  zh: {
    showSource: '显示源码',
    showDiagram: '显示图表',
    copySource: '复制源码',
    copied: '已复制',
    zoom: '放大',
    zoomViewer: '图表查看器',
    zoomIn: '放大',
    zoomOut: '缩小',
    zoomFit: '适应窗口',
    zoomClose: '关闭',
    zoomHint: '滚轮缩放 · 拖拽平移 · Esc 关闭',
    theme: '主题',
    themeNeutral: 'dsh 中性',
    layoutGrowAction: '完整展开：卡片随图变高',
    layoutScrollAction: '滚动容器：高图在卡片内滚动',
    loadFailed: '图表引擎未找到',
    loadFailedNote: '随插件附带的图表引擎没能加载，请重新安装插件后重试。',
    renderFailed: '图表语法有误',
    renderFailedNote: '已保留源码，修正后会自动重新渲染。',
    details: '查看详情',
  },
}

/**
 * Mermaid statements that may open a diagram. Case matters. The list tracks the
 * pinned Mermaid release (11.17.2): every keyword its `detectType` accepts, and
 * nothing else — a keyword mermaid does not know at all (`radar`, bare
 * `architecture`) must stay undetected, or the fence would be taken over only
 * to fail with "No diagram type detected". A hyphenated *suffix* on a known
 * keyword (`flowchart-v2`, rejected by mermaid since v9) still matches by
 * prefix on purpose: the fence looks like a diagram, so it is taken over and
 * mermaid's own error note explains the syntax. Verified against 11.17.2:
 * `radar-beta`, `kanban`, `treemap-beta`, the bare `sankey` / `xychart` /
 * `block` / `packet` / `treemap` forms and `flowchart-elk` are all accepted.
 */
const MERMAID_HEAD = /^(?:graph|flowchart(?:-elk)?|sequenceDiagram|classDiagram(?:-v2)?|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|quadrantChart|requirementDiagram|gitGraph|mindmap|timeline|(?:sankey|xychart|block|packet|treemap)(?:-beta)?|radar-beta|architecture-beta|kanban|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment|zenuml|info)\b/

/**
 * Diagram statements that attach behaviour instead of only drawing. Mermaid
 * binds these as closures over the diagram it parsed, so a replayed SVG string
 * comes back inert — such a fence is never cached.
 */
const INTERACTIVE = /(?:^|\n)[ \t]*click\b/

/**
 * Strip the front matter, directives, and comments Mermaid allows before the
 * first statement, then return that statement (leading whitespace removed).
 * @param code - the fence source.
 * @returns the first statement of the fence.
 */
const openingStatement = (code) => {
  let rest = code.replace(/^\uFEFF/, '')
  for (;;) {
    const before = rest
    rest = rest.replace(/^\s*%%[^\n]*(?:\n|$)/, '')
    rest = rest.replace(/^\s*%%\{[\s\S]*?\}%%\s*/, '')
    rest = rest.replace(/^\s*---\r?\n[\s\S]*?\r?\n---\s*/, '')
    if (rest === before) break
  }
  return rest.replace(/^\s+/, '')
}

/**
 * Answer whether the fence's first statement opens a diagram.
 * @param code - the fence source.
 * @returns true when the fence is a plausible Mermaid diagram.
 */
const opensDiagram = (code) => MERMAID_HEAD.test(openingStatement(code))

/**
 * The keyword to print in the card header, or `mermaid` when the fence only
 * passed the generic opener test.
 * @param code - the fence source.
 * @returns the header label.
 */
const diagramKind = (code) => {
  const head = openingStatement(code)
  for (const [pattern, name] of OPENERS) {
    if (pattern.test(head)) return name
  }
  return 'mermaid'
}

/** Readable one-line form of a thrown value. */
const messageOf = (error) => {
  if (error instanceof Error && error.message !== '') return error.message
  const text = String(error)
  return text === '' ? 'unknown error' : text
}

export default {
  name: PLUGIN_ID,
  /**
   * Register the DOM decorator. The host half is a no-op, so this runs in the
   * browser only; the guard keeps a non-DOM evaluation harmless.
   * @param ctx - the plugin's Cordis context.
   */
  apply(ctx) {
    if (typeof document === 'undefined' || typeof window === 'undefined') return

    const state = {
      disposed: false,
      uid: 0,
      /** block -> record */
      records: new Map(),
      /** block -> settle timer */
      timers: new Map(),
      /** <script> tags this plugin owns */
      scripts: new Set(),
      /** serialized render queue */
      queue: Promise.resolve(),
      /** cached Mermaid load promise */
      mermaid: null,
      /** the enlarged viewer, built on first open */
      viewer: null,
      /** the diagram theme variant in use (persisted per reader) */
      variant: storedTheme() ?? THEME_VARIANT,
      /** card layout: 'scroll' caps tall diagrams, 'grow' lets the card grow */
      fitMode: storedFitMode(),
      /** the shared theme menu, built on first open */
      menu: null,
      /** cache key -> { svg, id, bytes }; insertion order is recency order */
      cache: new Map(),
      /** total size of the cached SVG strings, for the byte bound */
      cacheBytes: 0,
      /** the shared visibility observer, built on first record */
      visible: null,
      /** holder -> record, for the visibility observer's callback */
      byHolder: new WeakMap(),
    }

    // The layout preference is global; the canvas CSS keys off this attribute.
    document.documentElement.dataset.dshMermaidFit = state.fitMode

    // ---- interface copy -------------------------------------------------
    // The locale service is resolved lazily, not once here. Client modules
    // mount in dependency order, so this plugin can be applied before the
    // locale service exists — binding at mount time then leaves the plugin
    // speaking its shipped English while the rest of the interface is Chinese.
    // Until the service answers, the copy follows the document language, which
    // is what the service itself keeps in sync.
    let translate = null
    let requested = false

    /**
     * The locale service, or undefined. Reading a service *property* off a
     * Cordis context is not a lookup: when the service is not provided (or not
     * injected) the context proxy throws `cannot get property "locale" without
     * inject`. `ctx.get()` is the plain lookup and answers undefined instead,
     * so it is asked first and the accessor is only ever touched in a guard.
     */
    const localeService = () => {
      try {
        const viaGet = typeof ctx.get === 'function' ? ctx.get('locale') : undefined
        if (viaGet !== undefined) return viaGet
      } catch {
        /* not resolvable in this context */
      }
      try {
        return ctx.locale ?? undefined
      } catch {
        return undefined
      }
    }

    /** The active language as the page reports it. */
    const pageLanguage = () => {
      try {
        const lang = (typeof document === 'undefined' ? '' : document.documentElement.lang) || ''
        if (lang !== '') return lang.toLowerCase()
        return (typeof navigator === 'undefined' ? '' : (navigator.language ?? '')).toLowerCase()
      } catch {
        return ''
      }
    }

    /**
     * Resolve the bound translator, registering this namespace's dictionary the
     * first time the service is seen. Null while the service is missing or its
     * dictionary has not landed yet — the caller then uses its own copy.
     */
    const translator = () => {
      if (translate !== null) return translate
      const locale = localeService()
      if (locale === undefined || typeof locale.bind !== 'function') return null
      if (!requested) {
        requested = true
        if (typeof locale.register === 'function') {
          try {
            ctx.effect(() => {
              // A namespace collision (a double mount) must not fail the plugin.
              try {
                return locale.register(NS, DICT)
              } catch {
                return () => {}
              }
            }, `${PLUGIN_ID}: locale`)
          } catch {
            /* no effect scope here: the built-in copy still works */
          }
        }
      }
      let bound
      try {
        bound = locale.bind(NS)
      } catch {
        return null
      }
      // A namespace with no dictionary yet answers with the key itself, so this
      // doubles as "has the registration landed". Asking again on the next call
      // is cheaper than guessing when it will.
      try {
        if (bound('zoom') === 'zoom') return null
      } catch {
        return null
      }
      translate = bound
      // Copy already rendered came from the fallback dictionary; refresh it.
      queueMicrotask(() => {
        for (const record of state.records.values()) applyView(record)
        if (state.viewer !== null) state.viewer.refreshLabels()
      })
      return translate
    }

    /**
     * Interface copy: the locale service when it answers, own copy otherwise.
     * This never throws — a service hiccup must not cost a diagram its copy,
     * let alone its rendering.
     */
    const t = (key) => {
      try {
        const bound = translator()
        if (bound !== null) {
          const value = bound(key)
          if (typeof value === 'string' && value !== key) return value
        }
      } catch {
        /* fall through to the built-in dictionary */
      }
      const dict = pageLanguage().startsWith('zh') ? DICT.zh : DICT.en
      return dict[key] ?? DICT.en[key] ?? key
    }

    /** Reader-facing name of one theme variant. */
    const themeLabel = (variant) => {
      const choice = THEME_CHOICES.find((entry) => entry.id === variant)
      if (choice === undefined) return variant
      return choice.key === undefined ? choice.label : t(choice.key)
    }

    // ---- styles ---------------------------------------------------------
    // Colors are theme tokens only, so light/dark switching needs no repaint of
    // the frame around the diagram.
    ctx.effect(() => {
      const style = document.createElement('style')
      style.dataset.dshMermaidStyles = '1'
      style.textContent = `
      /* ---- card chrome ------------------------------------------------- */
      /* A diagram is not code. While this plugin owns a fence it draws the
         card header its own way (type label + copy / source / zoom) and hides
         the shell's generic code banner with a reversible attribute. React's
         nodes are never removed — the source view only lifts the hidden
         attribute from the original body. */
      [data-dsh-mermaid-banner] { display: none !important; }
      [${HIDDEN}] { display: none !important; }
      /* The holder is appended after React's body, so the card is laid out as
         a column with the holder ordered first: one header for both views
         instead of a second toolbar underneath the code. */
      .md-code-block[data-dsh-mermaid] { display: flex; flex-direction: column; }
      .md-code-block[data-dsh-mermaid] > [data-code-block-content] { display: contents; }
      .md-code-block[data-dsh-mermaid] > [data-code-block-content] > pre { order: 1; margin: 0 !important; }
      .dsh-mermaid { order: 0; display: flex; flex-direction: column; min-width: 0; }

      .dsh-mermaid-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 18px 8px 22px;
        border-top-left-radius: var(--dsw-radius-lg, 16px);
        border-top-right-radius: var(--dsw-radius-lg, 16px);
        background: var(--dsw-alias-markdown-code-block-banner, transparent);
        color: var(--dsw-alias-label-tertiary, #81868c);
        font: 11px/18px var(--dsw-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif);
      }
      /* The header label is an Apple-style tag: a soft system-colour tint with
         a same-hue readable label, one colour per diagram type. */
      .dsh-mermaid-kind,
      .dsh-mermaid-zoom-kind {
        display: inline-block;
        max-width: 100%;
        min-width: 0;
        padding: 1px 8px;
        overflow: hidden;
        border-radius: 6px;
        background: var(--dsh-kind-bg, var(--dsw-alias-markdown-tag, rgba(127, 127, 127, 0.1)));
        color: var(--dsh-kind-fg, var(--dsw-alias-label-tertiary, #81868c));
        font: 11px/18px var(--ds-font-family-code, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='flowchart'] { --dsh-kind-bg: #e6f2ff; --dsh-kind-fg: #0058d6; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='sequenceDiagram'] { --dsh-kind-bg: #e7f9ee; --dsh-kind-fg: #1e7f3f; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='classDiagram'] { --dsh-kind-bg: #f5ebff; --dsh-kind-fg: #7a2fb8; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='stateDiagram'] { --dsh-kind-bg: #fff3e0; --dsh-kind-fg: #b25e00; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='erDiagram'] { --dsh-kind-bg: #e3f7fa; --dsh-kind-fg: #147a8c; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='gantt'] { --dsh-kind-bg: #ffe9ef; --dsh-kind-fg: #c21e45; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='pie'] { --dsh-kind-bg: #eae9ff; --dsh-kind-fg: #4543c4; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='journey'] { --dsh-kind-bg: #fff8d6; --dsh-kind-fg: #8a6200; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='mindmap'] { --dsh-kind-bg: #e0f8f6; --dsh-kind-fg: #0e7c74; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='gitGraph'] { --dsh-kind-bg: #f3ebe4; --dsh-kind-fg: #7a5a3c; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='timeline'] { --dsh-kind-bg: #ffe8e6; --dsh-kind-fg: #c22f26; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='quadrantChart'] { --dsh-kind-bg: #eae9ff; --dsh-kind-fg: #4543c4; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='requirementDiagram'] { --dsh-kind-bg: #e3f7fa; --dsh-kind-fg: #147a8c; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='xychart'] { --dsh-kind-bg: #e6f2ff; --dsh-kind-fg: #0058d6; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='sankey'] { --dsh-kind-bg: #e0f8f6; --dsh-kind-fg: #0e7c74; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='block'] { --dsh-kind-bg: #e7f9ee; --dsh-kind-fg: #1e7f3f; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='packet'] { --dsh-kind-bg: #fff3e0; --dsh-kind-fg: #b25e00; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='treemap'] { --dsh-kind-bg: #f5ebff; --dsh-kind-fg: #7a2fb8; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='radar'] { --dsh-kind-bg: #ffe9ef; --dsh-kind-fg: #c21e45; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='architecture'] { --dsh-kind-bg: #eae9ff; --dsh-kind-fg: #4543c4; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='kanban'] { --dsh-kind-bg: #fff3e0; --dsh-kind-fg: #b25e00; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='C4'] { --dsh-kind-bg: #f5ebff; --dsh-kind-fg: #7a2fb8; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='zenuml'] { --dsh-kind-bg: #e7f9ee; --dsh-kind-fg: #1e7f3f; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='flowchart'] { --dsh-kind-bg: rgba(10, 132, 255, 0.18); --dsh-kind-fg: #6fb6ff; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='sequenceDiagram'] { --dsh-kind-bg: rgba(48, 209, 88, 0.18); --dsh-kind-fg: #6ee7a0; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='classDiagram'] { --dsh-kind-bg: rgba(191, 90, 242, 0.2); --dsh-kind-fg: #d4a2ff; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='stateDiagram'] { --dsh-kind-bg: rgba(255, 159, 10, 0.18); --dsh-kind-fg: #ffc06a; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='erDiagram'] { --dsh-kind-bg: rgba(64, 200, 224, 0.18); --dsh-kind-fg: #7fe3f0; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='gantt'] { --dsh-kind-bg: rgba(255, 55, 95, 0.2); --dsh-kind-fg: #ff93ab; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='pie'] { --dsh-kind-bg: rgba(94, 92, 230, 0.22); --dsh-kind-fg: #b0aeff; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='journey'] { --dsh-kind-bg: rgba(255, 214, 10, 0.16); --dsh-kind-fg: #ffd60a; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='mindmap'] { --dsh-kind-bg: rgba(99, 230, 226, 0.16); --dsh-kind-fg: #7cf0e8; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='gitGraph'] { --dsh-kind-bg: rgba(172, 142, 104, 0.22); --dsh-kind-fg: #d9b48a; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='timeline'] { --dsh-kind-bg: rgba(255, 69, 58, 0.2); --dsh-kind-fg: #ff8a82; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='quadrantChart'] { --dsh-kind-bg: rgba(94, 92, 230, 0.22); --dsh-kind-fg: #b0aeff; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='requirementDiagram'] { --dsh-kind-bg: rgba(64, 200, 224, 0.18); --dsh-kind-fg: #7fe3f0; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='xychart'] { --dsh-kind-bg: rgba(10, 132, 255, 0.18); --dsh-kind-fg: #6fb6ff; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='sankey'] { --dsh-kind-bg: rgba(99, 230, 226, 0.16); --dsh-kind-fg: #7cf0e8; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='block'] { --dsh-kind-bg: rgba(48, 209, 88, 0.18); --dsh-kind-fg: #6ee7a0; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='packet'] { --dsh-kind-bg: rgba(255, 159, 10, 0.18); --dsh-kind-fg: #ffc06a; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='treemap'] { --dsh-kind-bg: rgba(191, 90, 242, 0.2); --dsh-kind-fg: #d4a2ff; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='radar'] { --dsh-kind-bg: rgba(255, 55, 95, 0.2); --dsh-kind-fg: #ff93ab; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='architecture'] { --dsh-kind-bg: rgba(94, 92, 230, 0.22); --dsh-kind-fg: #b0aeff; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='kanban'] { --dsh-kind-bg: rgba(255, 159, 10, 0.18); --dsh-kind-fg: #ffc06a; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='C4'] { --dsh-kind-bg: rgba(191, 90, 242, 0.2); --dsh-kind-fg: #d4a2ff; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='zenuml'] { --dsh-kind-bg: rgba(48, 209, 88, 0.18); --dsh-kind-fg: #6ee7a0; }
      .dsh-mermaid-tool.is-copied { color: #34c759; }
      body[data-ds-dark-theme] .dsh-mermaid-tool.is-copied { color: #30d158; }
      .dsh-mermaid-tools { display: flex; flex: none; align-items: center; gap: 4px; }
      .dsh-mermaid-tool {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        padding: 0;
        border: 0;
        border-radius: var(--dsw-radius-sm, 8px);
        color: var(--dsw-alias-label-secondary, #61666b);
        background: transparent;
        cursor: pointer;
        transition: background-color 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease);
      }
      .dsh-mermaid-tool svg { display: block; width: 16px; height: 16px; }
      .dsh-mermaid-tool[hidden] { display: none !important; }
      .dsh-mermaid-tool:hover {
        color: var(--dsw-alias-label-primary, #0f1115);
        background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, 0.06));
      }
      .dsh-mermaid-tool[aria-pressed='true'] {
        color: var(--dsw-alias-label-primary, #0f1115);
        background: var(--dsw-alias-interactive-bg-active, rgba(38, 49, 72, 0.1));
      }
      .dsh-mermaid-tool:focus-visible {
        outline: 1px solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, #4176e6));
        outline-offset: 2px;
      }
      .dsh-mermaid-tool::after,
      .dsh-mermaid-zoom-button::after {
        content: attr(data-tip);
        position: absolute;
        left: 50%;
        z-index: 8;
        padding: 3px 7px;
        border-radius: var(--dsw-radius-sm, 8px);
        background: var(--dsw-alias-tooltip-bg, #2c2c2e);
        color: var(--dsw-static-neutral-bluish-00, #fff);
        font: 13px/20px var(--dsw-font-family, system-ui, sans-serif);
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transition: opacity 120ms var(--ds-ease-in-out, ease), transform 120ms var(--ds-ease-in-out, ease);
      }
      .dsh-mermaid-tool::after { bottom: calc(100% + 6px); transform: translate(-50%, 2px); }
      .dsh-mermaid-tool:hover::after { opacity: 1; transform: translate(-50%, 0); }
      .dsh-mermaid-zoom-button::after { top: calc(100% + 6px); transform: translate(-50%, -2px); }
      .dsh-mermaid-zoom-button:hover::after { opacity: 1; transform: translate(-50%, 0); }
      .dsh-mermaid-tool[data-tip='']::after,
      .dsh-mermaid-zoom-button[data-tip='']::after { content: none; }

      /* ---- theme menu ---------------------------------------------------- */
      /* One shared popover, portaled to <body>: a card's scroll container can
         never clip it. The swatch is drawn from the variant's own palette. */
      .dsh-mermaid-theme-menu {
        position: fixed;
        z-index: ${THEME_Z_INDEX};
        min-width: 212px;
        padding: 5px;
        border: 0.5px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.1));
        border-radius: var(--dsw-radius-md, 12px);
        background: var(--dsw-alias-bg-layer-1, #fff);
        box-shadow: var(--dsw-elevation-prominent, 0 12px 32px rgba(0, 0, 0, 0.12));
        font: 13px/20px var(--dsw-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif);
        animation: dsh-mermaid-menu-in 120ms var(--ds-ease-in-out, ease);
      }
      @keyframes dsh-mermaid-menu-in { from { opacity: 0; transform: translateY(-2px); } }
      .dsh-mermaid-theme-menu[hidden] { display: none !important; }
      .dsh-mermaid-theme-item {
        display: flex;
        align-items: center;
        gap: 9px;
        width: 100%;
        padding: 5px 8px;
        border: 0;
        border-radius: var(--dsw-radius-sm, 8px);
        background: transparent;
        color: var(--dsw-alias-label-primary, #0f1115);
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .dsh-mermaid-theme-item:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, 0.06)); }
      .dsh-mermaid-theme-item:focus-visible {
        outline: 1px solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, #4176e6));
        outline-offset: -1px;
      }
      .dsh-mermaid-theme-item[aria-checked='true'] { background: var(--dsw-alias-interactive-bg-active, rgba(38, 49, 72, 0.1)); }
      .dsh-mermaid-theme-swatch { display: inline-flex; flex: none; gap: 2px; }
      .dsh-mermaid-theme-dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.12);
      }
      .dsh-mermaid-theme-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .dsh-mermaid-theme-check {
        display: inline-flex;
        flex: none;
        width: 16px;
        height: 16px;
        color: var(--dsw-alias-state-business-primary, #4d6bfe);
        opacity: 0;
      }
      .dsh-mermaid-theme-item[aria-checked='true'] .dsh-mermaid-theme-check { opacity: 1; }
      .dsh-mermaid-theme-check svg { display: block; width: 16px; height: 16px; }

      /* ---- diagram viewport ------------------------------------------- */
      /* The card itself is the surface — no second box inside it. */
      /* content-visibility:auto was measured here and rejected: it does cut
         the insert/layout segment by 70% (15.0ms -> 4.3ms for nine diagrams,
         1.3% of a pass), but a card the browser is skipping has only its
         intrinsic size, so a never-scrolled diagram paints blank in a
         full-page capture and prints blank, and the page height is wrong until
         each card is rendered once. This is a reading surface; a diagram that
         silently disappears when printed is not worth 1.3%. */
      .dsh-mermaid-canvas {
        display: block;
        /* NOT a scroll container: the diagram is always pinned to the column
           width and a tall one simply makes the card taller. A scrollable
           inner box would swallow wheel events over the diagram and stop the
           message list from scrolling while the pointer is on a chart. */
        padding: 6px 22px 20px;
      }
      .dsh-mermaid-canvas[hidden] { display: none !important; }
      /* Layout preference (header button, persisted): the default caps tall
         diagrams and lets them scroll inside the card; "grow" lets the card
         follow the diagram height instead (no nested scrollbar, the page
         scrolls over it). Toggle via the header's layout button. */
      html[data-dsh-mermaid-fit='scroll'] .dsh-mermaid-canvas {
        max-height: min(900px, 85vh);
        overflow: auto;
        overscroll-behavior: auto;
      }
      .dsh-mermaid-canvas svg { display: block; max-width: 100%; height: auto; margin: 0 auto; }
      /* fitReading pins the width whenever the diagram has to scale: wide ones
         shrink to the column, small-and-short ones grow a little. Tall
         diagrams keep natural size and grow the card instead. */
      .dsh-mermaid-canvas.dsh-mermaid-fit svg {
        width: var(--dsh-mermaid-fit-width);
        max-width: none !important;
        height: auto !important;
      }
      .dsh-mermaid-canvas.dsh-mermaid-zoomable { cursor: zoom-in; }
      @keyframes dsh-mermaid-ink { from { opacity: 0; } }
      .dsh-mermaid-canvas svg { animation: dsh-mermaid-ink 160ms var(--ds-ease-in-out, ease); }

      /* ---- failure note ----------------------------------------------- */
      /* A calm inline panel: human summary first, parser internals one click
         away. The fence below stays editable, so the note never needs to own
         the whole card. */
      .dsh-mermaid-error {
        margin: 0 22px 16px;
        padding: 10px 12px;
        border-radius: var(--dsw-radius-md, 12px);
        background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, 0.06));
        background: color-mix(in srgb, var(--dsw-alias-state-warn-primary, #f59e0b) 7%, transparent);
        color: var(--dsw-alias-label-secondary, #61666b);
      }
      .dsh-mermaid-error[hidden] { display: none !important; }
      .dsh-mermaid-error.is-error {
        background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ec1313) 7%, transparent);
      }
      .dsh-mermaid-error-main { display: flex; align-items: flex-start; gap: 8px; }
      .dsh-mermaid-error-icon {
        display: flex;
        flex: none;
        margin-top: 1px;
        color: var(--dsw-alias-state-warn-primary, #f59e0b);
      }
      .dsh-mermaid-error.is-error .dsh-mermaid-error-icon { color: var(--dsw-alias-state-error-primary, #ec1313); }
      .dsh-mermaid-error-icon svg { display: block; width: 16px; height: 16px; }
      .dsh-mermaid-error-body { min-width: 0; }
      .dsh-mermaid-error-title {
        margin: 0;
        color: var(--dsw-alias-label-primary, #0f1115);
        font-size: 13px;
        font-weight: 500;
        line-height: 20px;
      }
      .dsh-mermaid-error-note {
        margin: 1px 0 0;
        color: var(--dsw-alias-label-tertiary, #81868c);
        font-size: 12px;
        line-height: 18px;
      }
      .dsh-mermaid-error-details { margin-top: 4px; }
      .dsh-mermaid-error-details summary {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: var(--dsw-alias-label-secondary, #61666b);
        font-size: 12px;
        line-height: 18px;
        list-style: none;
        cursor: pointer;
      }
      .dsh-mermaid-error-details summary::-webkit-details-marker { display: none; }
      .dsh-mermaid-error-details summary::after {
        width: 5px;
        height: 5px;
        border-right: 1.5px solid currentColor;
        border-bottom: 1.5px solid currentColor;
        content: '';
        transform: rotate(45deg) translateY(-1px);
        transition: transform 120ms var(--ds-ease-in-out, ease);
      }
      .dsh-mermaid-error-details[open] summary::after { transform: rotate(-135deg) translateY(-1px); }
      .dsh-mermaid-error-details summary:hover { color: var(--dsw-alias-label-primary, #0f1115); }
      .dsh-mermaid-error-details summary:focus-visible {
        border-radius: var(--dsw-radius-xs, 4px);
        outline: 1px solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, #4176e6));
        outline-offset: 2px;
      }
      .dsh-mermaid-error-pre {
        margin: 6px 0 0;
        padding: 8px 10px;
        max-height: 160px;
        overflow: auto;
        border: 0.5px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.04));
        border-radius: var(--dsw-radius-sm, 8px);
        background: var(--dsw-alias-bg-base, #fff);
        color: var(--dsw-alias-label-secondary, #61666b);
        font: 11px/18px var(--ds-font-family-code, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      .dsh-mermaid [hidden] { display: none !important; }

      /* ---- full-window viewer ----------------------------------------- */
      .dsh-mermaid-zoom {
        position: fixed;
        inset: 0;
        z-index: ${ZOOM_Z_INDEX};
        background: var(--dsw-alias-bg-mask-3, rgba(0, 0, 0, 0.48));
        -webkit-backdrop-filter: blur(12px) saturate(140%);
        backdrop-filter: blur(12px) saturate(140%);
        overscroll-behavior: contain;
        animation: dsh-mermaid-zoom-in 160ms var(--ds-ease-in-out, ease);
      }
      @keyframes dsh-mermaid-zoom-in { from { opacity: 0; } }
      .dsh-mermaid-zoom[hidden] { display: none !important; }
      .dsh-mermaid-zoom-stage {
        position: absolute;
        inset: 0;
        overflow: hidden;
        touch-action: none;
        cursor: grab;
      }
      .dsh-mermaid-zoom-stage:active { cursor: grabbing; }
      .dsh-mermaid-zoom-pan {
        position: absolute;
        left: 0;
        top: 0;
        transform-origin: 0 0;
        will-change: transform;
      }
      /* The paper under the diagram. It uses the same surface the diagram was
         themed for, so its edge-label backgrounds keep matching off the card,
         and it is a framed print rather than a tight crop. */
      .dsh-mermaid-zoom-paper {
        box-sizing: content-box;
        background: var(--dsw-alias-markdown-code-block, #f9fafb);
        border-radius: var(--dsw-radius-lg, 16px);
        box-shadow:
          var(--dsw-elevation-prominent, 0 0 1px 0 rgba(0, 0, 0, 0.2), 0 12px 32px 0 rgba(0, 0, 0, 0.08)),
          0 24px 80px rgba(0, 0, 0, 0.24);
        padding: ${ZOOM_PAPER_PAD}px;
      }
      .dsh-mermaid-zoom-paper > svg { display: block; }
      /* The controls float in a pill instead of stretching a bar across the
         window: the diagram keeps the whole stage, the chrome stays light. */
      .dsh-mermaid-zoom-bar {
        position: absolute;
        top: 16px;
        left: 50%;
        z-index: 1;
        display: flex;
        align-items: center;
        gap: 2px;
        max-width: calc(100% - 32px);
        padding: 4px;
        border: 0.5px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.1));
        border-radius: var(--dsw-radius-md, 12px);
        background: var(--dsw-alias-bg-layer-1, #fff);
        box-shadow: var(--dsw-elevation-prominent, 0 12px 32px rgba(0, 0, 0, 0.12));
        color: var(--dsw-alias-label-secondary, #61666b);
        transform: translateX(-50%);
        animation: dsh-mermaid-bar-in 180ms var(--ds-ease-in-out, ease);
      }
      @keyframes dsh-mermaid-bar-in { from { opacity: 0; transform: translate(-50%, -4px); } }
      .dsh-mermaid-zoom-kind {
        max-width: 160px;
        margin-right: 4px;
      }
      .dsh-mermaid-zoom-level {
        min-width: 48px;
        padding: 0 2px;
        color: var(--dsw-alias-label-secondary, #61666b);
        font: 12px/20px var(--ds-font-family-code, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
        font-variant-numeric: tabular-nums;
        text-align: center;
      }
      .dsh-mermaid-zoom-button {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        padding: 0;
        border: 0;
        border-radius: var(--dsw-radius-sm, 8px);
        background: transparent;
        color: var(--dsw-alias-label-secondary, #61666b);
        cursor: pointer;
        transition: background-color 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease);
      }
      .dsh-mermaid-zoom-button svg { display: block; width: 16px; height: 16px; }
      .dsh-mermaid-zoom-button:hover {
        color: var(--dsw-alias-label-primary, #0f1115);
        background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, 0.06));
      }
      .dsh-mermaid-zoom-button:focus-visible {
        outline: 1px solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, #4176e6));
        outline-offset: 2px;
      }
      .dsh-mermaid-zoom-button[data-dsh-mermaid-zoom-action='close'] { margin-left: 2px; }
      .dsh-mermaid-zoom-hint {
        position: absolute;
        left: 50%;
        bottom: 20px;
        z-index: 1;
        padding: 4px 10px;
        border: 0.5px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.1));
        border-radius: 999px;
        background: var(--dsw-alias-bg-layer-1, #fff);
        box-shadow: var(--dsw-elevation-soft, 0 4px 12px rgba(0, 0, 0, 0.06));
        color: var(--dsw-alias-label-tertiary, #81868c);
        font-size: 12px;
        line-height: 18px;
        white-space: nowrap;
        pointer-events: none;
        transform: translateX(-50%);
      }
      @media (max-width: 640px) {
        .dsh-mermaid-zoom-hint { display: none; }
        .dsh-mermaid-zoom-kind { display: none; }
        .dsh-mermaid-zoom-bar { top: 12px; }
      }
      @media (prefers-reduced-motion: reduce) {
        .dsh-mermaid-canvas svg,
        .dsh-mermaid-zoom,
        .dsh-mermaid-zoom-bar,
        .dsh-mermaid-theme-menu { animation: none; }
        .dsh-mermaid-tool::after,
        .dsh-mermaid-zoom-button::after { transition: none; }
      }
      `
      ;(document.head ?? document.documentElement).append(style)
      return () => style.remove()
    }, `${PLUGIN_ID}: styles`)

    // ---- Mermaid --------------------------------------------------------
    /** A load failure, tagged so the note can use the load-failed copy. */
    const loadFailure = (message) => Object.assign(new Error(message), { dshMermaidLoad: true })

    /**
     * The engine's URL, derived from the page's boot manifest.
     *
     * dsh publishes every installed client plugin as a row in
     * `window.__DSH_BOOT__`, and the row's URL carries the package revision
     * the chunk route expects. This is the fallback for a page whose module
     * loader predates the chunk protocol.
     * @returns {string|null} an absolute URL, or null when the row is absent.
     */
    const engineChunkUrl = () => {
      const boot = globalThis.__DSH_BOOT__
      const entries = Array.isArray(boot?.entries) ? boot.entries : []
      const row = entries.find((entry) => entry?.id === PLUGIN_ID)
      if (row === undefined || typeof row.url !== 'string') return null
      const rev = /[?&]rev=([^&#]*)/.exec(row.url)?.[1]
      if (rev === undefined || rev === '') return null
      const path = `plugins/${PLUGIN_ID}/${ENGINE_FILE}?rev=${encodeURIComponent(rev)}`
      return new URL(path, document.baseURI).href
    }

    /**
     * Load a Mermaid build from a URL, as a plain script.
     *
     * The build assigns `globalThis.mermaid`; that is the whole contract.
     * @param {string} url - where to fetch the engine.
     * @returns {Promise<object>} the Mermaid API.
     */
    const loadEngineFrom = (url) => new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = url
      script.async = true
      script.onload = () => {
        state.scripts.delete(script)
        if (window.mermaid !== undefined) resolve(window.mermaid)
        else reject(loadFailure(`window.mermaid is missing after loading ${url}`))
      }
      script.onerror = () => {
        state.scripts.delete(script)
        script.remove()
        reject(loadFailure(url))
      }
      state.scripts.add(script)
      ;(document.head ?? document.documentElement).append(script)
    })

    /**
     * The vendored engine, loaded from the package.
     *
     * Three sources, in order:
     *   1. the module loader's chunk protocol (`require.async`) — the supported
     *      path for an installed plugin;
     *   2. a URL the reader set (`window.__DSH_MERMAID_ENGINE_URL__`), e.g. a
     *      self-hosted mirror;
     *   3. the chunk route addressed straight from the boot manifest, for a
     *      page whose loader predates the chunk protocol.
     *
     * @returns {Promise<object>} the Mermaid API.
     */
    const loadLocalEngine = async () => {
      if (typeof require === 'function' && typeof require.async === 'function') {
        try {
          const chunk = await require.async(ENGINE_CHUNK)
          if (chunk?.mermaid !== undefined) return chunk.mermaid
        } catch {
          // Fall through to the script-tag paths below.
        }
      }
      const override = globalThis.__DSH_MERMAID_ENGINE_URL__
      if (typeof override === 'string' && override !== '') {
        return await loadEngineFrom(override)
      }
      const url = engineChunkUrl()
      if (url !== null) return await loadEngineFrom(url)
      throw loadFailure(`the Mermaid ${MERMAID_VERSION} engine (${ENGINE_FILE}) is not reachable from this page`)
    }

    const loadMermaid = () => {
      if (window.mermaid !== undefined) return Promise.resolve(window.mermaid)
      if (state.mermaid !== null) return state.mermaid
      state.mermaid = loadLocalEngine().catch((error) => {
        // Let a later fence retry instead of pinning the page to one failed
        // load.
        state.mermaid = null
        throw error
      })
      return state.mermaid
    }

    /**
     * Start the engine load as soon as a fence looks like a diagram.
     *
     * The settle window and the engine fetch used to run one after the other,
     * so the first diagram in a conversation paid both: 250ms of quiet plus
     * the script. Firing the load when the fence is *detected* overlaps them
     * and takes the settle window off the critical path. The weak set bounds
     * it to one attempt per block, so a streaming fence cannot queue a request
     * per token, and the whole function is a no-op once the engine is on its
     * way.
     */
    const prefetched = new WeakSet()
    const prefetchEngine = (block) => {
      if (window.mermaid !== undefined || state.mermaid !== null) return
      if (prefetched.has(block)) return
      prefetched.add(block)
      const code = sourceOf(block)
      if (code === null || !isMermaidFence(block, code)) return
      // A failed prefetch stays invisible: the render that follows owns the
      // error note and retries the load itself.
      loadMermaid().catch(() => {})
    }

    /** The active color scheme, from the shell's theme service or the system. */
    const themeScheme = () => {
      const theme = ctx.get('theme')
      const scheme = theme?.getTheme?.()?.active?.colorScheme
      if (scheme === 'dark') return 'dark'
      if (scheme === 'light') return 'light'
      try {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      } catch {
        return 'light'
      }
    }

    // Keep a parse failure out of the page: this plugin renders its own note.
    // The three flags after the variant are the plugin's own contract, not theme
    // data: a variant must never be able to drop them. Without
    // suppressErrorRendering, any parse failure (including a half-written fence
    // during streaming) makes mermaid draw its own "Syntax error in text"
    // diagram into <body>, where it survives every later successful re-render.
    //
    // `initialize` is a process-global configuration call and it is *not* free:
    // it deep-copies the whole config several times and rebuilds the base theme
    // (a `new Theme()` plus ~95 colour operations, run twice) on every call.
    // Measured at 2-3ms here, and the plugin used to pay it once per diagram per
    // paint — 3.2% of a nine-diagram pass, and up to 15% of a message made of
    // small diagrams. Nothing needs that: `mermaid.render` begins with its own
    // internal `reset()`, which re-derives the per-render config from the site
    // config, so the site config only has to be right, not freshly written. One
    // call per (scheme, variant) is therefore enough, and the pair is exactly
    // what the key holds.
    let configuredKey = null
    let configuredOn = null
    /** @param scheme - the active colour scheme, read once by the caller. */
    const configure = (mermaid, scheme) => {
      const key = `${scheme}|${state.variant}`
      // The instance check covers a shell that swaps `window.mermaid` for a
      // fresh one, which would leave our key pointing at a config nobody applied.
      if (configuredKey === key && configuredOn === mermaid) return
      mermaid.initialize({
        ...configForVariant(scheme, state.variant),
        startOnLoad: false,
        securityLevel: 'strict',
        suppressErrorRendering: true,
      })
      configuredKey = key
      configuredOn = mermaid
    }

    // ---- DOM ------------------------------------------------------------
    /** The block's `[data-code-block-content]` body, when the layout has one. */
    const contentOf = (block) => block.querySelector('[data-code-block-content]')

    /**
     * The wrapper around the block's `[data-code-block-banner]`, which is the
     * element the shell's banner occupies. Hiding that wrapper hides the whole
     * row; hiding the banner alone would leave its border and padding behind.
     */
    const bannerWrapOf = (block) => block.querySelector('[data-code-block-banner]')?.parentElement ?? null

    /** The fence language the surface prints, when it prints one at all. */
    const bannerLabel = (block) => {
      const banner = block.querySelector('[data-code-block-banner]')
      if (banner === null) return null
      const head = banner.firstElementChild ?? banner
      const text = (head.textContent ?? '').trim().toLowerCase()
      return text === '' ? null : text.split(/\s+/)[0]
    }

    /**
     * The fence source, or null when this block is not an unhighlighted fence.
     * A highlighted fence wraps its shiki output in a `<div>`, so its body's
     * first element is never the `<pre>` we look for.
     */
    const sourceOf = (block) => {
      const content = contentOf(block)
      if (content !== null) {
        const first = content.firstElementChild
        if (first === null || first.tagName !== 'PRE') return null
      }
      const pre = (content ?? block).querySelector('pre')
      if (pre === null) return null
      const code = (pre.textContent ?? '').replace(/\s+$/, '')
      return code === '' ? null : code
    }

    const isMermaidFence = (block, code) => (
      bannerLabel(block) === LANGUAGE || opensDiagram(code)
    )

    /**
     * Hand the main thread back to the browser for one turn.
     *
     * This is the difference between a serialized queue that *looks* polite and
     * one that actually yields. Mermaid 11 replaces fastdom's
     * `requestAnimationFrame` with `queueMicrotask` — its source says so:
     * "requestAnimationFrame is too slow compared to queueMicrotask" — so every
     * `await` inside `mermaid.render` resumes inside the same task. Nine
     * cards repainting through a promise chain therefore ran as a small number
     * of very long tasks (measured: 561ms of work, four long tasks, the longest
     * 157ms) during which the browser could not paint, scroll or take input.
     * One macrotask between jobs leaves the total work and the strict
     * serialization untouched — two renders never overlap — and caps the
     * longest block at one diagram. On this machine's full-corpus run Mermaid
     * already returned to the event loop between renders, so the change shows no
     * wall-clock difference there; it is insurance against the case the audit
     * did measure (five renders in one uninterrupted 226ms task), and it is what
     * makes the "off screen now, render later" hand-off observable.
     *
     * `MessageChannel` rather than `setTimeout(0)`: nested timers are clamped to
     * 4ms after five levels, and a queue that yields on every job nests deeply.
     * `scheduler.yield()` is preferred where the browser has it, because it
     * marks the yield as such instead of looking like newly arrived work.
     */
    const yieldToMain = () => {
      const scheduler = typeof window === 'undefined' ? undefined : window.scheduler
      if (scheduler !== undefined && typeof scheduler.yield === 'function') {
        return Promise.resolve(scheduler.yield()).then(() => undefined, () => undefined)
      }
      if (typeof MessageChannel !== 'function') {
        return new Promise((resolve) => window.setTimeout(resolve, 0))
      }
      return new Promise((resolve) => {
        // A fresh channel per yield costs one microtask and bundles no state
        // between two jobs, which is worth more than the reusable-channel
        // bookkeeping it saves.
        const channel = new MessageChannel()
        channel.port1.onmessage = () => {
          channel.port1.close()
          resolve()
        }
        channel.port2.postMessage(0)
      })
    }

    /**
     * Queue one render job. Jobs stay strictly serialized — mermaid keeps its
     * configuration and its temporary SVG host in module scope, so two renders
     * must never be in flight together — but each one now starts after a real
     * yield instead of on the microtask right after its predecessor.
     */
    const enqueue = (task) => {
      const run = state.queue.then(yieldToMain).then(task)
      state.queue = run.then(() => undefined, () => undefined)
      return run
    }

    /** Copy plain text, preferring the async clipboard API. */
    const writeClipboard = async (text) => {
      try {
        if (navigator.clipboard !== undefined && typeof navigator.clipboard.writeText === 'function') {
          await navigator.clipboard.writeText(text)
          return true
        }
      } catch {
        /* permission or browser policy: fall through to the legacy path */
      }
      try {
        const area = document.createElement('textarea')
        area.value = text
        area.setAttribute('readonly', '')
        area.style.cssText = 'position:fixed;top:-1000px;left:-1000px;opacity:0'
        ;(document.body ?? document.documentElement).append(area)
        area.select()
        const copied = typeof document.execCommand === 'function' && document.execCommand('copy')
        area.remove()
        return copied === true
      } catch {
        return false
      }
    }

    /**
     * Fit a diagram to the card: a wide one is scaled down to the canvas width
     * (the stylesheet's `max-width:100%` does the shrinking), a small one is
     * magnified up to MAX_READING_SCALE inside the canvas' height budget. The
     * whole diagram is always visible; detail comes from the viewer. Called
     * after every render, after the source view returns, and whenever the
     * card's width changes.
     */
    const fitReading = (record) => {
      const svg = record.canvas.querySelector('svg')
      if (svg === null || record.canvas.hidden) return
      // Off screen, a measurement costs a synchronous layout for a card nobody
      // is looking at. Drop the memo and let the visibility observer take the
      // measurement when the card comes back into range — the SVG keeps its
      // natural size and the stylesheet's `max-width` in the meantime.
      if (record.visible === false) {
        record.fitKey = undefined
        return
      }
      const size = naturalSize(svg)
      if (!(size.width > 0) || !(size.height > 0)) return
      const style = getComputedStyle(record.canvas)
      const padX = (Number.parseFloat(style.paddingLeft) || 0)
        + (Number.parseFloat(style.paddingRight) || 0)
      const available = record.canvas.clientWidth - padX
      if (!(available > 0)) {
        // Hidden ancestor (collapsed surface/tab): do not persist a stale size.
        record.fitKey = undefined
        return
      }
      // Width is the only axis the card ever fits to: a wide diagram shrinks
      // to the column, and a tall one just makes the card taller (no inner
      // scroll container, so wheel events always reach the message list).
      const fit = available / size.width
      // Only small-and-short diagrams grow; a long sequence/C4 diagram keeps
      // 1:1 instead of becoming a poster.
      const maxScale = size.height > TALL_DIAGRAM_HEIGHT ? 1 : MAX_READING_SCALE
      const scale = Math.min(fit, maxScale)

      // Setting the svg width changes the canvas height, which wakes the
      // ResizeObserver; this key makes the second pass a no-op instead of a
      // write/measure loop.
      const key = `${Math.round(available)}|${Math.round(size.width)}|${Math.round(size.height)}`
      if (record.fitKey === key) return
      record.fitKey = key

      const sized = Math.abs(scale - 1) > 0.001
      record.canvas.classList.toggle('dsh-mermaid-fit', sized)
      if (sized) {
        record.canvas.style.setProperty('--dsh-mermaid-fit-width', `${Math.max(1, Math.round(size.width * scale))}px`)
      } else {
        // Natural size already matches the column: let mermaid's own
        // `max-width` cap size it, which keeps resizes clean.
        record.canvas.style.removeProperty('--dsh-mermaid-fit-width')
      }
    }

    /** Flip the global layout preference and refresh every card's chrome. */
    const toggleFitMode = () => {
      state.fitMode = state.fitMode === 'scroll' ? 'grow' : 'scroll'
      storeFitMode(state.fitMode)
      document.documentElement.dataset.dshMermaidFit = state.fitMode
      for (const record of state.records.values()) {
        // A new layout starts at the top of the diagram either way.
        record.canvas.scrollTop = 0
        applyView(record)
      }
    }

    /** Swap the copy control to its confirmation state for a moment. */
    const flashCopied = (record) => {
      record.copy.innerHTML = ICONS.check
      record.copy.classList.add('is-copied')
      record.copy.dataset.tip = t('copied')
      record.copy.setAttribute('aria-label', t('copied'))
      if (record.copyTimer !== undefined) window.clearTimeout(record.copyTimer)
      record.copyTimer = window.setTimeout(() => {
        record.copyTimer = undefined
        record.copy.innerHTML = ICONS.copy
        record.copy.classList.remove('is-copied')
        record.copy.dataset.tip = t('copySource')
        record.copy.setAttribute('aria-label', t('copySource'))
      }, 1000)
    }

    const copySource = (record) => {
      void writeClipboard(record.code ?? '').then((ok) => {
        if (ok && !state.disposed) flashCopied(record)
      })
    }

    /**
     * Show the diagram, the untouched original fence, or the failure note.
     * A failed block keeps its fence visible and drops the view controls:
     * there is no diagram to switch to or to enlarge.
     */
    const applyView = (record) => {
      // Re-resolve the body: React may have swapped the element out since the
      // record was created.
      const content = contentOf(record.block)
      record.content = content
      const failed = record.failed === true
      const readable = record.done === true && !failed && !record.showSource
      record.kind.textContent = record.kindName ?? LANGUAGE
      record.head.dataset.dshMermaidKind = record.kindName ?? LANGUAGE
      record.canvas.hidden = !readable
      record.canvas.classList.toggle('dsh-mermaid-zoomable', readable)
      record.canvas.title = readable ? t('zoom') : ''
      record.zoom.hidden = !readable
      record.source.hidden = failed
      record.source.setAttribute('aria-pressed', String(record.showSource))
      const sourceLabel = record.showSource ? t('showDiagram') : t('showSource')
      record.source.dataset.tip = sourceLabel
      record.source.setAttribute('aria-label', sourceLabel)
      const copyLabel = t('copySource')
      if (record.copyTimer === undefined) {
        record.copy.dataset.tip = copyLabel
        record.copy.setAttribute('aria-label', copyLabel)
      }
      record.copy.hidden = false
      const layoutTip = state.fitMode === 'scroll' ? t('layoutGrowAction') : t('layoutScrollAction')
      record.layout.dataset.tip = layoutTip
      record.layout.setAttribute('aria-label', layoutTip)
      record.layout.setAttribute('aria-pressed', String(state.fitMode === 'scroll'))
      record.zoom.dataset.tip = t('zoom')
      record.zoom.setAttribute('aria-label', t('zoom'))
      const themeTip = `${t('theme')} · ${themeLabel(state.variant)}`
      record.theme.dataset.tip = themeTip
      record.theme.setAttribute('aria-label', themeTip)
      record.error.hidden = !failed
      if (failed) {
        record.error.classList.toggle('is-error', record.errorKind === 'load')
        record.errorTitle.textContent = t(record.errorKind === 'load' ? 'loadFailed' : 'renderFailed')
        record.errorNote.textContent = t(record.errorKind === 'load' ? 'loadFailedNote' : 'renderFailedNote')
        record.errorSummary.textContent = t('details')
      }
      if (content !== null) content.toggleAttribute(HIDDEN, !record.showSource && !failed)
      // The shell's own code banner would be a second, redundant header: the
      // plugin-owned header stays in both views. The wrapper node itself
      // remains React's; only our attribute is toggled.
      const banner = bannerWrapOf(record.block)
      if (banner !== null) banner.toggleAttribute(BANNER_HIDDEN, true)
    }

    /** A plugin-owned icon button with a data-tip tooltip. */
    const toolButton = (action, artwork) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'dsh-mermaid-tool'
      button.dataset.dshMermaidTool = action
      button.innerHTML = artwork
      return button
    }

    /**
     * Create the holder for a block — or recreate it when React replaced the
     * block's children and dropped it. The holder is appended last so React's
     * own `bannerWrap` + `content` children keep their positions; the card is
     * laid out as a column in CSS so the holder reads *above* the source.
     */
    const ensureRecord = (block) => {
      const known = state.records.get(block)
      if (known !== undefined && known.holder.isConnected) return known
      if (known !== undefined) {
        if (state.menu !== null && state.menu.opener === known.theme) state.menu.close()
        if (known.canvasObserver !== undefined) known.canvasObserver.disconnect()
        if (known.copyTimer !== undefined) window.clearTimeout(known.copyTimer)
        unwatchVisibility(known)
        known.holder.remove()
        state.records.delete(block)
      }
      const content = contentOf(block)

      const holder = document.createElement('div')
      holder.className = 'dsh-mermaid'
      holder.dataset.dshMermaidHolder = '1'

      const head = document.createElement('div')
      head.className = 'dsh-mermaid-head'
      const kind = document.createElement('span')
      kind.className = 'dsh-mermaid-kind'
      kind.textContent = LANGUAGE
      const tools = document.createElement('div')
      tools.className = 'dsh-mermaid-tools'
      const layout = toolButton('layout', ICONS.layout)
      const theme = toolButton('theme', ICONS.palette)
      theme.setAttribute('aria-haspopup', 'menu')
      theme.setAttribute('aria-expanded', 'false')
      const copy = toolButton('copy', ICONS.copy)
      const source = toolButton('source', ICONS.source)
      const zoom = toolButton('zoom', ICONS.expand)
      zoom.hidden = true
      tools.append(layout, theme, copy, source, zoom)
      head.append(kind, tools)

      const canvas = document.createElement('div')
      canvas.className = 'dsh-mermaid-canvas'
      canvas.hidden = true

      // The failure note lives inside the holder, so writing it never looks
      // like a change to the fence itself — the observer ignores holder
      // subtrees.
      const error = document.createElement('div')
      error.className = 'dsh-mermaid-error'
      error.hidden = true
      const errorMain = document.createElement('div')
      errorMain.className = 'dsh-mermaid-error-main'
      const errorIcon = document.createElement('span')
      errorIcon.className = 'dsh-mermaid-error-icon'
      errorIcon.innerHTML = ICONS.warning
      const errorBody = document.createElement('div')
      errorBody.className = 'dsh-mermaid-error-body'
      const errorTitle = document.createElement('p')
      errorTitle.className = 'dsh-mermaid-error-title'
      const errorNote = document.createElement('p')
      errorNote.className = 'dsh-mermaid-error-note'
      const errorDetails = document.createElement('details')
      errorDetails.className = 'dsh-mermaid-error-details'
      const errorSummary = document.createElement('summary')
      const errorPre = document.createElement('pre')
      errorPre.className = 'dsh-mermaid-error-pre'
      errorDetails.append(errorSummary, errorPre)
      errorBody.append(errorTitle, errorNote, errorDetails)
      errorMain.append(errorIcon, errorBody)
      error.append(errorMain)

      const record = {
        block,
        content,
        holder,
        head,
        kind,
        tools,
        layout,
        theme,
        copy,
        source,
        zoom,
        canvas,
        error,
        errorTitle,
        errorNote,
        errorSummary,
        errorPre,
        /** the header keyword for the current text */
        kindName: LANGUAGE,
        code: null,
        showSource: false,
        /** the current text rendered successfully */
        done: false,
        /** `${scheme}|${variant}` the canvas was last painted with */
        paintedKey: null,
        /** the text changed while the card was off screen */
        wantsPaint: false,
        /** on screen (true), off screen (false), or not yet observed (undefined) */
        visible: undefined,
        /** the current text exhausted its retries and shows the note */
        failed: false,
        /** "load" or "render", for the note's copy and accent */
        errorKind: 'render',
        /** consecutive failures for the current text */
        failures: 0,
        /** a render for the current text is in flight */
        pending: false,
        /** the copy-confirmation timer */
        copyTimer: undefined,
        /** per-record width observer, when the platform has one */
        canvasObserver: undefined,
      }
      copy.addEventListener('click', () => copySource(record))
      layout.addEventListener('click', () => toggleFitMode())
      theme.addEventListener('click', () => openThemeMenu(theme))
      source.addEventListener('click', () => {
        record.showSource = !record.showSource
        applyView(record)
        if (!record.showSource) fitReading(record)
      })
      zoom.addEventListener('click', () => openViewer(record))
      canvas.addEventListener('click', () => {
        if (record.done === true && !record.showSource) openViewer(record)
      })
      holder.append(head, canvas, error)
      block.append(holder)
      state.records.set(block, record)
      watchVisibility(record)
      if (typeof ResizeObserver === 'function') {
        const observer = new ResizeObserver(() => fitReading(record))
        observer.observe(canvas)
        record.canvasObserver = observer
      }
      return record
    }

    // ---- enlarged viewer ------------------------------------------------
    // Mermaid fits its SVG to the fence (`width="100%"` and a `max-width`),
    // which is exactly what turns a wide diagram into unreadable type. The
    // viewer draws a *clone* of that SVG at the size mermaid gave it and scales
    // the clone from there; the fence's own copy is never touched.

    /** The natural size of a rendered diagram, in mermaid's own pixels. */
    const naturalSize = (svg) => {
      const box = (svg.getAttribute('viewBox') ?? '').trim().split(/[\s,]+/).map(Number)
      if (box.length === 4 && box.every((n) => Number.isFinite(n)) && box[2] > 0 && box[3] > 0) {
        return { width: box[2], height: box[3] }
      }
      const pixels = (name) => {
        const value = svg.getAttribute(name) ?? ''
        if (value.includes('%')) return Number.NaN
        const size = Number.parseFloat(value)
        return Number.isFinite(size) && size > 0 ? size : Number.NaN
      }
      const width = pixels('width')
      const height = pixels('height')
      if (Number.isFinite(width) && Number.isFinite(height)) return { width, height }
      const rect = svg.getBoundingClientRect()
      return { width: rect.width || 800, height: rect.height || 600 }
    }

    /** The part of the stage the floating toolbar does not cover. */
    const viewportOf = (viewer) => {
      const rect = viewer.stage.getBoundingClientRect()
      const top = viewer.bar.offsetTop + viewer.bar.offsetHeight + 8
      return { width: Math.max(1, rect.width), height: Math.max(1, rect.height - top), top }
    }

    /**
     * The scale that shows the whole diagram. Small diagrams may be magnified
     * up to ZOOM_FIT_MAX so "fit window" actually uses the window; larger ones
     * are still shrunk to fit exactly as before.
     */
    const fitScaleOf = (viewer) => {
      const view = viewportOf(viewer)
      return Math.min(
        ZOOM_FIT_MAX,
        Math.max(1, view.width - 2 * ZOOM_PAD) / viewer.width,
        Math.max(1, view.height - 2 * ZOOM_PAD) / viewer.height,
      )
    }

    /** Below the fit scale would mean "smaller than the whole diagram". */
    const minScaleOf = (viewer) => Math.min(ZOOM_MIN, fitScaleOf(viewer))

    const clampScale = (viewer, scale) => Math.min(ZOOM_MAX, Math.max(minScaleOf(viewer), scale))

    /**
     * Where the diagram sits: a diagram bigger than the window stays reachable
     * by panning, a smaller one is kept centered — dragging it around would
     * only ever be a way to lose it.
     */
    const placeIn = (viewer, scale, x, y) => {
      const view = viewportOf(viewer)
      const width = viewer.width * scale
      const height = viewer.height * scale
      return {
        x: width <= view.width
          ? (view.width - width) / 2
          : Math.min(0, Math.max(view.width - width, x)),
        y: height <= view.height
          ? view.top + (view.height - height) / 2
          : Math.min(view.top, Math.max(view.top + view.height - height, y)),
      }
    }

    /** Apply a scale and a position, clamped, and report the scale taken. */
    const showViewer = (viewer, scale, x, y, atFit = false) => {
      const limited = clampScale(viewer, scale)
      const placed = placeIn(viewer, limited, x, y)
      viewer.scale = limited
      viewer.x = placed.x
      viewer.y = placed.y
      viewer.atFit = atFit
      viewer.pan.style.transform = `translate(${placed.x}px, ${placed.y}px) scale(${limited})`
      viewer.level.textContent = `${Math.round(limited * 100)}%`
    }

    /** Show the whole diagram, centered. */
    const fitViewer = (viewer) => {
      const view = viewportOf(viewer)
      const scale = fitScaleOf(viewer)
      showViewer(viewer, scale, (view.width - viewer.width * scale) / 2, view.top + (view.height - viewer.height * scale) / 2, true)
    }

    /** Scale about a stage point, so the pixel under it stays put. */
    const zoomViewerAt = (viewer, scale, pointX, pointY) => {
      const ratio = clampScale(viewer, scale) / viewer.scale
      showViewer(viewer, viewer.scale * ratio, pointX - (pointX - viewer.x) * ratio, pointY - (pointY - viewer.y) * ratio)
    }

    /** The middle of the visible area, for zooming without a pointer. */
    const stageCenter = (viewer) => {
      const view = viewportOf(viewer)
      return { x: view.width / 2, y: view.top + view.height / 2 }
    }

    /**
     * Build the viewer. One element serves every diagram and lives as long as
     * the fiber: listeners are attached here and guard on `viewer.record`, so
     * opening and closing costs no listener bookkeeping.
     */
    const buildViewer = () => {
      const el = document.createElement('div')
      el.className = 'dsh-mermaid-zoom'
      el.dataset.dshMermaidZoom = '1'
      el.hidden = true
      el.setAttribute('role', 'dialog')
      el.setAttribute('aria-modal', 'true')
      const stage = document.createElement('div')
      stage.className = 'dsh-mermaid-zoom-stage'
      const pan = document.createElement('div')
      pan.className = 'dsh-mermaid-zoom-pan'
      stage.append(pan)
      const bar = document.createElement('div')
      bar.className = 'dsh-mermaid-zoom-bar'
      const kind = document.createElement('span')
      kind.className = 'dsh-mermaid-zoom-kind'
      const level = document.createElement('span')
      level.className = 'dsh-mermaid-zoom-level'
      level.setAttribute('aria-live', 'polite')
      const button = (action, artwork) => {
        const node = document.createElement('button')
        node.type = 'button'
        node.className = 'dsh-mermaid-zoom-button'
        node.dataset.dshMermaidZoomAction = action
        node.innerHTML = artwork
        return node
      }
      const zoomOut = button('out', ICONS.minus)
      const zoomIn = button('in', ICONS.plus)
      const fit = button('fit', ICONS.expand)
      const closeButton = button('close', ICONS.close)
      bar.append(kind, zoomOut, level, zoomIn, fit, closeButton)
      const hint = document.createElement('span')
      hint.className = 'dsh-mermaid-zoom-hint'
      el.append(stage, bar, hint)
      const viewer = {
        el,
        stage,
        pan,
        bar,
        kind,
        level,
        zoomOut,
        zoomIn,
        fit,
        hint,
        closeButton,
        /** the diagram on screen, or null while closed */
        record: null,
        /** the element to hand focus back to on close */
        focus: null,
        /** the pointer gesture in flight */
        drag: null,
        width: 0,
        height: 0,
        scale: 1,
        x: 0,
        y: 0,
        atFit: true,
      }
      viewer.refreshLabels = () => {
        el.setAttribute('aria-label', t('zoomViewer'))
        for (const [node, label] of [
          [zoomOut, t('zoomOut')],
          [zoomIn, t('zoomIn')],
          [fit, t('zoomFit')],
          [closeButton, t('zoomClose')],
        ]) {
          node.dataset.tip = label
          node.setAttribute('aria-label', label)
        }
        hint.textContent = t('zoomHint')
      }
      viewer.refreshLabels()

      const offs = []
      const on = (node, type, handler, options) => {
        node.addEventListener(type, handler, options)
        offs.push(() => node.removeEventListener(type, handler, options))
      }
      const active = () => viewer.record !== null

      on(zoomOut, 'click', () => {
        if (!active()) return
        const point = stageCenter(viewer)
        zoomViewerAt(viewer, viewer.scale / ZOOM_STEP, point.x, point.y)
      })
      on(zoomIn, 'click', () => {
        if (!active()) return
        const point = stageCenter(viewer)
        zoomViewerAt(viewer, viewer.scale * ZOOM_STEP, point.x, point.y)
      })
      on(fit, 'click', () => { if (active()) fitViewer(viewer) })
      on(closeButton, 'click', () => closeViewer())
      // Bound to the overlay rather than the stage: a wheel anywhere over the
      // modal must not scroll the conversation behind it, including over the
      // toolbar, where there is nothing to zoom.
      on(el, 'wheel', (event) => {
        if (!active()) return
        event.preventDefault()
        if (bar.contains(event.target)) return
        const rect = stage.getBoundingClientRect()
        // A wheel notch is ~100px; one line of text scroll is ~3px.
        const factor = Math.exp(-event.deltaY * (event.deltaMode === 1 ? 0.05 : 0.002))
        zoomViewerAt(viewer, viewer.scale * factor, event.clientX - rect.left, event.clientY - rect.top)
      }, { passive: false })
      on(stage, 'pointerdown', (event) => {
        if (!active() || event.button !== 0) return
        viewer.drag = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          originX: viewer.x,
          originY: viewer.y,
          target: event.target,
          moved: false,
        }
        // Capture is a convenience (dragging past the edge keeps working); a
        // pointer the browser no longer tracks must not break the gesture.
        try {
          viewer.stage.setPointerCapture(event.pointerId)
        } catch {
          /* not capturable */
        }
      })
      on(stage, 'pointermove', (event) => {
        const drag = viewer.drag
        if (drag === null || drag.id !== event.pointerId) return
        const dx = event.clientX - drag.x
        const dy = event.clientY - drag.y
        if (!drag.moved && Math.hypot(dx, dy) < ZOOM_DRAG_MIN) return
        drag.moved = true
        showViewer(viewer, viewer.scale, drag.originX + dx, drag.originY + dy, viewer.atFit)
      })
      on(stage, 'pointerup', (event) => {
        const drag = viewer.drag
        if (drag === null || drag.id !== event.pointerId) return
        viewer.drag = null
        try {
          viewer.stage.releasePointerCapture(event.pointerId)
        } catch {
          /* was not captured */
        }
        // A press on the empty backdrop closes the viewer. A drag never does,
        // and neither does a press on the diagram itself — that one is far too
        // easy to hit by accident while panning.
        const onDiagram = drag.target !== null
          && typeof drag.target.closest === 'function'
          && drag.target.closest('.dsh-mermaid-zoom-pan') !== null
        if (!drag.moved && !onDiagram) closeViewer()
      })
      on(stage, 'pointercancel', () => { viewer.drag = null })
      on(stage, 'dblclick', (event) => {
        if (!active()) return
        if (!viewer.atFit) {
          fitViewer(viewer)
          return
        }
        const rect = stage.getBoundingClientRect()
        zoomViewerAt(viewer, 1, event.clientX - rect.left, event.clientY - rect.top)
      })
      on(window, 'resize', () => {
        if (!active()) return
        if (viewer.atFit) fitViewer(viewer)
        else showViewer(viewer, viewer.scale, viewer.x, viewer.y)
      })
      // Captured, so Esc and the arrows belong to the viewer while it is open
      // instead of reaching the conversation behind it.
      on(window, 'keydown', (event) => {
        if (!active() || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
        const point = stageCenter(viewer)
        const key = event.key
        if (key === 'Escape') closeViewer()
        else if (key === '+' || key === '=') zoomViewerAt(viewer, viewer.scale * ZOOM_STEP, point.x, point.y)
        else if (key === '-' || key === '_') zoomViewerAt(viewer, viewer.scale / ZOOM_STEP, point.x, point.y)
        else if (key === '0') fitViewer(viewer)
        else if (key === 'ArrowLeft') showViewer(viewer, viewer.scale, viewer.x + ZOOM_ARROW_PX, viewer.y, viewer.atFit)
        else if (key === 'ArrowRight') showViewer(viewer, viewer.scale, viewer.x - ZOOM_ARROW_PX, viewer.y, viewer.atFit)
        else if (key === 'ArrowUp') showViewer(viewer, viewer.scale, viewer.x, viewer.y + ZOOM_ARROW_PX, viewer.atFit)
        else if (key === 'ArrowDown') showViewer(viewer, viewer.scale, viewer.x, viewer.y - ZOOM_ARROW_PX, viewer.atFit)
        else return
        event.preventDefault()
        event.stopPropagation()
      }, true)
      ;(document.body ?? document.documentElement).append(el)
      viewer.dispose = () => {
        viewer.record = null
        for (const off of offs) off()
        el.remove()
      }
      return viewer
    }

    /** Show one diagram enlarged, replacing whatever the viewer showed before. */
    const openViewer = (record) => {
      if (state.disposed) return
      const svg = record.canvas.querySelector('svg')
      if (svg === null) return
      const viewer = state.viewer ?? (state.viewer = buildViewer())
      closeViewer()
      const size = naturalSize(svg)
      // A clone, not the node: the fence keeps its own picture, and the copy
      // needs no `max-width` cap to be readable. Its paper (background, radius,
      // shadow) comes from the stylesheet, which knows the theme tokens.
      const clone = svg.cloneNode(true)
      clone.setAttribute('width', String(Math.round(size.width)))
      clone.setAttribute('height', String(Math.round(size.height)))
      clone.style.cssText = `width:${size.width}px;height:${size.height}px;max-width:none;display:block`
      const paper = document.createElement('div')
      paper.className = 'dsh-mermaid-zoom-paper'
      paper.append(clone)
      const width = size.width + 2 * ZOOM_PAPER_PAD
      const height = size.height + 2 * ZOOM_PAPER_PAD
      viewer.pan.style.width = `${width}px`
      viewer.pan.style.height = `${height}px`
      viewer.pan.replaceChildren(paper)
      viewer.kind.textContent = record.kindName ?? LANGUAGE
      viewer.bar.dataset.dshMermaidKind = record.kindName ?? LANGUAGE
      viewer.width = width
      viewer.height = height
      viewer.record = record
      viewer.focus = document.activeElement
      viewer.el.hidden = false
      fitViewer(viewer)
      viewer.closeButton.focus({ preventScroll: true })
    }

    /** Hide the viewer and hand focus back to whatever opened it. */
    const closeViewer = () => {
      const viewer = state.viewer
      if (viewer === null || viewer.record === null) return
      viewer.record = null
      viewer.drag = null
      viewer.el.hidden = true
      viewer.pan.replaceChildren()
      viewer.pan.style.width = ''
      viewer.pan.style.height = ''
      const focus = viewer.focus
      viewer.focus = null
      if (focus !== null && focus !== document.body && typeof focus.focus === 'function' && focus.isConnected) {
        focus.focus({ preventScroll: true })
      } else if (viewer.el.contains(document.activeElement)) {
        // Nothing owns the focus (the diagram itself is not focusable, the
        // opener may be gone): park it on the page instead of on a button
        // inside a hidden dialog.
        document.activeElement.blur()
      }
    }

    // ---- theme menu ------------------------------------------------------
    // One shared popover serves every card. A theme is a reader preference, not
    // a property of a single diagram, so choosing a variant repaints every
    // diagram on the page instead of only the one whose header opened the menu.

    /**
     * Build the popover. Each item carries a three-dot swatch derived from the
     * same palette the diagrams use, and the checked item is the live variant.
     */
    const buildThemeMenu = () => {
      const el = document.createElement('div')
      el.className = 'dsh-mermaid-theme-menu'
      el.dataset.dshMermaidThemeMenu = '1'
      el.hidden = true
      el.setAttribute('role', 'menu')
      const entries = new Map()
      const labels = new Map()
      const items = []
      for (const choice of THEME_CHOICES) {
        const item = document.createElement('button')
        item.type = 'button'
        item.className = 'dsh-mermaid-theme-item'
        item.dataset.dshMermaidTheme = choice.id
        item.setAttribute('role', 'menuitemradio')
        item.setAttribute('aria-checked', 'false')
        const swatch = document.createElement('span')
        swatch.className = 'dsh-mermaid-theme-swatch'
        swatch.setAttribute('aria-hidden', 'true')
        for (const color of THEME_SWATCHES[choice.id] ?? []) {
          const dot = document.createElement('span')
          dot.className = 'dsh-mermaid-theme-dot'
          dot.style.background = color
          swatch.append(dot)
        }
        const label = document.createElement('span')
        label.className = 'dsh-mermaid-theme-label'
        const check = document.createElement('span')
        check.className = 'dsh-mermaid-theme-check'
        check.innerHTML = ICONS.check
        item.append(swatch, label, check)
        item.addEventListener('click', () => chooseTheme(choice.id))
        el.append(item)
        entries.set(choice.id, item)
        labels.set(choice.id, label)
        items.push(item)
      }

      const menu = {
        el,
        items,
        entries,
        /** the header button the menu currently hangs from, or null */
        opener: null,
        dispose,
      }

      /** Mark exactly one item as the selected variant. */
      const sync = () => {
        for (const [id, item] of entries) {
          const checked = id === state.variant
          item.setAttribute('aria-checked', String(checked))
          item.tabIndex = checked ? 0 : -1
        }
      }

      /** Place the fixed popover under its trigger, clamped to the viewport. */
      const position = () => {
        const opener = menu.opener
        if (opener === null || !opener.isConnected) {
          close()
          return
        }
        const anchor = opener.getBoundingClientRect()
        const box = el.getBoundingClientRect()
        let left = anchor.right - box.width
        let top = anchor.bottom + 6
        if (top + box.height > window.innerHeight - 8 && anchor.top - box.height - 6 >= 8) {
          top = anchor.top - box.height - 6
        }
        left = Math.max(8, Math.min(left, window.innerWidth - box.width - 8))
        top = Math.max(8, Math.min(top, window.innerHeight - box.height - 8))
        el.style.left = `${Math.round(left)}px`
        el.style.top = `${Math.round(top)}px`
      }

      const onPointerDown = (event) => {
        const target = event.target
        if (target instanceof Node && (el.contains(target) || target === menu.opener)) return
        close()
      }

      const onDocumentKeyDown = (event) => {
        if (event.key !== 'Escape' || event.defaultPrevented) return
        event.preventDefault()
        event.stopPropagation()
        close(true)
      }

      const onMenuKeyDown = (event) => {
        const index = items.indexOf(document.activeElement)
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault()
          const step = event.key === 'ArrowDown' ? 1 : -1
          items[(index + step + items.length) % items.length].focus({ preventScroll: true })
        } else if (event.key === 'Home') {
          event.preventDefault()
          items[0].focus({ preventScroll: true })
        } else if (event.key === 'End') {
          event.preventDefault()
          items[items.length - 1].focus({ preventScroll: true })
        } else if (event.key === 'Tab') {
          close()
        }
      }
      el.addEventListener('keydown', onMenuKeyDown)

      /**
       * Open the menu under `opener`, focusing the live variant. Calling it
       * again with the same opener closes the menu, so the trigger toggles.
       */
      function open (opener) {
        if (state.disposed) return
        if (menu.opener === opener && !el.hidden) {
          close()
          return
        }
        close()
        menu.opener = opener
        el.hidden = false
        sync()
        position()
        const current = entries.get(state.variant) ?? items[0]
        current?.focus({ preventScroll: true })
        opener.setAttribute('aria-expanded', 'true')
        document.addEventListener('pointerdown', onPointerDown, true)
        document.addEventListener('keydown', onDocumentKeyDown, true)
        window.addEventListener('resize', position)
        window.addEventListener('scroll', position, true)
      }

      /** Hide the menu; `returnFocus` hands focus back to the trigger. */
      function close (returnFocus = false) {
        if (el.hidden) return
        el.hidden = true
        const opener = menu.opener
        menu.opener = null
        opener?.setAttribute('aria-expanded', 'false')
        document.removeEventListener('pointerdown', onPointerDown, true)
        document.removeEventListener('keydown', onDocumentKeyDown, true)
        window.removeEventListener('resize', position)
        window.removeEventListener('scroll', position, true)
        if (returnFocus && opener !== null && opener.isConnected) opener.focus({ preventScroll: true })
      }

      /** Refresh the localized copy (the locale service can bind after mount). */
      const refreshLabels = () => {
        el.setAttribute('aria-label', t('theme'))
        for (const choice of THEME_CHOICES) {
          const node = labels.get(choice.id)
          if (node === undefined) continue
          node.textContent = choice.key === undefined ? choice.label : t(choice.key)
        }
      }

      function dispose () {
        close()
        el.remove()
      }

      menu.open = open
      menu.close = close
      menu.sync = sync
      menu.refreshLabels = refreshLabels

      refreshLabels()
      sync()
      ;(document.body ?? document.documentElement).append(el)
      return menu
    }

    /** The shared menu, built the first time a header control asks for it. */
    const themeMenu = () => {
      if (state.disposed) return null
      if (state.menu === null) state.menu = buildThemeMenu()
      return state.menu
    }

    /** Toggle the menu under one card's theme button. */
    const openThemeMenu = (opener) => {
      const menu = themeMenu()
      if (menu !== null) menu.open(opener)
    }

    /**
     * Adopt a theme: remember it, refresh the header tooltips, and repaint every
     * diagram. `applyView` is deliberate before the repaint — the tooltip and
     * aria label must name the new variant even while the new SVGs are drawn.
     */
    const chooseTheme = (variant) => {
      if (state.disposed) return
      if (variant === state.variant) {
        if (state.menu !== null) state.menu.close(true)
        return
      }
      if (THEME_SWATCHES[variant] === undefined) return
      state.variant = variant
      storeTheme(variant)
      if (state.menu !== null) state.menu.close(true)
      for (const record of state.records.values()) applyView(record)
      repaint()
    }

    /**
     * The rendered-diagram cache.
     *
     * A Mermaid render is 95% of this plugin's cost and is a pure function of
     * the fence text plus the palette it is drawn in, yet three ordinary
     * situations repeat it for an identical answer: a reader toggling the theme
     * back to one they already used, React replacing a message's DOM (which
     * drops the holder and makes the block look new), and the same diagram
     * appearing twice in one message. Caching the finished SVG string turns each
     * of those from a 20-190ms render into a string insert.
     *
     * Insertion order is recency order: a hit is re-inserted, an overflow
     * evicts from the front, and the map is bounded by both entry count and
     * total bytes so one huge chart cannot pin hundreds of megabytes.
     */
    const cacheKeyOf = (palette, code) => `${palette}\n${code}`

    /** Read one entry, refreshing its recency. */
    const cacheGet = (key) => {
      const entry = state.cache.get(key)
      if (entry === undefined) return undefined
      state.cache.delete(key)
      state.cache.set(key, entry)
      return entry
    }

    /** Store one entry, evicting least-recently-used first past either bound. */
    const cacheSet = (key, entry) => {
      if (entry.bytes > CACHE_BYTES) return
      const previous = state.cache.get(key)
      if (previous !== undefined) {
        state.cache.delete(key)
        state.cacheBytes -= previous.bytes
      }
      state.cache.set(key, entry)
      state.cacheBytes += entry.bytes
      while (state.cache.size > CACHE_ENTRIES || state.cacheBytes > CACHE_BYTES) {
        const oldest = state.cache.keys().next()
        if (oldest.done === true) break
        const dropped = state.cache.get(oldest.value)
        state.cache.delete(oldest.value)
        state.cacheBytes -= dropped === undefined ? 0 : dropped.bytes
      }
    }

    /** Drop everything; called from the fiber teardown. */
    const cacheClear = () => {
      state.cache.clear()
      state.cacheBytes = 0
    }

    /**
     * Re-home one cached SVG on the id of the insertion that is about to use it.
     *
     * Mermaid namespaces everything it emits with the id it was handed — the
     * `<svg id>` itself, every `url(#…)` marker and arrowhead reference, and the
     * `<style>` selectors it compiles under `#<id>`. Two cards replaying the
     * same cached string would therefore carry duplicate ids, and `url(#…)`
     * resolves to whichever node the document finds first, so removing that card
     * would silently break the other one's arrowheads. Rewriting every
     * occurrence of the old id makes each insertion self-contained. The id is
     * this plugin's own and unique per render, so a literal replacement cannot
     * collide with anything belonging to the diagram.
     */
    const reidentify = (svg, from, to) => (from === to ? svg : svg.split(from).join(to))

    /**
     * Put a finished SVG on the card and settle the record. Shared by the fresh
     * and the cached path, so that a cache hit is indistinguishable to the rest
     * of the plugin.
     */
    const commit = (record, svg, palette) => {
      record.canvas.innerHTML = svg
      record.done = true
      record.failed = false
      record.failures = 0
      record.paintedKey = palette
      applyView(record)
      fitReading(record)
      record.block.dataset.dshMermaid = 'done'
    }

    // ---- visibility -----------------------------------------------------
    // A Mermaid render is 95% of this plugin's cost (measured: 698ms of a 738ms
    // nine-diagram pass) and it is per-diagram, so the cheapest render is the
    // one nobody asked to see. A conversation keeps its whole history in the
    // DOM, and its history holds diagrams the reader scrolled past long ago;
    // mounting such a conversation used to render every one of them. Parking a
    // job until the card is within VISIBLE_MARGIN of the viewport is the single
    // largest saving available, and it costs a reader nothing: the work starts
    // before the card arrives, and a fast scroll shows the plain fence for one
    // settle window instead of showing a frozen tab.

    /**
     * Is this block near the viewport *right now*?
     *
     * The observer is the right trigger for a parked render, but it cannot
     * answer the question that decides whether to start one: its first callback
     * arrives a frame after `observe()`, and the decision is taken in the same
     * task the record is created in. So the first sighting asks the layout
     * directly — one `getBoundingClientRect()` against a render that costs two
     * to three orders of magnitude more. The block is measured rather than the
     * canvas because the canvas is still `hidden` at this point and would report
     * a zero rect.
     */
    const onScreen = (block) => {
      const rect = block.getBoundingClientRect()
      // A block with no box at all is not laid out — a collapsed surface or a
      // background tab. Do not turn that into "off screen": the observer will
      // report the truth as soon as it has one, and a collapsed panel would
      // otherwise never render.
      if (rect.width === 0 && rect.height === 0) return true
      const height = window.innerHeight || 0
      return rect.bottom >= -VISIBLE_MARGIN_PX && rect.top <= height + VISIBLE_MARGIN_PX
    }

    /**
     * Record one block for the visibility observer, or drop it.
     *
     * The observed node is the holder, not the canvas: the canvas stays `hidden`
     * until it has a diagram in it, and an observer on a `display:none` box can
     * only ever report "not visible" — a parked card would never come back. The
     * holder is visible from the moment the card exists, so its intersection is
     * an honest answer to "would the reader see this".
     *
     * `record.visible` starts unknown, which the guard treats as visible: a
     * platform without the observer, and the first frame of a fresh card, both
     * behave exactly as the plugin did before — a render attempt worth paying
     * for.
     */
    const watchVisibility = (record) => {
      const observerFor = () => {
        if (state.visible !== null) return state.visible
        if (typeof IntersectionObserver !== 'function') return null
        state.visible = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            const target = state.byHolder.get(entry.target)
            if (target === undefined) continue
            target.visible = entry.isIntersecting
            if (!entry.isIntersecting) continue
            // Came into range: take the fit measurement that was skipped while
            // the card was off screen, and pay for the render that was parked
            // because nobody was looking.
            fitReading(target)
            if (target.wantsPaint) {
              target.wantsPaint = false
              if (target.block.isConnected) renderBlock(target.block, true)
            }
          }
        }, { rootMargin: VISIBLE_MARGIN })
        return state.visible
      }
      const observer = observerFor()
      if (observer === null) return
      state.byHolder.set(record.holder, record)
      observer.observe(record.holder)
    }

    /** Stop watching a holder whose record was replaced or disposed. */
    const unwatchVisibility = (record) => {
      if (state.visible === null) return
      state.byHolder.delete(record.holder)
      state.visible.unobserve(record.holder)
    }

    /** One diagram, rendered with the current theme. */
    const paint = async (record) => {
      // A repaint or a re-render replaces the SVG; a viewer showing the old one
      // would be showing a picture that no longer exists.
      if (state.viewer !== null && state.viewer.record === record) closeViewer()
      const mermaid = await loadMermaid()
      if (state.disposed || !record.block.isConnected) return
      // One read of the scheme, used for the configuration, the palette and the
      // cache key: two reads could straddle a theme switch and describe a
      // configuration that was never applied.
      const scheme = themeScheme()
      const palette = `${scheme}|${state.variant}`
      const code = record.code
      configure(mermaid, scheme)
      // The card is already showing this diagram in this palette. Only a
      // redundant theme event or a repaint racing a paint reaches here, and a
      // Mermaid render is three orders of magnitude more expensive than this
      // comparison, so the guard pays for itself the first time it fires.
      if (record.done === true && record.paintedKey === palette) return

      const id = `${PLUGIN_ID}-${(state.uid += 1)}`
      const key = cacheKeyOf(palette, code)
      const cached = cacheGet(key)
      if (cached !== undefined) {
        commit(record, reidentify(cached.svg, cached.id, id), palette)
        return
      }

      let result
      try {
        result = await mermaid.render(id, code)
      } catch (error) {
        // mermaid's temp nodes are `d<id>` (SVG host) and `i<id>` (sandbox
        // iframe). A failed render is allowed to leave them behind, which is
        // how a half-streamed fence used to deposit an error diagram at the end
        // of the conversation; remove them before surfacing our own note.
        for (const temp of [`d${id}`, `i${id}`]) document.getElementById(temp)?.remove()
        throw error
      }
      if (state.disposed || !record.block.isConnected) return
      // A newer snapshot of the fence, or another paint, got here while this
      // render was running. Committing would put the *old* picture on the card
      // and stamp it as current — and because `renderBlock` treats "record done
      // and same text" as nothing to do, a card could then keep showing a
      // diagram its text no longer matches, for good. Whatever superseded this
      // render owns the card now; drop the result. (The cache write below is
      // still correct: its key carries the text this render was made from.)
      if (record.code !== code) return
      // A `click` statement is bound as a closure over the diagram mermaid just
      // parsed, so a replayed string would come back inert. Those diagrams are
      // simply not cached; everything else is.
      if (!INTERACTIVE.test(code)) {
        cacheSet(key, { svg: result.svg, id, bytes: result.svg.length })
      }
      commit(record, result.svg, palette)
      if (typeof result.bindFunctions === 'function') {
        try {
          result.bindFunctions(record.canvas)
        } catch {
          /* interaction binding is best effort */
        }
      }
    }

    /**
     * A failed render. The first failures are almost always a fence that is
     * still being streamed, so they retry with backoff instead of surfacing;
     * only once the retries run out does the note appear.
     */
    const onFailure = (block, record, error) => {
      if (state.disposed || !record.block.isConnected) return
      record.failures += 1
      const delay = RETRY_MS[record.failures - 1]
      if (delay !== undefined) {
        schedule(block, delay, true)
        return
      }
      const key = error?.dshMermaidLoad === true ? 'loadFailed' : 'renderFailed'
      fail(block, record, error, key)
    }

    /**
     * Surface a settled failure without destroying the fence it came from. The
     * record stays alive and the note stays inside the holder: the next change
     * of this fence's text clears it and renders again.
     */
    const fail = (block, record, error, key) => {
      if (state.disposed || !block.isConnected) return
      record.failed = true
      record.errorKind = key === 'loadFailed' ? 'load' : 'render'
      record.errorPre.textContent = messageOf(error)
      block.dataset.dshMermaid = 'failed'
      applyView(record)
    }

    /**
     * Render one block. `force` skips the "nothing changed" guard; the retry
     * timer uses it to re-attempt the very same text.
     */
    const renderBlock = (block, force = false) => {
      if (state.disposed || !block.isConnected) return
      const code = sourceOf(block)
      if (code === null || !isMermaidFence(block, code)) return
      const record = ensureRecord(block)
      if (!force && record.code === code && (record.done || record.failed || record.pending)) return
      if (record.code !== code) {
        // The fence text moved on — a note left by an earlier snapshot of this
        // same block is stale, and the retry budget starts over. This is what
        // makes a mid-stream parse error, or a regenerated message that reuses
        // the same DOM node, recover instead of sticking forever.
        record.done = false
        record.failures = 0
        record.failed = false
      }
      record.code = code
      record.kindName = diagramKind(code)
      record.pending = true
      block.dataset.dshMermaid = 'pending'
      // Claim the card chrome immediately: the shell's generic code banner is
      // replaced by this card's own header while the first SVG is still being
      // fetched, so the block never flashes "代码块" and then changes shape.
      applyView(record)
      // Off screen: note what is owed and let the visibility observer collect
      // it. `pending` goes back to false so a later settle is not blocked by a
      // job that is not actually running.
      if (record.visible === false || (record.visible === undefined && !onScreen(block))) {
        record.visible = false
        record.wantsPaint = true
        record.pending = false
        return undefined
      }
      return enqueue(() => paint(record).then(
        () => { record.pending = false },
        (error) => { record.pending = false; onFailure(block, record, error) },
      ))
    }

    /** Wait for a fence to stop changing before rendering it (streaming). */
    const schedule = (block, delay = SETTLE_MS, force = false) => {
      if (state.disposed || !block.isConnected) return
      prefetchEngine(block)
      const pending = state.timers.get(block)
      if (pending !== undefined) window.clearTimeout(pending)
      state.timers.set(block, window.setTimeout(() => {
        state.timers.delete(block)
        // A throw escaping here used to leave the fence as plain source with no
        // holder, no buttons and no explanation — the whole block silently
        // dead. Whatever breaks, it becomes a note instead.
        try {
          renderBlock(block, force)
        } catch (error) {
          const record = state.records.get(block)
          if (record !== undefined) fail(block, record, error, 'renderFailed')
        }
      }, delay))
    }

    const scan = (root) => {
      if (root === null || typeof root.querySelectorAll !== 'function') return
      for (const block of root.querySelectorAll('.md-code-block')) schedule(block)
    }

    /**
     * Redraw every diagram for the current palette.
     *
     * Two filters keep this from being the most expensive thing the plugin can
     * do. A card already painted in this palette is skipped outright — that is
     * what makes the second of two identical `theme/change` events free. And an
     * off-screen card is only *marked*: its render is owed, and the visibility
     * observer pays for it if the reader ever scrolls back to it. Repainting a
     * conversation's whole history for a theme switch used to be visible as a
     * freeze; now only what is on screen is redrawn.
     */
    const repaint = () => {
      const palette = `${themeScheme()}|${state.variant}`
      for (const record of state.records.values()) {
        if (!record.block.isConnected || record.code === null || record.failed) continue
        if (record.done === true && record.paintedKey === palette) continue
        if (record.visible === false) {
          record.wantsPaint = true
          continue
        }
        enqueue(() => paint(record).then(
          () => {},
          (error) => onFailure(record.block, record, error),
        ))
      }
    }

    // ---- lifecycle ------------------------------------------------------
    const observer = new MutationObserver((mutations) => {
      // Streaming replaces message DOM wholesale; a viewer left showing a
      // diagram whose fence is gone has nothing to close it.
      const shown = state.viewer === null ? null : state.viewer.record
      if (shown !== null && !shown.block.isConnected) closeViewer()
      for (const mutation of mutations) {
        const target = mutation.target
        // Streaming edits land as characterData on the fence's text node, and as
        // a replaced text node (a childList mutation whose added node is not an
        // element). Both mean "the fence changed", so both have to be traced
        // back to the owning block — and a characterData target *is* the text
        // node, not an element, which is why the element is resolved first and
        // every check then runs against it.
        const element = target.nodeType === 1 ? target : target.parentElement
        // Our own DOM must never look like "the fence changed": the note and
        // the buttons live inside the holder, the viewer and the theme menu are
        // siblings of the whole conversation, and the attributes we toggle are
        // ours alone. This test has to come before the block lookup, or a write
        // inside the holder would schedule a render of the fence it belongs to.
        if (element !== null && typeof element.closest === 'function'
          && element.closest('[data-dsh-mermaid-holder], [data-dsh-mermaid-zoom], [data-dsh-mermaid-theme-menu]') !== null) continue
        if (mutation.type === 'attributes') {
          const name = mutation.attributeName
          if (name === HIDDEN || (typeof name === 'string' && name.startsWith('data-dsh-mermaid'))) continue
        }
        if (element !== null && typeof element.closest === 'function') {
          const owner = element.closest('.md-code-block')
          if (owner !== null) schedule(owner)
        }
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue
          if (typeof node.closest === 'function' && node.closest('[data-dsh-mermaid-holder], [data-dsh-mermaid-zoom], [data-dsh-mermaid-theme-menu]') !== null) continue
          if (typeof node.matches === 'function' && node.matches('.md-code-block')) schedule(node)
          else scan(node)
        }
      }
    })

    ctx.effect(() => {
      const target = document.body ?? document.documentElement
      // A failed render from a previous page state (or a pre-fix hot reload)
      // can leave mermaid's temporary SVG/iframe hosts behind. They are ours to
      // remove: the ids are `d<renderId>` / `i<renderId>`.
      for (const stale of document.querySelectorAll(
        '[id^="ddsh-mermaid-preview-"], [id^="idsh-mermaid-preview-"]',
      )) stale.remove()
      observer.observe(target, { childList: true, subtree: true, characterData: true })
      scan(target)
      return () => {
        state.disposed = true
        observer.disconnect()
        for (const timer of state.timers.values()) window.clearTimeout(timer)
        state.timers.clear()
        for (const script of state.scripts) script.remove()
        state.scripts.clear()
        if (state.viewer !== null) {
          state.viewer.dispose()
          state.viewer = null
        }
        if (state.menu !== null) {
          state.menu.dispose()
          state.menu = null
        }
        if (state.visible !== null) {
          state.visible.disconnect()
          state.visible = null
        }
        state.byHolder = new WeakMap()
        cacheClear()
        for (const record of state.records.values()) {
          record.canvasObserver?.disconnect()
          if (record.copyTimer !== undefined) window.clearTimeout(record.copyTimer)
          record.holder.remove()
          record.content?.removeAttribute(HIDDEN)
        }
        state.records.clear()
        for (const block of document.querySelectorAll('.md-code-block[data-dsh-mermaid]')) {
          delete block.dataset.dshMermaid
        }
        for (const el of document.querySelectorAll(`[${HIDDEN}]`)) el.removeAttribute(HIDDEN)
        for (const el of document.querySelectorAll(`[${BANNER_HIDDEN}]`)) el.removeAttribute(BANNER_HIDDEN)
        delete document.documentElement.dataset.dshMermaidFit
      }
    }, `${PLUGIN_ID}: observer`)

    /**
     * Repaint after a theme signal.
     *
     * Deferred by one macrotask, because the signal can arrive before the colour
     * scheme has been committed: `themeScheme()` would then read the old scheme,
     * the palette guard would correctly conclude there is nothing to repaint, and
     * the old palette would stay on screen until the next switch — the exact
     * "I changed it and nothing happened" failure. Deferring lets the commit
     * land first.
     *
     * Two signals, one idempotent handler. `theme/change` is the intended one;
     * the `data-ds-dark-theme` attribute on `<body>` — which this plugin's own
     * stylesheet already keys off — is the one that is written *by* the commit,
     * so watching it makes the ordering irrelevant rather than merely unlikely.
     * The palette guard makes the duplicate repaint free.
     */
    const onThemeSignal = () => {
      // The palette is part of the key, so a real switch makes the guard miss on
      // its own; forgetting it here just means another consumer of the global
      // mermaid instance cannot leave this plugin drawing with a stale config.
      configuredKey = null
      void yieldToMain().then(() => {
        if (!state.disposed) repaint()
      })
    }
    ctx.on('theme/change', onThemeSignal)
    ctx.effect(() => {
      const target = document.body
      if (target === null || typeof MutationObserver !== 'function') return () => {}
      const watch = new MutationObserver(onThemeSignal)
      watch.observe(target, { attributes: true, attributeFilter: ['data-ds-dark-theme'] })
      return () => watch.disconnect()
    }, `${PLUGIN_ID}: theme attribute`)
    ctx.on('locale/change', () => {
      for (const record of state.records.values()) applyView(record)
      state.viewer?.refreshLabels()
      state.menu?.refreshLabels()
    })
  },
}

/* dsh:test-only:start */
// Exposed for `npm run check` only: the pure detection logic is the part that
// cannot be exercised in the browser here. scripts/build.mjs strips everything
// between these markers from every built artifact.
export const __test = { MERMAID_HEAD, MERMAID_VERSION, ENGINE_CHUNK, opensDiagram, diagramKind }
/* dsh:test-only:end */
