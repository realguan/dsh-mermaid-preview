/**
 * dsh-mermaid-preview — standalone demo logic (zero dependencies, no build).
 *
 * The rendering pipeline is the same one the plugin uses: Mermaid 11 (the
 * engine vendored in `dist/client.mermaid.js`, served locally), `securityLevel:
 * 'strict'`, a diagram/source toggle, and a render failure that stays calm and
 * recoverable. The demo adds the product shell: presets, an appearance control
 * (follow system / light / dark), quiet render states, and a full-window
 * diagram viewer.
 *
 * Mermaid is configured in exactly one place — the marked block below — with
 * the same DSH-native theme the plugin uses, imported straight from
 * ../src/theme.js so the demo and the plugin can never drift apart.
 */

import { configForVariant, THEME_VARIANT, THEME_VARIANTS } from '../src/theme.js'

const MERMAID_VERSION = '11.17.2'
/** The vendored engine, served by the demo server from the package. */
const MERMAID_ENGINE = '/dist/client.mermaid.js'
const THEME_STORAGE_KEY = 'dsh-mermaid-demo-theme'
const DEBOUNCE_MS = 250

const PRESETS = {
  flowchart: `flowchart LR
    subgraph 人类侧
        Owner[责任人<br/>审核与问责]
    end

    subgraph 平台侧
        Launch[执行发起<br/>选择 Agent 类型 + 复制命令]
        Pass[Agent 通行证<br/>认证凭证]
        Track[状态与产出追踪]
    end

    subgraph Agent侧
        Agent[本地 Agent<br/>Claude Code / Codex]
        Run[认领并执行任务]
        Submit[提交任务产出]
    end

    Owner -->|选择 Agent 发起执行| Launch
    Agent -->|MCP 连接 + 通行证| Pass
    Launch --> Run
    Run --> Submit
    Submit --> Track
    Track -->|通知待审核| Owner
    Owner -->|通过 / 驳回| Track`,

  sequence: `sequenceDiagram
    participant O as 责任人
    participant P as 平台
    participant A as 本地 Agent
    O->>P: 选择 Agent 类型 + 复制命令
    P->>A: MCP 连接 + 通行证
    A->>P: 提交任务产出
    P-->>O: 通知待审核
    O-->>P: 通过 / 驳回`,

  class: `classDiagram
    class Task {
        +String id
        +String status
        +start()
        +submit()
    }
    class Agent {
        +String type
        +String pass
        +run(cmd)
    }
    class Owner {
        +review(task)
        +approve(task)
    }
    Task --> Agent : 认领执行
    Owner --> Task : 审核`,

  state: `stateDiagram-v2
    [*] --> 待执行
    待执行 --> 执行中 : 认领
    执行中 --> 已提交 : 提交产出
    已提交 --> 审核中 : 通知责任人
    审核中 --> 已通过 : 通过
    审核中 --> 已驳回 : 驳回
    已驳回 --> 执行中 : 重新执行
    已通过 --> [*]`,

  gantt: `gantt
    title 任务交接周期
    dateFormat YYYY-MM-DD
    section 执行
    认领任务       :a1, 2024-01-01, 1d
    执行开发       :a2, after a1, 3d
    section 审核
    提交产出       :b1, after a2, 1d
    责任审核       :b2, after b1, 2d`,

  pie: `pie title 任务类型占比
    "开发" : 40
    "测试" : 25
    "文档" : 20
    "运维" : 15`,

  er: `erDiagram
    OWNER ||--o{ TASK : 审核
    TASK }o--|| AGENT : 认领
    TASK {
        string id PK
        string status
        string output
    }
    AGENT {
        string type
        string pass
    }`,

  journey: `journey
    title 一次任务交接
    section 发起
      选择 Agent: 5: 责任人
      复制命令: 4: 责任人
    section 执行
      认领执行: 3: Agent
      提交产出: 4: Agent
    section 审核
      通知审核: 3: 平台
      通过驳回: 5: 责任人`,

  mindmap: `mindmap
  root((任务交接))
    人类侧
      审核与问责
    平台侧
      执行发起
      Agent 通行证
      状态追踪
    Agent侧
      认领执行
      提交产出`,

  git: `gitGraph
    commit id: "发起"
    branch agent
    checkout agent
    commit id: "执行"
    commit id: "提交产出"
    checkout main
    merge agent id: "审核通过"`,

  timeline: `timeline
    title 任务交接时间线
    2024-01-01 : 发起执行
    2024-01-02 : Agent 认领
    2024-01-05 : 提交产出
    2024-01-07 : 审核通过`,
}

