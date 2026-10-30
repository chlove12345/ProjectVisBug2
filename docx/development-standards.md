# VisBug2 项目代码规范

整理日期：2026-10-30

本文只记录当前仓库配置、源码结构和测试脚本中可观察到的代码约定。

## 当前代码约定

| 主题 | 现状与依据 |
| --- | --- |
| 基本格式 | `.editorconfig` 规定 UTF-8、LF、文件末尾换行、删除行尾空格、空格缩进 2 格；Makefile 用 Tab。Markdown 和 JSON 不限制行宽。 |
| 语言与模块 | `package.json` 的 `type` 为 `module`；应用源码使用原生 JavaScript ES modules，入口是 `app/index.js`，Rollup 从此处构建。 |
| 文件命名 | 自定义元素通常采用 `*.element.js` 与同名 `*.element.css`；测试文件采用 `*.test.js`，位于被测功能或组件附近。 |
| UI 结构 | `vis-bug` 及 `visbug-*` 是自定义元素；组件大多用 Shadow DOM 和 `adoptedStyleSheets` 隔离样式。CSS 文件与对应组件相邻，汇总于 `app/components/styles.store.js`。 |
| 功能组织 | `app/features/` 按工具分文件；工具启用函数通常注册快捷键或选中回调，并返回停用时调用的清理函数。工具栏在 `app/components/vis-bug/vis-bug.element.js` 中管理切换。 |
| 选中与覆盖层 | `app/features/selectable.js` 统一管理选择数组、页面事件、选中通知和覆盖层；几何计算在 `app/components/selection/quad.js` 等文件中。 |
| 可撤销编辑 | `app/features/history.js` 定义 `StyleChange`、`AttributeChange`、`DOMChange`、`TextChange`、`BatchChange` 和 `recordStyleChanges`。部分编辑功能已使用它们。 |
| 插件 | `app/plugins/_registry.js` 管理命令与选中菜单动作；插件可以激活、停用、注销。`app/plugins/export.js` 按需加载导出依赖。 |
| 测试 | `app/**/*.test.js` 使用 AVA，页面交互测试通过 Puppeteer 和 `tests/helpers.js` 打开本地演示页。`npm run test:ci` 先构建，再启动服务运行测试。 |
| 构建 | Rollup 生成 JS，PostCSS 生成 CSS；扩展构建把产物与教程资源复制到 `extension/`。生成的 bundle、chunks、`artifacts/` 已在 `.gitignore` 中。 |

**不要误读为已有统一风格：**源码中引号、变量命名、对齐空格和分号的用法并不完全一致；仓库没有 ESLint/Prettier 配置。后续改动应优先保持相邻代码的风格，避免为了格式化产生大范围噪声。

## 现有开发命令

| 命令 | 用途 |
| --- | --- |
| `npm start` | 同时启动 JS、CSS 监听构建和本地演示服务器。 |
| `npm run bundle` | 构建演示页的 JS 和 CSS。 |
| `npm run test:ci` | 构建演示页、启动本地服务器并运行 AVA 测试。 |
| `npm run extension:build` | 构建扩展 JS、CSS 并复制资源。 |
| `npm run extension:package` | 构建并打包浏览器扩展。 |

以上命令均定义于 `package.json`。
