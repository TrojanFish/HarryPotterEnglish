# 03 极简书房 · 方案 B (双栏工作台对照) 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于 oil-ui 探索并经用户确认的 **「03 极简书房 · 方案 B (双栏工作台对照 · Split-Pane Workbench)」**，为 Hogwarts Audio 重构桌面与移动端响应式布局：桌面端提供 55%:45% 黄金分割工作台（左栏全景精听字幕流 + 右栏免弹窗常驻影子跟读与艾宾浩斯生词岛），手机端自适应折叠，整体设计语言对齐骨白底色 `#F8F8F6`、深炭黑高对比文字 `#18181B`、发丝细线 `#E4E4E7`、克制皇家蓝高光 `#2563EB` 与纯正 4px 微圆角零阴影美学。

**Architecture:**
1. `src/components/StudioWorkbench.vue`: 新增右侧常驻交互工作台组件，包含同屏影子跟读 A/B 评测卡片（联动 Web Speech API 与原声试听）以及本章节重点词汇与艾宾浩斯复习卡片。
2. `src/App.vue`: 在桌面端（`md:` 及以上）采用 `flex flex-row` 双栏分割工作台（左栏 55% `SubtitleViewer`，右栏 45% `StudioWorkbench`）；移动端（`< md`）保持全宽沉浸并支持顶部抽屉/浮层展开。
3. `src/components/SubtitleViewer.vue` 与 `src/components/AudioPlayer.vue`: 精修视觉 Token，激活句左侧采用 3px 皇家蓝细线高光，底栏采用超薄贴地发丝边框，整体零阴影。
4. `tests/vue3/workbench.test.js`: 新增全套单元与布局测试，确保 36+ 项测试 100% 通过。

**Tech Stack:** Vue 3 SFC (`<script setup>`) + Vite + Pinia (`playerStore`, `subtitleStore`, `vocabStore`) + Tailwind CSS + Lucide Vue Next

---

### Task 1: 创建常驻交互工作台组件 `StudioWorkbench.vue`

**Files:**
- Create: `src/components/StudioWorkbench.vue`
- Create: `tests/vue3/workbench.test.js`

**Interfaces:**
- Consumes:
  - `usePlayerStore()`: `player.currentTime`, `player.isPlaying`, `player.seek()`, `player.play()`, `player.pause()`
  - `useSubtitleStore()`: `subtitleStore.currentCue`
  - `useVocabStore()`: `vocabStore.vocabList`, `vocabStore.promoteBox()`, `vocabStore.deleteWord()`
- Produces:
  - 影子跟读录音与 Web Speech API 实时评测（复用 `ShadowingRecorder.vue` 中的成熟算法和状态）
  - 本章收录生词列表与 1 键艾宾浩斯升箱操作

- [ ] **Step 1: 编写 `tests/vue3/workbench.test.js` 结构与规范测试**

```js
import test from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

test('StudioWorkbench.vue file exists and meets standards', () => {
  const filePath = path.resolve('src/components/StudioWorkbench.vue')
  assert.ok(fs.existsSync(filePath), 'StudioWorkbench.vue must exist')

  const content = fs.readFileSync(filePath, 'utf-8')
  assert.ok(content.includes('useSubtitleStore'), 'Must bind to subtitleStore')
  assert.ok(content.includes('usePlayerStore'), 'Must bind to playerStore')
  assert.ok(content.includes('useVocabStore'), 'Must bind to vocabStore')
  assert.ok(content.includes('lucide-vue-next'), 'Must use Lucide icons')
  assert.ok(!content.includes('lucide-react'), 'Must not import lucide-react')
  assert.ok(!content.includes('shadow-2xl') && !content.includes('shadow-xl'), 'Strict zero-shadow')
})
```

- [ ] **Step 2: 运行测试** — `node --test tests/vue3/workbench.test.js` — 预期 FAIL（文件尚未创建）

- [ ] **Step 3: 创建 `src/components/StudioWorkbench.vue`**
  - 卡片 1：A/B 影子跟读评测岛（目标句子展示、听示范原声、开始/停止录音、发音置信度评分徽章、Web Speech 提示）
  - 卡片 2：本章节重点收录与艾宾浩斯复习岛（展示 `vocabStore.vocabList` 中收录的词汇，附带音标、释义、熟记 +1 按钮）
  - 样式规范：`bg-[#ffffff]` 表面，`border border-[#e4e4e7]` 发丝细线，`rounded` (4px)，`text-[#18181b]`，零阴影。

