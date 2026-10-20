/**
 * The scenes the README screenshots are taken from: a short conversation with
 * a real question and a real Mermaid answer, in the shape dsh renders.
 */

/** One fence block, in the exact shape the shell emits for shiki-less code. */
export const makeBlock = (code) => {
  const block = document.createElement('div')
  block.className = 'md-code-block'

  const banner = document.createElement('div')
  banner.className = 'shell-banner'
  const label = document.createElement('span')
  label.setAttribute('data-code-block-banner', '')
  label.textContent = 'mermaid'
  const spacer = document.createElement('span')
  spacer.className = 'spacer'
  const tool = document.createElement('span')
  tool.className = 'tool'
  tool.textContent = '复制'
  banner.append(label, spacer, tool)

  const content = document.createElement('div')
  content.setAttribute('data-code-block-content', '')
  const pre = document.createElement('pre')
  const codeEl = document.createElement('code')
  codeEl.textContent = code
  pre.append(codeEl)
  content.append(pre)

  block.append(banner, content)
  return block
}

/** A user bubble. */
const userMessage = (html) => {
  const node = document.createElement('div')
  node.className = 'msg user'
  const who = document.createElement('div')
  who.className = 'who'
  const avatar = document.createElement('span')
  avatar.className = 'avatar'
  who.append(avatar, document.createTextNode('你'))
  const bubble = document.createElement('div')
  bubble.className = 'bubble'
  bubble.innerHTML = html
  node.append(who, bubble)
  return node
}

/** An assistant message: prose, optionally followed by a diagram. */
const assistantMessage = (html, code) => {
  const node = document.createElement('div')
  node.className = 'msg assistant'
  const who = document.createElement('div')
  who.className = 'who'
  const avatar = document.createElement('span')
  avatar.className = 'avatar'
  who.append(avatar, document.createTextNode('DeepSeek'))
  const body = document.createElement('div')
  body.innerHTML = html
  node.append(who, body)
  if (code !== undefined) node.append(makeBlock(code))
  return node
}

const FLOWCHART = `flowchart LR
    subgraph 人类侧
        Owner[责任人<br/>审核与问责]
    end

    subgraph 平台侧
        Launch[执行发起<br/>选择 Agent 类型]
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
    Owner -->|通过 / 驳回| Track`

const SEQUENCE = `sequenceDiagram
    autonumber
    participant O as 责任人
    participant P as 平台
    participant A as 本地 Agent
    O->>P: 选择 Agent 类型 + 复制命令
    P->>A: MCP 连接 + 通行证
    A->>P: 提交任务产出
    P-->>O: 通知待审核
    O-->>P: 通过 / 驳回`

const GANTT = `gantt
    title 渲染管线改造
    dateFormat YYYY-MM-DD
    axisFormat %m-%d

    section 测量
    建立基准        :done,    b1, 2026-10-01, 4d
    定位瓶颈        :done,    b2, after b1, 3d

    section 实现
    屏幕外不渲染    :active,  i1, after b2, 4d
    SVG 缓存        :         i2, after i1, 3d
    陈旧保护        :crit,    i3, after i2, 2d

    section 验证
    九图回归        :         v1, after i3, 3d
    像素比对        :milestone, m1, after v1, 0d`

const PIE = `pie showData
    title 一次九图渲染的时间去向
    "mermaid.render" : 698
    "initialize" : 22
    "DOM 插入 + 布局" : 15`

const TIMELINE = `timeline
    title 渲染管线的四轮改造
    section 2026 Q2
        0.3.0 : 接管围栏 : 设计系统主题
        0.4.0 : 全窗口查看器
    section 2026 Q3
        0.5.0 : 卡片内主题切换
        0.5.1 : 自适应布局
    section 2026 Q4
        0.6.0 : 屏幕外不渲染 : SVG 缓存 : 引擎随包附带`

const CLASS = `classDiagram
    class RenderPipeline {
        +scan(block)
        +schedule(block)
        -enqueue(task)
    }
    class SvgCache {
        -Map entries
        +get(key) Svg
        +set(key, svg)
    }
    class ThemeConfig {
        +variant
        +configFor(scheme)
    }
    RenderPipeline --> SvgCache : 命中则跳过渲染
    RenderPipeline --> ThemeConfig : 每 (scheme, variant) 一次`

