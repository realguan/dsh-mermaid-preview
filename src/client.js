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
 *    leaves every React-owned node in place; switching to source merely lifts a
 *    CSS rule. React therefore never reconciles a node it did not create, and
 *    the built-in copy button keeps reading the original `<pre>`.
 * 4. Mermaid 11 (UMD, jsDelivr) is fetched once, lazily, only when the first
 *    candidate fence appears. Renders are serialized so a message full of
 *    diagrams cannot block the main thread with parallel work.
 * 5. A wide diagram arrives at the fence's width and shrinks into unreadable
 *    type, so the diagram is also a control: click it — or the "Zoom" button
 *    beside the source toggle — to open a full-window viewer. The viewer clones
 *    the rendered SVG, drops mermaid's `max-width` cap, and offers wheel zoom,
 *    drag-to-pan, fit-to-window, double-click 1:1, arrow keys and Esc.
 * 6. A render failure is never final. Streaming cuts a fence mid-statement
 *    whenever the model pauses for longer than the settle window, and a
 *    half-written diagram is a parse error, not a user error: the block retries
 *    with backoff, and only a fence whose text has stopped changing and still
 *    fails earns the red note. New text on the same block clears the note and
 *    starts over — a block is never poisoned by one bad snapshot of itself.
 * 7. Theme switches repaint through `ctx.on('theme/change')`; UI copy comes from
 *    the Client locale service (`ctx.get('locale')`), so it follows the
 *    interface language. A repaint closes the viewer, which would otherwise
 *    keep showing the previous theme's picture.
 * 8. Every side effect — styles, observer, listeners, timers, script tag,
 *    injected DOM, the viewer — is owned by the plugin fiber and removed on
 *    stop/update.
 *
 * This module is the canonical source. `scripts/build.mjs` derives
 * `dist/client.js` (the native bundle a profile loads) and
 * `dist/dsh-mermaid-preview.client.js` (the paste-ready dynamic payload).
 *
 * MIT License — see LICENSE.
 */

/** Package name. It is the browser module identity, so it must equal `name`. */
const PLUGIN_ID = 'dsh-mermaid-preview'

/** Locale namespace for this plugin's own interface copy. */
const NS = PLUGIN_ID

/** Fence language this plugin takes over. */
const LANGUAGE = 'mermaid'

/** Pinned Mermaid release (UMD). Change this line to use a mirror. */
const MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.min.js'

/** Quiet period before a fence is considered settled and worth rendering. */
const SETTLE_MS = 250

/**
 * Backoff after a failed render, in milliseconds. A fence that fails while it
 * is still being streamed usually fails because it is half-written, so the
 * plugin stays quiet and tries again; only a fence that keeps failing after
 * these retries — one whose text has stopped changing — earns the error note.
 */
const RETRY_MS = [400, 900, 1800]

/** Padding left around the diagram by the viewer's fit-to-window scale. */
const ZOOM_PAD = 32

/** Scale bounds of the viewer; `ZOOM_MAX` covers a diagram of a few nodes. */
const ZOOM_MIN = 0.1
const ZOOM_MAX = 8

/** One press of the viewer's +/- buttons. */
const ZOOM_STEP = 1.25

/** Travel, in pixels, below which a pointer gesture is a click, not a pan. */
const ZOOM_DRAG_MIN = 4

/** How far one arrow key moves the diagram. */
const ZOOM_ARROW_PX = 80

/** Highest sane stacking order: the viewer must clear anything the shell draws. */
const ZOOM_Z_INDEX = 2147483000

/** Attribute marking the body we hide while the diagram is shown. */
const HIDDEN = 'data-dsh-mermaid-hidden'

/**
 * Attribute hiding the shell's own code banner (label, collapse, copy) while a
 * diagram stands in for the code. Toggled on the banner's wrapper, which React
 * owns — an attribute write is reversible, a node replacement is not.
 */
const BANNER_HIDDEN = 'data-dsh-mermaid-banner'

