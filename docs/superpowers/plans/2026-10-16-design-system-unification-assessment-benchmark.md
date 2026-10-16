# 全站 UI 风格对齐 AssessmentHub 标杆统一实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 以 `AssessmentHub.vue` 为单一设计基准，彻底清除全站残存的“科技蓝（#2563eb）”与“冷灰白底（bg-white, #e4e4e7）”，实现全景温润羊皮纸、琥珀金重音、无阴影平面层次与 Apple HIG 44px 统一美学。

**Architecture:** 
1. 建立专门的样式合规性测试套件 `tests/vue3/designSystemUnification.test.js`，基于 AST/静态分析与运行时属性，自动化断言设计令牌、触控靶心与零 Emoji 约束。
2. 采用 TDD 模式按业务领域模块分步重塑：精听主流程四大工坊 -> 步骤栏与底部播放器 -> 核心侧边抽屉 -> TED 模块全流程。
3. 保持已有 455 个测试用例 100% 零回归通过。

**Tech Stack:** Vue 3 SFC (Composition API, `<script setup>`), Tailwind CSS 3.4, Lucide Vue Next, Node.js Test Runner (`node:test`).

**Spec:** [`docs/superpowers/specs/2026-10-16-design-system-unification-assessment-benchmark.md`](file:///c:/Users/KeiyeeYu/Desktop/HarryPotterEnglish/docs/superpowers/specs/2026-10-16-design-system-unification-assessment-benchmark.md)

## Global Constraints
- **底色令牌**：全局画布为 `bg-[#fbf9f5]`，重点卡片为 `bg-[#f5efe6]`，常规卡片为 `bg-white/70` 或 `bg-[#faf6ee]`，边框线为 `border-[#e8ddd0]`。
- **主调强调色**：使用琥珀/金棕系（`amber-700`, `amber-800`, `amber-900`, `bg-amber-700 text-amber-50`），彻底移除科技蓝（`#2563eb`, `bg-blue-50`, `border-blue-200` 等）。
- **Apple HIG 触控**：所有可点击控件、按钮、药丸、输入框必须保持 `min-h-[44px] min-w-[44px]`，并携带 `touch-manipulation` 和 `active:scale-[0.98]` 或 `active:scale-95`。
- **严格零 Emoji**：100% 使用 `lucide-vue-next` 矢量图标，严禁任何 Unicode Emoji。
- **测试零回归**：全站现有 455 个测试必须持续 100% 通过。

## Review Focus
1. 避免残留生硬的纯黑操作按钮 `bg-[#18181b]`，主操作按钮需统一为 `bg-amber-700 hover:bg-amber-800 text-amber-50`。
2. 避免颜色替换遗漏了 `:focus` 或悬停状态（如 `focus:border-amber-600` 代替 `focus:border-[#2563eb]`）。
3. 字幕与原著句子的字号与行高需维持 K12 阅读规范（`font-serif leading-[1.85]` ~ `leading-[2.0]`）。
4. 触控热区在紧凑网格（如 5-box 指示器、章节序号）中必须保持 Apple HIG 44px，必要时使用负边距补偿。
5. 模态框和抽屉在多端（尤其是手机端 375px）上滚动顺畅，无横向溢出。

---

### Task 1: 建立样式合规性测试套件 `designSystemUnification.test.js`

**Files:**
- Create: `tests/vue3/designSystemUnification.test.js`

- [ ] **Step 1: 编写失败的合规测试**

编写测试断言目标组件集合不包含 `#2563eb`、`border-[#e4e4e7]`，且包含 `bg-[#fbf9f5]` 和 `border-[#e8ddd0]`：

```javascript
import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Design System Unification to AssessmentHub Benchmark', () => {
  const targetFiles = [
    'src/components/session/StepListening.vue',
    'src/components/session/StepShadowing.vue',
    'src/components/session/StepDictation.vue',
    'src/components/session/StepVocabReview.vue',
    'src/components/layout/StepTabBar.vue',
    'src/components/player/SmartAudioPlayer.vue',
    'src/components/BookshelfDrawer.vue',
    'src/components/VocabularyDrawer.vue',
    'src/components/ted/TedVocabPreload.vue',
    'src/components/ted/TedTaskStudio.vue',
    'src/components/ted/TedShadowing.vue',
    'src/components/ted/TedTalkList.vue',
    'src/components/ted/TedStepBar.vue'
  ]

  test('target files exist', () => {
    for (const f of targetFiles) {
      assert.ok(fs.existsSync(path.resolve(f)), `File must exist: ${f}`)
    }
  })

  test('no legacy tech blue (#2563eb) remains in core session and navigation components', () => {
    for (const f of targetFiles) {
      const content = fs.readFileSync(path.resolve(f), 'utf-8')
      assert.ok(!content.includes('#2563eb'), `${f} must not contain tech blue #2563eb`)
    }
  })
})
```

- [ ] **Step 2: 运行测试以确认失败**

Run: `node --test tests/vue3/designSystemUnification.test.js`
Expected: FAIL（存在大量 `#2563eb`）

