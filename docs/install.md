# 安装与验证

> **0.3.0 起，安装方式变了。** `dsh plugin --profile web add <pkg>` 只是 pnpm
> 透传命令，它**只安装依赖、不会把包注册成 bundle 层**。0.2 之前文档里说的
> 「一条命令自动注册」已经不成立——这正是旧版本装上却不生效的原因。
> 现在必须把包名写进 profile 的 `dsh.profile.bundles`。

---

## 方式一：让 Agent 安装（推荐）

在 dsh 会话里让模型调用 `plugin_manager`：

```
action: install_bundle
target: /绝对路径/dsh-mermaid-preview     # 或 npm/github 安装源
```

它会完成 pnpm 安装 + 把包加进当前 profile 的 `dsh.profile.bundles`，并通过 HMR
立即生效（替换已装包的同名代码需要重启 dsh）。

## 方式二：手动安装到某个 profile

```bash
# 1. 取包（本地开发用 link，线上用 github: 或 npm:）
git clone https://github.com/realguan/dsh-mermaid-preview.git
cd dsh-mermaid-preview && npm run check     # 可选：本地自检

# 2. 装进 profile 依赖
dsh plugin --profile web add github:realguan/dsh-mermaid-preview

# 3. 关键一步：注册为 bundle 层
#    编辑 ~/.dsh/profiles/web/package.json，在 dsh.profile.bundles 数组里追加：
#      "dsh-mermaid-preview"
#    然后让配置生效：
cd ~/.dsh/profiles/web && pnpm install
```

也可以不改 `package.json`，改用 profile 的用户 patch 层
（`~/.dsh/profiles/web/cordis.patch.yml`）：

```yaml
- insert:
    - id: mermaid-preview
      name: dsh-mermaid-preview
```

重启 `dsh web`（或等 HMR）后生效。

### 验证安装是否成功

