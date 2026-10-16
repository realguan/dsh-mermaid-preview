# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
