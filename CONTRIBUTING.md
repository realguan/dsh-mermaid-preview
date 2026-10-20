# 贡献指南

欢迎提交 issue、PR 或想法。请保持本仓库的定位：**小而专注的 Mermaid
渲染插件 + 独立演示**。

## 开发

```bash
npm run build   # 把 src/theme.js 内联进 src/client.js，生成两个 dist 产物
npm run check   # 语法 / manifest / 产物一致性 / 识别用例 / 版本一致
npm run demo    # 启动零依赖演示页 http://localhost:8090
```

修改 `src/client.js` 或 `src/theme.js` 后必须重新 `npm run build`，并把 `dist/` 产物一并提交
（仓库保证 dist 与 src 同步，访问者无需构建即可安装；`npm run check` 会拦住
忘记 build 的情况）。

## 行为变更的验证清单

浏览器侧的观感无法由脚本证明，改渲染逻辑时请按 `docs/install.md` § 验证
逐条自查：

- [ ] 对话视图（流式结束 → 渲染）正常
- [ ] 轨迹视图、计划评审等其它 Markdown 视图正常
- [ ] 明暗主题切换后图表重绘
- [ ] 卡片头部的主题 / 复制源码 / 显示源码 / 放大四个控件正常
- [ ] 主题菜单可切换全部风格、立即重绘并记住选择（刷新后仍在）
- [ ] 源码视图不再出现第二行「代码块」横幅
- [ ] 宽图按可读尺寸横向滚动，右上角渐隐提示在滚到末尾后消失
- [ ] 语法错误 / 引擎缺失时保留代码块并显示安静的提示条（详情可展开）
- [ ] 停用插件（或 `remove_bundle`）后样式、观察器、注入节点全部移除

## 代码规范

- 纯 JavaScript，无 TypeScript/JSX/构建期转换；`src/client.js` 只允许一个
  `export default`（构建脚本据此包出两种产物）。`src/theme.js` 只允许
  `export const/function`（构建时会被内联、去掉 export）。需要给自检用的内部函数放在
  `dsh:test-only` 标记之间，构建时会被剥掉。
- 不引入运行时依赖：Mermaid 引擎随包附带（`dist/client.mermaid.js`，由
  `scripts/vendor-engine.mjs` 生成），插件运行时**不联网**；工具脚本只用 Node
  内置模块。
- 样式只用 `cordis_inspect_query` 的 `Theme` 列出的 `--dsw-alias-*` token。
- 提交信息使用 Conventional Commits 风格（`feat:` / `fix:` / `docs:` …）。

## 发布流程

1. 更新 `CHANGELOG.md`（新版本一节，日期用发布日）与 `package.json` 版本号；
2. `npm run build` 重建 `dist/`，再 `npm run check` 全绿（含版本一致性与产物同步）；
3. 提交改动，打 annotated tag（`v<版本号>`，如 `v0.5.0`）并推送；
4. 在 GitHub 用该 tag 建 Release，正文取自 `CHANGELOG.md` 对应小节；
5. 如需 npm 发布：`npm publish`（当前以 GitHub 分发为主，非必需）。