```bash
# 1. 组合结果里应该有 mermaid-preview 行
dsh --profile web --dump-config | grep -A2 mermaid-preview

# 2. 会话里让模型调用 plugin_manager list_bundles，
#    应看到 dsh-mermaid-preview：enabled=true, installed=true

# 3. 页面侧：随便发一条带 ```mermaid 围栏的消息，应看到图而不是代码块
```

### 卸载

```bash
# 让模型调用 plugin_manager：action: remove_bundle, target: dsh-mermaid-preview
# 或者手动：
#   1. 从 dsh.profile.bundles 删除 "dsh-mermaid-preview"
#   2. 从 dependencies 删除同一行
cd ~/.dsh/profiles/web && pnpm install
```

### 更新

```bash
cd dsh-mermaid-preview && git pull && npm run build   # 改了 src 才需要 build
dsh plugin --profile web add github:realguan/dsh-mermaid-preview
```

---

## 方式三：动态插件（会话内定义，免 profile 修改）

适合临时试用。把 `dist/dsh-mermaid-preview.client.js` 的内容作为
`code.client` 交给 `cordis_define`，再 `cordis_run` 并允许即可。
该产物与原生 bundle 同源（`npm run build` 同时生成两者）。

---

## 验证（本仓库能证明什么）

`npm run check` 覆盖：

1. `src/client.js`、`index.js`、两个 `dist` 产物、脚本全部通过 `node --check`；
2. manifest 满足 dsh 0.2.x 的客户端插件契约（`exports["./client"]`、
   `dsh.bundle.patch`、`dsh.client.platform === 'web'`、`exports["./package.json"]`、
   `./locale/*.json`、图标大小）；
3. `dist/` 与 `src/` 一致（防止「改了源码忘了 build」这一客户端插件的经典静默故障）；
4. mermaid 识别启发式的 35 条用例（含 front matter、指令、注释、11.x 新图型、误判样本）；
5. 插件、演示页、文档里的 mermaid 版本号一致。

它**不**能证明浏览器里的观感。视觉验证需要在装有插件的 dsh Web 页面上，
用一条带 `mermaid` 围栏的消息确认：

- 出现图而不是代码块；
- 「显示源码 / 显示图表」切换正常，代码块自带的复制按钮仍能复制源码；
- 明暗主题切换后图跟着重绘；
- 语法错误的围栏保留代码块并显示红色提示；
- 点图表或「放大」按钮打开查看器：滚轮缩放（光标处内容不动）、拖拽平移、
  「适应窗口」回到整图、双击在适应窗口与 1:1 间切换、`Esc` 关闭后焦点回到触发元素；
- 查看器打开时滚轮不会滚动背后的消息流；
- 界面语言切成英文/中文后，按钮、查看器工具栏与提示文案跟着变（不需要刷新页面）；
- 显示图表时「代码块」横幅隐藏，切到源码视图后横幅与复制按钮回来；
- 停用插件后页面恢复原样（无残留样式、横幅属性、节点与查看器）。

---

## 常见问题

**装上了但完全不渲染（围栏还是普通代码块）**

1. 确认包名在 `dsh.profile.bundles` 里，且 `dsh --profile web --dump-config`
   能看到 `mermaid-preview` 行。只装了依赖、没注册 bundle 是本插件最常见的失败原因。
2. 打开页面控制台，看有没有 `client-modules:` 开头的报错——它会明确说出
   是哪个包的哪个声明有问题（缺 `./client` 导出、模块图成环等）。
3. 确认页面 boot 清单里有这一行：控制台执行
   `window.__DSH_BOOT__.entries.map(e => e.id)`。

**不渲染且报 CDN 加载失败**

离线或 jsDelivr 不可达。改 `src/client.js` 顶部的 `MERMAID_CDN`（可换成内网镜像），
`npm run build` 后重新安装。

**流式输出过程中不渲染**

设计如此：围栏静默 250ms 后才渲染，避免半截语法反复报错。

**某个 `text` 围栏被错误地渲染成了图**

识别是内容驱动的（见 [architecture.md](./architecture.md) §2）：首行恰好是
`graph TD` / `flowchart LR` 之类的非 mermaid 围栏会被接管。给围栏换一个语言标签
（例如 `text` 改成 `plaintext`）不影响结果，因为判定看内容；把首行注释掉或改成
非 mermaid 语句即可避免。

**主题切换后图没重绘**

确认 dsh 版本仍发出 `theme/change` 事件（`cordis_inspect_query` 的 client `Event`
目录里能看到）。若事件改名，插件需要同步更新。

**宽图看不清 / 想看大图**

点图表本身，或图表下方的「放大」按钮。查看器默认适应窗口；滚轮缩放、拖拽平移、
双击在适应窗口与 1:1 间切换、`0` 复位、`Esc` 关闭。首屏看不到入口时注意两点：
「放大」只在图渲染成功后出现（渲染中或失败时隐藏），切到「显示源码」时也隐藏。
查看器用的是 SVG 副本，关闭后代码块不受影响。

**图表完全不出现，连「显示源码 / 放大」按钮都没有**

这说明插件在接管之前就抛了错（不是识别或语法问题）：块保持原样、没有 holder、也没有
错误提示。打开控制台看有没有 uncaught 报错并提 issue；0.4.0 之前有过一次这样的回归
（渲染路径上读到不可用的服务属性），已在 0.4.0 修掉并把定时器回调也包进了 try/catch ——
现在任何逃逸错误都会变成红色提示，而不是让整块安静地死掉。

**界面是中文，插件文案却是英文**

插件会跟随 dsh 的语言设置：locale 服务就绪后注册命名空间 `dsh-mermaid-preview`
并绑定它的翻译函数（服务晚于本插件挂载也没关系，每次取文案都会重试），服务不可用
时按 `document.documentElement.lang` 在内置中/英字典间选择。若仍显示英文，检查：

1. 文档语言是否被设置：控制台执行 `document.documentElement.lang`，中文界面下应为
   `zh` 或 `zh-*`；
2. locale 服务是否在页面上：`window.__DSH_BOOT__.entries.map(e => e.id)` 里能看到
   `@deepseek-ai/dsh-client-locale`；
3. 两者都不成立时插件只能退回内置 `en`——这是它唯一的英文来源。
