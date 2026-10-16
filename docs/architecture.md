# 实现原理

本文说明 dsh-mermaid-preview 为什么这样写、依赖 dsh 的哪些稳定契约、以及已知边界。

---

## 1. 插件形态

一个 dsh 插件包可以同时有 **Host 半侧** 和 **Client 半侧**：

| 文件 | 角色 |
| --- | --- |
| `index.js` | Host 半侧。本插件不注册任何 Host 能力，`apply()` 为空；它的存在只是让 bundle 有一个可挂载的 Loader 行。 |
| `cordis.patch.yml` | bundle 层：`dsh.bundle.patch` 指向它，profile 组合时插入 `mermaid-preview` 行。 |
| `src/client.js` | Client 半侧源码（唯一逻辑所在）。 |
| `dist/client.js` | 构建产物，`exports["./client"]` 指向它。 |
| `dist/dsh-mermaid-preview.client.js` | 构建产物，动态插件（`cordis_define` 的 `code.client`）载荷。 |
| `locale/*.json` | 插件在「设置 → 插件」里的展示标题/描述。 |
| `icon.svg` | 展示图标（`package.json` 顶层 `icon`）。 |

`dsh.client` 声明告诉 `@deepseek-ai/dsh-client-modules`：这个包有浏览器半侧，
平台是 `web`，`exports["./client"]` 就是它的入口。宿主侧据此把文件挂在
`/plugins/dsh-mermaid-preview/client.js`，页面用
`window.__ModuleLoader__.load({ id, factory })` 执行它，并把 factory 的返回值
当作 Cordis 插件挂载。

> **模块身份 = 包名。** `dist/client.js` 里的 `id` 必须等于 `package.json` 的
> `name`，否则页面报 `no registered factory`。

---

## 2. Markdown 围栏的 DOM 契约

`@deepseek-ai/dsh-client-ui-primitives` 的 `CodeBlock` 渲染出：

```
.md-code-block                       ← 根，React 拥有
├── div(bannerWrap)                  ← React 拥有
│   └── [data-code-block-banner]     ← CodeToolbar（markdown 走这条分支）
│       ├── div.heading > span.language   ← 支持高亮时显示语言名，否则显示通用「代码」
│       └── div.actions > button          ← 复制按钮
└── div[data-code-block-content]     ← React 拥有
    └── <pre class="…plain…">        ← 未高亮：纯文本
        或 <div>（shiki 输出）        ← 已高亮
```

两个关键事实决定了实现方式：

1. **语言信息不在 DOM 里。** markdown 渲染把 `toolbarLabels` 传给 `CodeBlock`，
   于是走 `CodeToolbar` 分支；对 shiki 语法表不认识的 `mermaid`，`span.language`
   显示的是通用文案「代码 / Code」，而不是 info string。因此**不能靠语言标签识别
   mermaid 围栏**（这是 0.2 之前老做法失效的根本原因）。
2. **未高亮的围栏一定长成 `<pre>`。** 已高亮的围栏把 shiki 结果塞进一个 `<div>`。
   于是「`[data-code-block-content]` 的第一个子元素是 `<pre>`」就是一个廉价而稳定
   的「这是一个未高亮围栏」判据。

### 识别策略

```
候选 = [data-code-block-content] > pre 的 .md-code-block
命中 = 语言标签是 mermaid（老布局 / 演示页）
     或 围栏首条语句是 mermaid 语句（flowchart / sequenceDiagram / …）
```

`opensDiagram()` 会先剥掉 mermaid 允许出现在首语句之前的内容：
BOM、`%%` 行注释、`%%{ … }%%` 指令、`---` front matter。

误判边界：一个非 mermaid 语言的围栏，如果首行恰好是 `graph TD`，会被渲染。
这是内容判定的固有代价，已在 README 的 FAQ 中说明。

---

## 3. 为什么不替换 React 的节点

老版本把 `<pre>` `replaceWith` 成自己的容器。React 拥有那棵子树：主题切换或消息
重渲染时 React 会按自己的 fiber 更新/重建子节点，被替换掉的 `<pre>` 会让 React
的内部引用指向游离节点，出现「图表闪烁 / 消失」。

现在的做法：

- 容器 `.dsh-mermaid` 追加为 `.md-code-block` 的**最后一个子节点**。
  React 的子节点是 `[bannerWrap, content]`，多出来的第 3 个节点不在它的协调范围内，
  它不会去删除。
- 需要显示图表时，只给 `[data-code-block-content]` 打一个
  `data-dsh-mermaid-hidden` 属性，由插件样式表把它隐藏——**不动 React 的任何节点**。
- 切到源码 = 摘掉这个属性；内置复制按钮仍然从原来的 `<pre>` 读取文本，行为不变。
- 显示图表时另外给横幅外层容器打一个 `data-dsh-mermaid-banner` 属性，把「代码块」
  那一行（通用标签 + 折叠 + 复制）藏起来：图不是代码，头顶一行代码标签只会让人以为
  渲染失败了。切到源码视图就摘掉，复制按钮回来，失败时也始终可见。同样是**属性**
  而不是节点替换，React 无感。
