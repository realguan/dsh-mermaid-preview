# 贡献指南

欢迎提交 issue、PR 或想法。请保持本仓库的定位：**小而专注的 Mermaid
渲染插件 + 独立演示**。

## 开发

```bash
npm run build   # 从 src/client.js 重新生成 dist/ 粘贴载荷
npm run check   # 语法检查 + 载荷一致性验证
npm run demo    # 启动零依赖演示页 http://localhost:8090
```

修改 `src/client.js` 后必须重新 `npm run build`，并把 `dist/` 产物一并提交
（仓库保证 dist 与 src 同步，访问者无需构建即可安装）。

## 行为变更的验证清单

- [ ] 对话视图（流式结束 → 渲染）正常
- [ ] 轨迹视图、计划评审等其它 Markdown 视图正常
- [ ] 明暗主题切换后图表重绘
- [ ] 「显示源码 / 显示图表」切换正常，复制按钮仍可用
- [ ] 语法错误 / CDN 不可达时保留代码块并显示提示
- [ ] `cordis_stop` 后样式与观察器全部移除

## 代码规范

- 纯 JavaScript（动态插件无 TypeScript/JSX/import 转换），ES module 形式
  仅用于 `src/` 与 `demo/`，`dist/` 由脚本生成。
- 不引入运行时依赖（CDN 加载 Mermaid 除外）；工具脚本只用 Node 内置模块。
- 提交信息使用 Conventional Commits 风格（`feat:` / `fix:` / `docs:` …）。

## 发布流程（草案）

1. 更新 `CHANGELOG.md` 与 `package.json` 版本号；
2. `npm run check` 全绿；
3. 打 tag（`v0.1.0`）并推送；
4. 如需 npm 发布：`npm publish`（当前以 GitHub 分发为主，非必需）。
