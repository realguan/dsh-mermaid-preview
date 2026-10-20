# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2026-10-20

渲染得更少，而不是渲染得更快——因为 `mermaid.render` 本身就是全部开销。

在 headless Chromium 里用 `bench/`（新增）跑真实插件产物、九图语料量出的事实：
一次渲染的 95% 是 `mermaid.render` 自己（一组九图 698/738ms），
`mermaid.initialize` 2–3%（小图可达 15%），DOM 插入 + 首次布局 2%。
所以「把单次渲染做快」几乎没有空间，能拿的都在「少做一次」和「不要卡住主线程」。

### Added

- **渲染结果缓存。** `(配色, 源码)` → SVG 字符串，LRU 40 条 / 4MB，
  `dispose` 时清空。主题来回切、React 重建消息 DOM、同一条消息里出现两张相同的
  图，这三种情况以前都会整份重新渲染。实测九图一轮 **753ms → 14ms**。命中时重写
  SVG 的 id（mermaid 把 `url(#…)`、`<style>` 选择器全按 id 命名空间化，两张卡片
  共用 id 会让箭头指向别人）。带 `click` 语句的图不缓存。
- **只渲染看得见的图。** `renderBlock` 先同步判一次「离视口近不近」，不在就先记
  `wantsPaint`，交给 `IntersectionObserver` 在滚回来时补。实测九张图全部在屏幕外
  时 `mermaid.render` **9 次 → 0 次**；这就是「打开一段历史很长的对话」的开销来源。
  排版容器/后台标签页里拿不到盒子（rect 全 0）时按「可见」处理，避免永不渲染。
- **`bench/`**：可复现的渲染成本基准（Playwright + 真实 `dist/client.js` +
  九图语料），`node bench/bench.mjs --reps 9 --label baseline` 一条命令出表。
  README 里写清了每个指标量的是什么、以及这些数字不能证明什么。

### Changed

- **每个渲染任务之间让出主线程。** mermaid 11 明确把 fastdom 的
  `requestAnimationFrame` 换成了 `queueMicrotask`（源码注释：
  "requestAnimationFrame is too slow compared to queueMicrotask"），
  所以 `await mermaid.render()` 从不把控制权交回浏览器，一条 promise 链能把多张
  图连成一个长任务。队列仍然严格串行（mermaid 的配置和临时 SVG host 都是模块级
  状态），但每个任务前插一个宏任务（有 `scheduler.yield()` 就用它，否则
  `MessageChannel`），单次阻塞上限降到一张图。
- **`configure` 只在 `(scheme, variant)` 变化时调用。** `mermaid.initialize` 每次
  都会深拷贝整份配置并重建 base 主题（约 95 次颜色运算，跑两遍）——实测 2–3ms，
  以前是每张图每次重绘都付一遍（九图 3.2%，小图 15%）。`mermaid.render` 自己每次
  开头都会 `reset()` 从 site config 重新推导 per-render 配置，所以 site config 只
  要正确即可。顺手把 `securityLevel` / `suppressErrorRendering` 挪到主题配置**之后**
  展开：注释一直写着「变体绝不能覆盖这三个标志」，原来的顺序其实允许覆盖。
- **主题切换只重绘看得见的图。** 屏幕外的只标记待重绘，同一配色重复触发
  `theme/change` 则一次渲染都不做。`theme/change` 延后一个宏任务再判定，因为事件
  可能先于主题服务提交新配色，早读会读到旧配色。
- **首个图表更快出现。** 静默窗口和 CDN 取脚本以前是串行的（250ms + 约 1MB 下载
  + DNS/TLS），现在围栏一被识别就发预取，两者并行；并加了一条 `preconnect`。
- **屏幕外的图不再做同步尺寸测量**，等滚进视口再量（`fitReading` 会清掉 memo，
  期间 SVG 用自身尺寸 + 样式表的 `max-width`）。

### Fixed

