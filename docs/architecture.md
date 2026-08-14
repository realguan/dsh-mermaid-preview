# 实现原理

`dsh-mermaid-preview` 是一个**纯客户端、免构建**的 Cordis 动态插件：不改动
dsh Web 壳层（shell）的任何源码，只靠浏览器 DOM 观察与标准全局 API 工作。

## 为什么需要 DOM 扫描，而不是改 Markdown 渲染器

dsh Web 的 Markdown 渲染（`packages/client/ui-primitives` 中的
`MarkdownText`）是一条「mdast → React」的直接管线，`mermaid` 不在其
shiki 语法白名单里，因此：

- mermaid 围栏被渲染为**纯文本代码块**（无高亮，但结构稳定）；
- 渲染器本身没有对第三方开放「代码块渲染器」扩展点；
- 动态插件也无法 hook 该 React 组件。

于是插件选择了对**渲染结果**做观察与替换：只要 DOM 里出现满足条件的
代码块，就把它变成图表。好处是不依赖任何 dsh 内部 API，天然覆盖对话、
轨迹、计划评审等所有使用 `MarkdownText` 的视图；代价是依赖渲染器的
DOM 输出结构（见下），dsh 升级若改变该结构需要同步适配。

## 挂载点：`.md-code-block` 的稳定结构

`CodeBlock` 组件（`ui-primitives/src/markdown/CodeBlock.tsx`）对未知语言
围栏输出：

```html
<div class="md-code-block …">            <!-- 根包装，类名固定 -->
  <div class="…bannerWrap">
    <div class="…banner">
      <div class="…infostring">mermaid</div>   <!-- 围栏语言标签 -->
      <div class="…action"><button>复制</button></div>
    </div>
  </div>
  <pre class="…plain"><code>…源码…</code></pre>  <!-- 纯文本兜底 -->
</div>
```

插件据此识别：

1. 找到 `.md-code-block`；
2. 读取横幅第一个子 div 的文本（`blockLang`），小写比对 `mermaid`；
3. 命中后取出 `<pre>` 的 `textContent` 作为 Mermaid 源码。

> 已知语言（ts/bash/json 等）由 shiki 渲染成 `<div dangerouslySetInnerHTML>`，
> 没有 `<pre>` 兜底，也不会命中 `mermaid` 标签，天然互不干扰。

## 渲染管线

```
MutationObserver(document.body)
  └─ 新增节点 / 文本变化
      └─ 命中 .md-code-block[infostring=mermaid] 且未处理
          └─ loadMermaid(): <script src=jsDelivr mermaid@11.16.1>（去重，仅一次）
              └─ mermaid.initialize({ theme: 跟随 dsh 主题, securityLevel: 'strict' })
                  └─ mermaid.render(唯一id, 源码)
                      └─ <pre> → .dsh-mermaid 容器（SVG + 隐藏源码 + 切换按钮）
```

关键细节：

- **流式→结束**：流式期间渲染器不传语言标签（`streaming` 分支
  `lang = undefined`），横幅为空；消息结束后 React 原地更新横幅文本，
  属于 `characterData` 变化——观察器监听字符级变化正是为了捕获这一瞬间。
- **去重与防回环**：每个代码块设置 `data-dsh-mermaid` / `data-dsh-busy`
  标记；观察器跳过 `[data-dsh-mermaid]` 子树内的一切变化，避免「渲染 →
  触发观察 → 再渲染」的无限循环。
- **React 重建**：消息视图切换、列表重渲染会重建代码块 DOM，观察器
  会重新捕获并渲染，无需额外状态。
- **渲染 id 唯一**：`mermaid.render` 要求 id 全文档唯一，使用
  `dsh-mermaid-<时间戳36进制>-<自增>`。
- **主题跟随**：读 `theme.getTheme().active.colorScheme` 决定 mermaid 的
  `dark` / `default` 主题，监听 `theme/change` 事件重绘可见图表。
- **失败兜底**：CDN 加载失败或语法错误时，保留原始代码块并显示一行
  红色错误提示；加载失败不重试，避免反复请求。

## 生命周期

所有副作用都挂在插件 fiber 上：

- 样式：在 `ctx.effect` 里创建 `<style>` 元素注入 CSS，并返回 `() => style.remove()`
  作为清理函数 —— 浏览器端客户端运行时不提供 `styles` 服务，故不依赖它；
  停止/更新插件时自动移除注入的样式；
- 观察器：`ctx.effect(() => { observer.observe(…); return () => observer.disconnect() })`；
- 主题监听：`ctx.on('theme/change', …)` —— Cordis 事件绑定随 fiber 释放。

## 安全

- Mermaid 以 `securityLevel: 'strict'` 初始化：HTML 标签渲染、点击跳转等
  高风险能力被禁用，仅输出受控 SVG。
- 插件不读取、不透传任何会话数据；只处理页面里**已渲染**的 mermaid 代码块
  文本，且不向任何服务器上报。
- CDN 脚本与 dsh 页面同源策略一致（无 CSP 限制的部署下可用）。

## 局限与已知边界

| 边界 | 说明 |
| --- | --- |
| 依赖网络 | Mermaid 库按需从 jsDelivr 加载；离线部署需改 CDN 常量或自托管 |
| 不参与流式 | 只在消息结束后渲染（避免抖动与重复重绘） |
| 只认 `mermaid` 标签 | `mmd` 等别名不会触发；如需支持可在 `blockLang` 处扩展 |
| DOM 结构耦合 | 依赖 `.md-code-block` / 横幅结构；dsh 升级若改动需同步适配 |
| 主题事件名 | 依赖 `theme/change` 事件；版本差异需按上文 FAQ 调整 |
| 已渲染 SVG 不回收 | 停止插件不会移除已渲染的 SVG（它们是内容，不是副作用） |

## 目录速览

```
src/client.js       插件唯一源码（ES module 形式，export default）
scripts/build-dynamic.mjs   从 src 生成 dist 粘贴载荷
dist/               生成的动态插件载荷（提交到仓库，开箱即用）
demo/               零依赖独立演示页（无需 dsh）
examples/           图型示例合集
docs/               安装与原理文档
```
