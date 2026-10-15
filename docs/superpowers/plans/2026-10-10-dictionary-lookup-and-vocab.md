# 即时查词与全局生词本系统实施计划 (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建闭环的精听即时查词系统（iOS Bottom Sheet 卡片、音标、真人发音、中考/高考/原著标签、释义与一键收录）及顶栏常驻生词本入口与抽屉增强（发音、搜索过滤、向下滑动关闭手势）。

**Architecture:** 
采用离线优先的分层架构：`dictionaryData.js` 提供词形清洗、屈折还原与本地预置词条；`vocabStore.js` 扩展富字段与 `hasWord` / `toggleWord` 动作；`WordLookupModal.vue` 呈现触控友好的词典卡片并联动播放器暂停；`App.vue` 与 `VocabularyDrawer.vue` 增强全局常驻入口、实时徽标、卡片发音与向下滑动关闭。

**Tech Stack:** Vue 3 SFC (`<script setup>`), Pinia, Tailwind CSS, Lucide Vue Next, Web Speech API (`speechSynthesis`), Vitest + Vue Test Utils.

**Spec:** `docs/superpowers/specs/2026-10-10-dictionary-lookup-and-vocab-design.md`

## Global Constraints

- **Zero Unicode Emoji**：严禁在 UI、提示文案、代码中使用任何 Unicode Emoji；必须使用 Lucide 矢量图标。
- **Zero-Shadow Rule**：严禁使用 `shadow-lg`, `shadow-xl`, `shadow-2xl`，依赖纯粹的浅赭石/深色边框（`border border-[#e4e4e7]`）。
- **Apple HIG 44px**：所有可交互按钮、发音喇叭、关闭把手的点击面积必须 $\ge 44 \times 44\text{px}$。
- **iOS Safari 防缩放**：输入框字号不低于 16px（`text-base`）。
- **Offline-First**：本地预置词汇 0ms 极速响应，屈折还原与 Web Speech API 优雅容错。

## Review Focus

1. **标点与大小写边界**：带引号或标点的单词（如 `“peculiar”`、`Privet`）清洗后必须精准匹配小写原型。
2. **多词/连字符单词**：带连字符复合词（如 `emerald-green`）不崩溃，安全回退或精准命中。
3. **播放器状态联动**：打开查词弹窗时必须调用 `player.pause()` 暂停音频；关闭后不破坏播放器状态。
4. **移动端手势一致性**：`WordLookupModal` 和 `VocabularyDrawer` 移动端顶部具备药丸拉手并支持向下滑动关闭。
5. **生词本响应式同步**：在查词卡片中收录/取消收录后，顶栏 Badge 与 `VocabularyDrawer` 列表必须即刻响应更新。

---

### Task 1: 离线词典服务与 VocabStore 增强

**Files:**
- Create: `src/data/dictionaryData.js`
- Modify: `src/stores/vocabStore.js`
- Test: `tests/vue3/vocabAndDictionary.test.js`

**Interfaces:**
- Produces in `src/data/dictionaryData.js`:
  - `lookupWord(rawWord: string): { word: string, phonetic: string, pos: string, definition: string, tag: string }`
  - `DICTIONARY: Record<string, Object>`
- Produces in `src/stores/vocabStore.js`:
  - `hasWord(word: string): boolean`
  - `toggleWord(wordData: Object, contextQuote?: string): boolean`
  - `addWord(wordOrData: string|Object, contextQuote?: string): boolean`
  - `removeWord(word: string): void`

- [ ] **Step 1: 编写词典查询与 Store 扩展示例的失败测试**
  在 `tests/vue3/vocabAndDictionary.test.js` 中编写测试：
  - 测试 `lookupWord('cloak')` 返回包含音标 `/kləʊk/`、词性 `n.`、释义的条目；
  - 测试 `lookupWord('“peculiar.”')` 正确脱除标点符号；
  - 测试 `lookupWord('cloaks')` 能还原到 `cloak` 原型；
  - 测试未收录生僻词 `lookupWord('unknownxyz')` 返回安全合规的兜底对象（不抛错）；
  - 测试 `vocabStore.toggleWord`：未收录时加入并返回 `true`，已收录时移除并返回 `false`；
  - 测试 `vocabStore.hasWord('cloak')` 在收录后为 `true`。

- [ ] **Step 2: 运行测试验证失败**
  `npm test tests/vue3/vocabAndDictionary.test.js`
  预期：FAIL（文件或方法未定义）。

- [ ] **Step 3: 实现 `src/data/dictionaryData.js` 与 `src/stores/vocabStore.js`**
  - 在 `src/data/dictionaryData.js` 中建立高频词库（含 `cloak`, `peculiar`, `quill`, `wand`, `muggle`, `privet`, `dursley`, `proud`, `perfectly`, `cat`, `owl` 等），并实现带有正则清洗与屈折词缀脱除的 `lookupWord`。
  - 在 `src/stores/vocabStore.js` 中更新 `addWord` 支持对象传入，添加 `hasWord`、`removeWord`、`toggleWord`，保留 `localStorage` 同步。

- [ ] **Step 4: 运行测试验证通过**
  `npm test tests/vue3/vocabAndDictionary.test.js`
  预期：PASS。

- [ ] **Step 5: 提交代码**
  ```bash
  git add src/data/dictionaryData.js src/stores/vocabStore.js tests/vue3/vocabAndDictionary.test.js
  git commit -m "feat(vocab): add offline dictionaryData and enhance vocabStore with toggleWord and rich schema"
  ```

---

### Task 2: 查词弹窗组件 `WordLookupModal.vue`

