# AGENTS.md

> 用户备注（原文保留）：我叫starchen，我的性格很懒，但是喜欢新技术。

本文件面向在本仓库中工作的开发者和编码代理，记录项目结构、运行方式、实现约定与已知问题。修改代码前请先通读本文件。

## 1. 项目概览

| 项目 | 内容 |
| --- | --- |
| 项目名称 | 叙野 XUYE · 餐厅官网 |
| 项目类型 | 单页品牌官网 / 概念餐厅展示页 |
| 技术栈 | 原生 HTML、CSS、JavaScript |
| 构建方式 | 无构建步骤、无框架、无 npm 依赖 |
| 页面语言 | 简体中文为主，少量英文装饰文案 |
| 主要内容 | 品牌首屏、餐厅介绍、招牌菜、交互菜单、主厨故事、空间画廊、订座表单、联系方式 |

项目目标是呈现一间位于上海的当代中餐厅“叙野 XUYE”。视觉风格偏杂志化编辑设计：暖米色纸张底色、深墨色、朱砂红与黄铜金，衬线中文标题，大量留白和细线分隔。

当前是可独立运行的前端演示站，没有后端、数据库、真实订座接口、统计脚本或用户系统。

## 2. 快速开始

直接打开 `index.html` 即可浏览。推荐使用本地 HTTP 服务，避免部分浏览器对本地文件和字体的限制：

```powershell
python -m http.server 8000
```

然后访问 `http://localhost:8000`。

项目没有以下常规命令，不要假设它们存在：

- `npm install`
- `npm run build`
- `npm test`
- 任何打包、转译或代码生成步骤

`tools/` 下的两个脚本仅用于浏览器验收，需要 Node.js 和 Chromium 浏览器的调试端口。

## 3. 目录结构

| 路径 | 作用 | 说明 |
| --- | --- | --- |
| `index.html` | 唯一页面 | 包含全部页面结构、文案和两套订座表单 |
| `styles.css` | 全部样式 | 设计变量、布局、组件、动画与响应式规则 |
| `script.js` | 全部交互 | 原生 JavaScript，无第三方库 |
| `assets/` | 正式图片资源 | 页面实际引用的 JPEG 与 `favicon.svg` |
| `assets/archive/` | 备选图片 | 已被 `.gitignore` 忽略，不参与页面 |
| `tools/smoke-test.mjs` | 交互冒烟测试 | 通过 Chrome DevTools Protocol 检查主要交互 |
| `tools/capture.mjs` | 整页/局部截图 | 通过 Chrome DevTools Protocol 生成验收截图 |
| `previews/` | 截图产物 | 已被忽略，不应提交 |
| `preview.png` | 根目录截图产物 | 已被忽略，不应作为页面资源引用 |
| `README.md` | 简要说明 | 面向普通读者的项目介绍 |
| `AGENTS.md` | 本文件 | 面向后续开发者和编码代理的工作说明 |

## 4. 页面结构

`index.html` 中的 `<main>` 按以下顺序组织：

| 顺序 | 区块 | 锚点 | 内容 |
| --- | --- | --- | --- |
| 1 | Hero 首屏 | `#home` | 品牌标题、主视觉、订座按钮、营业状态、地址 |
| 2 | 餐厅介绍 | `#intro` | 品牌理念、四项餐厅数据 |
| 3 | 招牌风味 | `#signatures` | 4 张招牌菜卡片，使用不规则网格 |
| 4 | 时令菜单 | `#menu` | 4 个标签页，每页 4 道菜，共 16 道 |
| 5 | 主厨故事 | `#story` | 双图拼贴、主厨引言与签名 |
| 6 | 空间 | `#space` | 3 张可放大图片、滚动文字带 |
| 7 | 食客评价 | 无 id | 朱砂红背景的大段引言 |
| 8 | 订座 | `#reserve` | 左侧空间图，右侧完整订座表单 |
| 9 | 联系 | `#contact` | 地址、营业时间、电话与邮箱 |

页面底部还有全站页脚、订座弹窗、图片灯箱和 Toast 提示层。

导航锚点约定：

- 桌面端主导航包含 `#signatures`、`#menu`、`#story`、`#space`。
- 移动端菜单额外包含 `#reserve`，并用 `01`–`05` 编号。
- 修改区块 id 时必须同步更新导航、脚本中的观察目标和测试脚本。

## 5. 技术实现约定

### 5.1 HTML

- 页面为单文件结构，所有文案直接写在 `index.html` 中，没有模板或数据层。
- 使用语义化 `<header>`、`<main>`、`<section>`、`<article>`、`<dialog>`、`<footer>`。
- 主要区块使用 `aria-labelledby` 关联标题。
- 页面顶部有跳至主要内容的 skip link。
- 交互钩子统一使用 `data-*` 属性，不以样式类作为 JavaScript 选择器。