const MINDMAP = `mindmap
  root((渲染性能))
    少做一次
      屏幕外不渲染
      SVG 缓存
    不卡主线程
      宏任务让出
      单张图上限
    更快出现
      预取引擎
      主题只配一次`

const JOURNEY = `journey
    title 读者的阅读动线
    section 打开对话
      滚动到图表: 5: 读者
      图表已在屏幕上: 5: 读者
    section 看细节
      点击图表: 4: 读者
      查看器放大: 5: 读者
    section 换主题
      点调色板: 5: 读者
      全部重绘: 4: 读者`

export const SCENES = [
  {
    id: 'overview',
    messages: [
      {
        kind: 'user',
        html: '这三块是怎么串起来的？<br/>责任人发起之后，本地 Agent 怎么把产出交回来？',
      },
      {
        kind: 'assistant',
        html: `<p>一句话：<strong>责任人只跟平台打交道，平台替 Agent 签发通行证。</strong></p>
<p>流程分三段：</p>
<ul>
<li><strong>发起</strong> —— 责任人选 Agent 类型，平台生成一条带通行证的命令；</li>
<li><strong>执行</strong> —— 本地 Agent 用通行证接 MCP，认领并跑完任务；</li>
<li><strong>回收</strong> —— 产出回到平台，责任人收到待审核通知。</li>
</ul>`,
        code: FLOWCHART,
      },
    ],
  },
  {
    id: 'sequence',
    messages: [
      { kind: 'user', html: '把上面那个流程画成时序图。' },
      {
        kind: 'assistant',
        html: '<p>时序上，平台是唯一的中转方 —— Agent 从不直连责任人：</p>',
        code: SEQUENCE,
      },
    ],
  },
  {
    id: 'gantt',
    messages: [
      { kind: 'user', html: '这次渲染管线改造，排期大概是什么样？' },
      {
        kind: 'assistant',
        html: '<p>先测量再动手，验证排在最后：</p>',
        code: GANTT,
      },
    ],
  },
  {
    id: 'pie',
    messages: [
      { kind: 'user', html: '一次九图渲染，时间到底花在哪儿？' },
      {
        kind: 'assistant',
        html: '<p>几乎全在 <code>mermaid.render</code> 自己身上，所以优化方向只能是「少做一次」：</p>',
        code: PIE,
      },
    ],
  },
  {
    id: 'timeline',
    messages: [
      { kind: 'user', html: '这个插件的渲染管线，是怎么一步步改到现在的？' },
      {
        kind: 'assistant',
        html: '<p>四轮改造，每轮只解决一个问题：</p>',
        code: TIMELINE,
      },
    ],
  },
  {
    id: 'class',
    messages: [
      { kind: 'user', html: '缓存和主题配置在代码里是什么关系？' },
      {
        kind: 'assistant',
        html: '<p>渲染管线只持有两个协作者：缓存与主题配置。</p>',
        code: CLASS,
      },
    ],
  },
  {
    id: 'mindmap',
    messages: [
      { kind: 'user', html: '把这次的优化点整理成一张图。' },
      { kind: 'assistant', html: '', code: MINDMAP },
    ],
  },
  {
    id: 'journey',
    messages: [
      { kind: 'user', html: '从读者角度看，这些改动体现在哪些环节？' },
      {
        kind: 'assistant',
        html: '<p>三处：图表更早出现、看细节更顺、换主题不卡。</p>',
        code: JOURNEY,
      },
    ],
  },
  {
    id: 'error',
    messages: [
      { kind: 'user', html: '语法写错的时候会怎样？' },
      {
        kind: 'assistant',
        html: '<p>保留源码，给一条安静的提示 —— 解析器原文收在「查看详情」里：</p>',
        code: 'flowchart LR\n    A[开始] -->\n    B[没有闭合的括号 --> C',
      },
    ],
  },
]

/** Build a scene into the thread element; returns the code cards. */
export const buildThread = (thread, scene) => {
  const blocks = []
  for (const message of scene.messages) {
    const node = message.kind === 'user'
      ? userMessage(message.html)
      : assistantMessage(message.html, message.code)
    thread.append(node)
    if (message.kind === 'assistant' && message.code !== undefined) {
      blocks.push(node.querySelector('.md-code-block'))
    }
  }
  return blocks
}
