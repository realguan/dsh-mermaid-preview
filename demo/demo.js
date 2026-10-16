/**
 * dsh-mermaid-preview standalone demo logic.
 *
 * Same rendering pipeline as the dsh plugin: mermaid 11 UMD loaded from
 * jsDelivr, `securityLevel: 'strict'`, diagram/source toggle, error surface.
 * The only differences are the page plumbing (no MutationObserver needed —
 * the user edits the source directly) and the theme select.
 */

const CDN = 'https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.min.js'

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

const $ = (id) => document.getElementById(id)
const sourceEl = $('source')
const outputEl = $('output')
const sourceViewEl = $('sourceView')
const toggleBtn = $('toggle')
const statusEl = $('status')
const presetEl = $('preset')
const themeEl = $('theme')
const copyBtn = $('copy')

let mermaidPromise = null
let uid = 0
let renderToken = 0

function loadMermaid() {
  if (window.mermaid) return Promise.resolve(window.mermaid)
  if (mermaidPromise) return mermaidPromise
  mermaidPromise = new Promise((resolve, reject) => {
    const tag = document.createElement('script')
    tag.src = CDN
    tag.onload = () => (window.mermaid ? resolve(window.mermaid) : reject(new Error('mermaid 已加载但未暴露 window.mermaid')))
    tag.onerror = () => reject(new Error('mermaid CDN 加载失败'))
    document.head.append(tag)
  })
  return mermaidPromise
}

function setStatus(text, kind = '') {
  statusEl.textContent = text
  statusEl.className = `status ${kind}`
}

function showDiagram() {
  outputEl.hidden = false
  sourceViewEl.hidden = true
  toggleBtn.textContent = '显示源码'
}

function showSource() {
  outputEl.hidden = true
  sourceViewEl.hidden = false
  toggleBtn.textContent = '显示图表'
}

async function render() {
  const code = sourceEl.value.trim()
  const token = ++renderToken
  if (code === '') {
    outputEl.innerHTML = '<p class="placeholder">等待渲染…</p>'
    outputEl.hidden = false
    sourceViewEl.hidden = true
    toggleBtn.hidden = true
    setStatus('')
    return
  }
  sourceViewEl.textContent = sourceEl.value
  toggleBtn.hidden = false
  setStatus('渲染中…')
  try {
    const mermaid = await loadMermaid()
    if (token !== renderToken) return
    mermaid.initialize({
      startOnLoad: false,
      theme: themeEl.value,
      securityLevel: 'strict',
      fontFamily: 'inherit',
      suppressErrorRendering: true,
    })
    const id = `demo-mermaid-${Date.now().toString(36)}-${++uid}`
    const result = await mermaid.render(id, code)
    if (token !== renderToken) return
    outputEl.innerHTML = result.svg
    if (typeof result.bindFunctions === 'function') {
      try { result.bindFunctions(outputEl) } catch { /* ignore */ }
    }
    showDiagram()
    setStatus(`✓ ${code.split('\n')[0].split(' ')[0]} · ${result.svg.length} bytes`, 'ok')
  } catch (err) {
    if (token !== renderToken) return
    outputEl.innerHTML = ''
    const note = document.createElement('div')
    note.className = 'dsh-mermaid-error'
    note.textContent = `渲染失败：${err && err.message ? err.message : String(err)}`
    outputEl.append(note)
    showSource()
    setStatus('✗ 渲染失败', 'err')
  }
}

let debounce = null
sourceEl.addEventListener('input', () => {
  clearTimeout(debounce)
  debounce = setTimeout(render, 250)
})

presetEl.addEventListener('change', () => {
  sourceEl.value = PRESETS[presetEl.value] ?? ''
  render()
})

themeEl.addEventListener('change', render)
toggleBtn.addEventListener('click', () => {
  if (outputEl.hidden) showDiagram()
  else showSource()
})

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(sourceEl.value)
    copyBtn.textContent = '已复制 ✓'
    setTimeout(() => { copyBtn.textContent = '复制源码' }, 1200)
  } catch {
    setStatus('复制失败：请手动选择文本复制', 'err')
  }
})

// Boot: load the flowchart preset and render.
sourceEl.value = PRESETS.flowchart
render()
