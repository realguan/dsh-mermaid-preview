# dsh-mermaid-preview

<p align="center">
  <img src="assets/banner.png" alt="dsh-mermaid-preview banner" width="100%" />
</p>

在 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（dsh）Web
界面中，把 Markdown 的 `mermaid` 围栏代码块渲染为图表的 Cordis 客户端插件。

对话、轨迹、计划评审、摘要 —— 所有走 `MarkdownText` 渲染的视图，一处接入，
处处生效。

> English README: [README.en.md](./README.en.md)

## 安装

### 方式一：dsh 原生命令（推荐）

```bash
dsh plugin --profile web add github:realguan/dsh-mermaid-preview
```

一条命令完成：从 GitHub 克隆 + pnpm 安装 + 自动注册为 web profile 的 bundle 层
+ 重启 `dsh web` 即生效。

> 如果你的 dsh 版本不支持 `dsh plugin`，请先升级 dsh CLI：
> `npm i -g @deepseek-ai/dsh`

### 方式二：本地路径安装

```bash
git clone https://github.com/realguan/dsh-mermaid-preview.git
cd dsh-mermaid-preview && npm run build
dsh plugin --profile web add .
```

### 方式三：动态插件（免安装，会话内定义）

如果不想修改 profile，可以在 dsh 会话中让模型执行 `cordis_define`，
将 `dist/dsh-mermaid-preview.client.js` 的内容粘贴为 `code.client`，
再执行 `cordis_run` 并允许。详见 [docs/install.md](./docs/install.md)。

> #### 🧩 关于两种安装产物（build 后自动生成）
>
> `npm run build` 会同时产出两份客户端代码，机制和格式完全不同：
>
> | 产物 | 用途 | 格式 | 加载链 |
> | --- | --- | --- | --- |
> | `dist/dsh-mermaid-preview.client.js` | 动态插件（`cordis_define`） | 函数体 `return {...}` | 会话内动态 runner |
> | `dist/dsh-mermaid-preview.bundle.js` | 原生 bundle（`dsh plugin add`） | `__ModuleLoader__.load({id, factory})` | web profile 的 `client-modules` |
>
> `dsh plugin add` 依赖 **bundle 产物**：它要求 package.json 的 `exports` 暴露
> `./package.json`、并把 `./client` 指向 bundle。改了 `src/client.js` 后务必
> `npm run build` 再重装，否则原生安装拿不到新渲染逻辑。

### 卸载

编辑 `~/.dsh/profiles/web/package.json`，删除 `dependencies` 里的
`"dsh-mermaid-preview"` 一行，然后：

```bash
cd ~/.dsh/profiles/web && pnpm install
```

重启 `dsh web` 后生效。插件注入的样式和 DOM 观察器随 profile 层移除而清理；
已渲染的 SVG 保留（属于内容），重新加载页面即恢复原样。

### 更新

重新执行安装命令即可（pnpm 会自动拉取最新版本）：

```bash
dsh plugin --profile web add dsh-mermaid-preview
```

## 特性

- 🖼️ **免改壳层**：不修改 dsh 任何源码，通过 DOM 观察自动接管 mermaid 围栏
- ⚡ **一条命令安装**：`dsh plugin add` 自动完成注册与依赖管理
- 🌗 **跟随主题**：自动适配 dsh 明/暗主题，切换时实时重绘
- 📋 **保留交互**：原代码块的复制按钮继续可用，另附「显示源码/显示图表」切换
- 🛟 **失败兜底**：CDN 不可达或语法错误时保留代码块并给出提示
- 🧹 **干净卸载**：停止插件即移除样式、观察器与监听
- 🧪 **独立演示**：`demo/` 是零依赖的纯 HTML 演示页，不需要 dsh 也能体验
- 📚 **多图型**：flowchart / sequenceDiagram / classDiagram / stateDiagram-v2 /
  gantt / pie / erDiagram / journey / mindmap / gitGraph / timeline

## 本地体验独立演示页（无需 dsh）

```bash
npm run demo        # → http://localhost:8090
```