- **「改了但没生效」的两个缺口。** 加缓存和可见性门控的本质是「很多时候故意什么都
  不做」，每一处跳过都是潜在的陈旧画面，所以逐个排查并补上：
  - **渲染途中的文本变化会被旧结果覆盖，且永久不修。** `mermaid.render` 期间围栏
    又变了，旧结果回来后会把「已完成」和当前配色盖到卡片上；而 `renderBlock` 的
    「已完成 + 文字没变 → 什么都不做」和 `paint` 的配色守卫都会因此跳过那张真正
    该渲染的新图。现在 `paint` 记住自己渲染的是哪一版文字，回来发现已被取代就直接
    丢弃结果（缓存写入仍然正确，它的 key 带的是那次渲染的文字）。**只有当单张图的
    渲染超过 250ms 静默窗口时才会触发**，普通图基本遇不到，但几十个节点的图会。
    已用「把 render 拉长到 400ms」的可复现用例验证：去掉这道守卫，卡片会停在旧图
    并一直标着 `done`，直到别的事件碰巧触发一次重绘才恢复；加上后正确收敛。
  - **主题事件可能早于配色提交。** `theme/change` 若先于主题服务提交新配色到达，
    `themeScheme()` 读到的是旧值，配色守卫会「正确地」判断无事可做，于是旧主题留在
    屏幕上直到下次切换。现在读取延后一个宏任务，并且**同时监听 `<body>` 上的
    `data-ds-dark-theme`**（本插件样式表本来就依赖这个属性）——那个属性是提交动作
    写出来的，所以事件顺序不再重要；配色守卫让重复触发不花任何渲染。
- **原地更新的围栏文本以前永远不会重新渲染。** `MutationObserver` 里
  `if (target.nodeType === 1)` 把 `characterData` 的 target（文本节点，nodeType 3）
  全丢了，而 React 更新文本子节点正是原地改 `nodeValue`。现在文本节点先解析到
  父元素、再走原本的「是不是我们自己的 DOM」判断。已验证：原地改字后 2 个节点
  的图变成 3 个节点；旧产物在同样操作下状态永远停在 `done`。

### Rejected

- **`content-visibility: auto` + `contain-intrinsic-size`（画布上）。** 实测确实把
  插入 + 布局段砍掉 70%（九图 15.0ms → 4.3ms），但只占一轮的 1.3%，代价是被跳过
  的卡片只有内在尺寸：从未滚到过的图在整页截图和打印里是空白，且每张图首次渲染前
  页面高度是错的。阅读场景里「打印时图消失」不值 1.3%。
- **`mermaid.render(id, code, container)` 的隔离容器。** 一开始测出 −27%，把节奏
  对齐（插件是 250ms 静默后才渲染，连续渲染本身便宜 15–20%）之后只剩 −1.7%。
  临时节点插到哪不影响 mermaid 量什么。
- **`securityLevel: 'loose'` 跳过 DOMPurify**（省约 2.2ms/次）：渲染的是模型输出的
  markdown，净化不是可选项。
- **`htmlLabels: false` 换掉 foreignObject 测量**：实测更慢（48ms vs 42ms）。

### Measured

同一台机器、同一语料、`--reps 7`，改前 → 改后：

| 指标 | 改前 | 改后 |
| --- | --- | --- |
| 九图一轮 `init` | 30.0ms | 0 |
| 九图一轮 `insert` | 15.0ms | 15.1ms（未变，见 Rejected） |
| 九图一轮合计 | 815ms | 763ms（−6.4%） |
| 屏幕外九图的 `mermaid.render` 次数 | 9 | 0 |
| 同配色再来一轮 | 753ms | 14ms（缓存命中 −98%） |
| 主题切走再切回 | 整份重渲染 | 0 次渲染 |
| 视觉回归（DPR 2 整页像素比对） | — | 0 / 9,891,840 像素差异 |

`mermaid.render` 单项在多次运行间有 ±10% 的机器噪声，所以上表只列可归因的差
（`init` 归零、缓存命中、屏幕外不渲染）；`render` 本身的波动不作为收益。

## [0.5.1] - 2026-10-17

让图真正「自适应窗口」，并补上新图型与 C4 的主题覆盖。

### Changed