- [ ] **Step 3: 提交合规测试套件基础框架**

```bash
git add tests/vue3/designSystemUnification.test.js
git commit -m "test(design): add design system unification compliance test suite"
```

---

### Task 2: 精听多模态主课堂 `StepListening.vue` 视觉重塑

**Files:**
- Modify: `src/components/session/StepListening.vue`

**Design Changes:**
- 外层容器采用 `bg-[#fbf9f5]`。
- 字幕控制带与分割线采用 `border-[#e8ddd0]`。
- 字幕卡片流：常规卡片 `bg-white/75 border-[#e8ddd0] hover:border-amber-300`；当前激活句采用 `border-l-4 border-l-amber-600 border-[#e8ddd0] bg-amber-500/10`；时间戳高亮为 `text-amber-800`。
- 词级点击高亮采用 `hover:text-amber-700 hover:underline`。
- 右侧当前句核心词汇面板：背景采用 `bg-[#f5efe6] border-l border-[#e8ddd0]`，词汇数量药丸采用 `bg-amber-100 text-amber-900 border-amber-300`，词卡采用 `bg-white/80 border-[#e8ddd0] hover:border-amber-400`。

- [ ] **Step 1: 修改 `StepListening.vue` 样式代码**
- [ ] **Step 2: 运行针对性测试验证通过**

Run: `node --test tests/vue3/stepListening.test.js`
Expected: PASS

- [ ] **Step 3: 提交修改**

```bash
git add src/components/session/StepListening.vue
git commit -m "refactor(ui): align StepListening to AssessmentHub parchment and amber benchmark"
```

---

### Task 3: 影子跟读工坊 `StepShadowing.vue` 视觉重塑

**Files:**
- Modify: `src/components/session/StepShadowing.vue`

**Design Changes:**
- 外层容器改用 `bg-[#fbf9f5]`。
- 跟读目标句卡片改用 `bg-[#f5efe6] border border-[#e8ddd0] rounded-2xl`，句序药丸改用 `bg-white/80 border-[#e8ddd0] text-stone-600`，麦克风图标改用 `text-amber-700`。
- 示范原声卡片 Track A：`bg-white/70 border-[#e8ddd0]`，播放按钮采用 `bg-[#fbf9f5] hover:bg-[#f2ece2] border-[#e8ddd0] text-stone-800`，图标 `text-amber-700`，原声圆点改用琥珀金。
- 我的录音卡片 Track B：录音停止/开始主按钮改用 `bg-amber-700 hover:bg-amber-800 text-amber-50 font-bold`（录音状态时使用 `bg-rose-700 hover:bg-rose-800`）；回放按钮采用 `border-amber-300 bg-amber-50 text-amber-800` 激活态。

- [ ] **Step 1: 修改 `StepShadowing.vue` 样式代码**
- [ ] **Step 2: 运行测试验证**

Run: `node --test tests/vue3/stepShadowing.test.js tests/vue3/audioPlayer.test.js`
Expected: PASS

- [ ] **Step 3: 提交修改**

```bash
git add src/components/session/StepShadowing.vue
git commit -m "refactor(ui): align StepShadowing to AssessmentHub parchment and dual-track benchmark"
```

---

### Task 4: 拼写听写工坊 `StepDictation.vue` 视觉重塑

**Files:**
- Modify: `src/components/session/StepDictation.vue`

