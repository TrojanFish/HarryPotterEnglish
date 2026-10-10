# Hogwarts Audio · 方案 C (Session 步骤流) 实施计划 (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有零散的字幕播放器与工坊抽屉全面重组为沉浸式 4 步 Session 流程架构（① 精听 → ② 跟读 → ③ 听写 → ④ 词汇复习），实现清爽统一的极简排版与响应式人因体验。

**Architecture:** 
1. 引入 `sessionStore.js` 统一调度当前步骤（1~4）与流转逻辑；
2. 顶部由 `TopHeader` + `StepTabBar` 构成极简导航，主舞台根据步骤动态挂载四个独立的沉浸式阶段组件；
3. 底部部署全功能响应式 `SmartAudioPlayer`，提供全宽可拖动进度条、前后切句、倍速、单句循环锁定与自适应「下一步 →」行动按钮。

**Tech Stack:** Vue 3 (Composition API / `<script setup>`), Pinia, Tailwind CSS, Lucide Vue Next, Vite, Node.js Test Runner.

**Spec:** `docs/superpowers/specs/2026-10-10-session-flow-redesign.md`

## Global Constraints
- **零 Emoji 铁律**：严禁出现任何 Unicode Emoji，所有图标 100% 使用 Lucide 矢量图标；
- **视觉主题**：严格遵循 03 极简书房 (Pure Reader)，骨白基底 `#F8F8F6`、内容面 `#FFFFFF`、皇家蓝 `#2563EB`、极细描边 `#E4E4E7`；
- **零阴影法则**：禁止任何 `shadow-lg`, `shadow-xl`, `shadow-2xl`，依靠 1px 细线边框分隔空间；
- **触控人因**：所有交互控件点击区域不得低于 Apple HIG 标准 `44×44px`；
- **移动端键盘规范**：所有 `<input>` 与 `<textarea>` 最小字号 16px，防止 iOS Safari 缩放视口；
- **测试覆盖**：每项任务均需保持既有测试 100% 通过（当前基线为 38/38）。

## Review Focus
1. **步骤切换时音频播放状态连续性**：切换步骤时音频不能意外静音或爆音崩溃；
2. **跟读与听写单句片段播放越界问题**：在步骤 2 和 3 中，播放原声必须在 `cue.end - 0.15` 时精确暂停；
3. **生词查词防重复**：在步骤 1 点击生词时，不可向 Pinia store 插入重复单词；
4. **小屏手机响应式溢出**：在 iPhone 375px 宽度下，4 步 Tab 与底部播放器按键不能折行挤压或重叠；
5. **构建与离线兼容性**：Vite 构建零警告，且不可将 Cloudflare R2 凭证硬编码入客户端代码。

---

### Task 1: Session 状态管理与步骤导航条 (`sessionStore.js` & `StepTabBar.vue`)

**Files:**
- Create: `src/stores/sessionStore.js`
- Create: `src/components/layout/StepTabBar.vue`
- Test: `tests/vue3/sessionStore.test.js`

**Interfaces:**
- Consumes: none
- Produces: 
  - `useSessionStore`: `{ currentStep: Ref<number>, setStep(n: number), advanceStep(), isStepCompleted(n: number) }`
  - `StepTabBar`: Emits `select-step(n: number)`

- [ ] **Step 1: 编写测试用例 `tests/vue3/sessionStore.test.js`**
```js
import { test, describe } from 'node:test'
import assert from 'node:assert'
import { setActivePinia, createPinia } from 'pinia'
import { useSessionStore } from '../../src/stores/sessionStore.js'

describe('sessionStore', () => {
  test('initializes at step 1 and advances properly', () => {
    setActivePinia(createPinia())
    const store = useSessionStore()
    assert.strictEqual(store.currentStep, 1)
    store.advanceStep()
    assert.strictEqual(store.currentStep, 2)
    store.setStep(4)
    assert.strictEqual(store.currentStep, 4)
  })
})
```

- [ ] **Step 2: 运行测试验证失败**
Run: `node --test tests/vue3/sessionStore.test.js`
Expected: FAIL (Cannot find module)

- [ ] **Step 3: 实现 `src/stores/sessionStore.js` 与 `src/components/layout/StepTabBar.vue`**
- `src/stores/sessionStore.js`: 实现 Pinia store，管理 1..4 步状态；
- `src/components/layout/StepTabBar.vue`: 渲染 4 个药丸按钮（1. 精听, 2. 跟读, 3. 听写, 4. 词汇），触控热区 `min-h-[44px]`，激活态采用皇家蓝背景 `#2563EB`。

