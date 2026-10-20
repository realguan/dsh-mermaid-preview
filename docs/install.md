# 安装与验证

> **一句话**：`dsh plugin add` 会自动把包注册成 bundle 层，装完**重启**即生效。
> 手工 `pnpm add` 不会——那正是「装了却没反应」的经典原因。

---

## 方式一：图形界面（桌面客户端，推荐）

1. 左侧导航 → **设置 → 插件**，或侧栏的**插件**页；
2. 右上角 **＋ 添加插件**；
3. 输入 `github:realguan/dsh-mermaid-preview`（也可贴完整仓库地址），
   或 **安装第三方插件** 里选包名 / Git 地址 / 本地目录；
4. 选安装源（国内网络可选「中国大陆镜像源」）；
5. 阅读安全提示 → **安装**；
6. **重启客户端**。

> 替换已安装包的同名代码需要重启，热更新不足以让新 bundle 生效。

## 方式二：命令行

```bash
# 默认 profile
dsh plugin add github:realguan/dsh-mermaid-preview

# 或指定 profile
dsh plugin --profile desktop add github:realguan/dsh-mermaid-preview

# 固定版本
dsh plugin --profile desktop add github:realguan/dsh-mermaid-preview#v0.6.0
```

`dsh plugin` 会把其余参数原样透传给 pnpm（`add <pkg>` / `remove <pkg>` / `why <pkg>` …），
并在**装完之后**做一次 `reconcile`：读取新装的包，若它声明了 `dsh.bundle`，就把包名
追加进 profile `package.json` 的 `dsh.profile.bundles`，并加载它声明的 patch 层。

所以这一步是自动的，**不需要手改配置**。装完重启 `dsh web` 或桌面客户端。

### 如果用了手工 pnpm

```bash
cd ~/.dsh/profiles/web
pnpm add github:realguan/dsh-mermaid-preview
```

`pnpm` 自己不认识 dsh 的 bundle 概念，**不会**注册。补上：

```bash
# 编辑 ~/.dsh/profiles/web/package.json，在 dsh.profile.bundles 里追加：
#   "dsh-mermaid-preview"
cd ~/.dsh/profiles/web && pnpm install
```

或者用 profile 的用户 patch 层（`~/.dsh/profiles/web/cordis.patch.yml`）：

```yaml
- insert:
    - id: mermaid-preview
      name: dsh-mermaid-preview
```

## 方式三：本地源码（开发者）

```bash
git clone https://github.com/realguan/dsh-mermaid-preview.git
cd dsh-mermaid-preview

npm run build          # src/ → dist/（dist 随仓库提交，消费者侧不需要构建）
npm run check          # 自检

dsh plugin --profile web add link:$PWD
```

改 `src/` 之后必须 `npm run build`；`npm run check` 会拦住「改了源码忘了 build」。

> **`--profile desktop` 的说明。** 桌面版的 profile 由应用独占管理：
> `dsh --profile desktop --dump-config` 会被拒绝（`profile "desktop" is managed
> exclusively by the Electron application`），但 `dsh plugin --profile desktop add`
> 本身可用——它只是拿到 profile 目录的锁去跑 pnpm + reconcile。
> 稳妥做法是**退出应用后**再执行，装完重启。

## 验证安装

