# 安装指南

本插件支持多种安装方式，按推荐程度排序。

---

## 方式一：dsh 原生命令安装（推荐）

### 前置条件

- dsh CLI ≥ 0.1.0-rc（支持 `dsh plugin` 命令）
- pnpm（dsh plugin 内部使用）
- 浏览器可访问 jsDelivr CDN（插件按需加载 Mermaid 库）

### 安装

```bash
dsh plugin --profile web add dsh-mermaid-preview
```

这条命令做了三件事：
1. 用 pnpm 将 `dsh-mermaid-preview` 安装到 web profile 的依赖
2. 自动识别包内的 `dsh.bundle.patch` 声明，将插件注册为 profile 的 bundle 层
3. 重启 `dsh web` 后插件自动激活

### 从 GitHub 安装（跟踪最新源码）

```bash
dsh plugin --profile web add github:realguan/dsh-mermaid-preview
```

### 从本地路径安装（参与开发）

```bash
git clone https://github.com/realguan/dsh-mermaid-preview.git
cd dsh-mermaid-preview && npm run build
dsh plugin --profile web add .
```

### 卸载

```bash
dsh plugin --profile web remove dsh-mermaid-preview
```

重启 `dsh web` 后生效。

### 更新

```bash
dsh plugin --profile web update dsh-mermaid-preview
```

---

## 方式二：动态插件（会话内定义，免 profile 修改）

适用于临时试用或无法使用 `dsh plugin` 命令的场景。

### 安装步骤

1. 打开任意 dsh 会话，让模型执行：

   ```
   cordis_define
   ```

2. 在 `code.client` 参数中粘贴 **`dist/dsh-mermaid-preview.client.js`** 的完整内容。

   参数建议：

   | 参数 | 值 |
   | --- | --- |
   | `plugin.kind` | `new`，`idPrefix` 填 `merm` |
   | `name` | `Mermaid 渲染` |
   | `purpose` | 一句话说明：把 mermaid 围栏渲染为图表 |
   | `code.client` | `dist/dsh-mermaid-preview.client.js` 全文 |

3. 执行：

   ```
   cordis_run <返回的 pluginId> <返回的 packageId>
   ```

4. 在 Run 卡片上点击 **允许（Allow）**，等待激活完成。

5. 验证：发送一条包含 ````` ```mermaid ```` 围栏的消息，代码块应被渲染成图表。

### 卸载

```
cordis_stop <pluginId>   # 停用（保留定义，可随时再启动）
cordis_undefine <pluginId>  # 彻底删除
```

### 更新

修改 `src/client.js` 后运行 `npm run build` 重新生成载荷，然后：

```
cordis_define   # plugin.kind = existing，pluginId 不变，粘贴新载荷
cordis_run <pluginId> <新packageId>  # mode = update
```

---

## 方式三：自建 dsh 分支静态挂载

适用于你维护自己的 dsh 部署（fork deepseek-harness）的场景。本仓库已经包含
`dsh.bundle.patch` 和 `dsh.client.inject` 声明，兼容 dsh 的 bundle 插件体系。

概括步骤（具体路径以你的分支版本为准）：

1. 将本仓库作为 workspace 包加入（`pnpm-workspace.yaml` 增加一行，例如
   `plugins/*`）。
2. 确保 `src/client.js` 的 TypeScript 等价版本通过构建（或直接用 JS）。
3. 本仓库的 `cordis.yml` 已经声明了 `insert` 行，会自动注册客户端插件。
4. 重新构建 Web 产物并部署。

> 注意：dsh 的客户端插件运行时（`cordis-client-runner`）对**动态**包开放
> DOM 全局（`document`/`window`）；静态 bundle 插件同样可用，但请以你 fork 的
> `packages/extensions/cordis-client-runner` 源码为准。

---

## 常见问题

### 图表没有渲染，代码块下方出现红色提示

- `Mermaid 加载失败：mermaid CDN script failed to load` —— 浏览器访问
  jsDelivr 失败（离线 / 被墙 / 代理）。可改用其他镜像：
  修改 `src/client.js` 顶部的 `CDN` 常量（例如 `unpkg.com` 或自建镜像），
  重新 `npm run build` 并更新插件。
- `Mermaid 渲染失败：…` —— Mermaid 语法错误。对照
  `examples/showcase.md` 的写法检查，或在 `demo/` 里先验证语法。

### 流式输出过程中不渲染？

设计如此：流式期间 Markdown 渲染器不携带语言标签，只有消息**结束**后
插件才会接管渲染，避免对流式内容反复重绘。

### 图表不跟随主题切换？

插件监听 `theme/change` 事件自动重绘。若你的 dsh 版本事件名不同，请
调整 `src/client.js` 中 `ctx.on('theme/change', reflowTheme)` 一行。

### 为什么图表下方还有一个「显示源码」按钮？

点击可切换 图表 / 源码视图；源码视图保留了原代码块的全部文本，
复制按钮（横幅上）仍然可用。