主要 `data-*` 钩子按功能分组：

| 功能 | 属性 |
| --- | --- |
| 页头与移动菜单 | `data-header`、`data-menu-toggle`、`data-mobile-menu` |
| 菜单标签页 | `data-menu-tab`、`data-menu-panel` |
| 订座弹窗 | `data-open-reservation`、`data-reservation-dialog`、`data-close-dialog` |
| 主页面订座表单 | `data-reservation-form`、`data-reservation-success`、`data-success-copy`、`data-reset-reservation` |
| 弹窗订座表单 | `data-dialog-form`、`data-dialog-success`、`data-dialog-success-copy`、`data-reset-dialog` |
| 日期输入 | `data-date-input` |
| 图片灯箱 | `data-lightbox`、`data-lightbox-dialog`、`data-lightbox-image`、`data-close-lightbox` |
| 动效与提示 | `data-parallax`、`data-toast` |

重命名或删除这些属性前，必须同步修改 `script.js`、`tools/smoke-test.mjs` 和 `tools/capture.mjs`。

### 5.2 CSS

所有样式集中在 `styles.css`，没有 CSS Modules、预处理器或工具类框架。

设计变量定义在 `:root`：

| 变量 | 值 | 用途 |
| --- | --- | --- |
| `--ink` | `#1c1a17` | 主文字、深色背景 |
| `--ink-soft` | `#2b2823` | 次级深色 |
| `--paper` | `#f3efe7` | 主浅色背景 |
| `--paper-deep` | `#e5ddcf` | 分区浅色背景 |
| `--cream` | `#d8c9b4` | 浅色辅助文字 |
| `--vermillion` | `#a8442f` | 强调色、按钮悬停、印章 |
| `--gold` | `#c0a272` | 深色区块中的点缀色 |
| `--muted` | `#777066` | 说明文字 |

排版约定：

- 中文标题使用 `--serif`（Noto Serif SC 及系统中文字体回退）。
- 正文和界面文字使用 `--sans`（DM Sans 及系统中文字体回退）。
- 字号、间距和区块 padding 大量使用 `clamp()` 实现流式缩放。
- 按钮默认直角、细边框，不使用大圆角。
- 主内容常用最大宽度为 `1540px`，部分标题和卡片网格为 `1370px`。

响应式断点：

| 断点 | 主要变化 |
| --- | --- |
| `max-width: 1180px` | 缩小导航间距，隐藏页头电话 |
| `max-width: 960px` | 隐藏桌面导航和页头操作，显示汉堡菜单；主要双栏改为单栏；订座弹窗隐藏左侧图片栏 |
| `max-width: 680px` | 手机字号与间距；招牌卡片、画廊、联系方式改为单列；表单字段改为单列 |

关键状态类：

| 类名 | 作用 |
| --- | --- |
| `html.js` | JavaScript 可用标记；`.js .reveal` 才会进入隐藏待显示状态 |
| `.is-scrolled` | 页头滚动后的收缩与浅色背景 |
| `.is-open` | 移动菜单展开 |
| `.is-menu-open` | 菜单展开时页头保持透明 |
| `.menu-open` | 锁定页面滚动 |
| `.dialog-open` | 弹窗或灯箱打开时锁定页面滚动 |
| `.is-visible` | 滚动进入视口后的 reveal 动画；也用于 Toast |
| `.is-active` | 当前菜单标签页、当前导航项 |

层级约定：页头 `z-index: 100`，移动菜单 `90`，Toast `200`；原生 `<dialog>` 位于浏览器顶层。

动效约定：

- `.reveal` 使用 IntersectionObserver 触发，阈值 `0.08`，底部内缩 `40px`。
- 首屏图片有轻微视差，最大位移 `90px`。
- 菜单面板切换使用 `panel-in`，弹窗使用 `dialog-in`，空间文字带使用无限 marquee。
- `prefers-reduced-motion: reduce` 下会关闭平滑滚动并压缩动画时长，同时直接显示所有 `.reveal` 元素。

### 5.3 JavaScript

`script.js` 是普通顶层脚本，通过 `<script defer>` 加载，不依赖 DOMContentLoaded。

主要行为：