- [ ] **Step 4: 运行测试验证通过**
Run: `node --test tests/vue3/sessionStore.test.js`
Expected: PASS

- [ ] **Step 5: 提交代码**
```bash
git add src/stores/sessionStore.js src/components/layout/StepTabBar.vue tests/vue3/sessionStore.test.js
git commit -m "feat: add sessionStore and StepTabBar component"
```

---

### Task 2: 步骤 1 精听主舞台重构 (`StepListening.vue`)

**Files:**
- Create: `src/components/session/StepListening.vue`
- Modify: `src/components/SubtitleViewer.vue`
- Test: `tests/vue3/stepListening.test.js`

**Interfaces:**
- Consumes: `useSubtitleStore`, `usePlayerStore`, `useVocabStore`
- Produces: `StepListening.vue`

- [ ] **Step 1: 编写测试用例 `tests/vue3/stepListening.test.js`**
验证 `StepListening.vue` 正确引入、拥有触控热区以及单词点击收录逻辑。

- [ ] **Step 2: 运行测试验证失败**
Run: `node --test tests/vue3/stepListening.test.js`
Expected: FAIL

- [ ] **Step 3: 实现 `src/components/session/StepListening.vue`**
- 左侧 (或手机端全屏): 宽行距 (`leading-[2.0]`) 纯净阅读纸张排版，单词间距 `mr-[0.35em]`，点击单词调用 `vocabStore.addWord` 并弹出 Toast；
- 右侧 (桌面端 ≥ 768px): 当前句高频重点考纲词汇速查卡片与一键直达跟读入口；
- 顶部支持一键盲听模式切换（模糊中文译文）。

- [ ] **Step 4: 运行测试验证通过**
Run: `node --test tests/vue3/stepListening.test.js`
Expected: PASS

- [ ] **Step 5: 提交代码**
```bash
git add src/components/session/StepListening.vue tests/vue3/stepListening.test.js
git commit -m "feat: implement StepListening stage component with word-tap vocab"
```

---

### Task 3: 步骤 2 影子跟读工坊主舞台 (`StepShadowing.vue`)

**Files:**
- Create: `src/components/session/StepShadowing.vue`
- Test: `tests/vue3/stepShadowing.test.js`

**Interfaces:**
- Consumes: `useSubtitleStore`, `usePlayerStore`
- Produces: `StepShadowing.vue`

- [ ] **Step 1: 编写测试用例 `tests/vue3/stepShadowing.test.js`**
验证 `StepShadowing.vue` 包含 Track A / Track B 对比控件，且音频切片在 `cue.end - 0.15` 停止。

- [ ] **Step 2: 运行测试验证失败**
Run: `node --test tests/vue3/stepShadowing.test.js`
Expected: FAIL

- [ ] **Step 3: 实现 `src/components/session/StepShadowing.vue`**
- 居中目标句子大字号卡片 (`text-2xl font-serif leading-relaxed`)；
- Track A (原声示范)：循环播放当前句音频片段；
- Track B (我的录音)：调用 Web Speech API 或 MediaRecorder 进行录制与回放；
- AI 发音测评：展示准确度得分卡与发音评估详情；
- 底部提供直通「前往听写工坊 →」按钮。

- [ ] **Step 4: 运行测试验证通过**
Run: `node --test tests/vue3/stepShadowing.test.js`
Expected: PASS

- [ ] **Step 5: 提交代码**
```bash
git add src/components/session/StepShadowing.vue tests/vue3/stepShadowing.test.js
git commit -m "feat: implement StepShadowing stage component with dual-track A/B"
```

---

### Task 4: 步骤 3 拼写听写工坊主舞台 (`StepDictation.vue`)

**Files:**
- Create: `src/components/session/StepDictation.vue`
- Test: `tests/vue3/stepDictation.test.js`

**Interfaces:**
- Consumes: `useSubtitleStore`, `usePlayerStore`
- Produces: `StepDictation.vue`

- [ ] **Step 1: 编写测试用例 `tests/vue3/stepDictation.test.js`**
验证 `StepDictation.vue` 具有 16px 输入框，Enter 键提交校验，并正确计算字符差异。

- [ ] **Step 2: 运行测试验证失败**
Run: `node --test tests/vue3/stepDictation.test.js`
Expected: FAIL