- **卡片内小图会放大。** 以前 mermaid 的 `useMaxWidth` 只缩不放，小于阅读列的图
  永远停在自然尺寸（756px 卡片里放 290px 的 block 图，左右各空 213px）。现在
  `fitReading` 对「自然高 ≤600px 且宽度放得下」的小图最多放大到 1.5×（14px 标签
  → 21px）；宽图缩到列宽，很高的图保持 1:1 让卡片变高。`MAX_READING_SCALE = 1.5`
  是为了让图示比正文略大，而不是把卡片变成海报。
- **宽图永远完整显示，不再裁切/横向滚动。** 去掉上一版的「缩放下限」兜底（它会
  在不同宽度下把 treemap、packet、timeline 等不同图型随机打回裁剪态）：现在所有
  23 种图型统一按卡片宽度等比缩小到整图可见，只有小图才放大（≤1.5×）。已用真实
  插件产物做 **23 图型 × 6 种卡片宽度（420/560/710/760/900/1200px）** 回归，
  0 失败、0 裁切、0 SVG 超出画布。看细节用全窗口查看器；treemap 叶子标签同时从
  mermaid 的 38px 上限压到 20px，避免字号比正文大一号。
- **鼠标停在图上也能滚动消息。** 以前画布是内层滚动容器
  （`max-height` + `overflow:auto` + `overscroll-behavior:contain`），图一高，
  指针落在图上时滚轮只会试图滚图、不滚文档。现在画布**不再是滚动容器**：高度不设
  上限、高图让卡片自然变高，滚轮事件始终交给消息列表；自然高 >600px 的图也不再
  被放大成海报。
- **卡片布局可切换，默认滚动容器。** 头部新增「布局」按钮：默认 `滚动容器`
  （高图限高 `min(900px, 85vh)`、卡片内滚动），点一下切到 `完整展开`（卡片随图
  变高、滚轮直接滚文档），选择写入 `localStorage`
  （`dsh-mermaid-preview:fit-mode`）并跨刷新保留。两种模式只改画布 CSS，宽度
  适配规则一致。
- **全窗口查看器「适应窗口」真的适配窗口。** `fitScaleOf` 不再硬编码
  `Math.min(1, …)`：小图会放大到填满可用窗口（上限 `ZOOM_FIT_MAX = 2.5`），大图
  照旧缩小；`817×603` 下 block 从 100% → 143%，`1440×900` 下 235%。双击 1:1 对
  小图第一次真正有意义。

### Fixed

- **黄色系颜色不再发灰发橄榄。** 设计系统的黄色 token 在「1px 描边可读性」归一化
  时被反复压黑（`#ffe629` → 橄榄），导致 sequence 的 note、gitGraph 的 tag、
  timeline/mindmap 的黄色带变成灰褐/橄榄。现在 note / tag / 黄色 cScale / journey
  第 7 段 / pie 第 8 片改从**原始设计系统色相**生成：粉彩底 + 适度加深的暖色描边。
- **gitGraph `type: HIGHLIGHT` 提交**不再是“空心浅蓝方块”：补了主题蓝描边和
  quiet 变体的对应规则。
- **gantt 条外标签不再是白字。** 当任务条比标签窄时，mermaid 会把标签移到条外
  （正常行为），但它的元素仍带着条内的 `activeText/doneText/critText` 类，而主题
  对这些类用了 `!important` 的条内文字色——放到浅色分区带上就成了白字/近乎不可读
  （例如 active 任务「交互与视觉设计」）。现在 `.taskTextOutsideRight/Left`
  强制使用 outside 色（浅色 `#60646C` / 深色 `#A8ADB6`），quiet 变体同步。
- **block-beta 没进入节点循环。** 节点画在 `g.block` 下，而主题的
  `nth-of-type` 循环只匹配 `.nodes g.node`；现在两个作用域都命中，暗色下不再是
  白底浅字。
- **packet-beta 是 mermaid 默认白底黑框。** themeCSS 接管
  `.packetBlock` / `.packetLabel` / `.packetByte` / `.packetTitle`。
- **C4Context / C4Container 完全没上主题。** C4 的元素颜色是 renderer 写死的
  inline `!important`，只能通过 `c4.*_bg_color` / `*_border_color` 配置上色；新增
  按调色板生成的 c4 配置（person/system/container/component 粉彩 + 中性
  external），字体全部换成 DSH 字体栈；标签文字用 tspan 规则重新上墨，关系线/
  边界框的 `#444444` 属性选择器接管。