/** Copy for the built-in locales; `en` is the fallback. */
const DICT = {
  en: {
    showSource: 'Show source',
    showDiagram: 'Show diagram',
    loadFailed: 'Mermaid failed to load: ',
    renderFailed: 'Mermaid render failed: ',
    zoom: 'Zoom',
    zoomViewer: 'Diagram viewer',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    zoomFit: 'Fit',
    zoomClose: 'Close',
    zoomHint: 'Scroll to zoom · Drag to pan · Esc to close',
  },
  zh: {
    showSource: '显示源码',
    showDiagram: '显示图表',
    loadFailed: 'Mermaid 加载失败：',
    renderFailed: 'Mermaid 渲染失败：',
    zoom: '放大',
    zoomViewer: '图表查看器',
    zoomIn: '放大',
    zoomOut: '缩小',
    zoomFit: '适应窗口',
    zoomClose: '关闭',
    zoomHint: '滚轮缩放 · 拖拽平移 · Esc 关闭',
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
 * Strip the front matter, directives, and comments Mermaid allows before the
 * first statement, then answer whether that statement opens a diagram.
 * @param code - the fence source.
 * @returns true when the fence is a plausible Mermaid diagram.
 */
const opensDiagram = (code) => {
  let rest = code.replace(/^\uFEFF/, '')
  for (;;) {
    const before = rest
    rest = rest.replace(/^\s*%%[^\n]*(?:\n|$)/, '')
    rest = rest.replace(/^\s*%%\{[\s\S]*?\}%%\s*/, '')
    rest = rest.replace(/^\s*---\r?\n[\s\S]*?\r?\n---\s*/, '')
    if (rest === before) break
  }
  return MERMAID_HEAD.test(rest.replace(/^\s+/, ''))
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
    }

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

    // ---- styles ---------------------------------------------------------
    // Colors are theme tokens only, so light/dark switching needs no repaint of
    // the frame around the diagram.
    ctx.effect(() => {
      const style = document.createElement('style')
      style.dataset.dshMermaidStyles = '1'
      style.textContent = `
      .dsh-mermaid { margin-top: 8px; }
      .dsh-mermaid-diagram {
        display: flex;
        justify-content: center;
        overflow-x: auto;
        padding: 8px 10px;
        background: var(--dsw-alias-bg-layer-1, #fff);
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 8px;
      }
      .dsh-mermaid-diagram[hidden] { display: none; }
      .dsh-mermaid-diagram svg { max-width: 100%; height: auto; }
      .dsh-mermaid-diagram.dsh-mermaid-zoomable { cursor: zoom-in; }
      /* A diagram is not code: while one is on screen, the shell's code banner
         (its generic "代码块" label, collapse and copy buttons) is noise. It
         comes back with the source view, where copying matters. The attribute
         is toggled on the wrapper by applyView — the node stays React's. */
      [data-dsh-mermaid-banner] { display: none !important; }
      .dsh-mermaid-actions {
        display: flex;
        gap: 2px;
        margin-top: 4px;
      }
      .dsh-mermaid-actions[hidden] { display: none; }
      .dsh-mermaid-toggle,
      .dsh-mermaid-zoom-open {
        display: inline-flex;
        align-items: center;
        height: 22px;
        padding: 0 8px;
        font: inherit;
        font-size: 12px;
        line-height: 1;
        color: var(--dsw-alias-label-secondary);
        background: transparent;
        border: 1px solid transparent;
        border-radius: 6px;
        cursor: pointer;
      }
      .dsh-mermaid-toggle:hover,
      .dsh-mermaid-zoom-open:hover {
        color: var(--dsw-alias-label-primary);
        background: rgba(127, 127, 127, 0.14);
        border-color: var(--dsw-alias-border-l1);
      }
      /* The enlarged viewer. It is appended to <body>, so its own [hidden]
         rule cannot rely on the .dsh-mermaid scope below. */
      .dsh-mermaid-zoom {
        position: fixed;
        inset: 0;
        z-index: ${ZOOM_Z_INDEX};
        background: rgba(0, 0, 0, 0.62);
        overscroll-behavior: contain;
      }
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
      /* The paper under the diagram: mermaid draws on a transparent canvas, so
         without this the dimmed conversation shows through every gap between
         nodes. */
      .dsh-mermaid-zoom-pan svg {
        display: block;
        background: var(--dsw-alias-bg-layer-1, #fff);
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
      }
      .dsh-mermaid-zoom-bar {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        display: flex;
        align-items: center;
        gap: 2px;
        padding: 6px 10px;
        /* The token is the shell's own layer color. The fallback keeps the bar
           legible where the tokens are absent (the standalone demo). */
        background: var(--dsw-alias-bg-layer-1, rgba(127, 127, 127, 0.35));
        border-bottom: 1px solid var(--dsw-alias-border-l1);
      }
      .dsh-mermaid-zoom-level {
        min-width: 44px;
        font-size: 12px;
        text-align: center;
        color: var(--dsw-alias-label-secondary);
        font-variant-numeric: tabular-nums;
      }
      .dsh-mermaid-zoom-hint {
        flex: 1;
        margin-left: 6px;
        overflow: hidden;
        font-size: 12px;
        white-space: nowrap;
        text-overflow: ellipsis;
        color: var(--dsw-alias-label-secondary);
      }
      .dsh-mermaid-zoom-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 24px;
        height: 24px;
        padding: 0 8px;
        font: inherit;
        font-size: 13px;
        line-height: 1;
        color: var(--dsw-alias-label-secondary);
        background: transparent;
        border: 1px solid transparent;
        border-radius: 6px;
        cursor: pointer;
      }
      .dsh-mermaid-zoom-button:hover {
        color: var(--dsw-alias-label-primary);
        background: rgba(127, 127, 127, 0.14);
        border-color: var(--dsw-alias-border-l1);
      }
      .dsh-mermaid-zoom-close { margin-left: 6px; }
      @media (max-width: 640px) {
        .dsh-mermaid-zoom-hint { display: none; }
      }
      .dsh-mermaid-error {
        margin-top: 6px;
        font-size: 12px;
        line-height: 1.5;
        color: var(--dsw-alias-state-error-primary);
      }
      .dsh-mermaid [hidden] { display: none !important; }
      [${HIDDEN}] { display: none !important; }
      `
      ;(document.head ?? document.documentElement).append(style)
      return () => style.remove()
    }, `${PLUGIN_ID}: styles`)

    // ---- Mermaid --------------------------------------------------------
    /** A load failure, tagged so the note can use the load-failed copy. */
    const loadFailure = (message) => Object.assign(new Error(message), { dshMermaidLoad: true })

    const loadMermaid = () => {
      if (window.mermaid !== undefined) return Promise.resolve(window.mermaid)
      if (state.mermaid !== null) return state.mermaid
      state.mermaid = new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = MERMAID_CDN
        script.async = true
        script.onload = () => {
          state.scripts.delete(script)
          if (window.mermaid !== undefined) resolve(window.mermaid)
          else reject(loadFailure(`window.mermaid is missing after loading ${MERMAID_CDN}`))
        }
        script.onerror = () => {
          state.scripts.delete(script)
          script.remove()
          // Let a later fence retry instead of pinning the page to one failed
          // request.
          state.mermaid = null
          reject(loadFailure(MERMAID_CDN))
        }
        state.scripts.add(script)
        ;(document.head ?? document.documentElement).append(script)
      })
      return state.mermaid
    }

    const themeName = () => {
      const theme = ctx.get('theme')
      const scheme = theme?.getTheme?.()?.active?.colorScheme
      if (scheme === 'dark') return 'dark'
      if (scheme === 'light') return 'default'
      try {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default'
      } catch {
        return 'default'
      }
    }

    const configure = (mermaid) => mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: themeName(),
      fontFamily: 'inherit',
      // Keep a parse failure out of the page: this plugin renders its own note.
      suppressErrorRendering: true,
    })

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

    const enqueue = (task) => {
      const run = state.queue.then(task)
      state.queue = run.then(() => undefined, () => undefined)
      return run
    }

    /**
     * Show the diagram, the untouched original fence, or the failure note. A
     * failed block keeps its fence visible and drops its buttons: there is no
     * diagram to switch to or to enlarge.
     */
    const applyView = (record) => {
      // Re-resolve the body: React may have swapped the element out since the
      // record was created.
      const content = contentOf(record.block)
      record.content = content
      const failed = record.failed === true
      const readable = record.done === true && !failed && !record.showSource
      record.diagram.hidden = record.showSource || failed
      record.diagram.classList.toggle('dsh-mermaid-zoomable', readable)
      record.diagram.title = readable ? t('zoom') : ''
      record.note.hidden = !failed
      record.actions.hidden = failed
      record.toggle.hidden = failed
      record.zoomButton.hidden = !readable
      record.toggle.textContent = record.showSource ? t('showDiagram') : t('showSource')
      record.zoomButton.textContent = t('zoom')
      record.zoomButton.setAttribute('aria-label', t('zoom'))
      record.toggle.setAttribute('aria-pressed', String(record.showSource))
      if (content !== null) content.toggleAttribute(HIDDEN, !record.showSource && !failed)
      // A diagram needs no "代码块" label above it; the source view does need
      // the banner back for its copy button.
      const banner = bannerWrapOf(record.block)
      if (banner !== null) banner.toggleAttribute(BANNER_HIDDEN, readable)
    }

    /**
     * Create the holder for a block — or recreate it when React replaced the
     * block's children and dropped it. The holder is appended last so React's
     * own `bannerWrap` + `content` children keep their positions.
     */
    const ensureRecord = (block) => {
      const known = state.records.get(block)
      if (known !== undefined && known.holder.isConnected) return known
      if (known !== undefined) {
        known.holder.remove()
        state.records.delete(block)
      }
      const content = contentOf(block)
      const holder = document.createElement('div')
      holder.className = 'dsh-mermaid'
      holder.dataset.dshMermaidHolder = '1'
      const diagram = document.createElement('div')
      diagram.className = 'dsh-mermaid-diagram'
      diagram.hidden = true
      // The two buttons share a row so the source toggle and the enlargement
      // stay on one line however the shell styles a lone button.
      const actions = document.createElement('div')
      actions.className = 'dsh-mermaid-actions'
      const toggle = document.createElement('button')
      toggle.type = 'button'
      toggle.className = 'dsh-mermaid-toggle'
      // Labeled up front: the first render may still be waiting on the CDN, and
      // an empty button in the meantime is just a mystery.
      toggle.textContent = t('showSource')
      const zoomButton = document.createElement('button')
      zoomButton.type = 'button'
      zoomButton.className = 'dsh-mermaid-zoom-open'
      zoomButton.hidden = true
      // The note lives inside the holder, so writing it never looks like a
      // change to the fence itself — the observer ignores holder subtrees.
      const note = document.createElement('div')
      note.className = 'dsh-mermaid-error'
      note.dataset.dshMermaidError = '1'
      note.hidden = true
      const record = {
        block,
        content,
        holder,
        diagram,
        actions,
        toggle,
        zoomButton,
        note,
        code: null,
        showSource: false,
        /** the current text rendered successfully */
        done: false,
        /** the current text exhausted its retries and shows the note */
        failed: false,
        /** consecutive failures for the current text */
        failures: 0,
        /** a render for the current text is in flight */
        pending: false,
      }
      toggle.addEventListener('click', () => {
        record.showSource = !record.showSource
        applyView(record)
      })
      zoomButton.addEventListener('click', () => openViewer(record))
      diagram.addEventListener('click', () => {
        if (record.done === true && !record.showSource) openViewer(record)
      })
      actions.append(toggle, zoomButton)
      holder.append(diagram, actions, note)
      block.append(holder)
      state.records.set(block, record)
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

    /** The part of the stage the toolbar does not cover. */
    const viewportOf = (viewer) => {
      const rect = viewer.stage.getBoundingClientRect()
      const top = viewer.bar.offsetHeight
      return { width: Math.max(1, rect.width), height: Math.max(1, rect.height - top), top }
    }

    /** The scale that shows the whole diagram, never magnifying a small one. */
    const fitScaleOf = (viewer) => {
      const view = viewportOf(viewer)
      return Math.min(
        1,
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
      const level = document.createElement('span')
      level.className = 'dsh-mermaid-zoom-level'
      level.setAttribute('aria-live', 'polite')
      const hint = document.createElement('span')
      hint.className = 'dsh-mermaid-zoom-hint'
      const button = (action) => {
        const node = document.createElement('button')
        node.type = 'button'
        node.className = 'dsh-mermaid-zoom-button'
        node.dataset.dshMermaidZoomAction = action
        return node
      }
      const zoomOut = button('out')
      zoomOut.textContent = '−'
      const zoomIn = button('in')
      zoomIn.textContent = '+'
      const fit = button('fit')
      const closeButton = button('close')
      closeButton.className = 'dsh-mermaid-zoom-button dsh-mermaid-zoom-close'
      closeButton.textContent = '✕'
      bar.append(zoomOut, level, zoomIn, fit, hint, closeButton)
      el.append(stage, bar)
      const viewer = {
        el,
        stage,
        pan,
        bar,
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
        zoomOut.setAttribute('aria-label', t('zoomOut'))
        zoomIn.setAttribute('aria-label', t('zoomIn'))
        fit.textContent = t('zoomFit')
        hint.textContent = t('zoomHint')
        closeButton.setAttribute('aria-label', t('zoomClose'))
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
        if (event.clientY < bar.offsetHeight) return
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
      const svg = record.diagram.querySelector('svg')
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
      viewer.pan.style.width = `${size.width}px`
      viewer.pan.style.height = `${size.height}px`
      viewer.pan.replaceChildren(clone)
      viewer.width = size.width
      viewer.height = size.height
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

    /** One diagram, rendered with the current theme. */
    const paint = async (record) => {
      // A repaint or a re-render replaces the SVG; a viewer showing the old one
      // would be showing a picture that no longer exists.
      if (state.viewer !== null && state.viewer.record === record) closeViewer()
      const mermaid = await loadMermaid()
      if (state.disposed || !record.block.isConnected) return
      configure(mermaid)
      const id = `${PLUGIN_ID}-${(state.uid += 1)}`
      const result = await mermaid.render(id, record.code)
      if (state.disposed || !record.block.isConnected) return
      record.diagram.innerHTML = result.svg
      if (typeof result.bindFunctions === 'function') {
        try {
          result.bindFunctions(record.diagram)
        } catch {
          /* interaction binding is best effort */
        }
      }
      record.done = true
      record.failed = false
      record.failures = 0
      record.note.textContent = ''
      applyView(record)
      record.block.dataset.dshMermaid = 'done'
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
      block.dataset.dshMermaid = 'failed'
      record.note.textContent = t(key) + messageOf(error)
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
        if (record.failed) {
          record.failed = false
          record.note.textContent = ''
          record.note.hidden = true
          record.toggle.hidden = false
        }
      }
      record.code = code
      record.pending = true
      block.dataset.dshMermaid = 'pending'
      return enqueue(() => paint(record).then(
        () => { record.pending = false },
        (error) => { record.pending = false; onFailure(block, record, error) },
      ))
    }

    /** Wait for a fence to stop changing before rendering it (streaming). */
    const schedule = (block, delay = SETTLE_MS, force = false) => {
      if (state.disposed || !block.isConnected) return
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

    const repaint = () => {
      for (const record of state.records.values()) {
        if (!record.block.isConnected || record.code === null || record.failed) continue
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
        // Our own DOM must never look like "the fence changed": the note and
        // the buttons live inside the holder, the viewer is a sibling of the
        // whole conversation, and the attributes we toggle are ours alone.
        if (target.nodeType === 1 && target.closest('[data-dsh-mermaid-holder], [data-dsh-mermaid-zoom]') !== null) continue
        if (mutation.type === 'attributes') {
          const name = mutation.attributeName
          if (name === HIDDEN || (typeof name === 'string' && name.startsWith('data-dsh-mermaid'))) continue
        }
        // Streaming edits land as characterData on the fence's text node, and as
        // a replaced text node (a childList mutation whose added node is not an
        // element). Both mean "the fence changed" — find the owning block.
        if (target.nodeType === 1) {
          const owner = target.closest('.md-code-block')
          if (owner !== null) schedule(owner)
        }
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue
          if (typeof node.closest === 'function' && node.closest('[data-dsh-mermaid-holder], [data-dsh-mermaid-zoom]') !== null) continue
          if (node.dataset?.dshMermaidError !== undefined) continue
          if (typeof node.matches === 'function' && node.matches('.md-code-block')) schedule(node)
          else scan(node)
        }
      }
    })

    ctx.effect(() => {
      const target = document.body ?? document.documentElement
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
        for (const record of state.records.values()) {
          record.holder.remove()
          record.content?.removeAttribute(HIDDEN)
        }
        state.records.clear()
        for (const block of document.querySelectorAll('.md-code-block[data-dsh-mermaid]')) {
          delete block.dataset.dshMermaid
        }
        for (const note of document.querySelectorAll('[data-dsh-mermaid-error]')) note.remove()
        for (const el of document.querySelectorAll(`[${HIDDEN}]`)) el.removeAttribute(HIDDEN)
        for (const el of document.querySelectorAll(`[${BANNER_HIDDEN}]`)) el.removeAttribute(BANNER_HIDDEN)
      }
    }, `${PLUGIN_ID}: observer`)

    ctx.on('theme/change', repaint)
    ctx.on('locale/change', () => {
      for (const record of state.records.values()) applyView(record)
      state.viewer?.refreshLabels()
    })
  },
}

/* dsh:test-only:start */
// Exposed for `npm run check` only: the pure detection logic is the part that
// cannot be exercised in the browser here. scripts/build.mjs strips everything
// between these markers from every built artifact.
export const __test = { MERMAID_HEAD, MERMAID_CDN, opensDiagram }
/* dsh:test-only:end */
