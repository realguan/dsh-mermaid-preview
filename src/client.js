/**
 * dsh-mermaid-preview — dynamic Cordis client plugin
 *
 * Renders Mermaid fenced code blocks as diagrams in every Markdown surface of
 * DeepSeek Harness (dsh) web: chat messages, the trajectory view, plan review,
 * compaction summaries — anywhere the built-in `MarkdownText` renderer draws a
 * fence with the info string `mermaid`.
 *
 * How it works (see docs/architecture.md for the full story):
 *
 *   1. The dsh Markdown renderer emits a stable DOM shape for fences whose
 *      language is unknown to its shiki grammar allowlist: a
 *      `.md-code-block` wrapper with a banner showing the language label and a
 *      copy button, followed by a plain `<pre><code>` body.
 *   2. A `MutationObserver` on `document.body` (childList + subtree +
 *      characterData) watches for such blocks — including the
 *      streaming→settled transition, when the language label finally lands.
 *   3. Mermaid 11 (UMD) is loaded once from jsDelivr via a `<script>` tag.
 *      The browser half of a dynamic package may touch DOM globals; only
 *      timers / fetch / require are shadowed by the runner.
 *   4. The `<pre>` body is replaced by the rendered SVG inside a `.dsh-mermaid`
 *      holder. The original banner (language label + copy button) survives, so
 *      copying the Mermaid source keeps working.
 *   5. The dsh theme is followed (`theme.getTheme().active.colorScheme`) and
 *      visible diagrams re-render when the `theme/change` event fires.
 *   6. Every side effect (styles, observer, theme listener) is fiber-owned:
 *      stopping or updating the plugin removes all of it.
 *
 * This module is the canonical source. `scripts/build-dynamic.mjs` derives the
 * paste-ready dynamic payload (`dist/dsh-mermaid-preview.client.js`) from it —
 * the exact text you hand to `cordis_define` as `code.client`.
 *
 * MIT License — see LICENSE.
 */