```bash
# 1. 组合结果里应有 mermaid-preview 行
dsh --profile web --dump-config | grep -A2 mermaid-preview

# 2. 会话里让模型调用 plugin_manager list_bundles，
#    应看到 dsh-mermaid-preview：enabled=true, installed=true

# 3. 页面侧：控制台执行
#    window.__DSH_BOOT__.entries.map(e => e.id)
#    应包含 "dsh-mermaid-preview"

# 4. 发一条带 ```mermaid 围栏的消息，应出图而不是代码块
```

## 卸载

```bash
dsh plugin --profile desktop remove dsh-mermaid-preview
```

或在插件页里关掉。`remove` 同样会走 reconcile：依赖删除后包名会自动从
`dsh.profile.bundles` 里移除（已实测）。插件自身在 dispose 时会清掉样式、观察器、
定时器、脚本、注入节点与查看器。

## 更新

```bash
dsh plugin --profile desktop add github:realguan/dsh-mermaid-preview   # 重装最新
dsh plugin --profile desktop add github:realguan/dsh-mermaid-preview#v0.6.0   # 或固定版本
```

装完重启。桌面客户端暂不支持自动更新，**升级需先卸载再安装**。

## 验证（本仓库能证明什么）

`npm run check` 覆盖：

1. `src/client.js`、`src/theme.js`、`index.js`、两个 `dist` 产物、引擎分块、全部脚本
   通过 `node --check`；
2. manifest 满足 dsh 0.2.x 的客户端插件契约（`exports["./client"]`、
   `dsh.bundle.patch`、`dsh.client.platform === 'web'`、`exports["./package.json"]`、
   `./locale/*.json`、图标大小）；
3. `dist/` 与 `src/` 一致（防「改了源码忘了 build」这一客户端插件的经典静默故障）；
4. mermaid 识别启发式的 35 条用例（含 front matter、指令、注释、11.x 新图型、误判样本）；
5. **随包引擎完整**：分块存在、版本与 `src/client.js` 的 `MERMAID_VERSION` 一致、
   引擎字节的 sha256 与头部记录一致（手改过的引擎冒充不了）；
6. **出货表面无 CDN 依赖**（源码 / 产物 / 演示 / 基准 / 脚本 / 文档）；
7. 插件、演示页、文档里的 mermaid 版本号一致；
8. `package.json` 版本与 CHANGELOG 最新一节一致。

它**不**能证明浏览器里的观感。视觉验证要在装有插件的 dsh Web 页面上确认：

- 出现图而不是代码块；图表使用默认的 Radix Colors 主题（粉彩节点 + 同色系描边、
  系统字体），不是 mermaid 默认的薰衣草紫；
- 卡片头部显示图表类型（`flowchart` / `sequenceDiagram` …），右侧四个控件
  （主题 / 复制源码 / 显示源码 / 放大）可用；源码视图就是原来的 `<pre>`，
  不出现第二行「代码块」横幅；
- 调色板按钮弹出主题菜单：8 套风格带三色 swatch，当前项打勾；换风格后所有图表即时
  重绘，刷新后选择保留，`Esc` 关闭菜单并把焦点还给按钮；
- 明暗主题切换后图、卡片与查看器一起重绘；
- 所有图型按卡片宽度完整适配；布局按钮在「滚动容器（默认）」与「完整展开」之间切换，
  选择被记住；
- 语法错误的围栏保留源码并显示安静提示条，展开「查看详情」能看到解析器原文；
- 点图表或放大按钮打开查看器：模糊遮罩、悬浮工具条；滚轮缩放（光标处内容不动）、
  拖拽平移、适应窗口、双击切换 1:1、`Esc` 关闭后焦点回到触发元素；
- 查看器打开时滚轮不滚动背后的消息流；
- 界面语言切中/英后，按钮、查看器工具栏与提示文案跟着变（不需刷新）；
- 停用插件后页面恢复原样（无残留样式、横幅属性、节点与查看器）。

## 排查

### 装上了但完全不渲染（围栏还是普通代码块）

1. **包名在 `dsh.profile.bundles` 里吗**：`dsh --profile <名字> --dump-config | grep -A2 mermaid-preview`。
   用 `dsh plugin add` 装会自动写入；手工 `pnpm add` 不会——这是最常见的原因。
2. **控制台有 `client-modules:` 开头的报错吗**：它会指出是哪个包的哪个声明有问题
   （缺 `./client` 导出、模块图成环等）。
3. **boot 清单里有这一行吗**：`window.__DSH_BOOT__.entries.map(e => e.id)`。
4. **重启过吗**：替换已装包同名代码必须重启。

### 报「图表引擎未找到」

包里的 `dist/client.mermaid.js` 缺失或包被裁剪过。引擎随包安装，重装即可；
本地可用 `npm run check` 验证该文件存在且完整。当前随包的是 Mermaid **11.17.2**
（`src/client.js` 的 `MERMAID_VERSION`）。

### 免安装的动态载荷（`code.client`）不渲染

动态载荷本身不含引擎（3.4MB 塞不进一次对话粘贴），它会读 boot manifest 里的分块地址——
**前提是同一个 profile 里装着本插件**。不想装就给个引擎地址：
页面里设置 `window.__DSH_MERMAID_ENGINE_URL__` 指向可访问的 `mermaid.min.js`。

### 流式输出过程中不渲染

设计如此：围栏静默 250ms 后才渲染，避免半截语法反复报错。

### 某个 `text` 围栏被错误地渲染成了图

识别是内容驱动的（见 [architecture.md](./architecture.md) §2）：首行恰好是
`graph TD` / `flowchart LR` 之类语句的非 mermaid 围栏会被接管。换语言标签没用
（判定看内容）；把首行改成非 mermaid 语句即可。

### 主题切换后图没重绘

确认 dsh 版本仍发出 `theme/change` 事件（`cordis_inspect_query` 的 client `Event`
目录里能看到），或页面 `<body>` 上仍有 `data-ds-dark-theme` 属性。两者都没了，
插件就收不到主题信号。

### 宽图看不清 / 想看大图

卡片把整图缩放到宽度完整显示；点图表本身或头部放大图标进查看器。查看器默认适应窗口
（小图放大到填窗），滚轮缩放、拖拽平移、双击在适应窗口与 1:1 间切换、`0` 复位、
`Esc` 关闭。放大图标只在渲染成功后出现，切到「显示源码」时隐藏。

### 图表配色和网上的 mermaid 截图不一样

0.5.0 起用各设计系统色板重绘 `base` 主题（默认 Radix Colors，可在卡片头部切换），
不再用 mermaid 默认调色板。围栏里的 `%%{init: …}%%` 指令仍可覆盖主题。

### 图表完全不出现，连头部的复制 / 源码 / 放大控件都没有

说明插件在接管之前就抛了错（不是识别或语法问题）。打开控制台看有没有 uncaught 报错
并提 issue；0.4.0 之前有过一次这样的回归，现在任何逃逸错误都会变成一条提示条，
而不是让整块安静地死掉。

### 界面是中文，插件文案却是英文

插件跟随 dsh 语言设置：locale 服务就绪后注册命名空间 `dsh-mermaid-preview` 并绑定
翻译函数（服务晚于插件挂载也没关系），服务不可用时按
`document.documentElement.lang` 在内置中/英字典间选择。若仍显示英文：

1. `document.documentElement.lang` 在中文界面下应为 `zh` 或 `zh-*`；
2. boot 清单里应有 `@deepseek-ai/dsh-client-locale`；
3. 两者都不成立时插件只能退回内置 `en`。