- [ ] **Step 3: 实现 `src/components/session/StepDictation.vue`**
- 单句盲听提示卡片，支持 Tab 或按键重听本句；
- `<textarea>` 输入框设为 `text-base` (≥ 16px)，声明 `autocapitalize="none" spellcheck="false"`；
- Enter 键提交，显示红绿对比校验结果，匹配度达标时自动提供「前往生词复习 →」入口。

- [ ] **Step 4: 运行测试验证通过**
Run: `node --test tests/vue3/stepDictation.test.js`
Expected: PASS

- [ ] **Step 5: 提交代码**
```bash
git add src/components/session/StepDictation.vue tests/vue3/stepDictation.test.js
git commit -m "feat: implement StepDictation stage component with diff verification"
```

---

### Task 5: 步骤 4 艾宾浩斯词汇复习主舞台 (`StepVocabReview.vue`)

**Files:**
- Create: `src/components/session/StepVocabReview.vue`
- Test: `tests/vue3/stepVocabReview.test.js`

**Interfaces:**
- Consumes: `useVocabStore`
- Produces: `StepVocabReview.vue`

- [ ] **Step 1: 编写测试用例 `tests/vue3/stepVocabReview.test.js`**
验证 `StepVocabReview.vue` 连接 `vocabStore`，支持 5 盒级别展示和抽认卡翻转逻辑。

- [ ] **Step 2: 运行测试验证失败**
Run: `node --test tests/vue3/stepVocabReview.test.js`
Expected: FAIL

- [ ] **Step 3: 实现 `src/components/session/StepVocabReview.vue`**
- 顶部展示 Leitner 5 盒进阶徽章数量；
- 居中展示 3D 翻转抽认卡：正面为单词、音标、原著例句；背面为中文释义与拓展辨析；
- 底部操作按钮：【遗忘 (回退 Box 1)】 与 【熟记 +1 (升级下一盒)】；
- 完成本章所有生词后，呈现「课时通关成就」总结徽章。

- [ ] **Step 4: 运行测试验证通过**
Run: `node --test tests/vue3/stepVocabReview.test.js`
Expected: PASS

- [ ] **Step 5: 提交代码**
```bash
git add src/components/session/StepVocabReview.vue tests/vue3/stepVocabReview.test.js
git commit -m "feat: implement StepVocabReview stage component with 3D Leitner cards"
```

---

### Task 6: 智能底部播放器与全局 App.vue 组装 (`SmartAudioPlayer.vue` & `App.vue`)

**Files:**
- Create: `src/components/player/SmartAudioPlayer.vue`
- Modify: `src/App.vue`
- Test: `tests/vue3/audioPlayer.test.js`, `tests/vue3/smoke.test.js`

**Interfaces:**
- Consumes: `sessionStore`, `playerStore`, `subtitleStore`, `catalogStore`
- Produces: 全局响应式流式布局

- [ ] **Step 1: 编写测试用例验证 SmartAudioPlayer 包含单句循环、倍速切换与下一步行动按钮**
- [ ] **Step 2: 实现 `src/components/player/SmartAudioPlayer.vue`**
- 贴底 flex child (`shrink-0 w-full bg-white border-t border-[#E4E4E7]`)；
- 全宽进度条拖动；
- 播放控制簇：切句、快退/进 10s、播放/暂停、倍速、单句循环锁定；
- 右侧自适应流转按钮（如「跟读 →」、「听写 →」、「词汇 →」）。
- [ ] **Step 3: 重构 `src/App.vue`**
- 移除杂乱的 55%:45% 分栏结构与顶栏堆叠图标；
- 组合 TopHeader + StepTabBar + 动态步骤舞台 (`StepListening` / `StepShadowing` / `StepDictation` / `StepVocabReview`) + SmartAudioPlayer；
- 保留书架、学情、离线、快捷键模态抽屉入口。
- [ ] **Step 4: 运行自动化测试与代码规范检查**
Run: `npm test && npm run check-emojis && npm run verify-security && npm run build`
Expected: 所有的测试全部通过（44+ 个），Emoji 0 违规，构建无错误。
- [ ] **Step 5: 提交并推送到代码库**
```bash
git add src/components/player/SmartAudioPlayer.vue src/App.vue tests/
git commit -m "feat: integrate Session Flow architecture and SmartAudioPlayer into App.vue"
```
