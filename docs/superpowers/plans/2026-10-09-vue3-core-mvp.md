# Vue 3 Core MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于全新独立分支 `feature/vue3-core-mvp`，将 Hogwarts Audio 核心前端架构迁移至 Vue 3 (Composition API + Pinia + Vite 6 + TailwindCSS)，实现流媒体音频播放、章节书架选择及 WebVTT 英雄聚焦单句精听。

**Architecture:** 创建独立 Git 分支隔离重构；替换 Vite 插件为 `@vitejs/plugin-vue`；状态层采用 Pinia (`playerStore` 与 `subtitleStore`)；视图层拆分为 `AudioPlayer.vue`、`SubtitleViewer.vue` 与 `BookshelfDrawer.vue`；原生 `<audio>` 实例采用 `shallowRef` 避免 Proxy 劫持；复用纯原生工具库与霍格沃茨羊皮纸设计体系。

**Tech Stack:** Vue 3.5+, Vite 6, `@vitejs/plugin-vue`, Pinia 2.2+, `lucide-vue-next`, TailwindCSS 3, 原生 HTML5 Audio, WebVTT.

**Spec:** [`docs/superpowers/specs/2026-10-09-vue3-core-mvp-design.md`](file:///c:/Users/Administrator/Desktop/harrypotter/docs/superpowers/specs/2026-10-09-vue3-core-mvp-design.md)

## Global Constraints

- **Git 分支隔离**：所有改动严格在 `feature/vue3-core-mvp` 上进行，`main` 主分支保留现存 React 版本。
- **零 Emoji 规范**：用户界面和代码中严禁出现任何 Emoji 字符，所有图标必须使用 `lucide-vue-next`。
- **人机工程学基准**：所有交互按钮尺寸必须 $\ge 44 \times 44\text{px}$ (Apple HIG 触控热区)。
- **原生媒体安全**：`<audio>` 元素实例必须使用 `shallowRef` 管理，严禁放入深度响应式 `reactive`。
- **设计风格一致**：继承现有的霍格沃茨羊皮纸设计系统（`#fbf9f5` 底衬、`#1e1610` 正文、无重阴影扁平风）。

## Review Focus

1. **Proxy 代理穿透导致音频缓冲事件失效**：必须用 `shallowRef` 包装 `<audio>`，并在切换章节时验证 `canplay`、`timeupdate` 和 `ended` 事件正常触发。
2. **高频 `timeupdate` 卡顿**：每秒 4~10 次触发的字幕时间匹配必须在 Store 中使用二分查找定位，不得使用全数组 `filter`/`find`。
3. **进度条拖拽跳针抖动**：滑动进度条时仅更新视图 UI 临时秒数，松手后才更新底层 `currentTime`。
4. **断点续听丢失**：章节切换与暂停时需将 `currentChapterId` 和 `currentTime` 同步至 `localStorage` 的 `hp_last_position`。
5. **无字幕章节报错白屏**：当章节缺少 VTT 文件时，进入纯音频磨耳朵模式，控制台警告而不产生未捕获异常。

---

### Task 1: 分支建立与 Vue 3 核心工程环境配置

**Files:**
- Create: `src/main.js`
- Modify: `package.json`, `vite.config.js`, `index.html`
- Test: `tests/vue3/smoke.test.js`

**Interfaces:**
- Produces: 启动并支持 `.vue` 单文件组件编译的 Vite 6 开发与构建环境。

- [ ] **Step 1: 检出重构专属分支 `feature/vue3-core-mvp`**

Run: `git checkout -b feature/vue3-core-mvp`
Expected: 切换至新分支。

- [ ] **Step 2: 调整 `package.json` 依赖**

将 `@vitejs/plugin-react`、`react`、`react-dom` 替换为 `vue` (^3.5.0)、`@vitejs/plugin-vue` (^5.2.0)、`pinia` (^2.2.0)、`lucide-vue-next` (^0.453.0)。

- [ ] **Step 3: 更新 `vite.config.js`**

使用 `@vitejs/plugin-vue` 替换原有 React 插件配置。

- [ ] **Step 4: 创建 Vue 3 入口 `src/main.js` 并更新 `index.html`**

挂载 Pinia 实例与基础 App 骨架，引入 `src/index.css`。

- [ ] **Step 5: 编写环境冒烟测试并在 Node 环境下执行**

Run: `npm install && npm run build`
Expected: 构建成功输出 `dist/`。

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.js index.html src/main.js
git commit -m "chore(vue3): scaffold Vue 3 and Pinia tooling baseline"
```

---

### Task 2: Pinia 状态管理层实现 (`playerStore` 与 `subtitleStore`)

**Files:**
- Create: `src/stores/playerStore.js`, `src/stores/subtitleStore.js`
- Test: `tests/vue3/stores.test.js`

**Interfaces:**
- Consumes: `src/utils/vttParser.js`, `src/utils/booksData.js`
- Produces:
  - `usePlayerStore()`: `{ currentBookId, currentChapterId, isPlaying, currentTime, duration, playbackRate, volume, isBlindMode, isBookshelfOpen, play(), pause(), seek(time), switchChapter(bookId, chapterId) }`
  - `useSubtitleStore()`: `{ cues, activeCueIndex, activeCue, loadVtt(url), updateActiveCue(currentTime) }`

- [ ] **Step 1: 编写 Stores 单元测试 `tests/vue3/stores.test.js`**

测试 `updateActiveCue` 二分查找正确性、章节切换状态重置与 `localStorage` 断点记录。

- [ ] **Step 2: 运行测试验证失败**

Run: `node tests/vue3/stores.test.js`
Expected: FAIL (模块未定义)

- [ ] **Step 3: 实现 `src/stores/playerStore.js` 与 `src/stores/subtitleStore.js`**

实现播放状态流转、`localStorage` 读写持久化及二分查找优化。

- [ ] **Step 4: 运行测试验证通过**

Run: `node tests/vue3/stores.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/stores/playerStore.js src/stores/subtitleStore.js tests/vue3/stores.test.js
git commit -m "feat(vue3): implement Pinia player and subtitle stores"
```

---

### Task 3: 底部流媒体控制栏组件 (`AudioPlayer.vue`)

**Files:**
- Create: `src/components/AudioPlayer.vue`
- Test: `tests/vue3/audioPlayer.test.js`

**Interfaces:**
- Consumes: `usePlayerStore()`
- Produces: 满足 $\ge 44\text{px}$ 触控、支持拖拽防抖、倍速切换 (0.8x~1.5x) 的底部固定播放栏。

- [ ] **Step 1: 编写 AudioPlayer 组件逻辑测试**

验证时间格式化输出（`mm:ss`）、快进快退 5 秒逻辑计算以及倍速列表。

- [ ] **Step 2: 编写 `src/components/AudioPlayer.vue`**

使用 `<script setup>` 编写单文件组件，应用暖色羊皮纸设计规范、`lucide-vue-next` 图标（`Play`, `Pause`, `RotateCcw`, `RotateCw`, `Gauge` 等）。

- [ ] **Step 3: 验证组件渲染与交互逻辑**

Run: `node tests/vue3/audioPlayer.test.js`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/AudioPlayer.vue tests/vue3/audioPlayer.test.js
git commit -m "feat(vue3): add AudioPlayer SFC component"
```

---

### Task 4: WebVTT 精听多模态视窗 (`SubtitleViewer.vue`)

**Files:**
- Create: `src/components/SubtitleViewer.vue`
- Test: `tests/vue3/subtitleViewer.test.js`

**Interfaces:**
- Consumes: `usePlayerStore()`, `useSubtitleStore()`
- Produces: 具备单句英雄聚焦 (`hero-sentence`)、4px 琥珀色引导条、Lumos 聚光灯跳转及隐身斗篷盲听遮罩的字幕视图。

- [ ] **Step 1: 编写 SubtitleViewer 行为逻辑测试**

测试激活样式类名输出与点击单句跳转 `startTime` 派发。

- [ ] **Step 2: 编写 `src/components/SubtitleViewer.vue`**

使用 `<script setup>`，`watch(activeCueIndex)` 触发平滑滚动 `scrollIntoView({ behavior: 'smooth', block: 'center' })`，实现盲听模式遮罩与单句点击起播。

- [ ] **Step 3: 验证逻辑通过**

Run: `node tests/vue3/subtitleViewer.test.js`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/SubtitleViewer.vue tests/vue3/subtitleViewer.test.js
git commit -m "feat(vue3): add SubtitleViewer component with hero focus"
```

---

### Task 5: 书架抽屉与章节选择组件 (`BookshelfDrawer.vue`)

**Files:**
- Create: `src/components/BookshelfDrawer.vue`
- Test: `tests/vue3/bookshelf.test.js`

**Interfaces:**
- Consumes: `usePlayerStore()`, `src/utils/booksData.js`
- Produces: 7 卷阶梯化书架导航面板（对齐 CEFR A2~C1 标识），支持章节切换与抽屉侧滑动效。

- [ ] **Step 1: 编写 Bookshelf 章节解析与难度标签映射测试**

- [ ] **Step 2: 编写 `src/components/BookshelfDrawer.vue`**

使用 Vue 3 `<Transition>` 实现丝滑侧边抽屉滑入滑出，渲染 7 卷有声小说目录，提供清晰的双通道无障碍指示。

- [ ] **Step 3: 验证测试通过**

Run: `node tests/vue3/bookshelf.test.js`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/BookshelfDrawer.vue tests/vue3/bookshelf.test.js
git commit -m "feat(vue3): add BookshelfDrawer component with CEFR levels"
```

---

### Task 6: 顶层容器组装与错误边界 (`App.vue` & `MagicErrorBoundary.vue`)

**Files:**
- Create: `src/App.vue`, `src/components/common/MagicErrorBoundary.vue`, `src/components/common/WorkshopPlaceholder.vue`
- Modify: `src/main.js`

**Interfaces:**
- Consumes: `usePlayerStore()`, `useSubtitleStore()`, `shallowRef(HTMLAudioElement)`
- Produces: 完整可运行的 Vue 3 MVP 应用。

- [ ] **Step 1: 创建通用错误边界与工坊占位卡片组件**

编写 `MagicErrorBoundary.vue` 与 `WorkshopPlaceholder.vue`。

- [ ] **Step 2: 编写 `src/App.vue` 顶层装配逻辑**

声明 `const audioElement = shallowRef(null)`，绑定原生 `<audio>` 事件（`timeupdate`, `ended`, `error`, `play`, `pause`），处理全局快捷键（空格播放/暂停），组装 Header、SubtitleViewer、AudioPlayer 与 BookshelfDrawer。

- [ ] **Step 3: 本地启动验证与冒烟测试**

Run: `npm run build`
Expected: 生产构建 0 错误输出。

- [ ] **Step 4: Commit**

```bash
git add src/App.vue src/components/common/MagicErrorBoundary.vue src/components/common/WorkshopPlaceholder.vue
git commit -m "feat(vue3): assemble root App layout with audio pipeline"
```

---

### Task 7: 规范审计与全链路质量验收

**Files:**
- Verify: 全量工作区文件

- [ ] **Step 1: 运行零 Emoji 审计脚本**

Run: `npm run check-emojis`
Expected: 0 emojis found, audit passed.

- [ ] **Step 2: 运行生产打包校验**

Run: `npm run build`
Expected: Vite 打包完全成功，输出纯净的 SPA bundle。

- [ ] **Step 3: 运行 Vue 3 测试套件**

Run: `node tests/vue3/stores.test.js && node tests/vue3/audioPlayer.test.js && node tests/vue3/subtitleViewer.test.js && node tests/vue3/bookshelf.test.js`
Expected: 全部测试绿灯通过。

- [ ] **Step 4: Commit**

```bash
git commit --allow-empty -m "chore(vue3): complete Phase 1 Core MVP verification"
```
