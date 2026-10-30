# Tasks

## 1. 侧边栏提示

- [ ] 1.1 从工具提示模板移除 GIF 图像和教程路径属性，保留现有文字；在 `vis-bug.test.js` 验证有/无操作说明的工具均显示文字且不含图像，运行 `npm run test:ci`。

## 2. GIF 资源与构建引用

- [ ] 2.1 删除 `app/tuts/`、`assets/tuts_src/` 中的 26 个 GIF 和已生成的扩展教程资源；清理注入脚本、扩展清单、资源复制与打包脚本中的教程路径，运行 `npm run extension:build` 验证不再依赖 GIF 目录。
- [ ] 2.2 将演示页的 Open Graph/Twitter GIF 预览路径改为现有 PNG，确认图片文件存在并运行 `npm run bundle`。
- [ ] 2.3 运行 `npm run extension:package`，检查生成的扩展包不含教程 GIF，并搜索仓库确认没有残留的 `.gif` 文件路径引用。