1. 给 `<html>` 添加 `.js` 类。
2. 滚动超过 `28px` 时为页头添加 `.is-scrolled`。
3. 控制移动菜单开合、`aria-expanded`/`aria-hidden`、滚动锁定，并支持 Escape 关闭和窗口宽度大于 `960px` 时自动关闭。
4. 用 IntersectionObserver 触发 `.reveal` 入场动画。
5. 用 `requestAnimationFrame` 更新首屏视差。
6. 菜单标签页支持点击、左右方向键、Home、End，并同步 `aria-selected`、`tabindex` 和 `hidden`。
7. 日期输入的最小值为本地“今天”，默认值为本地“明天”；通过手动拼接年月日避免 UTC 时区偏移。
8. 订座表单为纯前端演示：阻止默认提交，使用 `checkValidity()` 校验，标记 `aria-invalid`，显示个性化成功文案和 Toast，不发送任何网络请求。
9. 画廊按钮读取 `data-lightbox` 的图片路径，复制缩略图 alt 文本后打开原生 `<dialog>` 灯箱。
10. 用 IntersectionObserver 根据当前视口区块高亮桌面导航。

订座表单有两套，字段和交互逻辑独立绑定：

- 主页面表单位于 `#reserve`。
- 弹窗表单位于 `data-reservation-dialog`。

修改字段、校验规则、成功文案或重置逻辑时，两套表单都要同步修改。

## 6. 图片与外部依赖

正式图片全部位于 `assets/`，均为 JPEG；`favicon.svg` 为站点图标。

| 文件 | 尺寸 | 用途 |
| --- | --- | --- |
| `hero.jpg` | 2200×1467 | 首屏主视觉、订座弹窗左侧背景 |
| `dish-steak.jpg` | 1200×801 | 炭火慢烤肋排 |
| `dish-dimsum.jpg` | 1200×724 | 松露小笼包 |
| `dish-noodles.jpg` | 1200×1200 | 鲜虾高汤面 |
| `dish-bowl.jpg` | 1200×800 | 炭烤时蔬谷物饭 |
| `chef-portrait.jpg` | 1400×2100 | 主厨故事主图 |
| `ingredients.jpg` | 1600×1600 | 主厨故事细节图 |
| `space-c.jpg` | 1600×1067 | 空间画廊大厅 |
| `tea.jpg` | 1200×800 | 空间画廊茶席 |
| `feast.jpg` | 1600×1067 | 空间画廊炭火料理 |
| `space-b.jpg` | 1600×1068 | 订座区空间图 |

外部依赖只有 Google Fonts：

- `DM Sans`
- `Noto Serif SC`

页面已提供系统中文字体回退。离线打开时字体可能回退，但页面仍可用。

当前图片没有 `srcset`、WebP/AVIF 或响应式尺寸版本；首屏 `hero.jpg` 约 755KB。后续做性能优化时优先处理首屏图和画廊大图，并保留现有 `loading="lazy"` 策略。

内容性质提醒：

- 品牌、主厨、菜单价格、地址、电话和评价均为概念示例。
- 邮箱使用保留域名 `hello@xuye.example`。
- 页脚小红书、微信、Instagram 链接目前都是 `#` 占位。
- 地图链接是 Google Maps 搜索链接，不是正式门店标注。

## 7. 测试与验收

### 7.1 运行前提

两个验收脚本都通过 Chrome DevTools Protocol 连接 `http://127.0.0.1:9222/json/list`，并默认操作第一个 `page` 类型的标签页。

需要：

- Node.js 22 或更高版本（当前环境为 v24.21.0，脚本使用全局 `fetch` 和 `WebSocket`）。
- Chromium 内核浏览器（Chrome 或 Edge）。
- 浏览器以远程调试模式启动，并打开一个可操作的页面。

本项目在 Windows 上可用 Edge 的无头模式：

```powershell
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$profileDir = Join-Path $env:TEMP "codex-edge-test"

Start-Process $edge -ArgumentList @(
  "--headless=new",
  "--remote-debugging-port=9222",
  "--user-data-dir=$profileDir",
  "--disable-gpu",
  "about:blank"
) -WindowStyle Hidden
```

### 7.2 冒烟测试

```powershell
node tools/smoke-test.mjs
```

覆盖范围：

- 桌面 `1440×1000` 和移动 `390×844` 两种视口。
- 图片加载失败列表。
- 4 个菜单标签页的选中状态与面板可见性。
- 订座弹窗打开、表单提交成功、成功文案、弹窗关闭。
- 图片灯箱打开。
- 移动菜单打开、可见、页面滚动锁定、点击链接后关闭。
- 页面运行时异常 `Runtime.exceptionThrown`。

注意：脚本只输出 JSON，不会因为检查失败自动以非零状态退出。必须人工查看 `imageFailures` 和 `runtimeErrors`。

最近一次运行（2026-10-18）结果：菜单标签页、订座、灯箱、移动菜单全部通过，`runtimeErrors` 为空；唯一图片失败是缺失的 `assets/interior.jpg`。

### 7.3 截图

