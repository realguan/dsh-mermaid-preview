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
 * 5. Theme switches repaint through `ctx.on('theme/change')`; UI copy comes from
 *    the Client locale service (`ctx.get('locale')`), so it follows the
 *    interface language.
 * 6. Every side effect — styles, observer, listeners, timers, script tag,
 *    injected DOM — is owned by the plugin fiber and removed on stop/update.
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

/** Attribute marking the body we hide while the diagram is shown. */
const HIDDEN = 'data-dsh-mermaid-hidden'

/** Copy for the built-in locales; `en` is the fallback. */
const DICT = {
  en: {
    showSource: 'Show source',
    showDiagram: 'Show diagram',
    loadFailed: 'Mermaid failed to load: ',
    renderFailed: 'Mermaid render failed: ',
  },
  zh: {
    showSource: '显示源码',
    showDiagram: '显示图表',
    loadFailed: 'Mermaid 加载失败：',
    renderFailed: 'Mermaid 渲染失败：',
  },
}

/** Mermaid statements that may open a diagram. Case matters. */
const MERMAID_HEAD = /^(?:graph|flowchart|sequenceDiagram|classDiagram(?:-v2)?|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|quadrantChart|requirementDiagram|gitGraph|mindmap|timeline|sankey-beta|xychart-beta|block-beta|packet-beta|architecture-beta|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment|zenuml|info)\b/

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
    }

    // ---- interface copy -------------------------------------------------
    // The locale service is optional: without it the built-in English copy is
    // used, and a namespace collision (a double mount) must not fail the plugin.
    const locale = ctx.get('locale')
    let t = (key) => DICT.en[key] ?? key
    if (locale !== undefined && typeof locale.register === 'function' && typeof locale.bind === 'function') {
      let registered = false
      ctx.effect(() => {
        try {
          const dispose = locale.register(NS, DICT)
          registered = true
          return dispose
        } catch {
          return () => {}
        }
      }, `${PLUGIN_ID}: locale`)
      if (registered) t = locale.bind(NS)
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
        background: var(--dsw-alias-bg-layer-1);
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 8px;
      }
      .dsh-mermaid-diagram[hidden] { display: none; }
      .dsh-mermaid-diagram svg { max-width: 100%; height: auto; }
      .dsh-mermaid-toggle {
        margin-top: 6px;
        padding: 2px 10px;
        font: inherit;
        font-size: 12px;
        color: var(--dsw-alias-label-secondary);
        background: transparent;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 6px;
        cursor: pointer;
      }
      .dsh-mermaid-toggle:hover {
        color: var(--dsw-alias-label-primary);
        border-color: var(--dsw-alias-border-l2);
      }
      .dsh-mermaid-error {
        margin-top: 6px;
        font-size: 12px;
        line-height: 1.5;
        color: var(--dsw-alias-state-error-primary);
      }
      [${HIDDEN}] { display: none !important; }
      `
      ;(document.head ?? document.documentElement).append(style)
      return () => style.remove()
    }, `${PLUGIN_ID}: styles`)

    // ---- Mermaid --------------------------------------------------------
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
          else reject(new Error(`window.mermaid is missing after loading ${MERMAID_CDN}`))
        }
        script.onerror = () => {
          state.scripts.delete(script)
          script.remove()
          // Let a later fence retry instead of pinning the page to one failed
          // request.
          state.mermaid = null
          reject(new Error(MERMAID_CDN))
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

    /** Show either the diagram or the untouched original fence. */
    const applyView = (record) => {
      // Re-resolve the body: React may have swapped the element out since the
      // record was created.
      const content = contentOf(record.block)
      record.content = content
      record.diagram.hidden = record.showSource
      if (content !== null) content.toggleAttribute(HIDDEN, !record.showSource)
      record.toggle.textContent = record.showSource ? t('showDiagram') : t('showSource')
      record.toggle.setAttribute('aria-pressed', String(record.showSource))
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
      const toggle = document.createElement('button')
      toggle.type = 'button'
      toggle.className = 'dsh-mermaid-toggle'
      const record = {
        block,
        content,
        holder,
        diagram,
        toggle,
        code: null,
        showSource: false,
      }
      toggle.addEventListener('click', () => {
        record.showSource = !record.showSource
        applyView(record)
      })
      holder.append(diagram, toggle)
      block.append(holder)
      state.records.set(block, record)
      return record
    }

    /** One diagram, rendered with the current theme. */
    const paint = async (record) => {
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
      applyView(record)
      record.block.dataset.dshMermaid = 'done'
    }

    /** Surface a failure without destroying the fence it came from. */
    const fail = (block, record, error, key) => {
      if (state.disposed || !block.isConnected) return
      if (record !== undefined) {
        record.holder.remove()
        state.records.delete(block)
      }
      contentOf(block)?.removeAttribute(HIDDEN)
      block.dataset.dshMermaid = 'failed'
      const note = document.createElement('div')
      note.className = 'dsh-mermaid-error'
      note.dataset.dshMermaidError = '1'
      note.textContent = t(key) + messageOf(error)
      block.append(note)
    }

    const renderBlock = (block) => {
      if (state.disposed || !block.isConnected) return
      if (block.dataset.dshMermaid === 'failed') return
      const code = sourceOf(block)
      if (code === null || !isMermaidFence(block, code)) return
      const record = ensureRecord(block)
      if (record.code === code && block.dataset.dshMermaid === 'done') return
      record.code = code
      block.dataset.dshMermaid = 'pending'
      return enqueue(() => paint(record).catch((error) => fail(block, record, error, 'renderFailed')))
    }

    /** Wait for a fence to stop changing before rendering it (streaming). */
    const schedule = (block) => {
      if (state.disposed || !block.isConnected) return
      const pending = state.timers.get(block)
      if (pending !== undefined) window.clearTimeout(pending)
      state.timers.set(block, window.setTimeout(() => {
        state.timers.delete(block)
        renderBlock(block)
      }, SETTLE_MS))
    }

    const scan = (root) => {
      if (root === null || typeof root.querySelectorAll !== 'function') return
      for (const block of root.querySelectorAll('.md-code-block')) schedule(block)
    }

    const repaint = () => {
      for (const record of state.records.values()) {
        if (!record.block.isConnected || record.code === null) continue
        enqueue(() => paint(record).catch((error) => fail(record.block, record, error, 'loadFailed')))
      }
    }

    // ---- lifecycle ------------------------------------------------------
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const target = mutation.target
        if (target.nodeType === 1 && target.closest('[data-dsh-mermaid-holder]') !== null) continue
        // Streaming edits land as characterData on the fence's text node, and as
        // a replaced text node (a childList mutation whose added node is not an
        // element). Both mean "the fence changed" — find the owning block.
        if (target.nodeType === 1) {
          const owner = target.closest('.md-code-block')
          if (owner !== null) schedule(owner)
        }
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue
          if (typeof node.closest === 'function' && node.closest('[data-dsh-mermaid-holder]') !== null) continue
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
      }
    }, `${PLUGIN_ID}: observer`)

    ctx.on('theme/change', repaint)
    ctx.on('locale/change', () => {
      for (const record of state.records.values()) applyView(record)
    })
  },
}

/* dsh:test-only:start */
// Exposed for `npm run check` only: the pure detection logic is the part that
// cannot be exercised in the browser here. scripts/build.mjs strips everything
// between these markers from every built artifact.
export const __test = { MERMAID_HEAD, MERMAID_CDN, opensDiagram }
/* dsh:test-only:end */