- 如果 React 因为结构性变化丢掉了容器，`MutationObserver` 会发现并重建它
  （`ensureRecord()` 检测 `holder.isConnected`）。

---

## 4. 渲染管线

```
MutationObserver（childList + subtree + characterData）
      │  任何新增 / 文本变化
      ▼
schedule(block)  250ms 静默去抖     ← 流式输出期间不会反复渲染
      ▼
renderBlock → sourceOf → isMermaidFence
      ▼
enqueue(...)     串行队列             ← 一屏多图不会并发挤爆主线程
      ▼
paint: loadMermaid → configure → mermaid.render
      ▼
注入 SVG + applyView
```

- **Mermaid 按需加载**：只有真的出现候选围栏才去取 UMD（`window.mermaid` 已存在则
  直接复用）。加载失败会清掉缓存，允许后续围栏重试。
- **重绘会关闭查看器**：`paint()` 先关掉正显示这条记录的查看器。主题切换、
  围栏文本变化都会重新 `mermaid.render`，查看器里那份克隆随之过期——留着一张
  不再存在的图比关掉更糟。
- **失败分级**（0.3.2 起）：渲染失败不再是终态。模型流式输出时只要停顿超过静默窗口，
  半截围栏就会被解析一次并报错——那是「还没写完」，不是「写错了」。因此：

  | 阶段 | 行为 |
  | --- | --- |
  | 第 1–3 次失败 | 静默退避重试（400 / 900 / 1800ms），不出任何提示 |
  | 退避耗尽 | 才显示红色说明（`--dsw-alias-state-error-primary`），保留原始代码块 |
  | 围栏文本再次变化 | 立即清除提示、重置退避预算，重新渲染 |

  记录状态挂在 block 上（`data-dsh-mermaid="pending｜done｜failed"`），但**不再
  用它做「不再重试」的判据**——0.3.1 及之前正是如此：一次流式中途的解析失败会把块
  永久标记为 failed，之后即使围栏写完了（或被重新生成的消息复用同一个 DOM 节点）
  也再也不渲染，红字错误一直挂到组件重建。现在只有「文本没变且已成功/已放弃」才跳过。
- **安全**：`securityLevel: 'strict'`（禁用 HTML 标签与脚本），
  `suppressErrorRendering: true`（mermaid 自己不会往页面里塞错误图）。

---

## 5. 生命周期与清理

所有副作用都注册在插件 fiber 上：

| 副作用 | 归属 |
| --- | --- |
| 样式表 `<style data-dsh-mermaid-styles>` | `ctx.effect` |
| MutationObserver | `ctx.effect` |
| 去抖定时器 | `ctx.effect` 的清理函数逐个 `clearTimeout` |
| `<script>`（mermaid UMD） | `ctx.effect` 的清理函数移除 |
| 查看器 `<div data-dsh-mermaid-zoom>` 及其 window 监听 | `ctx.effect` 的清理函数调用 `viewer.dispose()`（摘监听 + 删节点） |
| 注入的 DOM、`data-dsh-mermaid*` 属性 | 清理函数逐个摘除 |
| `theme/change`、`locale/change` 监听 | `ctx.on` |
| locale 字典 | `ctx.effect(() => locale.register(...))` |

停用插件、HMR 重载或 profile 移除该 bundle 后，页面回到「未安装」的样子。

---

## 6. 主题与语言

- 主题：`ctx.get('theme').getTheme().active.colorScheme` → mermaid `dark` / `default`；
  取不到时退回 `prefers-color-scheme`。`theme/change` 触发全部重绘。
- 语言：文案走 Client locale 服务，但**不在 `apply()` 里绑定一次**——客户端模块按依赖
  顺序挂载，本插件可能早于 locale 服务就绪，过早绑定会永久退到内置英文（这就是
  「界面中文、插件英文」的成因）。现在的解析顺序：

  | 顺序 | 来源 | 说明 |
  | --- | --- | --- |
  | 1 | `ctx.locale.bind(ns)` | 服务就绪后注册字典并绑定；用「已知键是否返回键本身」判断注册是否落地 |
  | 2 | `document.documentElement.lang` | 服务不可用/未就绪时按它在内置中/英字典间选择；该属性由 locale 服务自己同步 |
  | 3 | 内置 `en` | 最后的兜底 |

  每次取文案都会重试第 1 步（失败只多读两个属性）；绑定成功后把已渲染的文案刷新
  一遍——注册字典本身不发 `locale/change`。

  > **坑：服务属性会抛，不是返回 `undefined`。** Cordis 的上下文是 Proxy，读一个
  > 未提供（或未 `inject`）的服务属性会抛
  > `cannot get property "locale" without inject`；`ctx.get(name)` 才是普通查表。
  > 在渲染路径上直接读 `ctx.locale` 曾经把异常抛出静默定时器的回调，结果**所有**围栏
  > 都停在源码状态（无 holder、无按钮、无提示，看起来像没装插件）。所以：服务一律
  > `ctx.get()` 优先 + 守卫兜底，`t()` 不抛，定时器回调也包 try/catch 转成红色提示。