/* ---- DOM ---------------------------------------------------------------- */

const $ = (id) => document.getElementById(id)

const sourceEl = $('source')
const sourceMetaEl = $('source-meta')
const modKeyEl = $('mod-key')
const copyBtn = $('copy-btn')
const copyLabelEl = $('copy-label')
const copyIconEl = copyBtn.querySelector('.icon-copy')
const checkIconEl = copyBtn.querySelector('.icon-check')
const presetListEl = $('preset-list')
const presetButtons = [...presetListEl.querySelectorAll('.preset')]
const themeButtons = [...document.querySelectorAll('[data-theme-set]')]
const variantSelectEl = $('variant-select')

/* ---- Theme style (design system) --------------------------------------- */

const VARIANT_STORAGE_KEY = 'dsh-mermaid-demo-variant'
const VARIANT_LABELS = {
  apple: 'Apple',
  github: 'GitHub Primer',
  radix: 'Radix',
  carbon: 'IBM Carbon',
  atlassian: 'Atlassian',
  material: 'Material 2',
  polaris: 'Polaris',
  quiet: 'dsh 中性',
}

const storedVariant = (() => {
  try {
    return localStorage.getItem(VARIANT_STORAGE_KEY)
  } catch {
    return null
  }
})()
let variantPreference = (storedVariant !== null && THEME_VARIANTS[storedVariant] !== undefined)
  ? storedVariant
  : (THEME_VARIANTS[THEME_VARIANT] !== undefined ? THEME_VARIANT : 'apple')

const populateVariantSelect = () => {
  variantSelectEl.replaceChildren(...Object.keys(THEME_VARIANTS).map((name) => {
    const option = document.createElement('option')
    option.value = name
    option.textContent = VARIANT_LABELS[name] ?? name
    return option
  }))
  variantSelectEl.value = variantPreference
}

const setVariant = (name) => {
  if (THEME_VARIANTS[name] === undefined || name === variantPreference) return
  variantPreference = name
  try {
    localStorage.setItem(VARIANT_STORAGE_KEY, name)
  } catch {
    /* private mode: the choice lasts for this page */
  }
  renderNow()
}

const stageEl = $('stage')
const outputEl = $('output')
const sourceViewEl = $('source-view')
const progressEl = $('progress')
const emptyEl = $('empty')
const skeletonEl = $('skeleton')
const noticeEl = $('notice')
const noticeTitleEl = $('notice-title')
const noticeMsgEl = $('notice-msg')
const noticeHintEl = $('notice-hint')
const noticeDetailEl = $('notice-detail')
const noticePreEl = $('notice-pre')
const retryBtn = $('retry-btn')

const statusEl = $('status')
const statusTextEl = $('status-text')
const diagramMetaEl = $('diagram-meta')
const viewSegEl = $('view-seg')
const viewDiagramBtn = $('view-diagram')
const viewSourceBtn = $('view-source')
const expandBtn = $('expand-btn')
const mermaidVersionEl = $('mermaid-version')