```powershell
# 整页截图，默认 1440×1000
node tools/capture.mjs previews\preview-full.png 1440 1000

# 手机视口
node tools/capture.mjs previews\preview-mobile.png 390 844

# 订座弹窗
node tools/capture.mjs previews\preview-dialog.png 1440 1000 "" "" dialog

# 图片灯箱
node tools/capture.mjs previews\preview-lightbox.png 1440 1000 "" "" lightbox

# 移动菜单
node tools/capture.mjs previews\preview-menu.png 390 844 "" "" mobilemenu
```

参数顺序为：输出路径、宽度、高度、裁剪起点 Y、裁剪高度、UI 状态。脚本同时输出各区块的顶部位置和高度。

### 7.4 人工验收清单

- 页面无横向滚动条。
- 所有图片正常显示，控制台无 404。
- 桌面端四个导航锚点能正确定位并高亮。
- `960px` 以下出现汉堡菜单，Escape 可关闭，打开时背景不可滚动。
- 四个菜单标签页可用鼠标和键盘切换。
- 两套订座表单都能校验、提交、显示成功文案并重置。
- 画廊三张图片都能打开灯箱，关闭后页面滚动恢复。
- 在 `1440px`、`1180px`、`960px`、`680px`、`390px` 宽度下检查布局。
- 开启“减少动态效果”后页面内容仍然全部可见。

## 8. 已知问题与注意事项

1. **缺失图片引用**：`index.html` 的灯箱初始 `<img src="assets/interior.jpg">` 指向不存在的文件；实际文件只在被忽略的 `assets/archive/interior.jpg`。这会产生 404，并被冒烟测试记录为图片失败。修复方式：改为已有图片（例如 `assets/space-c.jpg`），或删除初始 `src`（JavaScript 会在打开灯箱前设置真实路径）。
2. **路径写死**：`tools/smoke-test.mjs` 和 `tools/capture.mjs` 都写死了 `file:///D:/codex-list/index.html`。移动项目目录后必须修改脚本，或改为基于 `import.meta.url` 计算相对路径。
3. **调试标签页选择**：脚本取第一个 `page` 目标；如果浏览器里还有其他标签页，可能操作到错误页面。测试时使用独立 profile，或只保留目标页面。
4. **冒烟测试没有断言**：检查结果只打印到 stdout，CI 中需要额外解析 JSON 或改造脚本才能作为门禁。
5. **`.js` 与 reveal 的耦合**：脚本开头就添加 `.js`，若后续初始化代码抛错，`.reveal` 元素可能一直保持透明。排查“页面空白”时先看控制台异常，并确认 `.reveal` 是否被加上了 `.is-visible`。
6. **两套订座表单重复**：字段、时间选项、人数选项和文案需要人工保持一致。修改时不要只改其中一套。
7. **静态内容重复**：招牌菜卡片与菜单标签页中的同名菜品分别维护；改价格或菜名时要同时检查两处。
8. **截图产物不入库**：`previews/`、根目录 `preview*.png` 和 `assets/archive/` 都被 `.gitignore` 排除。不要把截图或备选图当作正式页面资源引用。
9. **外部字体**：Google Fonts 不可用时页面会使用系统字体；不要假设字体文件在本地。
10. **无真实后端**：订座提交成功只是前端状态变化。接入真实接口前，需要补充请求、错误处理、隐私说明和成功/失败状态，并修改“30 分钟内致电”等演示文案。

## 9. 开发约定

- 保持零构建、零框架的现状，除非用户明确要求引入工具链。
- 修改交互时优先沿用现有 `data-*` 钩子和原生 Web API，不要引入 jQuery 或组件库。
- 新样式优先复用 `:root` 变量、现有间距体系和 `clamp()` 写法；不要在组件中散落新的主色值。
- 新增图片放在 `assets/`，使用有意义的文件名，补齐中文 `alt`，首屏以下图片继续使用 `loading="lazy"`。
- 保持中文文案的语气：克制、书面、略带诗意，避免营销式夸张表达。
- 所有可交互按钮使用 `<button type="button">` 或正确的表单提交类型；不要用 `div` 模拟按钮。
- 修改弹窗、标签页、移动菜单时保持键盘可操作性和 ARIA 状态同步。
- 修改布局后至少检查桌面 `1440px` 和手机 `390px`，并关注 `960px`、`680px` 两个断点。
- 修改页头、菜单标签页或灯箱的选择器后，同步更新 `tools/` 下的验收脚本。
- 完成后运行冒烟测试并人工检查 JSON；涉及视觉布局时再生成截图核对。
- 不要提交 `previews/`、`preview*.png` 或 `assets/archive/`。

## 10. 版本控制

- 主分支：`main`
- 远程仓库：`origin` → `https://github.com/starchenw/codex-list.git`
- 当前远程仓库为公开仓库。
- 首次提交：`c488b2f Initial commit: 叙野餐厅官网`

提交前建议执行：

```powershell
git status --short
git diff
```

确认没有把截图、备选图、临时文件或本地环境配置加入版本库。