- **sankey-beta 的 d3 Tableau10 硬编码色板。** 节点用主题 6 色循环覆盖 SVG
  属性；流带改为主题中性连线色（`sankey.linkColor`），并关掉暗色下不可见的
  `mix-blend-mode: multiply`。
- **architecture-beta / radar-beta / journey / gantt 的残留默认色。** 补
  `arch*` themeVariables、`themeVariables.radar`（graticule 不再画成亮灰圆盘）、
  journey 的 section/task 边框与表情眼睛、gantt 的 `currentColor` 网格线；服务
  图标内置 `#087ebf` 背景换成系统蓝。
- **sequenceDiagram 序号字体** 不再落到 `sans-serif`。

### Internal

- `src/theme.js`：C4、sankey、radar、architecture 的配置/变量加入
  `makeThemeVariables` 与各 scheme 的 `schemeConfig`，`configForVariant` 对
  `c4/sankey/architecture` 做深合并；quiet 变体同步补规则。
- `npm run check` 覆盖新产物；23 种图型 × light/dark 的真实渲染回归见本地审计
  报告（`.audit/theme/report.md`，未提交）。

## [0.5.0] - 2026-10-17

视觉重构：图表不再是「贴进对话里的 mermaid 默认图」，而是长在 dsh 里的内容。

### Added

- **图表主题（`src/theme.js`），8 套变体，默认 Radix Colors。** 全部基于 mermaid
  `base` 主题 + 每套 200+ 个 `themeVariables` + 针对性 `themeCSS` + 14 种图型的
  布局配置；字体用字面量（修掉 class/state 标签被裁的根因），构建时内联进两个产物，
  演示页直接 `import` 同一份，三处不会漂移。
  - `radix`（默认，作者选择）：Radix Colors 12 阶色板取实色，通透明亮，8px 圆角。
  - `apple`：Apple HIG 系统色，最鲜艳的粉彩 + vivid 数据色。
  - `github` / `carbon` / `atlassian` / `material` / `polaris`：取各自官方 token，
    并跟随形状语言（Carbon/Material 方角、GitHub/Polaris 6px）。
  - `quiet`：dsh 中性主题（白/深灰节点、发丝描边）。
  默认值由 `THEME_VARIANT` 决定，卡片头部的调色板菜单可在界面里即时切换；
  演示页顶部的「风格」下拉框可实时对比全部变体（明暗都跟随）。
- **可切换的设计系统主题（8 套变体）。** 新增 GitHub Primer、Radix Colors、
  IBM Carbon、Atlassian Design System、Material Design 2、Shopify Polaris 六套
  开源设计系统色板（每个色相/中性色来自其已发布 token；过亮的规范色会做描边
  可读性归一）。`buildPalette()` 从「实色 hues + 中性色」推导粉彩 tint、行色、
  强调文字，所以新增一套设计系统只需要一张色板表。
- **卡片内主题切换。** 图表卡片头部新增调色板按钮：打开一个挂到 `<body>` 的
  fixed 弹层菜单，8 套变体各带自身色板取样的三色 swatch，当前项打勾；选择后
  所有图表即时重绘，选择写入 `localStorage`（`dsh-mermaid-preview:theme`）并跨
  刷新保留，`THEME_VARIANT` 继续作为默认值。菜单支持方向键 / `Home` / `End` /
  `Enter` / `Esc`，靠近视口边缘自动翻转与收拢，`Esc` 归还焦点；明暗主题与中英文
  界面下文案都跟随。
- **卡片头部。** 图表卡片有了自己的头部：左侧是按图型配色的 Apple 风格 tint 标签
  （`flowchart` 蓝 / `sequenceDiagram` 绿 / `classDiagram` 紫 / `gantt` 粉 …），
  右侧 24px 命中区的四个图标按钮——主题、复制源码、显示源码、放大（复制成功变绿）。
  源码视图与图表视图共用这一行。