const viewerEl = $('viewer')
const viewerContentEl = $('viewer-content')
const viewerStageEl = $('viewer-stage')
const viewerLevelEl = $('viewer-level')
const viewerTypeEl = $('viewer-type')
const viewerOutBtn = $('viewer-out')
const viewerInBtn = $('viewer-in')
const viewerFitBtn = $('viewer-fit')
const viewerCloseBtn = $('viewer-close')

mermaidVersionEl.textContent = MERMAID_VERSION

/* ---- State -------------------------------------------------------------- */

let mermaidPromise = null
let renderUid = 0
let renderToken = 0
let debounceTimer = null
let copyTimer = null
let stageState = 'rendering'
let viewMode = 'diagram'
let hasDiagram = false
let currentType = ''

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

/* ---- Small helpers ------------------------------------------------------ */

const errorText = (error) => {
  if (error instanceof Error && error.message !== '') return error.message
  const text = String(error)
  return text === '' ? '未知错误' : text
}

const formatDuration = (ms) => (
  ms < 1000 ? `${Math.max(1, Math.round(ms))} ms` : `${(ms / 1000).toFixed(1)} s`
)

/** The first statement of the diagram, used as its mono type label. */
const diagramType = (code) => {
  let inFrontmatter = false
  for (const rawLine of code.split('\n')) {
    const line = rawLine.trim()
    if (inFrontmatter) {
      if (line === '---') inFrontmatter = false
      continue
    }
    if (line === '') continue
    if (line.startsWith('%%')) continue
    if (line === '---') {
      inFrontmatter = true
      continue
    }
    const word = line.split(/\s+/)[0]
    return word === 'graph' ? 'flowchart' : word
  }
  return ''
}

const naturalSizeOf = (svg) => {
  const box = (svg.getAttribute('viewBox') ?? '').trim().split(/[\s,]+/).map(Number)
  if (box.length === 4 && box.every((n) => Number.isFinite(n)) && box[2] > 0 && box[3] > 0) {
    return { width: box[2], height: box[3] }
  }
  const rect = svg.getBoundingClientRect()
  return { width: Math.max(1, Math.round(rect.width)), height: Math.max(1, Math.round(rect.height)) }
}

const diagramSize = (container) => {
  const svg = container.querySelector('svg')
  if (svg === null) return '—'
  const size = naturalSizeOf(svg)
  return `${Math.round(size.width)} × ${Math.round(size.height)}`
}

/* ---- Theme -------------------------------------------------------------- */
// The document drives appearance through data-theme="system|light|dark".
// CSS resolves the tokens; this module only mirrors the choice into Mermaid.

const themePreference = () => {
  const value = document.documentElement.dataset.theme
  return value === 'light' || value === 'dark' ? value : 'system'
}

const effectiveScheme = () => {
  const preference = themePreference()
  if (preference === 'dark') return 'dark'
  if (preference === 'light') return 'light'
  return darkQuery.matches ? 'dark' : 'light'
}

const syncThemeButtons = () => {
  const preference = themePreference()
  for (const button of themeButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.themeSet === preference))
  }
}

const setThemePreference = (preference) => {
  document.documentElement.dataset.theme = preference
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    /* storage unavailable: the choice still holds for this session */
  }
  syncThemeButtons()
  cancelScheduledRender()
  renderNow()
}

/* ---- Mermaid load + render ---------------------------------------------- */

const loadFailure = (detail) => Object.assign(new Error(detail), { dshMermaidLoad: true })

const loadMermaid = () => {
  if (window.mermaid !== undefined) return Promise.resolve(window.mermaid)
  if (mermaidPromise !== null) return mermaidPromise
  mermaidPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = MERMAID_ENGINE
    script.async = true
    script.onload = () => {
      if (window.mermaid !== undefined) {
        resolve(window.mermaid)
      } else {
        mermaidPromise = null
        reject(loadFailure(`脚本已加载，但 window.mermaid 缺失：${MERMAID_ENGINE}`))
      }
    }
    script.onerror = () => {
      script.remove()
      mermaidPromise = null
      reject(loadFailure(`无法加载本地 Mermaid 引擎：${MERMAID_ENGINE}`))
    }
    document.head.append(script)
  })
  return mermaidPromise
}