- 配色只用 `cordis_inspect_query` 的 `Theme` 列出的 token：
  `--dsw-alias-bg-layer-1`、`--dsw-alias-border-l1`、`--dsw-alias-border-l2`、
  `--dsw-alias-label-primary`、`--dsw-alias-label-secondary`、
  `--dsw-alias-state-error-primary`。token 改名只会影响观感，不会打断渲染。

---

## 7. 放大查看器

mermaid 渲染出的 SVG 自带 `width="100%"` 和 `style="max-width: <自然宽>px"`——它被
设计成**填满容器**。代码块只有一栏宽，于是宽图会被等比压小，节点文字小到看不清。
查看器要解决的就是这条约束，做法是：

```
点击图表 / 「放大」按钮
      ▼
cloneNode(true) 复制 SVG          ← 代码块里那份一个字节都不动
      ▼
按 viewBox 还原自然尺寸            ← 去掉 max-width，width/height 写死为自然像素
      ▼
全窗口 stage + pan 层
   transform: translate(x, y) scale(s)
```

- **图纸**：mermaid 的 SVG 是**透明画布**，只画节点和连线。查看器给克隆出来的 SVG
  加一层主题层色背景（+圆角+投影），否则放大后节点之间的空隙会把背后被压暗的会话
  透出来，图反而更看不清。
- **坐标系**：`pan` 层 `transform-origin: 0 0`，图的自然尺寸就是它的
  `width/height`。缩放只改 `s`，平移只改 `x/y`；缩放以指针为锚点时用
  `x' = px - (px - x) × (s'/s)`，光标下那块内容保持不动。
- **默认适应窗口**：`s = min(1, 可用宽/图宽, 可用高/图高)`——整图可见，但小图不会被
  放大到失真；`ZOOM_MIN`/`ZOOM_MAX` 为 0.1×/8×（`ZOOM_MIN` 只在整图比 0.1× 还小时
  才继续变小，否则会缩到看不见）。
- **位置约束**：图比窗口小时自动居中（拖也拖不走），比窗口大时贴边——不会出现
  「拖到看不见的地方」。
- **交互**：滚轮（`exp(-deltaY × 0.002)`，按行滚动时为 `0.05`）、`+` / `-` / `0`、
  双击切换适应窗口 ↔ 1:1、方向键平移 80px、拖拽平移、`Esc` 或点击空白背景关闭。
  `pointerdown` 绑定 `setPointerCapture`，拖到窗口外也不断线；位移小于 4px 视为点击，
  因此在空白处轻点是关闭、拖拽永远不关闭，点在图上也不关闭（拖拽时太容易误触）。
- **模态行为**：`role="dialog"` + `aria-modal`，打开时焦点进入关闭按钮，关闭后交还
  给触发元素；键盘监听用捕获阶段登记，`Esc` / 方向键不会漏给背后的会话；滚轮监听
  挂在查看器容器上（不是画布），鼠标停在工具栏上也不会滚到背后的消息流。
- **与观察器互不干扰**：观察器跳过 `[data-dsh-mermaid-zoom]` 子树，平移时每帧的
  `transform` 变更不会被当成「围栏变了」。
- **生命周期**：查看器在第一次打开时才创建，之后所有图共用同一个元素；它归属插件
  fiber，`dispose()` 摘掉 window 监听并删除节点。围栏 DOM 被流式输出替换掉时，
  观察器会发现并在下一次 mutation 批次里关闭它。
- **无头测量**：整图尺寸取 SVG 的 `viewBox`；没有 viewBox 时退到 `width`/`height`
  属性（含 `%` 则不可用），再退到 `getBoundingClientRect()`。

---

## 8. 已知边界

- **CDN 依赖**：mermaid UMD 默认从 jsDelivr 取（`src/client.js` 顶部的
  `MERMAID_CDN`，当前固定 `11.17.2`）。离线环境或镜像不可达时，围栏保持原样并给出
  加载失败提示。换镜像 = 改一行常量后 `npm run build`。
- **流式输出不渲染**：设计如此，静默 250ms 后才渲染；停顿超过静默窗口时的半截围栏
  会静默退避重试，不弹错误（见 §4 失败分级）。错误提示只在围栏文本停止变化后仍然
  解析失败时出现。
- **内容判定**：见 §2 的误判边界。
- **查看器不做焦点陷阱**：`Tab` 仍可能走出弹层（`Esc` 与方向键在弹层内被拦下）。
  这是刻意的最小实现——插件只在页面上挂装饰，不接管应用级焦点管理。
- **查看器里是静态副本**：克隆不会带上 `bindFunctions()` 绑定的事件，因此图内交互
  只在代码块里那一份上生效。`securityLevel: 'strict'` 下 mermaid 本身也不生成链接。
- **mermaid 12 未验证**：本插件只按 11.x 的 `initialize` / `render` 契约编写与
  验证；升级大版本前请按 `docs/install.md` 的验证步骤自查。