**Design Changes:**
- 外层容器改用 `bg-[#fbf9f5]`。
- 顶部卡片：`bg-[#f5efe6] border border-[#e8ddd0] rounded-2xl`。
- 游戏模式切换器：容器 `bg-[#e8ddd0]/50 border border-[#e8ddd0]`，激活模式改用 `bg-amber-700 text-amber-50 font-bold`，未激活改用 `text-stone-600 hover:text-stone-900`。
- 连胜徽章：`bg-amber-100 text-amber-900 border border-amber-300`。
- 填空输入框与词块拼图候选芯片：聚焦边框改为 `focus:border-amber-600 focus:ring-amber-200`，候选词块未激活 `bg-white/80 border-[#e8ddd0] text-stone-800`，选中采用 `bg-amber-700 text-amber-50`。
- 提交主操作按钮：采用 `bg-amber-700 hover:bg-amber-800 text-amber-50 font-bold`。

- [ ] **Step 1: 修改 `StepDictation.vue` 样式代码**
- [ ] **Step 2: 运行测试验证**

Run: `node --test tests/vue3/dictationStudio.test.js`
Expected: PASS

- [ ] **Step 3: 提交修改**

```bash
git add src/components/session/StepDictation.vue
git commit -m "refactor(ui): align StepDictation to AssessmentHub parchment and amber game modes"
```

---

### Task 5: 艾宾浩斯复习流 `StepVocabReview.vue` 视觉重塑

**Files:**
- Modify: `src/components/session/StepVocabReview.vue`

**Design Changes:**
- 外层容器改用 `bg-[#fbf9f5]`。
- 5-Box 切换卡片：`bg-[#f5efe6] border border-[#e8ddd0] rounded-2xl`，激活箱号按钮采用 `bg-amber-700 text-amber-50 font-bold`，未激活箱号采用 `bg-white/80 border-[#e8ddd0] text-stone-700 hover:bg-[#fbf9f5]`。
- 3D 翻转卡片：正面 `bg-white/90 border-[#e8ddd0]`，英文采用 `font-serif font-bold text-stone-900`；背面 `bg-[#faf6ee] border-[#e8ddd0]`，释义采用 `text-stone-800`。
- 掌握度操作栏：没记住（`bg-rose-50 text-rose-800 border-rose-200`）、模糊（`bg-amber-50 text-amber-800 border-amber-200`）、牢记（`bg-emerald-50 text-emerald-800 border-emerald-200`）。

- [ ] **Step 1: 修改 `StepVocabReview.vue` 样式代码**
- [ ] **Step 2: 运行测试验证**

Run: `node --test tests/vue3/vocabStore.test.js`
Expected: PASS

- [ ] **Step 3: 提交修改**

```bash
git add src/components/session/StepVocabReview.vue
git commit -m "refactor(ui): align StepVocabReview to AssessmentHub parchment 5-box benchmark"
```

---

### Task 6: 步骤流程栏与音频播放器 `StepTabBar.vue` & `SmartAudioPlayer.vue`

**Files:**
- Modify: `src/components/layout/StepTabBar.vue`
- Modify: `src/components/player/SmartAudioPlayer.vue`

**Design Changes:**
- `StepTabBar.vue`：
  - 背景与边框改用 `bg-[#fbf9f5] border-b border-[#e8ddd0]`。
  - 激活步骤改用 `bg-amber-700 text-amber-50 font-bold`，序号徽标为白圈金字 `border-white text-white`。
  - 未激活步骤改用 `text-stone-600 hover:text-stone-900 hover:bg-[#f2ece2]`。
- `SmartAudioPlayer.vue`：
  - 容器改用 `bg-[#fbf9f5] border-t border-[#e8ddd0]`。
  - 进度槽采用 `bg-[#e8ddd0]`，已播放进度条填充色采用 `bg-amber-600 group-hover:bg-amber-700`。
  - 居中主播放按钮采用 `bg-amber-700 hover:bg-amber-800 text-amber-50`。
  - 单句循环按钮激活态采用 `bg-amber-100 text-amber-900 border border-amber-300 font-semibold`。
  - 倍速控制药丸采用 `bg-white/80 border border-[#e8ddd0] text-stone-700 hover:bg-[#f2ece2]`。

- [ ] **Step 1: 修改 `StepTabBar.vue` 与 `SmartAudioPlayer.vue` 样式代码**
- [ ] **Step 2: 运行针对性测试验证**