/* ═══════════════════════════════════════════════════════════════════════════
   MERMAID THEME — the single place where Mermaid is configured.

   `configFor(scheme)` is the plugin's own theme module (src/theme.js): Mermaid
   `base` re-derived from the DSH palette, literal host font stack, and the
   per-diagram-type tuning the plugin uses in chat. No Mermaid colors are
   hardcoded anywhere else in this file.
   ═══════════════════════════════════════════════════════════════════════════ */

const configureMermaid = (mermaid, scheme) => {
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    suppressErrorRendering: true,
    ...configForVariant(scheme, variantPreference),
  })
}

/* ═══════════════════════════════════════════════════════════════════════════ */

const removeMermaidTemp = (id) => {
  if (id === '') return
  document.getElementById(`d${id}`)?.remove()
}

/* ---- Status + stage state ----------------------------------------------- */

const setStatus = (kind, text) => {
  statusEl.dataset.kind = kind
  statusTextEl.textContent = text
}

const syncSourceMeta = (code) => {
  const trimmed = code.replace(/\s+$/, '')
  const lines = code === '' ? 0 : code.split('\n').length
  sourceMetaEl.textContent = `${lines} 行 · ${code.length} 字符`
  for (const button of presetButtons) {
    button.setAttribute('aria-pressed', String(PRESETS[button.dataset.preset] === trimmed))
  }
}

const syncViewButtons = () => {
  viewDiagramBtn.setAttribute('aria-pressed', String(viewMode === 'diagram'))
  viewSourceBtn.setAttribute('aria-pressed', String(viewMode === 'source'))
}

const syncExpand = () => {
  // The slot is always reserved (the button is only made invisible), so the
  // view switcher never jumps sideways between render states.
  expandBtn.hidden = false
  expandBtn.classList.toggle(
    'is-unavailable',
    viewMode !== 'diagram' || stageState !== 'ready' || !hasDiagram,
  )
}

const syncStageVisibility = () => {
  const sourceMode = viewMode === 'source'
  stageEl.dataset.state = stageState
  stageEl.dataset.view = viewMode
  sourceViewEl.hidden = !sourceMode
  outputEl.hidden = sourceMode || stageState !== 'ready'
  emptyEl.hidden = sourceMode || stageState !== 'empty'
  noticeEl.hidden = sourceMode || stageState !== 'error'
  skeletonEl.hidden = sourceMode || stageState !== 'rendering' || hasDiagram
  progressEl.hidden = sourceMode || stageState !== 'rendering' || !hasDiagram
  outputEl.title = stageState === 'ready' && hasDiagram ? '点击放大图表' : ''
}

const setStageState = (state) => {
  stageState = state
  if (state === 'empty' && viewMode === 'source') {
    viewMode = 'diagram'
    syncViewButtons()
  }
  syncStageVisibility()
  syncExpand()
}

const setView = (mode) => {
  viewMode = mode
  syncViewButtons()
  syncStageVisibility()
  syncExpand()
}

/* ---- Render pipeline ---------------------------------------------------- */

const cancelScheduledRender = () => {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
}

const scheduleRender = () => {
  cancelScheduledRender()
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    renderNow()
  }, DEBOUNCE_MS)
}

const showError = (error) => {
  const message = errorText(error)
  const isLoadError = error?.dshMermaidLoad === true
  const summary = message.split('\n').map((line) => line.trim()).find((line) => line !== '') ?? message
  noticeTitleEl.textContent = isLoadError ? 'Mermaid 加载失败' : '无法渲染此图表'
  noticeMsgEl.textContent = summary
  noticeHintEl.textContent = isLoadError
    ? '检查网络连接后重试；也可以继续编辑源码。'
    : '修改上方源码后会自动重新渲染。'
  noticePreEl.textContent = message
  noticeDetailEl.open = false
  retryBtn.hidden = !isLoadError
}