- **宽图可读性策略。** 放得下就适配；适配比例会低于 `MIN_FIT_SCALE = 0.85` 时保持
  原始尺寸横向滚动，右缘用渐隐提示（滚到末尾消失）；高度上限
  `min(900px, 85vh)`。容器尺寸变化通过 `ResizeObserver` 重新测量。
- **安静的失败态。** 语法错误 / CDN 加载失败不再把解析器原文倒满卡片：一条
  警示色提示条（一句话 + 可展开的详情，详情为等宽限高滚动区）。
- `docs/design.md`：设计原则、token 表、图表主题、卡片 / 查看器 / 失败态规格、
  验证方法与已知边界。

### Changed

- **查看器重做。** 模糊遮罩（`bg-mask-3` + `backdrop-filter`）；顶部悬浮胶囊工具条
  （彩色类型标签 + − / 百分比 / + / 适应窗口 / 关闭）；图纸加 22px 内边距 + 16px 圆角 +
  升层投影；底部安静的操作提示胶囊；进出场 160–180ms 淡入（尊重
  `prefers-reduced-motion`）。
- **壳层代码横幅彻底让位。** 图表卡片不再显示「代码块」标签；切到源码视图也不再
  叠出第二行横幅与内置复制按钮——复制由插件头部提供（同样写剪贴板），源码正文仍是
  React 原来的 `<pre>`，不替换任何 React 节点。
- **独立演示页整体重做。** dsh 风格的 token、明暗两种主题（跟随系统 + 手动切换）、
  分区预设选择、安静的状态/错误/空态、可访问性与 reduced-motion；零依赖不变，
  `npm run demo` 仍是一条命令。
- **构建与自检。** `scripts/build.mjs` 负责把 `src/theme.js` 内联成单文件产物；
  `npm run check` 增加 `src/theme.js` 语法检查与「bundle 已内联主题」的证据检查。
- README / architecture / install / contributing 同步更新。
- **展示文案与品牌徽章。** `locale/zh.json`、`locale/en.json` 与 `package.json` 的
  description 改为当前视觉与能力的准确描述（设计系统主题、原生卡片、全窗口查看）；
  README 中英双语补上「powered by dsh」徽章；`docs/design.md` 里「默认 Apple」的
  旧表述同步为 Radix。

### Fixed

- **对话底部多出 mermaid 的「Syntax error in text」错误图。** 主题重构时
  `mermaid.initialize()` 丢了插件自己的 `suppressErrorRendering: true`（以及
  `startOnLoad: false`），流式输出中途的半截围栏解析失败时，mermaid 会把它自己的
  错误图直接画进 `<body>`，之后即使卡片重试成功，这张错误图也会永久留在页面底部。
  现在初始化始终显式带上这三个插件级开关（不再受主题变体影响），并在渲染失败后清理
  mermaid 的临时节点（`d<id>` / `i<id>`）、插件启动时清掉历史残留。
- **classDiagram / stateDiagram 成员文字被裁切。** 根因是 `fontFamily: 'inherit'`：
  mermaid 在宿主正文环境测量 HTML label、却在代码卡片的等宽字体环境渲染，量得窄、
  画得宽。主题改为字面量 dsh 字体栈后测量与渲染一致。
- **gantt 轴标签重叠、图过宽。** `gantt.useWidth: 660` + `axisFormat: '%m-%d'`。

## [0.4.0] - 2026-10-16

### Added

- **放大查看（issue #1）。** 模型很爱输出很宽的图，而 mermaid 会把 SVG 压进代码块
  的宽度（`width="100%"` + `max-width`），节点文字小到看不清。现在图表本身也是入口：

  - 点击图表，或点它下方新增的「放大」按钮，打开全窗口查看器；
  - 查看器把 SVG **克隆**一份、去掉 `max-width` 约束，按 mermaid 自己的尺寸
    （viewBox）显示，代码块里的那一份原样不动；
  - 默认「适应窗口」（整图可见，小图不会被放大到失真）；滚轮缩放、拖拽平移、
    双击在「适应窗口 ↔ 1:1」间切换、方向键平移、`+` / `-` / `0` 缩放与复位、
    `Esc` 或点击空白背景关闭；
  - 缩放以指针为锚点（光标下那块内容不动）；图比窗口小时自动居中，比窗口大时
    贴着边缘，拖不丢；
  - 打开时焦点进入关闭按钮，关闭后交还给触发元素；文案随界面语言切换；
  - 工具栏显示当前缩放百分比（`aria-live`）与「滚轮缩放 · 拖拽平移 · Esc 关闭」
    提示（窄屏隐藏）；
  - 查看器里那张图有自己的**图纸**（主题层色 + 圆角 + 投影）。mermaid 的 SVG
    本身是透明画布，没有这层纸，放大后节点之间的空隙会把背后被压暗的会话透出来。

