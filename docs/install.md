# 安装指南

dsh（DeepSeek Harness）的 Web 界面支持两种插件机制：

1. **动态 Cordis 插件**（本仓库的主要安装方式）—— 无需改源码、无需构建，
   在会话里直接定义并运行，适合任何 dsh 部署。
2. **静态客户端插件** —— 把插件作为源码并入自建 dsh 分支并重新构建 Web
   产物，适合深度定制部署。

本指南以方式一为主。

---

## 方式一：动态插件（推荐）

### 前置条件

- 一个运行中的 dsh Web 会话（`dsh web`）。
- 浏览器可访问 jsDelivr CDN（插件按需加载 Mermaid 库）。

### 安装步骤

1. 打开任意会话，让模型执行 Cordis 插件定义：

   ```
   cordis_define
   ```

2. 在 `code.client` 参数中粘贴 **`dist/dsh-mermaid-preview.client.js`** 的完整
   内容（那是 `cordis_define` 所需的函数体文本，已由
   `npm run build` 从 `src/client.js` 生成）。

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

> 提示：模型通常也会读取本仓库的 `src/client.js` 并自行生成等价代码；两者
> 效果一致，但使用 `dist/` 载荷可保证与仓库中的验证版本逐字节一致。

### 卸载

```
cordis_stop <pluginId>   # 停用（保留定义，可随时再启动）
cordis_undefine <pluginId>  # 彻底删除
```

停止插件会立即移除其注入的样式、DOM 观察器与主题监听；已渲染的 SVG 会
保留在页面上（属于内容而非插件副作用），重新加载页面即恢复原样。

### 更新

修改 `src/client.js` 后运行 `npm run build` 重新生成载荷，然后：

```
cordis_define   # plugin.kind = existing，pluginId 不变，粘贴新载荷
cordis_run <pluginId> <新packageId>  # mode = update
```

---

## 方式二：静态挂载（自建 dsh 分支）

适用于你维护自己的 dsh 部署（fork deepseek-harness）并希望插件随 Web 产物
一起构建的场景。概括步骤如下（具体路径以你的分支版本为准）：

1. 将本仓库作为 workspace 包加入（`pnpm-workspace.yaml` 增加一行，例如
   `plugins/*`），并把 `src/client.js` 按 dsh 客户端插件约定改写为
   TypeScript 模块（`export default` 的 Cordis 插件对象 + 可选的
   `dsh.client.inject` 声明）。
2. 在 Web 组合（composition）中注册该客户端插件行，使构建器把它纳入
   客户端入口图。
3. 重新构建 Web 产物并部署。

> 注意：dsh 的客户端插件运行时（`cordis-client-runner`）只对**动态**包开放
> DOM 全局（`document`/`window`）；静态插件同样可用，但请以你 fork 的
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