- [ ] **Step 4: 运行测试** — `node --test tests/vue3/workbench.test.js` — 预期 PASS

- [ ] **Step 5: 提交代码**

```bash
git add src/components/StudioWorkbench.vue tests/vue3/workbench.test.js
git commit -m "feat(workbench): create StudioWorkbench component for right-pane interactive training"
```

---

### Task 2: 在 `App.vue` 中集成 55%:45% 桌面双栏工作台

**Files:**
- Modify: `src/App.vue`
- Update: `package.json`（将 `tests/vue3/workbench.test.js` 加入测试命令）

**Interfaces:**
- 桌面端（`md:flex`）：`<main>` 内部为 `flex-row`，左侧为 `<SubtitleViewer class="flex-[1.1] ...">`，右侧为 `<StudioWorkbench class="hidden md:flex flex-[0.9] ...">`
- 移动端（`< md`）：`StudioWorkbench` 在主界面保持隐藏，通过顶部栏或快捷入口唤起，全宽展示 `SubtitleViewer`。

- [ ] **Step 1: 修改 `src/App.vue`**
  - 引入 `StudioWorkbench` 组件
  - 将主工作区包装为响应式双栏结构：
    ```vue
    <main class="flex-1 flex flex-col md:flex-row overflow-hidden relative" role="main">
      <div class="flex-1 md:flex-[1.1] flex flex-col overflow-hidden border-r border-[#e4e4e7]/60">
        <MagicErrorBoundary>
          <SubtitleViewer />
        </MagicErrorBoundary>
      </div>

      <div class="hidden md:flex md:flex-[0.9] overflow-hidden bg-[#f8f8f6]/50">
        <StudioWorkbench />
      </div>
    </main>
    ```
  - 顶栏和底栏根据「03 极简书房」进行轻微对齐：背景采用 `#ffffff` 或 `#f8f8f6/90`，发丝边框 `border-[#e4e4e7]`。

- [ ] **Step 2: 更新 `package.json`** 中的 `scripts.test`，加入 `tests/vue3/workbench.test.js`。

- [ ] **Step 3: 运行全套测试** — `npm test` — 确保 37/37 项测试全部通过。

- [ ] **Step 4: 提交代码**

```bash
git add src/App.vue package.json
git commit -m "feat(layout): implement responsive 55:45 split-pane workbench in App.vue"
```

---

### Task 3: 全局视觉 Token 与极简书房细节精修

**Files:**
- Modify: `src/components/SubtitleViewer.vue`
- Modify: `src/components/AudioPlayer.vue`
- Modify: `src/index.css`（微调基础 CSS 变量以对齐极简书房调性）

- [ ] **Step 1: 精修 `src/components/SubtitleViewer.vue`**
  - 激活高亮句子：左侧边缘赋予 `border-l-2 border-[#2563eb]`（克制皇家蓝），文字加深至 `#18181b`，英文衬线字体增强。
  - 非激活句子：文字为优雅的灰炭色 `#71717a`，字号与行距舒适。
  - 单词点词悬浮样式：`hover:text-[#2563eb] hover:bg-blue-50/50 hover:underline hover:decoration-dotted`。
  - 提示 Toast：采用 `#18181b` 纯黑底色与 `#ffffff` 文字，精致发丝细线。

- [ ] **Step 2: 精修 `src/components/AudioPlayer.vue`**
  - 底栏背景采用 `bg-[#ffffff]/95` 或 `bg-[#f8f8f6]/95`，边框采用 `border-t border-[#e4e4e7]`。
  - 进度条填充色采用皇家蓝高光 `bg-[#2563eb]`，滑块圆润微胶囊。
  - 移除任何残余的不透明度杂音，保证 Apple HIG 44px 热区。

- [ ] **Step 3: 运行全套验证**
  - `npm test`
  - `npm run check-emojis`
  - `npm run verify-security`
  - `npm run build`

- [ ] **Step 4: 提交代码**

```bash
git add src/components/SubtitleViewer.vue src/components/AudioPlayer.vue src/index.css
git commit -m "style(theme): refine pure reader visual tokens with royal blue accents and hairline borders"
```

---

### Task 4: 终验与质量门禁审计

- [ ] **Step 1: 运行本地仿真套件** — `npm run test:simulation`
- [ ] **Step 2: 确认无任何 Emoji 违规与密钥泄漏**
- [ ] **Step 3: 确认 Git 状态干净，准备向用户交付**