**Files:**
- Create: `src/components/common/WordLookupModal.vue`
- Test: `tests/vue3/wordLookupModal.test.js`

**Interfaces:**
- Consumes: `lookupWord` from `src/data/dictionaryData.js`, `useVocabStore` from `src/stores/vocabStore.js`, `useBottomSheet` from `src/composables/useBottomSheet.js`.
- Produces: `WordLookupModal` component accepting `:is-open="Boolean"`, `:word="String"`, `:context-quote="String"`, emitting `@close`.

- [ ] **Step 1: 编写 `WordLookupModal` 的测试**
  在 `tests/vue3/wordLookupModal.test.js` 中编写组件测试：
  - 测试当 `isOpen=true` 时渲染单词、音标、释义和语境例句；
  - 测试点击发音按钮调用 `window.speechSynthesis.speak`；
  - 测试点击【收录至生词本】切换按钮，调用 `vocabStore.toggleWord` 并改变按钮文本；
  - 测试点击关闭按钮触发 `close` 事件。

- [ ] **Step 2: 运行测试验证失败**
  `npm test tests/vue3/wordLookupModal.test.js`
  预期：FAIL（组件不存在）。

- [ ] **Step 3: 实现 `WordLookupModal.vue`**
  - 使用 `<Teleport to="body">` 渲染。
  - 移动端使用 Bottom Sheet（顶部居中 `w-10 h-1.5 rounded-full bg-[#d4d4d8]` 拉手，集成 `useBottomSheet` 实现向下滑动关闭手势）。
  - 桌面端使用居中模态卡片（`max-w-md`，`border border-[#e4e4e7]`，零投影）。
  - 头部展示单词、音标与考纲标签徽章；发音按钮为 `<Volume2>` 图标，保证 $\ge 44 \times 44\text{px}$ 触控区。
  - 主操作按钮响应展示【收录至生词本】与【已在生词本中 (点击移除)】。

- [ ] **Step 4: 运行测试验证通过**
  `npm test tests/vue3/wordLookupModal.test.js`
  预期：PASS。

- [ ] **Step 5: 提交代码**
  ```bash
  git add src/components/common/WordLookupModal.vue tests/vue3/wordLookupModal.test.js
  git commit -m "feat(ui): create WordLookupModal with iOS bottom sheet, TTS pronunciation, and vocab toggle"
  ```

---

### Task 3: 精听字幕查词联动、顶栏常驻入口与生词本抽屉升级

**Files:**
- Modify: `src/components/session/StepListening.vue`
- Modify: `src/App.vue`
- Modify: `src/components/VocabularyDrawer.vue`
- Modify: `tests/vue3/vocabularyDrawer.test.js`
- Modify: `tests/vue3/subtitleViewer.test.js`

**Interfaces:**
- In `StepListening.vue`: 点击字幕单词暂停音频并打开 `WordLookupModal`。
- In `App.vue`: 顶栏右侧新增生词本按钮（`<BookMarked>`），带动态数字徽标，点击打开 `VocabularyDrawer`。
- In `VocabularyDrawer.vue`: 增加搜索框、卡片发音喇叭（`<Volume2>`）、移动端滑动关闭支持。

- [ ] **Step 1: 编写集成测试**
  在 `tests/vue3/vocabularyDrawer.test.js` 中新增测试：
  - 测试搜索过滤功能：输入关键词能够正确筛选卡片列表；
  - 测试卡片发音功能：点击发音喇叭调用发音 API。

- [ ] **Step 2: 运行测试验证失败**
  `npm test tests/vue3/vocabularyDrawer.test.js`
  预期：FAIL。

- [ ] **Step 3: 修改 `StepListening.vue`、`App.vue` 和 `VocabularyDrawer.vue`**
  - 在 `StepListening.vue` 中引入 `WordLookupModal`，`handleWordClick` 记录播放状态、调用 `player.pause()` 并打开弹窗。
  - 在 `App.vue` 顶栏工具区右侧加入常驻生词本按钮，展示 `vocabStore.vocabList.length` 徽标。
  - 在 `VocabularyDrawer.vue` 中加入搜索输入框（字号 $\ge 16\text{px}$）、卡片 `<Volume2>` 发音按钮，并增强移动端滑动交互。

- [ ] **Step 4: 运行测试验证通过**
  `npm test tests/vue3/vocabularyDrawer.test.js`
  预期：PASS。

- [ ] **Step 5: 提交代码**
  ```bash
  git add src/components/session/StepListening.vue src/App.vue src/components/VocabularyDrawer.vue tests/vue3/vocabularyDrawer.test.js tests/vue3/subtitleViewer.test.js
  git commit -m "feat: wire word-tap lookup in StepListening, add header vocab badge button, and enhance VocabularyDrawer"
  ```

---

### Task 4: 全局门禁与回归验证 (Zero-Regression & Audits)

**Files:**
- Verification only

- [ ] **Step 1: 运行全量单元测试与组件测试**
  `npm test`
  预期：全部 38+ 个测试用例 100% 通过。

- [ ] **Step 2: 运行 Zero-Emoji 审查**
  `npm run check-emojis`
  预期：0 违规 Emoji。

- [ ] **Step 3: 运行安全凭证泄露审查**
  `npm run verify-security`
  预期：0 安全泄露。

- [ ] **Step 4: 运行 Vite 生产构建验证**
  `npm run build`
  预期：构建成功，无语法与类型错误。

- [ ] **Step 5: 最终提交**
  ```bash
  git commit --allow-empty -m "chore: verify zero-regression across all quality gates"
  ```