Run: `node --test tests/vue3/audioPlayer.test.js tests/vue3/sprint6Integration.test.js`
Expected: PASS

- [ ] **Step 3: 提交修改**

```bash
git add src/components/layout/StepTabBar.vue src/components/player/SmartAudioPlayer.vue
git commit -m "refactor(ui): align StepTabBar and SmartAudioPlayer to AssessmentHub parchment theme"
```

---

### Task 7: 侧边抽屉与辅助模态 `BookshelfDrawer.vue` & `VocabularyDrawer.vue`

**Files:**
- Modify: `src/components/BookshelfDrawer.vue`
- Modify: `src/components/VocabularyDrawer.vue`
- Modify: `src/components/AnalyticsDashboard.vue`
- Modify: `src/components/StorageManagerModal.vue`
- Modify: `src/components/ShortcutsModal.vue`

**Design Changes:**
- `BookshelfDrawer.vue`：
  - 面板改用 `bg-[#fbf9f5] border-l border-[#e8ddd0]`。
  - HP1~HP7 书本标签激活态改用 `bg-amber-50/80 border-amber-600 text-amber-900 font-bold`；未激活改用 `bg-white/70 border-[#e8ddd0] text-stone-600`。
  - 激活章节条目改用 `bg-amber-50/70 border-amber-500 border-l-4 border-l-amber-600 text-stone-900`。
- `VocabularyDrawer.vue`：
  - 面板与搜索区改用 `bg-[#fbf9f5] border-[#e8ddd0]`，搜索输入框聚焦边框为 `focus:border-amber-600`。
  - 箱号过滤激活态改用 `bg-amber-700 text-amber-50`。
  - 词汇卡片流采用 `bg-white/85 border-[#e8ddd0]`，单词字型采用 `font-serif text-stone-900`。
- `AnalyticsDashboard.vue` / `StorageManagerModal.vue` / `ShortcutsModal.vue`：
  - 全面清除 `#e4e4e7` 与纯黑按钮，统一至羊皮纸色系与琥珀金操作金字塔。

- [ ] **Step 1: 修改抽屉与模态组件样式代码**
- [ ] **Step 2: 运行测试验证**

Run: `node --test tests/vue3/bookshelfView.test.js tests/vue3/vocabularyDrawer.test.js`
Expected: PASS

- [ ] **Step 3: 提交修改**

```bash
git add src/components/BookshelfDrawer.vue src/components/VocabularyDrawer.vue src/components/AnalyticsDashboard.vue src/components/StorageManagerModal.vue src/components/ShortcutsModal.vue
git commit -m "refactor(ui): align drawers and modals to AssessmentHub parchment benchmark"
```

---

### Task 8: TED 视听体系整改与全站合规测试绿化

**Files:**
- Modify: `src/components/ted/TedVocabPreload.vue`
- Modify: `src/components/ted/TedTaskStudio.vue`
- Modify: `src/components/ted/TedShadowing.vue`
- Modify: `src/components/ted/TedTalkList.vue`
- Modify: `src/components/ted/TedStepBar.vue`
- Test: `tests/vue3/designSystemUnification.test.js`

**Design Changes:**
- TED 词汇预学、任务演练、跟读对比、演讲列表、步骤栏全数消除残余的冷白与科技蓝。
- 完整运行样式合规测试 `designSystemUnification.test.js`，全部断言转绿。
- 执行全局质检：`npm test`（455+ 全绿）、`npm run build`、`npm run check-emojis`、`npm run verify-security`。

- [ ] **Step 1: 修改 TED 模块组件样式代码**
- [ ] **Step 2: 运行样式合规测试套件**

Run: `node --test tests/vue3/designSystemUnification.test.js`
Expected: PASS

- [ ] **Step 3: 运行完整工程全量质检**

Run: `npm test && npm run build && npm run check-emojis && npm run verify-security`
Expected: 455+ tests pass, build clean, 0 emojis, 0 security leaks.

- [ ] **Step 4: 提交修改**

```bash
git add src/components/ted/*.vue tests/vue3/designSystemUnification.test.js
git commit -m "refactor(ui): align TED ecosystem to AssessmentHub benchmark and pass full design audit"
```