左侧编辑 Mermaid 源码（内置 11+ 种图型预设），右侧实时渲染，主题可切换。

## 图型示例

见 [examples/showcase.md](./examples/showcase.md) —— 11 种图型的可直接粘贴
源码；`demo/demo.js` 里有同样的预设。

## 工作原理（30 秒版）

dsh 的 Markdown 渲染器对未知语言（含 `mermaid`）输出稳定的
`.md-code-block` 结构，横幅标明语言、正文是 `<pre><code>` 纯文本。
插件用 `MutationObserver` 监听 `document.body`，发现 `mermaid` 围栏后
通过 `<script>` 按需加载 Mermaid 11（jsDelivr CDN），把 `<pre>` 替换为
渲染好的 SVG——语言横幅与复制按钮原样保留。

```mermaid
flowchart LR
    A[Markdown 渲染器<br/>输出 .md-code-block] -->|MutationObserver 发现 mermaid 围栏| B[加载 Mermaid 11<br/>jsDelivr CDN]
    B --> C[读取 pre 源码]
    C --> D[mermaid.render<br/>securityLevel strict]
    D --> E[SVG 替换 pre]
    E --> F[保留横幅 + 复制按钮<br/>可切换 图表/源码]
```

完整原理、设计取舍与已知边界见 [docs/architecture.md](./docs/architecture.md)。

## 目录结构

```
cordis.yml             dsh bundle composition（dsh plugin add 读取）
src/client.js          插件唯一源码（ES module，apply 即全部逻辑）
scripts/build-dynamic.mjs      生成 dist 动态粘贴载荷
scripts/build-client-bundle.mjs 生成 dist 原生 bundle 客户端半体
dist/dsh-mermaid-preview.client.js   动态插件载荷（cordis_define 粘贴用）
dist/dsh-mermaid-preview.bundle.js   原生 bundle（dsh plugin add 加载用）
demo/                  零依赖独立演示页
examples/showcase.md   图型示例合集
docs/install.md        安装 / 卸载 / 更新 / FAQ
docs/architecture.md   实现原理与安全说明
```

## 技术要点

| 项 | 值 |
| --- | --- |
| 平台 | dsh Web（客户端） |
| 插件形态 | dsh bundle 客户端插件（`dsh plugin add`） |
| Mermaid | 11.16.1（UMD，jsDelivr CDN，可按需改镜像） |
| 依赖 | 无运行时依赖；工具脚本仅用 Node 内置模块 |
| 安全 | `securityLevel: 'strict'`；不采集任何数据 |
| 许可证 | MIT |

## 常见问题

- **完全不渲染（围栏只是普通代码块）**：先确认插件进了浏览器启动清单
  `window.__DSH_BOOT__`。若没有、`/plugins/dsh-mermaid-preview/client.js` 返回
  404，通常是你装的是旧版本（≤ 0.2.0，缺 bundle 产物）或改了源码没重装。
  升级到新版本后重装并重启：`dsh plugin --profile web add github:realguan/dsh-mermaid-preview`
  （详见 [docs/install.md](./docs/install.md) 的 FAQ）。
- **没渲染且报 CDN 加载失败**：离线环境或 jsDelivr 不可达。修改
  `src/client.js` 的 `CDN` 常量后 `npm run build` 再更新插件。
- **流式过程中不渲染**：设计如此，消息结束后才渲染。
- **主题切换后不重绘**：确认你的 dsh 版本事件名为 `theme/change`。

更多见 [docs/install.md](./docs/install.md) 的 FAQ 一节。

## 贡献

见 [CONTRIBUTING.md](./CONTRIBUTING.md)。修改 `src/client.js` 后请
`npm run build` 并同步提交 `dist/` 产物。

## 致谢

- [mermaid](https://github.com/mermaid-js/mermaid) —— 图表引擎
- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) —— dsh 平台
- [jsDelivr](https://www.jsdelivr.com/) —— CDN 分发

## License

[MIT](./LICENSE) © 2026 realguan
