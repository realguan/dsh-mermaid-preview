# 视觉设计

面向 dsh 对话/轨迹等 Markdown 表面的图表渲染设计。目标不是「把 mermaid 画出来」，
而是**让图表成为对话里有质感的内容**，而不是从别的产品里贴过来的第三方控件。

> 本文档记录 0.5.0 的视觉重构（Radix Colors 等 7 套开源设计系统主题 + 中性备选）：
> 设计原则、用到的 token、图表主题、卡片内主题切换器、卡片/查看器/失败态的规格，
> 以及验证方式。

---

## 1. 设计原则

1. **宿主优先。** 图表卡片和同一列里的代码卡片是同级内容：圆角、字号、图标语法、
   卡片表面都取自 dsh 的设计系统；图表本体则负责「内容该有的色彩」。
2. **内容是图，chrome 退后。** 图表不是代码：去掉「代码块」标签；卡片只保留一个
   轻量头部（彩色类型标签 + 三个 16px 图标），把面积留给图本身。
3. **多彩但可读。** 默认主题走 Radix Colors（作者选择）：节点粉彩底 + 同色系高饱和
   描边，数据类图表用 vivid 调色板；连线保持中性灰、文字保持 label 色，颜色只做信息
   分层，不把所有元素都染成高饱和。
4. **完整可见优先，布局交给读者。** 图永远按卡片宽度完整适配：宽图等比缩小到
   整图可见（不裁切、不横向滚动），小图最多放大 1.5×。高的图有两种布局，头部
   布局按钮切换并记住：**滚动容器（默认）** 限高、卡片内滚动；**完整展开** 让
   卡片随图变高、滚轮直接滚文档。需要看清细节时打开全窗口查看器（fit 会把小图
   放大到填窗，上限 2.5×）。
5. **失败也要体面。** 一句人话 + 可展开的技术详情，而不是把解析器内部错误倒满屏幕。
6. **动效服务于理解。** 150–200ms 的淡入/位移，尊重 `prefers-reduced-motion`；
   不为炫技加弹跳、发光或渐变。

## 2. 设计 token

卡片外壳直接消费 dsh 主题变量（`@deepseek-ai/dsh-client-ui-theme`），因此明暗切换
不需要重绘外壳：

| 用途 | token | 说明 |
| --- | --- | --- |
| 卡片背景 | `--dsw-alias-markdown-code-block` | 和代码卡片同一表面（light `#F9FAFB` / dark `#1B1B1C`） |
| 卡片头部 | `--dsw-alias-markdown-code-block-banner` | dark 下比正文浅一档，和代码卡片一致 |
| 文字 | `--dsw-alias-label-primary/secondary/tertiary` | 标签/图标用 secondary/tertiary |
| 描边 / 升层 | `--dsw-alias-border-l1/l2`、`--dsw-elevation-prominent` | 查看器悬浮工具条与图纸 |
| 交互 | `--dsw-alias-interactive-bg-hover/active` | 图标按钮 hover / 按下 |
| 失败态 | `--dsw-alias-state-warn-primary`（语法错）、`--dsw-alias-state-error-primary`（加载失败） | 提示条图标与 7% 底色 |
| 圆角 | `--dsw-radius-xs/sm/md/lg` = 4/8/12/16 | 卡片 16，头部 16/0/0/16，按钮 8 |
| 字体 | `--dsw-font-family`、`--ds-font-family-code` | 正文系统字体；类型标签、错误详情用等宽 |
| 动效 | `--ds-ease-in-out` = `cubic-bezier(.4,0,.2,1)` | 120/160/180ms |

图表主题使用各设计系统自己的色板（Radix Colors、Apple HIG、GitHub Primer 等，明暗
各一套），而不是 dsh alias token：这些色板是主题的一部分，用于内容上色；卡片外壳仍
完全跟随 dsh 主题。所有外壳变量都带 fallback，脱离 dsh 的独立演示页也能显示。

### 2.1 类型标签配色

卡片头部左侧的类型标签是 Apple 风格的 tint 标签：背景是系统色的淡 tint，文字是同色系
的可读深色（暗色主题下是提亮版系统色）。每种图型固定一种颜色，例如：
flowchart 蓝、sequenceDiagram 绿、classDiagram 紫、stateDiagram 橙、gantt 粉、
pie 靛蓝、timeline 红、mindmap 青绿。hover/focus 时标签不抢焦点；它在明暗主题下都
保持同一色相，形成「看图型颜色就知道是什么图」的稳定记忆点。

## 3. 图表主题（`src/theme.js`）

mermaid 默认的 `default` / `dark` 主题是通用配色，和 dsh 放在一起会显得突兀。
现在使用 `theme: 'base'` + 多套自建变体，用 `themeCSS` 补 mermaid 没有变量的部分，
用 `CONFIG`/`SCHEME_CONFIG` 调各图型布局：

