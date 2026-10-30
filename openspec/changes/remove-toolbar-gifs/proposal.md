# Proposal

## Why

侧边栏工具提示目前加载教程 GIF。用户希望去掉动画内容，同时继续看到工具名称、说明和快捷键；删除图片后，还需清除依赖这些文件的构建与扩展引用。

## What Changes

- 侧边栏悬浮提示保留现有文字和快捷键内容，不再渲染或请求 GIF。
- 删除仓库中 `app/tuts/` 与 `assets/tuts_src/` 的 26 个教程 GIF。
- 清理扩展注入、资源复制、打包和清单中的教程 GIF 引用；将演示页的分享预览图改为现有静态图片。

## Capabilities

### New Capabilities

- `sidebar-tool-hints`：侧边栏工具的纯文字悬浮提示行为。

### Modified Capabilities

无。当前 `openspec/specs/` 尚无相关主规范。

## Impact

涉及工具栏提示渲染、演示页分享元数据、扩展注入与打包脚本，以及两处教程 GIF 目录。不改动工具选择、快捷键含义、编辑功能或其他图片资源。