export default {
  apply(ctx) {
    // ---- package styles: diagram holder, source toggle, error note ----
    // Colors come from dsh theme tokens so the diagram fits light and dark.
    ctx.effect(() => styles.insert(`
      .dsh-mermaid { margin: 8px 0; }
      .dsh-mermaid-diagram {
        overflow-x: auto;
        display: flex;
        justify-content: center;
        padding: 8px 0;
      }
      .dsh-mermaid-diagram[hidden] { display: none; }
      .dsh-mermaid-diagram svg { max-width: 100%; height: auto; }
      .dsh-mermaid-source {
        margin: 0;
        padding: 8px 10px;
        overflow-x: auto;
        font-size: 12px;
        line-height: 1.5;
        color: var(--dsw-alias-label-secondary);
        background: var(--dsw-alias-bg-layer-1);
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 6px;
      }
      .dsh-mermaid-toggle {
        margin-top: 6px;
        font-size: 12px;
        padding: 2px 10px;
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
        font-size: 12px;
        color: var(--dsw-alias-state-error-primary);
        margin-top: 6px;
      }
    `))

    // Pin a concrete mermaid release for reproducible output. Bump deliberately.
    const CDN = 'https://cdn.jsdelivr.net/npm/mermaid@11.16.1/dist/mermaid.min.js'
    let mermaidPromise = null
    let uid = 0

    // Load the mermaid UMD bundle through a <script> tag. The dynamic client
    // closure shadows fetch/setTimeout/require but leaves DOM globals intact.
    const loadMermaid = () => {
      if (typeof window !== 'undefined' && window.mermaid) return Promise.resolve(window.mermaid)
      if (mermaidPromise !== null) return mermaidPromise
      mermaidPromise = new Promise((resolve, reject) => {
        const tag = document.createElement('script')
        tag.src = CDN
        tag.onload = () => {
          if (window.mermaid) resolve(window.mermaid)
          else reject(new Error('mermaid loaded but window.mermaid is missing'))
        }
        tag.onerror = () => {
          mermaidPromise = null
          reject(new Error('mermaid CDN script failed to load'))
        }
        document.head.append(tag)
      })
      return mermaidPromise
    }

    // Follow the dsh theme: dark palette → mermaid dark theme.
    const schemeOf = () => {
      try {
        const theme = ctx.get('theme')
        if (theme === undefined) return null
        const snapshot = theme.getTheme()
        const scheme = snapshot && snapshot.active ? snapshot.active.colorScheme : null
        return scheme === 'dark' || scheme === 'light' ? scheme : null
      } catch {
        return null
      }
    }
    const themeName = () => (schemeOf() === 'dark' ? 'dark' : 'default')

    // Read the language label from the CodeBlock banner. DOM shape:
    //   .md-code-block > div(bannerWrap) > div(banner) > div(infostring) + div(action > button)
    const blockLang = (block) => {
      for (const child of block.children) {
        if (child.tagName !== 'DIV' || child.querySelector('button') === null) continue
        const banner = Array.from(child.children).find(el => el.tagName === 'DIV')
        if (banner === undefined || banner.children.length === 0) return null
        return (banner.children[0].textContent || '').trim().toLowerCase()
      }
      return null
    }

    const configure = (mermaid) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: themeName(),
        securityLevel: 'strict',
        fontFamily: 'inherit',
      })
    }

    // Mermaid render ids must be unique per document; never reuse one.
    const nextId = () => `dsh-mermaid-${Date.now().toString(36)}-${++uid}`

    const paint = (mermaid, diagram, code) => {
      configure(mermaid)
      return mermaid.render(nextId(), code).then(result => {
        if (!diagram.isConnected) return
        diagram.innerHTML = result.svg
        if (typeof result.bindFunctions === 'function') {
          try { result.bindFunctions(diagram) } catch { /* interaction binding is best-effort */ }
        }
      })
    }

    const maybeRender = (block) => {
      if (block.dataset.dshMermaid !== undefined || block.dataset.dshBusy !== undefined) return
      if (blockLang(block) !== 'mermaid') return
      const pre = block.querySelector('pre')
      if (pre === null) return
      const code = (pre.textContent || '').trim()
      if (code === '') return
      block.dataset.dshBusy = '1'
      loadMermaid().then(mermaid => {
        if (!block.isConnected) return
        block.dataset.dshBusy = ''
        block.dataset.dshMermaid = 'done'
        const holder = document.createElement('div')
        holder.className = 'dsh-mermaid'
        holder.dataset.dshMermaid = '1'
        const diagram = document.createElement('div')
        diagram.className = 'dsh-mermaid-diagram'
        diagram.textContent = '渲染中…'
        const source = document.createElement('pre')
        source.className = 'dsh-mermaid-source'
        source.hidden = true
        source.textContent = code
        const toggle = document.createElement('button')
        toggle.type = 'button'
        toggle.className = 'dsh-mermaid-toggle'
        toggle.textContent = '显示源码'
        toggle.onclick = () => {
          const showSource = !diagram.hidden
          diagram.hidden = showSource
          source.hidden = !showSource
          toggle.textContent = showSource ? '显示图表' : '显示源码'
        }
        holder.append(diagram, source, toggle)
        pre.replaceWith(holder)
        paint(mermaid, diagram, code).catch(err => {
          if (!diagram.isConnected) return
          diagram.textContent = ''
          const note = document.createElement('div')
          note.className = 'dsh-mermaid-error'
          note.textContent = 'Mermaid 渲染失败：' + (err && err.message ? err.message : String(err))
          diagram.append(note)
        })
      }).catch(err => {
        // CDN load failure: keep the original code block, show one note, no retry.
        if (!block.isConnected) return
        block.dataset.dshBusy = ''
        block.dataset.dshMermaid = 'failed'
        const pre2 = block.querySelector('pre')
        if (pre2 === null) return
        const note = document.createElement('div')
        note.className = 'dsh-mermaid-error'
        note.textContent = 'Mermaid 加载失败：' + (err && err.message ? err.message : String(err))
        pre2.before(note)
      })
    }

    // Re-render visible diagrams when the app theme switches.
    const reflowTheme = () => {
      const holders = document.querySelectorAll('[data-dsh-mermaid="1"]')
      for (const holder of holders) {
        const diagram = holder.querySelector('.dsh-mermaid-diagram')
        const source = holder.querySelector('.dsh-mermaid-source')
        if (diagram === null || source === null || diagram.hidden) continue
        loadMermaid().then(mermaid => {
          paint(mermaid, diagram, source.textContent || '').catch(() => { /* keep the old diagram on re-theme failure */ })
        }).catch(() => {})
      }
    }

    const scan = (root) => {
      if (root === null || root.querySelectorAll === undefined) return
      const blocks = root.querySelectorAll('.md-code-block')
      for (const block of blocks) maybeRender(block)
    }

    // Watch for newly added blocks and for text changes inside existing ones
    // (the streaming→settled transition lands the language label in place).
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          const parent = mutation.target.parentElement
          if (parent === null || parent.closest === undefined) continue
          const block = parent.closest('.md-code-block')
          if (block !== null) maybeRender(block)
          continue
        }
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue
          if (node.closest !== undefined && node.closest('[data-dsh-mermaid]') !== null) continue
          if (node.matches !== undefined && node.matches('.md-code-block')) maybeRender(node)
          else scan(node)
        }
      }
    })

    ctx.effect(() => {
      observer.observe(document.body, { childList: true, subtree: true, characterData: true })
      scan(document.body)
      return () => observer.disconnect()
    })
    ctx.on('theme/change', reflowTheme)
  },
}