| 变体 | 说明 |
| --- | --- |
| `radix`（默认） | Radix Colors：12 阶色板取实色，通透明亮，8px 圆角 |
| `apple` | Apple HIG 系统色：粉彩节点 + 同色系高饱和描边；饼图/甘特/时间线 vivid 调色板 |
| `github` | GitHub Primer：克制的蓝/绿/粉/橙，6px 圆角 |
| `carbon` | IBM Carbon：冷蓝/紫/橙，**2px 方角**、企业感 |
| `atlassian` | Atlassian Design System：蓝绿为主，4px 圆角 |
| `material` | Material Design 2：Google 饱和色 + 柔和粉彩，2px 方角 |
| `polaris` | Shopify Polaris：靛蓝/青绿/金，6px 圆角 |
| `quiet`（备选） | 原来的 dsh 中性主题：白/深灰节点、发丝描边、DeepSeek 蓝只做点缀 |

开源变体的色值来自各设计系统已发布的 token：Primer primitives、Radix Colors
（step 9 实色 + slate 中性色）、Carbon Colors、@atlaskit/tokens、Material Design 2
色板、Polaris tokens。实现上只保留每套的「实色 hues + 中性色」，粉彩 tint、行色、
强调文字、on-accent 文字由 `buildPalette()` 推导，所以新增一套设计系统只需要一张
色板表。极亮的规范色（如 Radix yellow/mint、Material yellow）会先做「描边可读性」
归一到与卡片对比 ≥2.2，再参与循环，避免节点边框消失。

切换：

- **在卡片里切（推荐）**：每张图表卡片头部的调色板按钮打开主题菜单，8 套变体各带
  由自身色板取样的三色 swatch，当前项打勾。选择后页面上所有图表即时重绘，选择存在
  `localStorage`（`dsh-mermaid-preview:theme`），刷新或重开界面仍生效。菜单是挂在
  `<body>` 下的 fixed 弹层（不会被卡片的滚动容器裁掉），靠近视口底部时自动向上翻开，
  并收拢在视口内；支持 `↑`/`↓`/`Home`/`End` 移动、`Enter`/`Space` 选择、`Esc` 关闭并
  把焦点还给触发按钮。
- **改默认值**：改 `src/theme.js` 的 `THEME_VARIANT` 后 `npm run build`；没有本地
  选择时用它。

```js
// src/theme.js
export const THEME_VARIANT = 'radix'   // 或 apple / github / carbon / atlassian / material / polaris / quiet
```

`CONFIG` 与字体栈所有变体共享。演示页顶部的「风格」下拉框可以在浏览器里实时对比
全部变体（明暗均跟随），无需重新构建。

### 3.1 默认变体取值（Radix Colors）

| 项 | light | dark |
| --- | --- | --- |
| 卡片/背景 | `#F9FAFB` | `#1B1B1C` |
| 节点底 | Radix 实色与卡片混合的粉彩（step 3–4 观感） | 同色相更深 tint |
| 节点描边 | Radix 各色相 step 9 实色（`#0090ff`、`#30a46c`、`#f76b15`、`#d6409f`…） | 暗色 step 9 实色 |
| 文字 | slate12/11/9（`#1c2024` / `#60646c` / `#8b8d98`） | `#edeef0` / `#b0b4ba` / `#696e77` |
| 连线 / 箭头 | `#b9bbc6` | `#5a6169` |
| 子图/卡片容器 | 中性灰（不参与色彩轮换） | 中性深灰 |

- 字号基准 14px；节点正文 13–14px；轴/commit/autonumber 等元数据 11–12px。
- 流程图/状态图/类图/ER 的节点按 `themeCSS` 的 `nth-of-type(6n+k)` 轮换 6 种色相；
  子图（`.clusters`）保持中性，避免和节点抢颜色。节点圆角跟随变体的形状语言
  （Carbon/Material 2px、GitHub/Polaris 6px、Radix/Apple 8px）。
- 序列图：actor 淡蓝 tint、alt/loop 标签紫/粉 tint、便签使用 yellow tint、autonumber
  靛蓝圆标；连线/箭头中性灰。
- 饼图/时间线/git 分支/象限图/xy 图使用该变体的 vivid 实色 ramp；甘特图任务条用主题
  蓝，分区底色是淡蓝/淡橙交替，today 线红。
- 暗色方案下同一色相换成对应设计系统的暗色实色，节点 tint 加深，文字用亮色 label。
- Journey 的分区底色是 **config 数组**（不是 theme variable），所以放在
  `SCHEME_CONFIG` 里随变体和明暗切换。

### 3.1.1 全部 23 种示例图型的覆盖（0.5.1）

mermaid 11.x 的 beta 图型与 C4 各有自己的硬编码路径，只写 `themeVariables` 不够：

