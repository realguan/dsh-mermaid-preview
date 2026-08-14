# dsh-mermaid-preview

在 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（dsh）Web
界面中，把 Markdown 的 `mermaid` 围栏代码块渲染为图表的 Cordis 客户端插件。

对话、轨迹、计划评审、摘要 —— 所有走 `MarkdownText` 渲染的视图，一处接入，
处处生效。

> English README: [README.en.md](./README.en.md)

## 特性

- 🖼️ **免改壳层**：不修改 dsh 任何源码，通过 DOM 观察自动接管 mermaid 围栏
- ⚡ **免构建安装**：动态插件一键定义运行，适合任何 dsh 部署
- 🌗 **跟随主题**：自动适配 dsh 明/暗主题，切换时实时重绘
- 📋 **保留交互**：原代码块的复制按钮继续可用，另附「显示源码/显示图表」切换
- 🛟 **失败兜底**：CDN 不可达或语法错误时保留代码块并给出提示
- 🧹 **干净卸载**：停止插件即移除样式、观察器与监听
- 🧪 **独立演示**：`demo/` 是零依赖的纯 HTML 演示页，不需要 dsh 也能体验
- 📚 **多图型**：flowchart / sequenceDiagram / classDiagram / stateDiagram-v2 /
  gantt / pie / erDiagram / journey / mindmap / gitGraph / timeline

## 快速开始

### 在 dsh 中安装（动态插件，约 1 分钟）

1. 在 dsh 会话中让模型执行 `cordis_define`；
2. `code.client` 参数粘贴 **`dist/dsh-mermaid-preview.client.js`** 全文；
3. 执行 `cordis_run` 并在 Run 卡片上允许；
4. 发送一条含 mermaid 围栏的消息验证。

详细步骤与卸载/更新说明见 [docs/install.md](./docs/install.md)。

### 本地体验独立演示页（无需 dsh）

```bash
npm run demo        # → http://localhost:8090
# 或任意静态服务器指向 demo/ 目录
```

左侧编辑 Mermaid 源码（内置 10+ 种图型预设），右侧实时渲染，主题可切换。

### 图型示例

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
src/client.js                插件唯一源码（ES module）
scripts/build-dynamic.mjs    生成 dist 粘贴载荷
dist/dsh-mermaid-preview.client.js   动态插件载荷（开箱即用）
demo/                        零依赖独立演示页
examples/showcase.md         图型示例合集
docs/install.md              安装 / 卸载 / 更新 / FAQ
docs/architecture.md         实现原理与安全说明
```

## 技术要点

| 项 | 值 |
| --- | --- |
| 平台 | dsh Web（客户端） |
| 插件形态 | 动态 Cordis 客户端插件（`code.client`） |
| Mermaid | 11.16.1（UMD，jsDelivr CDN，可按需改镜像） |
| 依赖 | 无运行时依赖；工具脚本仅用 Node 内置模块 |
| 安全 | `securityLevel: 'strict'`；不采集任何数据 |
| 许可证 | MIT |

## 常见问题

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