const renderNow = async () => {
  const raw = sourceEl.value
  const code = raw.replace(/\s+$/, '')
  const nonEmpty = code.trim() !== ''
  const token = ++renderToken

  if (!viewerEl.hidden) closeViewer()

  syncSourceMeta(raw)
  sourceViewEl.textContent = code
  viewSegEl.hidden = !nonEmpty

  if (!nonEmpty) {
    hasDiagram = false
    currentType = ''
    outputEl.replaceChildren()
    setStageState('empty')
    setStatus('idle', '等待输入')
    diagramMetaEl.textContent = '—'
    return
  }

  currentType = diagramType(code)
  setStageState('rendering')
  const loading = window.mermaid === undefined
  setStatus(loading ? 'loading' : 'rendering', loading ? '加载 Mermaid…' : '渲染中')

  let renderId = ''
  try {
    const mermaid = await loadMermaid()
    if (token !== renderToken) return
    setStatus('rendering', '渲染中')
    configureMermaid(mermaid, effectiveScheme())
    renderId = `dsh-demo-${(renderUid += 1)}`
    const startedAt = performance.now()
    const result = await mermaid.render(renderId, code)
    if (token !== renderToken) return
    outputEl.innerHTML = result.svg
    if (typeof result.bindFunctions === 'function') {
      try {
        result.bindFunctions(outputEl)
      } catch {
        /* interaction binding is best effort */
      }
    }
    const elapsed = performance.now() - startedAt
    hasDiagram = true
    setStageState('ready')
    setStatus('ready', `${currentType || 'mermaid'} · ${formatDuration(elapsed)}`)
    diagramMetaEl.textContent = diagramSize(outputEl)
    syncExpand()
  } catch (error) {
    if (token !== renderToken) return
    removeMermaidTemp(renderId)
    hasDiagram = false
    outputEl.replaceChildren()
    showError(error)
    setStageState('error')
    setStatus('error', '渲染失败')
    diagramMetaEl.textContent = '—'
    syncExpand()
  }
}

/* ---- Copy source -------------------------------------------------------- */

const resetCopyState = () => {
  if (copyTimer !== null) {
    clearTimeout(copyTimer)
    copyTimer = null
  }
  copyBtn.dataset.state = 'idle'
  copyLabelEl.textContent = '复制'
  copyIconEl.hidden = false
  checkIconEl.hidden = true
}

const showCopyState = (state, label) => {
  if (copyTimer !== null) clearTimeout(copyTimer)
  copyBtn.dataset.state = state
  copyLabelEl.textContent = label
  copyIconEl.hidden = state === 'copied'
  checkIconEl.hidden = state !== 'copied'
  copyTimer = setTimeout(resetCopyState, 1500)
}

const copySource = async () => {
  let copied = false
  try {
    await navigator.clipboard.writeText(sourceEl.value)
    copied = true
  } catch {
    /* clipboard permission refused — fall back to the selection API */
  }
  if (!copied) {
    try {
      sourceEl.focus()
      sourceEl.select()
      copied = document.execCommand('copy')
      if (copied) {
        const end = sourceEl.value.length
        sourceEl.setSelectionRange(end, end)
      }
    } catch {
      copied = false
    }
  }
  if (copied) showCopyState('copied', '已复制')
  else showCopyState('failed', '复制失败')
}

/* ---- Diagram viewer ----------------------------------------------------- */

const VIEWER_PAD = 32
const VIEWER_PAD_SMALL = 16
const ZOOM_MIN = 0.1
const ZOOM_MAX = 8
const ZOOM_STEP = 1.25

const viewer = {
  open: false,
  scale: 1,
  atFit: true,
  natural: { width: 1, height: 1 },
  focus: null,
}

const clampScale = (scale) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, scale))