- `block` 的节点画在 `g.block` 下，节点循环必须同时匹配 `.nodes g.node` 与
  `.block g.node`；带标签的边要补 `.block .edgeLabel`。
- `packet` 的 cell/label/title 颜色全部硬编码（`#efefef`/`black`），只能用
  themeCSS 接管 `.packetBlock` 等类。
- **C4** 的元素颜色由 renderer 写成 inline `!important`，**只能**从 `c4` 图型
  config 的 `*_bg_color`/`*_border_color` 进入；标签白色也是 inline，但可见字形在
  `<tspan>` 上，themeCSS 打 tspan 的 `fill` 即可；关系线/边界框的 `#444444` 是
  presentation attribute，用属性选择器接管。C4 字体来自 `c4.*FontFamily`，全部
  换成 `FONT_STACK`。
- `sankey` 的节点色是 d3 Tableau10 写进 `<rect fill>` 属性，themeCSS 的
  `nth-of-type` 循环可以覆盖（CSS 优先于 presentation attribute）；流带改用
  `sankey.linkColor` 的中性线色，并关掉暗色下不可见的 `multiply` 混合。
- `architecture` 的边/分组框是 `arch*` themeVariables（此前未设，落到 `#777`/
  `#000`），内置服务图标的 `#087ebf` 背景只能用 `!important` 覆盖；
  `radar` 的 graticule/curve 走 `themeVariables.radar` + themeCSS；
  `journey` 的表情眼睛、`gantt` 的 `currentColor` 网格线、`sequence` 的序号字体
  也都在 themeCSS 里收口。

### 3.2 字体必须是字面量

mermaid 测量 HTML label 时用的是挂在 `<body>` 下的临时 SVG（继承宿主正文字体），
而最终 SVG 渲染在代码卡片里（继承宿主的**等宽**字体）。如果 `fontFamily: 'inherit'`，
「量出来窄、画出来宽」→ class/state 图里的成员文字会被裁掉。因此主题里所有字体都是
字面量字体栈，测量与渲染使用同一套。

### 3.3 为什么单独一个文件

`src/theme.js` 是 ESM 模块，演示页直接 `import`；`scripts/build.mjs` 在打包时把它
（去掉 `export`）内联进两个产物，所以插件仍然只有一个可粘贴的源码文件。

## 4. 卡片规格

```
┌─ .md-code-block（dsh 的代码卡片，16px 圆角）───────────────┐
│ .dsh-mermaid-head   10/18/8/22 + 11px/18px               │
│   (flowchart) 彩色标签                 [复制][源码][放大]  │
│ .dsh-mermaid-canvas   padding 6/22/20，背景 = 卡片本身     │
│                     …                                    │
└──────────────────────────────────────────────────────────┘
```

- 卡片是 **CSS 列布局 + `order`** 把插件容器排到 React 源码前面，因此「图表」和
  「源码」共用同一个头部；壳层那条通用代码横幅用 `data-dsh-mermaid-banner` 属性隐藏
  （可逆，不删 React 节点）。
- 头部左侧是 tint 类型标签（按图型取色，见 §2.1），右侧是 24px 命中区的 16px 图标
  按钮（复制源码 / 显示源码 / 放大），hover 出 tooltip，键盘用 1px focus ring；
  复制成功时图标变 Apple 绿。
- 图表不套第二层背景/边框：卡片本身就是画布。
- **尺寸策略：宽度永远完整适配；高度按读者选的布局处理。** 比容器宽的图缩到整图
  可见（不裁切、不横向滚动，所有图型同一规则；treemap 996px、packet 1026px、
  timeline 1252px 在 ~700px 卡片里分别缩到约 72% / 70% / 57%）。高度有两种模式，
  由头部布局按钮切换、写入 `localStorage`（`dsh-mermaid-preview:fit-mode`）：
  - `scroll`（默认）：画布 `max-height: min(900px, 85vh)` + `overflow:auto`，
    高图在卡片内滚动；
  - `grow`：不设高度上限、画布不是滚动容器，高图让卡片变高，滚轮事件直接交给
    消息列表。
  两种模式都只有宽度方向的显式缩放：自然高 >600px 的图保持 1:1，≤600px 的小图
  最多放大到 `MAX_READING_SCALE = 1.5`；放大后的宽度写回
  `--dsh-mermaid-fit-width`，与 mermaid 的 shrink-only inline `max-width` 用
  `!important` 解开，`fitKey` 防止 ResizeObserver 写读回环。treemap 的叶子标签由
  mermaid 从 38px 起自适应，主题里统一压到 20px（缩放后约 14px），避免它比其他
  图型大一号。
- 明暗切换、容器宽度变化（侧栏、字号、窗口）都会重新测量（`ResizeObserver`）。
- 渲染完成时 160ms 淡入；`prefers-reduced-motion` 下取消。