- **图表视图隐藏代码块的「代码块」横幅。** 图不是代码，头顶一行通用标签 + 折叠/复制
  按钮只会让读者以为这是一段没渲染出来的代码；横幅在切到「显示源码」时回来（那里才
  需要复制按钮），渲染失败时也保持可见。实现只是给横幅外层容器挂一个
  `data-dsh-mermaid-banner` 属性，React 的节点照旧不动。

### Fixed

- **文案不跟随 dsh 的语言设置（界面中文、插件英文）。** 旧实现只在 `apply()` 里
  取一次 `ctx.get('locale')`，而客户端模块按依赖顺序挂载，本插件很可能在 locale
  服务就绪之前就挂上了——于是永远退到内置英文文案，且再也不会重试。现在：

  - locale 服务**惰性解析**，每次取文案都会再试一次（`ctx.get('locale')` 为主，
    服务属性访问只在守卫里兜底）；
  - 服务出现后注册字典并绑定翻译函数；用「查询一个已知键是否返回键本身」判断
    注册是否落地，避免用过早绑定的空字典；
  - 绑定成功后把已经渲染出来的文案刷新一遍（注册字典不发 `locale/change`）；
  - 服务不可用或尚未就绪时，按 `document.documentElement.lang`（dsh 的 locale
    服务自己维护它）在内置中英字典之间选择，而不是一律英文。

- **上面那条修复引入的回归：所有图表都不渲染，连按钮都没有。** Cordis 的上下文是
  个 Proxy，读一个**未提供（或未 inject）的服务属性**不是返回 `undefined`，而是抛
  `cannot get property "locale" without inject`。第一版修复在渲染路径上直接读
  `ctx.locale`，异常从静默定时器的回调里逃出去——**每一块围栏都是同一个下场**：
  没有 holder、没有按钮、没有错误提示，看起来就像插件没装。现在：

  - `ctx.get('locale')` 优先（普通查表，服务不可用时返回 `undefined`），
    `ctx.locale` 只在 try/catch 里碰；
  - `t()` 整条链路保证不抛：文案服务抖一下，最坏是文案回退，不该赔上一张图；
  - 静默定时器的回调也包了 try/catch：任何逃逸的错误变成红色提示，而不是让整块
    围栏「安静地死掉」。

  这条是在真实 Cordis 语义下（`ctx.locale` 抛异常 → 什么都不渲染）先复现、再修复、
  再复测的；`docs/architecture.md` §6 记了这个坑。

- **查看器打开时滚轮会滚动背后的会话。** 滚轮监听现在挂在查看器容器而不是画布上，
  鼠标停在工具栏上也不会漏出滚动。

### Changed

- 「显示源码 / 显示图表」与「放大」共用一个按钮行（`.dsh-mermaid-actions`）：
  渲染失败时整行隐藏，切到源码视图时只隐藏「放大」——没有图就没有可放大的东西。
  两个按钮改成与壳层一致的 ghost 样式（默认无边框，hover 才出现底色）。
- 重绘（主题切换、围栏文本变化）会关闭已打开的查看器：它显示的是上一张图，
  留着就是一张不再存在的画。
- 观察器同时忽略查看器子树内的变动，平移时每帧的 transform 变更不再进入
  「围栏变了」判定。

## [0.3.3] - 2026-10-16

### Fixed

