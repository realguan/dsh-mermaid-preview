# 兼容性声明与证据

`package.json` 的 `dsh.compatibility` 逐版本声明本插件与官方 DSH 发行版的兼容性。
这份文件记录**每个 `compatible` 是怎么得出的**，以及它**不**代表什么。

> 背景：DSH STORE 的自动检查（`AI-Scarlett/DSH-Store#910`）要求作者在新固定 Commit
> 上用精确的 `dsh.compatibility.dshReleases` 记录替代宽泛范围；范围声明不构成可安装证据。

## 声明

```json
"dsh": {
  "compatibility": {
    "dsh": ">=0.2.0-rc.2 <0.3.0",
    "node": ">=18",
    "dshReleases": {
      "0.1.7-rc.1": "unknown",
      "0.1.7-rc.2": "unknown",
      "0.2.0-rc.1": "compatible",
      "0.2.0-rc.2": "compatible",
      "0.2.1-alpha.1": "compatible",
      "0.2.1-alpha.2": "compatible",
      "0.2.1-alpha.3": "compatible",
      "0.2.1-alpha.4": "compatible",
      "0.2.1-alpha.5": "compatible",
      "0.2.1-rc.1": "compatible",
      "0.2.1-rc.2": "compatible"
    }
  }
}
```

## `compatible` 的判定标准

某个版本被标为 `compatible`，当且仅当对**该版本官方发布的代码**逐项验证通过：

1. **该版本自己的 `@deepseek-ai/dsh-client-modules` 接受本包。** 用该版本的
   `ClientModuleRegistry.resolveMeta()` 解析本包，确认得到
   `packageName = dsh-mermaid-preview`、存在的 `clientPath`、`immediately: true`，
   且 `external` 为空（插件不需要任何基座之外的模块）。
2. **包声明契约存在。** 该版本的 client-modules 读取 `dsh.client`，支持
   `platform` / `inject` / `external` / `immediately`，要求 `exports["./client"]`，
   并经 `<包名>/package.json` 解析清单。
3. **`/plugins/<id>/client.js` 路由与 `__DSH_BOOT__` 注入存在**（bundle 的投递方式）。
4. **本插件依赖的 DOM 契约存在。** 该版本 `dsh-client-ui-primitives` 的 `CodeBlock`
   仍然渲染 `.md-code-block` + `[data-code-block-banner]` + `[data-code-block-content]`，
   并且未高亮围栏的正文仍是 `<pre>`（这是本插件的候选判据）。
5. **依赖的服务与行存在。** 该版本 `dsh-client-locale` 提供
   `register(ns, dicts)` / `bind(ns)`；`inject` 目标
   `@deepseek-ai/dsh-client-ui-conversation` 仍是 `platform: web` 的客户端行。

`unknown` 表示没有做上述验证，不表示不兼容。`incompatible` 表示验证失败。

## 已验证的版本

| DSH 版本 | 本包被该版本 scanner 接受 | DOM / locale / inject 契约 |
| --- | --- | --- |
| 0.2.0-rc.1 | ✓ | ✓ |
| 0.2.0-rc.2 | ✓ | ✓ |
| 0.2.1-alpha.1 | ✓ | ✓ |
| 0.2.1-alpha.2 | ✓ | ✓ |
| 0.2.1-alpha.3 | ✓ | ✓ |
| 0.2.1-alpha.4 | ✓ | ✓ |
| 0.2.1-alpha.5 | ✓ | ✓ |
| 0.2.1-rc.1 | ✓ | ✓ |
| 0.2.1-rc.2 | ✓ | ✓ |

0.2.0-rc.2 另有**真实 profile 证据**：通过 `plugin_manager` 的 `install_bundle`
安装进一个运行中的 dsh 0.2.0-rc.2 profile，结果为 `application: applied`、
`warnings: []`，且安装产物与仓库 `dist/client.js` 字节一致。

## 这些声明不代表什么

- **不是运行时验收。** 上表是**源码契约**层面的判定：证明该版本的机制仍然提供本插件
  所依赖的接口与 DOM 形状。它不等于「在一次性 Profile 里跑完 install / start /
  uninstall / rollback 并确认渲染结果」。
- **不含视觉验收。** 图表在浏览器里的观感（出图、主题重绘、切换、失败兜底）需要在
  装有插件的 dsh Web 页面上人工确认，见 [install.md](./install.md) § 验证。
- **不含 mermaid 版本声明。** mermaid 引擎（当前 **11.17.2**）随插件包一起发布，
  与 DSH 版本无关；升级大版本前请按 [architecture.md](./architecture.md) §8 自查。

## 复现验证

`npm run check` 会校验这份矩阵的形状（键为完整 SemVer、取值在
`compatible | incompatible | unknown` 内、`node` 与 `engines.node` 一致、
至少有一条 `compatible`），但它不联网，因此不重新执行上面 1–5 项的逐版本检查。
逐版本检查的做法：

仓库里带了这个检查（`scripts/verify-compat.mjs`，只用 Node 内置模块）：

```bash
# 对某个版本 V（或多个），取该版本官方发布的客户端包，用它们自己的 scanner 解析本包
npm run verify:compat -- 0.2.1-alpha.5 0.2.1-rc.1 0.2.1-rc.2
```

它按上面 1–5 项逐条判定并打印 `compatible` / `NOT compatible`；写 `compatible`
之前请先跑一遍，把结论一并写进 `dshReleases` 与本表。

> **商店的兼容窗口会滚动。** DSH STORE 以「官方最新三个 DSH 发行版」为窗口，
> 窗口里只要有一个版本没有精确记录，条目就会被判定为「兼容性暂时下架」
> （见 `AI-Scarlett/DSH-Store#910`）。每出一个新的 DSH 发行版，就要重跑一次这个
> 检查并补一条声明 —— 这也是本插件需要「新固定 Commit + 新 SemVer」的原因。