## 5. 全窗口查看器

- 遮罩：`--dsw-alias-bg-mask-3` + `backdrop-filter: blur(12px) saturate(140%)`。
- 图纸：克隆出来的 SVG 包在 `.dsh-mermaid-zoom-paper` 里 —— 卡片同色背景、
  16px 圆角、22px 内边距、升层投影；图不再是「紧贴纸边」。
- 工具条：顶部居中的悬浮胶囊（彩色类型标签 + − / 百分比 / + / 适应窗口 / 关闭），
  28px 命中区、8px 圆角、`--dsw-elevation-prominent`；底部是「滚轮缩放 · 拖拽平移 ·
  Esc 关闭」的安静提示胶囊，窄屏隐藏。
- 默认适应窗口，且**小图会被放大到填满窗口**（上限 `ZOOM_FIT_MAX = 2.5`；大图仍
  照旧缩小）：`817×603` 下 block ≈143%、`1440×900` ≈235%，双击 1:1 对小图才真正
  可见。滚轮以指针为锚点缩放，拖拽平移，双击适应 ↔ 1:1，方向键平移，
  `+`/`-`/`0`、`Esc`。焦点进入关闭按钮，关闭后归还。
- 打开/关闭有 160–180ms 的淡入与工具条位移，reduced-motion 下取消。

## 6. 失败态

```
⚠ 图表语法有误
  已保留源码，修正后会自动重新渲染。
  查看详情 ⌄     ← 展开后是解析器原文（等宽 11px，限高滚动）
```

- 底色：warn 7%（语法错误）/ error 7%（引擎缺失），圆角 12，12–13px 文字。
- 标题用 label-primary，说明用 tertiary，图标用对应 state 色。
- `details/summary` 原生展开，键盘可用；不再把整段 `Parse error …` 直接铺在卡片里。
- 流式中途的失败仍然静默重试（400/900/1800ms），只有文本稳定后仍失败才显示提示。

## 7. 验证

- `npm run check`：语法、manifest、产物同步、识别用例、mermaid 版本钉住。
- 视觉验证在「dsh 设计令牌复刻的对话界面」里跑**真实插件产物**，覆盖明暗、默认/
  宽图/失败/查看器/源码视图；0.5.1 起对 **23 种图型**（light + dark，8 套变体
  抽样）检查：无裁切标签、无 mermaid 原生默认色（`#ECECFF`/`#efefef`/Tableau10/
  C4 原色等）、无意外衬线字体、有效字号 ≥ 11px；图形自适应（1.5× 上限）与查看器
  适应窗口（2.5× 上限）也在真实插件产物上回归。
- 独立演示页（`npm run demo`）直接 import `src/theme.js`，是随手看主题效果的最短路径。

## 8. 已知边界

- 极宽的图缩到列宽后字会偏小，需要看清时用查看器；极长的图会让卡片变长（页面
  正常滚动），这是「完整可见、无内嵌滚动」的代价。放大有上限（卡片 1.5×、查看器
  2.5×），填满宽卡片需要 2.5–4.7×，会把图示变成海报。
- C4 的 label 白色是 renderer 写死的 inline `!important`：插件依赖 tspan 的
  `fill` 规则上墨，没有替换任何 React 节点；mermaid 若改变 C4 label 结构，主题会
  退化为白字，需要重新校准选择器。
- 部分图型的颜色是 mermaid 写死的 inline 属性（sankey 节点、packet cell 等）：
  themeCSS 覆盖的是**渲染结果**，SVG 源码里的原始属性仍在，复制源码不受影响。
- gantt 的标签在「任务条宽度 < 文字宽度」时会被 mermaid 移到条外（短任务、里程碑
  常见），这是上游布局规则；插件只保证条外标签使用可读的 outside 色，不再沿用
  条内 active/done/crit 文字色。想减少外置可缩小 gantt 字号或拉宽图表。
- 查看器不做完整焦点陷阱（`Tab` 可能走出弹层）；`Esc`/方向键会被拦下。
- 查看器里是静态 SVG 副本，`bindFunctions()` 的图内交互只在代码块那份上生效。
- 节点颜色轮换是装饰性的：`nth-of-type` 顺序是 mermaid 的节点迭代顺序，不是视觉顺序；
  mermaid 大版本升级后如果形状 class 改名，轮换规则会静默失效并回退到中性节点色
  （不会破坏渲染）。
- 饼图百分比用「白字 + 深色描边 halo」保证在 vivid 色块上的可读性；这是 Apple 变体
  唯一的非 4.5:1 文本 hack，如果更在意严格对比度可改用粉彩 ramp。
- Apple 色板是静态 HIG 值，不跟随用户自定义 dsh 强调色（中性主题才跟）。