- **`radar-beta`、`kanban`、`treemap-beta` 围栏完全不渲染。** 内容识别的关键词表
  （`MERMAID_HEAD`）停留在更早的 mermaid 版本，漏掉了 11.x 新增的这三个图表类型：
  围栏既没有图、也没有切换按钮、更没有错误提示——就像插件没装一样。已按固定的
  mermaid 11.17.2 重新核对并补齐：新增 `radar-beta`、`kanban`、`treemap-beta`，
  并接受 mermaid 同样认可的裸名形式 `sankey` / `xychart` / `block` / `packet` /
  `treemap` 与 `flowchart-elk`；mermaid 根本不认的关键词（裸 `radar`、裸
  `architecture`）保持不检测，避免接管后只能报 "No diagram type detected"。
  `check.mjs` 的识别用例从 25 条增加到 35 条，覆盖上述全部类型与反例。

## [0.3.2] - 2026-10-16

### Fixed

- **流式输出期间的解析错误会永久卡住整个代码块。** 模型停顿超过 250ms 静默窗口时，
  半截围栏会被渲染一次并抛出 parse error；旧实现随即把块标记为
  `data-dsh-mermaid="failed"` 并且 `renderBlock` 直接 return——此后即使围栏写完了、
  或被重新生成的消息复用同一个 DOM 节点，也再也不渲染，红色错误提示一直挂到组件
  重建。这就是「输出时报错，切走再切回来就好了」的原因：切换会话会销毁并重建消息
  DOM，顺带清掉了这个标记。

  现在失败不再是终态：

  - 前 3 次失败静默退避重试（400 / 900 / 1800ms），不显示任何提示——半截围栏是
    「还没写完」，不是「写错了」；
  - 退避耗尽（文本已停止变化仍失败）才显示红色提示，并保留原始代码块；
  - 围栏文本再次变化时立即清除提示、重置退避预算并重新渲染——重新生成、模型改写
    都能恢复；
  - 错误提示移入插件自己的 holder 内部，observer 不再把自己的写入误判成「围栏变了」；
  - CDN 加载失败与渲染失败现在使用各自的文案（`loadFailed` / `renderFailed`）。

  副作用：真正语法错误的围栏，错误提示会晚约 3 秒出现（退避跑完才显示）。

## [0.3.1] - 2026-10-16

Answers the DSH STORE author-fix request `AI-Scarlett/DSH-Store#910`
(`DSH_LATEST_THREE_COMPATIBILITY_HOLD`): the catalog had no exact compatible
record for any release in its rolling window, so the plugin was unlisted.

### Added

- `dsh.compatibility` in the manifest: a DSH range, a Node range, and an exact
  per-release `dshReleases` matrix. A range alone is not installable evidence
  for the store; exact records are.
- `docs/compatibility.md`: the five checks behind every `compatible` entry, the
  versions they were run against, and an explicit statement of what those
  claims do **not** cover (no runtime acceptance, no visual verification).
- `npm run check` now validates the declaration's shape (full-SemVer keys,
  known statuses, Node range agreement with `engines.node`, at least one
  `compatible`).

### Compatibility evidence

`compatible` was declared for `0.2.0-rc.1`, `0.2.0-rc.2`, and
`0.2.1-alpha.1` … `0.2.1-alpha.4` after, for each version, running **that
version's own published `@deepseek-ai/dsh-client-modules` scanner** against this
package and confirming the CodeBlock DOM, locale API, and `inject` target row
the plugin depends on are still present. `0.1.7-rc.1` and `0.1.7-rc.2` stay
`unknown`: the same markers happen to hold there, but the 0.1 line was not
exercised and is not claimed.

## [0.3.0] - 2026-10-16

Rebuilt against dsh 0.2.0-rc.2 and the plugin spec shipped with it
(`cordis-plugin-development` skill). **Install steps changed — read
[docs/install.md](./docs/install.md).**

### Fixed

- **The plugin was inert on current dsh.** `dsh plugin --profile web add` is a
  pnpm passthrough: it installs the dependency but never registers a bundle
  layer, so the row was absent from the composed profile. The docs claimed
  otherwise; both the docs and the packaging now match reality, and
  `plugin_manager install_bundle` is the documented path.
