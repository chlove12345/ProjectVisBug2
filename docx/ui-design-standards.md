# VisBug2 UI 设计规范

> 适用范围：VisBug2 自身的工具栏、设置、提示、菜单和覆盖层；不规定用户网页的视觉风格。本文依据 2026-10-30 工作区源码整理，属于后续界面的设计约定，不表示已完成页面视觉验收。现有风格优先，外部标准用于补充可用性与无障碍要求。

## 1. 当前界面的视觉基线

| 部位 | 从源码观察到的做法 | 依据 |
| --- | --- | --- |
| 整体形态 | 工具栏固定在页面左上方，以竖向图标为主；工具说明向右展开。设置与颜色入口独立于主工具列表。 | [`vis-bug.element.js`](../app/components/vis-bug/vis-bug.element.js)、[`vis-bug.element.css`](../app/components/vis-bug/vis-bug.element.css) |
| 配色 | 明暗主题共享 `--theme-*` 变量，文本和图标使用中性灰，粉色用于选中、快捷键和重点标记；覆盖层也使用紫色等强调色。 | [`_variables.css`](../app/components/_variables.css)、[`_variables_light.css`](../app/components/_variables_light.css)、[`_variables_dark.css`](../app/components/_variables_dark.css) |
| 字体 | 工具栏与说明框使用约 16px 的系统无衬线字体；样式属性和值使用等宽字体。 | [`vis-bug.element.css`](../app/components/vis-bug/vis-bug.element.css)、[`metatip.element.css`](../app/components/metatip/metatip.element.css) |
| 形状与层次 | 工具栏为圆角胶囊，图标项为圆形；提示框与检查面板使用圆角、阴影和半透明背景。选中菜单比说明框更紧凑。 | [`vis-bug.element.css`](../app/components/vis-bug/vis-bug.element.css)、[`metatip.element.css`](../app/components/metatip/metatip.element.css)、[`actions.element.css`](../app/components/selection/actions.element.css) |
| 操作状态 | 工具有悬停、按下与选中状态；选中菜单有 `:focus-visible`、忙碌状态及子菜单的视口翻转。工具提示目前保留文字和快捷键说明。 | [`vis-bug.element.css`](../app/components/vis-bug/vis-bug.element.css)、[`actions.element.css`](../app/components/selection/actions.element.css)、[`model.js`](../app/components/vis-bug/model.js) |

上表描述的是当前做法，不等于每一处界面都已满足无障碍标准。新增界面按下列规则设计；修正现有界面时以当前任务范围为准，不借机重排整个工具栏。

## 2. 布局与组件

1. **保持工具叠加在网页上的轻量形态。**主工具入口沿用左侧竖向工具栏；解释性内容靠近入口或被操作元素，不把长期占屏的大面板当作默认方案。
2. **复用相同角色的组件。**工具说明沿用右侧说明框的标题、简述、操作表结构；选中元素的操作沿用小型菜单；检查数据沿用浮动检查面板。不要为同一信息层级再造一套卡片样式。
3. **位置随视口调整。**浮层不得被视口边缘裁断，也应尽量避开正在编辑的元素。现有选中菜单使用位置回退；新增浮层采用相同原则，窄屏或低视口时允许换边、滚动或收起次要信息。
4. **尺寸取自邻近组件。**当前工具栏项约为 `2.25em`，说明框内边距约为 `1em`，操作菜单更紧凑。这些是现状参考值，不是全局固定栅格；新增尺寸先与同类组件对齐，再根据内容调整。

### 设置入口与组件库

- 设置齿轮位于颜色工具下方的独立圆形按钮内，图标须在圆心；它是全局入口，不表现为一个持续激活的编辑工具。
- 点击设置打开居中的模态弹窗，而非工具悬停说明框。弹窗有标题、关闭按钮，可用 Escape 关闭；关闭后焦点回到设置按钮。背景遮罩只在弹窗打开时出现。
- 当前语言只有两项，使用 [Shoelace Radio Group / Radio Button](https://shoelace.style/components/radio-group) 的分段单选控件，比普通下拉框更直接。项目只按需引入这两个 Web Components，弹窗仍使用浏览器原生 `dialog`；不要因此把其他 UI 一并替换。
- Shoelace 主题样式只进入 VisBug 的 Shadow DOM，并把主要颜色、字体和圆角变量映射到现有 `--theme-*`。不从 CDN 加载组件、字体或图标，也不让组件库样式影响用户网页。其他设置控件先复用已有结构；确需引入新的 Shoelace 控件时再按同一方式处理明暗主题、键盘和文案。

## 3. 颜色、文字和图标

- 颜色优先使用现有 `--theme-*`、`--neon-*` 等变量，并同时考虑亮色、暗色和 `auto` 模式。不要在同一类状态中引入新的强调色含义。
- 颜色不能是状态的唯一线索。选中、成功、失败、禁用和忙碌状态还需有文字、图标、边框或形状等可辨识线索；不假定当前配色天然满足对比度要求。
- 界面正文保持简短，按“名称 → 作用 → 操作方式”呈现。快捷键、CSS/DOM/SVG 等术语和代码标识保留准确写法；没有通行中文译名的术语不生造译名。新增文案应能随设置中的语言切换，并在两种语言下容纳长度差异。
- 新图标沿用现有 SVG 图标的线条或实心风格与尺寸感。图标入口必须有可访问名称；操作含义不清时提供文字说明。图标和提示不得只靠鼠标悬停才可理解。
- 工具提示以文字和快捷键说明为主；动画素材不是解释操作的必需条件。

## 4. 交互状态与无障碍

- 每个可操作入口至少考虑默认、悬停、键盘焦点、激活、禁用与忙碌状态；只在确实适用时展示状态，不为静态说明制造“可点击”的视觉暗示。
- 新增可点击图标优先使用原生 `button`、明确的名称和可见焦点。快捷键用于加速，不替代可发现的入口；应避免与网页或浏览器常用快捷键冲突。
- 纯说明提示可以靠近入口展示；若其中含按钮、选择框等交互控件，应使用可聚焦、可关闭的面板，并处理焦点与 Escape。悬停内容应可在需要时保持可见，不能一移动鼠标就无法阅读。
- 动效沿用当前短时淡入/位移的节奏，并尊重 `prefers-reduced-motion`；动效不能阻挡输入或成为唯一反馈。
- 文本与交互目标按 WCAG 2.2 的相关要求评估：普通文本对比度至少 4.5:1，大号文本至少 3:1；非文字控件及焦点指示也需有足够对比；交互目标至少满足 24×24 CSS 像素或适用的间距例外。以上是新增界面的验收目标，**不是对当前界面已达标的声明**。

## 5. 新界面的简短检查表

- 是否能看出入口、当前状态和下一步操作？
- 是否沿用同类组件的颜色、圆角、字级与间距，且在亮暗主题均可读？
- 是否支持键盘焦点、名称、关闭方式与必要的状态反馈？
- 浮层在窄视口和边缘位置是否仍能读到，并尽量不遮住操作目标？
- 中英文切换后，布局和技术术语是否仍准确？

## 外部参考

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)：对比度、键盘、焦点、目标尺寸，以及悬停或聚焦内容的相关成功标准。
- [WAI-ARIA Authoring Practices：Menu Button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)：按钮与菜单的语义、键盘操作和焦点处理。
- [Nielsen Norman Group：10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)：一致性、状态可见性、用户控制与识别优于回忆等通用原则。
- [Shoelace Radio Group](https://shoelace.style/components/radio-group)：本项目设置弹窗中语言选项所用组件的用法。
