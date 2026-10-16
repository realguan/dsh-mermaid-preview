window.__ModuleLoader__.load({
	id: "dsh-mermaid-preview",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
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
 * 5. A render failure is never final. Streaming cuts a fence mid-statement
 *    whenever the model pauses for longer than the settle window, and a
 *    half-written diagram is a parse error, not a user error: the block retries
 *    with backoff, and only a fence whose text has stopped changing and still
 *    fails earns the red note. New text on the same block clears the note and
 *    starts over — a block is never poisoned by one bad snapshot of itself.
 * 6. Theme switches repaint through `ctx.on('theme/change')`; UI copy comes from
 *    the Client locale service (`ctx.get('locale')`), so it follows the
 *    interface language.
 * 7. Every side effect — styles, observer, listeners, timers, script tag,
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

/**
 * Backoff after a failed render, in milliseconds. A fence that fails while it
 * is still being streamed usually fails because it is half-written, so the
 * plugin stays quiet and tries again; only a fence that keeps failing after
 * these retries — one whose text has stopped changing — earns the error note.
 */
const RETRY_MS = [400, 900, 1800]

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

const __plugin =  {
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
     * failed block keeps its fence visible and drops the toggle: there is no
     * diagram to switch to.
     */
    const applyView = (record) => {
      // Re-resolve the body: React may have swapped the element out since the
      // record was created.
      const content = contentOf(record.block)
      record.content = content
      const failed = record.failed === true
      record.diagram.hidden = record.showSource || failed
      record.note.hidden = !failed
      record.toggle.hidden = failed
      if (content !== null) content.toggleAttribute(HIDDEN, !record.showSource && !failed)
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
      diagram.hidden = true
      const toggle = document.createElement('button')
      toggle.type = 'button'
      toggle.className = 'dsh-mermaid-toggle'
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
        toggle,
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
      holder.append(diagram, toggle, note)
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
        renderBlock(block, force)
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
      for (const mutation of mutations) {
        const target = mutation.target
        if (target.nodeType === 1 && target.closest('[data-dsh-mermaid-holder]') !== null) continue
        // Our own bookkeeping must never look like "the fence changed": the
        // note lives inside the holder, and the two attributes we toggle on the
        // block and its body are ours alone.
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


		exports.name = __plugin.name;
		exports.apply = __plugin.apply;
		return module.exports;
	}
});