- **Mermaid fences were no longer detectable.** Current dsh renders a fence
  header through `CodeToolbar`, which prints the *generic* code label for a
  language shiki does not know — the `mermaid` info string never reaches the DOM.
  Detection is now content-based (leading Mermaid statement) with the explicit
  label still honored where a surface prints one.
- **Diagrams fought React.** The old code replaced the React-owned `<pre>`. It
  now appends its holder after React's children and hides the original body with
  an attribute, so re-renders (theme switch, streaming settle) cannot orphan it,
  and the built-in copy button keeps working.
- Legacy `dsh.client.inject: ["@deepseek-ai/dsh-client-runtime"]` removed: that
  package no longer exists and never ordered anything.

### Added

- `index.js` Host half with the spec's named `apply` export (was a client-shaped
  default export used as the package entry).
- `locale/en.json` + `locale/zh.json` display metadata, `icon.svg`, and the
  `exports` entries dsh reads them through.
- Client locale integration: the source/diagram toggle follows the interface
  language and refreshes on `locale/change`.
- `suppressErrorRendering: true` so a parse failure cannot inject mermaid's own
  error graphic into the page.
- `npm run check`: syntax, manifest contract, `dist`/`src` freshness, 25
  detection cases, and one Mermaid pin across plugin/demo/docs.

### Changed

- Client artifact renamed to `dist/client.js` (`exports["./client"]`); the dynamic
  payload stays at `dist/dsh-mermaid-preview.client.js`. One `scripts/build.mjs`
  emits both; `cordis.yml` became `cordis.patch.yml`.
- Render scheduling: 250 ms settle debounce and a serialized render queue, so
  streaming and multi-diagram messages no longer thrash the main thread.
- Mermaid pinned to 11.17.2 (was 11.16.1).
- Every side effect is now fiber-owned and removed on dispose, including timers
  and the injected `<script>`.

## [0.2.1] - 2026-08-14

### Fixed

- Native `dsh plugin add` install actually loaded: the previous release only
  shipped the dynamic-runner payload, so the web `client-modules` loader never
  served the plugin (404 on `/plugins/dsh-mermaid-preview/client.js`, absent from
  `window.__DSH_BOOT__`) and nothing rendered. Two changes fix it:
  - `package.json` `exports` now exposes `./package.json` (required for the
    client-modules manifest discovery scan).
  - `exports["./client"]` now points at a browser-loadable bundle
    (`dist/dsh-mermaid-preview.bundle.js`) that calls
    `window.__ModuleLoader__.load({ id, factory })` with a CommonJS factory
    exporting `apply` — the same shape dsh's own native client plugins use.
- Added `scripts/build-client-bundle.mjs` to derive that native bundle from
  `src/client.js`; `npm run build`/`check` now emit and verify both artifacts
  (dynamic payload + native bundle).

## [0.2.0] - 2026-08-14

### Added

- `dsh bundle` support: `package.json` now declares `dsh.bundle.patch` and
  `dsh.client.inject`, enabling native installation via `dsh plugin --profile web add`.
- `cordis.yml` composition file for automatic plugin registration.
- `assets/banner.png` repository banner (1280×640, dark gradient).
- README.md / README.en.md embed the banner image.

### Changed

- Installation docs now lead with `dsh plugin add` as the primary method.
- Dynamic plugin (cordis_define) demoted to Option 4 / fallback.

## [0.1.0] - 2026-08-14

### Added

- Initial release: dynamic Cordis client plugin that renders Mermaid fenced code
  blocks in every dsh web Markdown surface (chat, trajectory, plan review, …).
- MutationObserver-based DOM hook with no modification to the dsh web shell.
- Mermaid 11 (UMD) loaded from jsDelivr via a `<script>` tag; no build step,
  no bundling into the host app.
- Follows the dsh light/dark theme and re-renders diagrams on theme change.
- Per-diagram "show source / show diagram" toggle; copy button of the original
  code block keeps working.
- Graceful fallback: on CDN or syntax failure the original code block is kept
  and an inline error note is shown.
- Dependency-free standalone demo page (`demo/`) with 10 diagram-type presets.
- Bilingual documentation (中文 / English), install guide, architecture notes.