const applyViewerScale = (scale) => {
  const next = clampScale(scale)
  const ratio = next / viewer.scale
  const centerX = viewerStageEl.scrollLeft + viewerStageEl.clientWidth / 2
  const centerY = viewerStageEl.scrollTop + viewerStageEl.clientHeight / 2
  viewerContentEl.style.width = `${Math.round(viewer.natural.width * next)}px`
  viewer.scale = next
  viewer.atFit = false
  viewerStageEl.scrollLeft = centerX * ratio - viewerStageEl.clientWidth / 2
  viewerStageEl.scrollTop = centerY * ratio - viewerStageEl.clientHeight / 2
  viewerLevelEl.textContent = `${Math.round(next * 100)}%`
}

const fitViewer = () => {
  const pad = window.innerWidth <= 640 ? VIEWER_PAD_SMALL : VIEWER_PAD
  const availableWidth = Math.max(1, viewerStageEl.clientWidth - pad * 2)
  const availableHeight = Math.max(1, viewerStageEl.clientHeight - pad * 2)
  const fit = Math.min(
    1,
    availableWidth / viewer.natural.width,
    availableHeight / viewer.natural.height,
  )
  viewerContentEl.style.width = `${Math.max(1, Math.round(viewer.natural.width * fit))}px`
  viewer.scale = fit
  viewer.atFit = true
  viewerStageEl.scrollLeft = 0
  viewerStageEl.scrollTop = 0
  viewerLevelEl.textContent = `${Math.round(fit * 100)}%`
}

const openViewer = () => {
  if (!hasDiagram || stageState !== 'ready' || viewMode !== 'diagram') return
  const svg = outputEl.querySelector('svg')
  if (svg === null) return
  const size = naturalSizeOf(svg)
  viewer.natural = size
  const clone = svg.cloneNode(true)
  clone.removeAttribute('style')
  clone.setAttribute('width', String(Math.round(size.width)))
  clone.setAttribute('height', String(Math.round(size.height)))
  viewerContentEl.replaceChildren(clone)
  viewerContentEl.style.width = `${Math.round(size.width)}px`
  viewerTypeEl.textContent = currentType
  viewer.scale = 1
  viewerEl.hidden = false
  viewer.open = true
  document.body.classList.add('viewer-open')
  viewer.focus = document.activeElement
  fitViewer()
  viewerCloseBtn.focus({ preventScroll: true })
}

const closeViewer = () => {
  if (!viewer.open) return
  viewer.open = false
  viewerEl.hidden = true
  viewerContentEl.replaceChildren()
  viewerContentEl.style.width = ''
  viewerStageEl.scrollLeft = 0
  viewerStageEl.scrollTop = 0
  document.body.classList.remove('viewer-open')
  const focus = viewer.focus
  viewer.focus = null
  if (focus !== null && focus.isConnected && typeof focus.focus === 'function') {
    focus.focus({ preventScroll: true })
  }
}

/* ---- Events ------------------------------------------------------------- */

sourceEl.addEventListener('input', () => {
  syncSourceMeta(sourceEl.value)
  resetCopyState()
  scheduleRender()
})

presetListEl.addEventListener('click', (event) => {
  const button = event.target instanceof Element ? event.target.closest('.preset') : null
  if (button === null) return
  const code = PRESETS[button.dataset.preset]
  if (code === undefined) return
  sourceEl.value = code
  sourceEl.scrollTop = 0
  syncSourceMeta(code)
  cancelScheduledRender()
  resetCopyState()
  renderNow()
})

for (const button of themeButtons) {
  button.addEventListener('click', () => setThemePreference(button.dataset.themeSet))
}

variantSelectEl.addEventListener('change', () => setVariant(variantSelectEl.value))

const onSystemSchemeChange = () => {
  if (themePreference() !== 'system') return
  cancelScheduledRender()
  renderNow()
}
if (typeof darkQuery.addEventListener === 'function') {
  darkQuery.addEventListener('change', onSystemSchemeChange)
} else if (typeof darkQuery.addListener === 'function') {
  darkQuery.addListener(onSystemSchemeChange)
}

copyBtn.addEventListener('click', copySource)

viewDiagramBtn.addEventListener('click', () => setView('diagram'))
viewSourceBtn.addEventListener('click', () => setView('source'))
expandBtn.addEventListener('click', openViewer)

outputEl.addEventListener('click', () => {
  if (stageState === 'ready' && viewMode === 'diagram') openViewer()
})

retryBtn.addEventListener('click', () => {
  cancelScheduledRender()
  renderNow()
})

viewerEl.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target.closest('[data-viewer-close]') : null
  if (target !== null) closeViewer()
})

viewerStageEl.addEventListener('wheel', (event) => {
  if (!viewer.open) return
  event.preventDefault()
  const factor = Math.exp(-event.deltaY * (event.deltaMode === 1 ? 0.05 : 0.0015))
  applyViewerScale(viewer.scale * factor)
}, { passive: false })

viewerOutBtn.addEventListener('click', () => applyViewerScale(viewer.scale / ZOOM_STEP))
viewerInBtn.addEventListener('click', () => applyViewerScale(viewer.scale * ZOOM_STEP))
viewerFitBtn.addEventListener('click', fitViewer)
viewerCloseBtn.addEventListener('click', closeViewer)

window.addEventListener('resize', () => {
  if (viewer.open && viewer.atFit) fitViewer()
})

// Global keys: ⌘/Ctrl+Enter renders immediately, even mid-debounce.
document.addEventListener('keydown', (event) => {
  if (viewer.open) return
  if (event.defaultPrevented || event.altKey) return
  const isEnter = event.key === 'Enter' || event.key === 'NumpadEnter'
  if (isEnter && (event.metaKey || event.ctrlKey)) {
    event.preventDefault()
    cancelScheduledRender()
    renderNow()
  }
})

// Viewer keys: Esc closes, +/- zoom, 0 fits, Tab stays inside the dialog.
document.addEventListener('keydown', (event) => {
  if (!viewer.open || event.defaultPrevented) return
  if (event.metaKey || event.ctrlKey || event.altKey) return
  if (event.key === 'Escape') {
    event.preventDefault()
    closeViewer()
    return
  }
  if (event.key === '+' || event.key === '=') {
    event.preventDefault()
    applyViewerScale(viewer.scale * ZOOM_STEP)
    return
  }
  if (event.key === '-' || event.key === '_') {
    event.preventDefault()
    applyViewerScale(viewer.scale / ZOOM_STEP)
    return
  }
  if (event.key === '0') {
    event.preventDefault()
    fitViewer()
    return
  }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    // Pan the stage: once a diagram is zoomed past the window, the arrow keys
    // are the keyboard way to reach the rest of it.
    event.preventDefault()
    const step = 80
    if (event.key === 'ArrowLeft') viewerStageEl.scrollLeft -= step
    else if (event.key === 'ArrowRight') viewerStageEl.scrollLeft += step
    else if (event.key === 'ArrowUp') viewerStageEl.scrollTop -= step
    else viewerStageEl.scrollTop += step
    return
  }
  if (event.key !== 'Tab') return
  const focusables = [...viewerEl.querySelectorAll('button')].filter(
    (node) => !node.hidden && !node.disabled && node.offsetParent !== null,
  )
  if (focusables.length === 0) return
  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  }
})

/* ---- Boot --------------------------------------------------------------- */

const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)
modKeyEl.textContent = isMac ? '⌘' : 'Ctrl'

syncThemeButtons()
syncViewButtons()
populateVariantSelect()
sourceEl.value = PRESETS.flowchart
sourceEl.scrollTop = 0
syncSourceMeta(sourceEl.value)
renderNow()
