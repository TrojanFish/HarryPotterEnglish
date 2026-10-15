# 智能词汇六维系统与 Nation 四层习得深度追踪 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 升级 Hogwarts Audio 词汇体系至 SLA 驱动的「六维标注体系」与 Nation「四层习得深度追踪（L1 识 · L2 懂 · L3 忆 · L4 用）」，平滑迁移本地存量数据，建立 Box 5（永久记忆）L4 产出硬门禁，并在生词本、复习闪卡、查词弹窗及听写工坊全面落地。

**Architecture:** 
1. 数据层在 `src/data/dictionaryData.js` 提供 `getCefrLevel` 算法，在 `src/stores/vocabStore.js` 扩展 6 维 `VocabEntry` 结构与无损兼容迁移机制。
2. 状态机在 `vocabStore` 中管理 `acquisition: { l1, l2, l3, l4 }` 状态流，并对 `promoteBox()` 执行 Box 4 -> Box 5 的 `l4 === true` 刚性阻断。
3. 展示层开发响应式 `VocabDepthMeter.vue` 微组件，并深度嵌入 `VocabularyDrawer.vue`、`StepVocabReview.vue`、`WordLookupModal.vue`。
4. 学习流集成在 `StepDictation.vue` 与 `TedTaskStudio.vue` 中打通听写/填空产出对 L4 状态的自动点亮。

**Tech Stack:** Vue 3 Composition API, Pinia, Tailwind CSS, Lucide Vue Next, Node.js Test Runner (`node:test`).

**Spec:** `docs/superpowers/specs/2026-10-15-vocab-six-dimension-depth-design.md`

## Global Constraints

- **零 Unicode Emoji**：全量代码、注释、模板、测试字符串严禁任何 Unicode Emoji，必须使用 `lucide-vue-next` 图标。
- **Apple HIG 触控**：所有可交互按钮、选项、筛选标签必须满足 `min-h-[44px]`，并包含 `touch-manipulation` 类。
- **羊皮纸设计语言**：遵循 `#fbf9f5` 暖底、`#e8ddd0` 边框、Amber/Bronze 强调色，严禁高饱和霓虹色与重度弥散投影（禁止 `shadow-lg`, `shadow-xl`, `shadow-2xl`）。
- **K12 适老化/青少年字体底线**：英文正文 ≥ 18px (`text-lg`)，中文释义 ≥ 14px (`text-sm`)，移动端输入框字号 ≥ 16px (`text-base`) 防止 iOS 自动缩放。
- **无损向后兼容**：旧版仅含有 `{ id, word, phonetic, definition, pos, tag, contextQuote, box, addedAt }` 的存量数据，在 `loadVocab()` 加载时必须能够平滑补充缺失的 6 维属性，不可报 undefined 错误或丢失原有数据。
- **零回归测试**：执行过程中已有的 278 项自动化测试必须保持 100% 通过。

## Review Focus

1. **存量空值防御**：历史 localStorage 记录中 `acquisition` 为 undefined 时，任何组件调用 `item.acquisition.l4` 是否会导致界面白屏崩溃。
2. **Box 5 升级门禁闭环**：当 `box === 4` 且 `acquisition.l4 === false` 时，无论是抽屉卡片的「熟记+1」还是闪卡的「已掌握」，都必须被精准拦截并提供正向引导，不能直接跳入 Box 5。
3. **L1–L4 触发幂等性**：多次播放发音或多次正确听写同一个词汇，不能导致状态异常变异或重置已有高阶状态（例如多次触发 l1 不得覆盖已有的 l4）。
4. **CEFR 跨考纲推导准确度**：小学基础映射 A1、中考核心映射 A2、高考重点映射 B1、四级高频映射 B2、雅思/六级映射 C1，未收录词优雅回退至 B1。
5. **双通道可访问性**：`VocabDepthMeter` 必须通过颜色结合图标/文字或明暗对比传达深度，不可仅依赖颜色区别；屏幕阅读器能读取清晰的 aria-label。

---

### Task 1: CEFR 推导工具与词典服务升级

**Files:**
- Modify: `src/data/dictionaryData.js`
- Test: `tests/vue3/vocabCefr.test.js`

**Interfaces:**
- Produces:
  - `getCefrLevel(word: string, tag?: string): 'A1' | 'A2' | 'B1' | 'B2' | 'C1'`
  - `lookupWord(word: string): { word: string, phonetic: string, pos: string, definition: string, tag: string, cefrLevel: string }`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/vue3/vocabCefr.test.js
import { describe, test } from 'node:test'
import assert from 'node:assert'
import { getCefrLevel, lookupWord } from '../../src/data/dictionaryData.js'

describe('CEFR Level Derivation & Dictionary Metadata', () => {
  test('getCefrLevel derives correct CEFR level by tag', () => {
    assert.strictEqual(getCefrLevel('cat', '小学基础'), 'A1')
    assert.strictEqual(getCefrLevel('survive', '中考核心'), 'A2')
    assert.strictEqual(getCefrLevel('peculiar', '高考重点'), 'B1')
    assert.strictEqual(getCefrLevel('inspire', '四级高频'), 'B2')
    assert.strictEqual(getCefrLevel('phenomenon', '六级进阶'), 'C1')
    assert.strictEqual(getCefrLevel('perseverance', '雅思核心'), 'C1')
    assert.strictEqual(getCefrLevel('wand', '魔法专有'), 'B2')
    assert.strictEqual(getCefrLevel('custom', '拓展生词'), 'B1')
    assert.strictEqual(getCefrLevel('unknown'), 'B1')
  })

  test('lookupWord includes cefrLevel in returned object', () => {
    const cloak = lookupWord('cloak')
    assert.ok(cloak)
    assert.ok(cloak.cefrLevel, 'Must contain cefrLevel')
    assert.match(cloak.cefrLevel, /^A[12]|B[12]|C1$/)

    const fallback = lookupWord('unknownwordxyz')
    assert.strictEqual(fallback.cefrLevel, 'B1')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/vue3/vocabCefr.test.js`
Expected: FAIL with "getCefrLevel is not a function"

- [ ] **Step 3: Implement `getCefrLevel` and update `lookupWord` in `src/data/dictionaryData.js`**

Implement mapping table from exam tags to CEFR levels (`A1`, `A2`, `B1`, `B2`, `C1`). Ensure `lookupWord` appends `cefrLevel: getCefrLevel(word, tag)` on all return branches.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/vue3/vocabCefr.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/data/dictionaryData.js tests/vue3/vocabCefr.test.js
git commit -m "feat(vocab): add getCefrLevel derivation and update lookupWord with CEFR metadata"
```

---

### Task 2: vocabStore 六维扩展、平滑迁移与 Box 5 L4 门禁

**Files:**
- Modify: `src/stores/vocabStore.js`
- Test: `tests/vue3/vocabStore.test.js`

**Interfaces:**
- Consumes: `getCefrLevel`, `lookupWord`, `cleanWordToken`
- Produces:
  - 6D `VocabEntry` schema with `cefrLevel`, `examTag`, `sourceType`, `acquisition: { l1, l2, l3, l4 }`, etc.
  - `migrateVocabEntry(raw)` in `loadVocab()`
  - `recordAcquisition(wordOrData, level: 'l1'|'l2'|'l3'|'l4'): boolean`
  - `promoteBox(item: string | object): { promoted: boolean, currentBox: number, reason?: string, message?: string }`
  - `addWord(wordOrData, contextQuote, meta)` accepting 6D fields (`sourceType`, `cefrLevel`, etc.)

- [ ] **Step 1: Write the failing test**

```javascript
// tests/vue3/vocabStore.test.js
import { describe, test, beforeEach } from 'node:test'
import assert from 'node:assert'
import { setActivePinia, createPinia } from 'pinia'
import { useVocabStore } from '../../src/stores/vocabStore.js'

if (typeof globalThis.localStorage === 'undefined') {
  const mem = new Map()
  globalThis.localStorage = {
    getItem: (k) => mem.get(k) || null,
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
    clear: () => mem.clear()
  }
}

describe('vocabStore 6D Schema & Acquisition State Machine', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  test('loadVocab smoothly migrates legacy data without acquisition and cefrLevel', () => {
    const legacyData = [
      { id: 101, word: 'wand', phonetic: '/wɒnd/', definition: '魔杖', pos: 'n.', tag: '中考核心', contextQuote: 'The wand chooses the wizard.', box: 2 },
      { id: 102, word: 'spell', phonetic: '/spel/', definition: '咒语', pos: 'n.', tag: '高考重点', contextQuote: 'Cast a spell.', box: 4 }
    ]
    localStorage.setItem('hp_vocab_list', JSON.stringify(legacyData))

    const store = useVocabStore()
    assert.strictEqual(store.vocabList.length, 2)
    const wand = store.vocabList.find(w => w.word === 'wand')
    assert.strictEqual(wand.cefrLevel, 'A2')
    assert.strictEqual(wand.examTag, '中考核心')
    assert.strictEqual(wand.sourceType, 'hp')
    assert.ok(wand.acquisition, 'Must have acquisition object')
    assert.strictEqual(wand.acquisition.l1, true)
    assert.strictEqual(wand.acquisition.l2, true)
    assert.strictEqual(wand.acquisition.l3, false) // box 2 < 3
    assert.strictEqual(wand.acquisition.l4, false) // box 2 < 4

    const spell = store.vocabList.find(w => w.word === 'spell')
    assert.strictEqual(spell.acquisition.l3, true) // box 4 >= 3
    assert.strictEqual(spell.acquisition.l4, true) // box 4 >= 4
  })

  test('recordAcquisition updates acquisition depth idempotently', () => {
    const store = useVocabStore()
    store.addWord('lumos', 'Lumos lights up.')
    const entry = store.vocabList.find(w => w.word === 'lumos')
    assert.ok(entry)
    assert.strictEqual(entry.acquisition.l4, false)

    const res = store.recordAcquisition('lumos', 'l4')
    assert.strictEqual(res, true)
    assert.strictEqual(entry.acquisition.l4, true)

    // Repeat call remains true
    store.recordAcquisition('lumos', 'l4')
    assert.strictEqual(entry.acquisition.l4, true)
  })

  test('promoteBox guards Box 5: blocked if l4 is false, succeeds if l4 is true', () => {
    const store = useVocabStore()
    store.addWord({ word: 'quidditch', box: 3 })
    const item = store.vocabList.find(w => w.word === 'quidditch')
    assert.strictEqual(item.box, 3)

    // Promote 3 -> 4 succeeds
    const res1 = store.promoteBox(item)
    assert.strictEqual(res1.promoted, true)
    assert.strictEqual(item.box, 4)

    // Box 4 -> 5 blocked because l4 is false
    assert.strictEqual(item.acquisition.l4, false)
    const res2 = store.promoteBox(item)
    assert.strictEqual(res2.promoted, false)
    assert.strictEqual(res2.reason, 'NEED_L4_PRODUCTION')
    assert.strictEqual(item.box, 4, 'Must stay at Box 4')

    // Mark l4 completed, then promote 4 -> 5 succeeds
    store.recordAcquisition('quidditch', 'l4')
    assert.strictEqual(item.acquisition.l4, true)
    const res3 = store.promoteBox(item)
    assert.strictEqual(res3.promoted, true)
    assert.strictEqual(item.box, 5)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/vue3/vocabStore.test.js`
Expected: FAIL with missing properties / methods

- [ ] **Step 3: Implement 6D schema, migration, `recordAcquisition`, and Box 5 guard in `src/stores/vocabStore.js`**

- In `loadVocab()`, map raw items with `migrateVocabEntry()` that backfills `cefrLevel`, `examTag`, `sourceType`, `acquisition: { l1, l2, l3, l4 }`, `lastReviewedAt`, and `errorCount`.
- In `addWord(wordOrData, contextQuote, meta)`, initialize full 6D entry with `acquisition: { l1: true, l2: true, l3: false, l4: false }`.
- Add action `recordAcquisition(wordOrData, level)` where level is `'l1'|'l2'|'l3'|'l4'`.
- In `promoteBox(item)`, enforce `target.box === 4 && !target.acquisition?.l4` guard returning `{ promoted: false, reason: 'NEED_L4_PRODUCTION' }`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/vue3/vocabStore.test.js`
Expected: PASS

- [ ] **Step 5: Run existing vocab test suites to verify zero regression**

Run: `node tests/vue3/vocabAndDictionary.test.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/stores/vocabStore.js tests/vue3/vocabStore.test.js
git commit -m "feat(vocab): extend vocabStore with 6D schema, in-place migration, acquisition tracker, and Box 5 L4 hard gate"
```

---

### Task 3: VocabDepthMeter.vue — 四层习得深度微组件

**Files:**
- Create: `src/components/common/VocabDepthMeter.vue`
- Test: `tests/vue3/vocabDepthMeter.test.js`

**Interfaces:**
- Props:
  - `acquisition`: `{ l1?: boolean, l2?: boolean, l3?: boolean, l4?: boolean }`
  - `size`: `'compact' | 'full'` (default `'compact'`)
  - `interactive`: `boolean` (default `false`)
- Emits: `select-level(levelKey: string)` (optional for interactive view)
- Output: 4 visual segments:
  - L1: 识 (Recognition - Volume2)
  - L2: 懂 (Comprehension - BookOpen)
  - L3: 忆 (Recall - Brain)
  - L4: 用 (Production - PenTool)
- Zero Unicode emoji, dual-channel status (color + icon/label), Apple HIG minimum touch target when interactive.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/vue3/vocabDepthMeter.test.js
import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('VocabDepthMeter.vue Component Standards', () => {
  const filePath = path.resolve('src/components/common/VocabDepthMeter.vue')

  test('file exists and conforms to design spec', () => {
    assert.ok(fs.existsSync(filePath), 'VocabDepthMeter.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    // Zero emojis
    const emojiMatches = content.match(/\p{Extended_Pictographic}/gu)
    assert.strictEqual(emojiMatches, null, 'Must contain zero Unicode emoji characters')

    // Lucide icons
    assert.ok(content.includes('lucide-vue-next'), 'Must use lucide-vue-next')
    assert.ok(content.includes('Volume2') || content.includes('Headphones'), 'Must include L1 audio icon')
    assert.ok(content.includes('BookOpen'), 'Must include L2 reading icon')
    assert.ok(content.includes('Brain'), 'Must include L3 recall icon')
    assert.ok(content.includes('PenTool') || content.includes('Sparkles'), 'Must include L4 production icon')

    // Four stages
    assert.ok(content.includes('l1') && content.includes('l2') && content.includes('l3') && content.includes('l4'), 'Must track l1, l2, l3, l4')
    assert.ok(content.includes('识') && content.includes('懂') && content.includes('忆') && content.includes('用'), 'Must render Chinese Nation depth characters')

    // Size variants
    assert.ok(content.includes('compact') && content.includes('full'), 'Must support compact and full size variants')

    // Accessibility
    assert.ok(content.includes('aria-label'), 'Must provide accessible aria-label')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/vue3/vocabDepthMeter.test.js`
Expected: FAIL with file not found

- [ ] **Step 3: Implement `src/components/common/VocabDepthMeter.vue`**

Implement the 4-stage segmented bar with dual-channel status (active amber/emerald vs warm stone muted), Lucide icons, compact / full mode, zero emojis, and accessible aria descriptions.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/vue3/vocabDepthMeter.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/common/VocabDepthMeter.vue tests/vue3/vocabDepthMeter.test.js
git commit -m "feat(vocab): add VocabDepthMeter.vue four-segmented SLA acquisition progress indicator"
```

---

### Task 4: VocabularyDrawer.vue — 六维卡片、CEFR 筛选与 Box 5 守卫交互

**Files:**
- Modify: `src/components/VocabularyDrawer.vue`
- Test: `tests/vue3/vocabularyDrawer6D.test.js`

**Interfaces:**
- Consumes: `VocabDepthMeter.vue`, `useVocabStore`
- Enhancements:
  - Display CEFR badge (`A1`–`C1`) on each card with level-appropriate colors.
  - Display source badge: `HP原著` or `TED精讲`.
  - Display `VocabDepthMeter` (`size="compact"`) on each card.
  - Add CEFR filter tabs alongside Leitner boxes (`全部`, `A1/A2`, `B1/B2`, `C1`).
  - Protect Box 5 promotion: if `item.box === 4 && !item.acquisition?.l4`, clicking "熟记 +1" displays a gentle warning banner/toast: "需完成听写拼写或造句跟读(L4)方可进入永久记忆盒(Box 5)".
  - Pronunciation button triggers `vocabStore.recordAcquisition(item.word, 'l1')`.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/vue3/vocabularyDrawer6D.test.js
import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('VocabularyDrawer 6D & Depth Meter Integration', () => {
  const filePath = path.resolve('src/components/VocabularyDrawer.vue')

  test('VocabularyDrawer imports and uses VocabDepthMeter and CEFR filtering', () => {
    assert.ok(fs.existsSync(filePath))
    const content = fs.readFileSync(filePath, 'utf-8')

    // Imports VocabDepthMeter
    assert.ok(content.includes('VocabDepthMeter'), 'Must import and use VocabDepthMeter')

    // CEFR badges and filter
    assert.ok(content.includes('cefrLevel') || content.includes('CEFR'), 'Must support CEFR level display')
    assert.ok(content.includes('activeCefr') || content.includes('cefrFilter'), 'Must support CEFR filtering')

    // Box 5 promotion feedback
    assert.ok(content.includes('NEED_L4_PRODUCTION') || content.includes('l4'), 'Must check L4 condition for Box 5')

    // Zero emojis
    const emojiMatches = content.match(/\p{Extended_Pictographic}/gu)
    assert.strictEqual(emojiMatches, null, 'Must contain zero Unicode emoji characters')

    // Apple HIG
    assert.ok(content.includes('min-h-[44px]') || content.includes('h-11'), 'Must satisfy 44px touch target')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/vue3/vocabularyDrawer6D.test.js`
Expected: FAIL on missing CEFR and VocabDepthMeter integration

- [ ] **Step 3: Implement 6D badges, CEFR filter tabs, depth meter, and Box 5 guard in `src/components/VocabularyDrawer.vue`**

- Import `VocabDepthMeter` from `./common/VocabDepthMeter.vue`.
- Add `activeCefr` ref (`'all'`, `'A1/A2'`, `'B1/B2'`, `'C1'`).
- Filter `filteredList` by both `activeBox`, `activeCefr`, and `searchQuery`.
- In card header, render `cefrBadge`, `sourceTypeBadge`, and `<VocabDepthMeter :acquisition="item.acquisition" size="compact" />`.
- In `promoteBox(item)`, check result; if `!res.promoted && res.reason === 'NEED_L4_PRODUCTION'`, show prompt banner/toast.
- In `playPronunciation(word)`, call `vocabStore.recordAcquisition(word, 'l1')`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/vue3/vocabularyDrawer6D.test.js`
Expected: PASS

- [ ] **Step 5: Run existing `tests/vue3/vocabularyDrawer.test.js` to ensure no regression**

Run: `node tests/vue3/vocabularyDrawer.test.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/VocabularyDrawer.vue tests/vue3/vocabularyDrawer6D.test.js
git commit -m "feat(vocab): upgrade VocabularyDrawer.vue with 6D badges, CEFR filter, and Box 5 guard feedback"
```

---

### Task 5: StepVocabReview.vue — 闪卡深度条与 Box 5 交互增强

**Files:**
- Modify: `src/components/session/StepVocabReview.vue`
- Test: `tests/vue3/stepVocabReview6D.test.js`

**Interfaces:**
- Consumes: `VocabDepthMeter.vue`, `useVocabStore`
- Enhancements:
  - Display `VocabDepthMeter (size="full")` on flashcard back.
  - When "已掌握" clicked: calls `vocabStore.promoteBox()`.
    - Automatically marks `recordAcquisition(currentCard.word, 'l3')` (successful recall).
    - If promotion was blocked due to `NEED_L4_PRODUCTION`, displays an inline gold banner below card: "已达 Box 4！在听写或造句跟读中正确拼写(L4)后即可晋升 Box 5 永久记忆盒。".

- [ ] **Step 1: Write the failing test**

```javascript
// tests/vue3/stepVocabReview6D.test.js
import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('StepVocabReview 6D Depth & Box 5 Guard', () => {
  const filePath = path.resolve('src/components/session/StepVocabReview.vue')

  test('StepVocabReview imports VocabDepthMeter and handles Box 5 L4 requirement', () => {
    assert.ok(fs.existsSync(filePath))
    const content = fs.readFileSync(filePath, 'utf-8')

    assert.ok(content.includes('VocabDepthMeter'), 'Must import and use VocabDepthMeter')
    assert.ok(content.includes('recordAcquisition'), 'Must call recordAcquisition for l3 recall')
    assert.ok(content.includes('NEED_L4_PRODUCTION') || content.includes('l4Message') || content.includes('l4Notice'), 'Must handle Box 5 L4 feedback')

    const emojiMatches = content.match(/\p{Extended_Pictographic}/gu)
    assert.strictEqual(emojiMatches, null, 'Must contain zero Unicode emoji characters')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/vue3/stepVocabReview6D.test.js`
Expected: FAIL

- [ ] **Step 3: Implement depth meter and Box 5 prompt in `src/components/session/StepVocabReview.vue`**

- Import `VocabDepthMeter` from `../common/VocabDepthMeter.vue`.
- Display `<VocabDepthMeter :acquisition="currentCard.acquisition" size="full" />` on the back of the flashcard.
- In `handlePromote()`:
  - `vocabStore.recordAcquisition(currentCard.value.word, 'l3')`
  - Inspect `vocabStore.promoteBox(currentCard.value)`. If `res.reason === 'NEED_L4_PRODUCTION'`, set `l4Notice.value = res.message` and clear it on card switch.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/vue3/stepVocabReview6D.test.js`
Expected: PASS

- [ ] **Step 5: Run existing `tests/vue3/stepVocabReview.test.js` to ensure no regression**

Run: `node tests/vue3/stepVocabReview.test.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/session/StepVocabReview.vue tests/vue3/stepVocabReview6D.test.js
git commit -m "feat(session): integrate VocabDepthMeter and Box 5 L4 requirement feedback into StepVocabReview.vue"
```

---

### Task 6: WordLookupModal.vue — CEFR 徽章、六维深度条与 L1 听音联动

**Files:**
- Modify: `src/components/common/WordLookupModal.vue`
- Test: `tests/vue3/wordLookupModal6D.test.js`

**Interfaces:**
- Consumes: `VocabDepthMeter.vue`, `useVocabStore`
- Enhancements:
  - Display `cefrLevel` badge prominently (e.g. `[CEFR B1]`) in the header next to exam tag.
  - If the word is already saved in `vocabStore`:
    - Display current Box indicator (`Box 1`–`Box 5`).
    - Render `VocabDepthMeter (size="full")` inside the modal body.
  - When user taps audio listen button (`playPronunciation`), trigger `vocabStore.recordAcquisition(word, 'l1')` if word exists in vocab.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/vue3/wordLookupModal6D.test.js
import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('WordLookupModal 6D Metadata and Depth Meter', () => {
  const filePath = path.resolve('src/components/common/WordLookupModal.vue')

  test('WordLookupModal includes CEFR badge and VocabDepthMeter', () => {
    assert.ok(fs.existsSync(filePath))
    const content = fs.readFileSync(filePath, 'utf-8')

    assert.ok(content.includes('cefrLevel') || content.includes('getCefrLevel'), 'Must support CEFR level display')
    assert.ok(content.includes('VocabDepthMeter'), 'Must import and use VocabDepthMeter')
    assert.ok(content.includes('recordAcquisition') || content.includes('l1'), 'Must trigger L1 acquisition on pronunciation')

    const emojiMatches = content.match(/\p{Extended_Pictographic}/gu)
    assert.strictEqual(emojiMatches, null, 'Must contain zero Unicode emoji characters')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/vue3/wordLookupModal6D.test.js`
Expected: FAIL

- [ ] **Step 3: Implement CEFR badge, depth meter, and L1 trigger in `src/components/common/WordLookupModal.vue`**

- Import `VocabDepthMeter` from `./VocabDepthMeter.vue`.
- Display CEFR badge using `wordData.cefrLevel || getCefrLevel(wordData.word, wordData.tag)`.
- If `vocabStore.hasWord(wordData.word)`, retrieve the stored entry to display `<VocabDepthMeter :acquisition="storedEntry.acquisition" size="full" />`.
- In `playPronunciation()`, call `vocabStore.recordAcquisition(targetWord, 'l1')`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/vue3/wordLookupModal6D.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/common/WordLookupModal.vue tests/vue3/wordLookupModal6D.test.js
git commit -m "feat(lookup): add CEFR badge, acquisition meter, and L1 recognition trigger to WordLookupModal.vue"
```

---

### Task 7: 听写与 TED 填空 — L4 产出能力自动点亮

**Files:**
- Modify: `src/components/session/StepDictation.vue`
- Modify: `src/components/ted/TedTaskStudio.vue`
- Test: `tests/vue3/vocabAcquisitionL4.test.js`

**Interfaces:**
- Consumes: `useVocabStore.recordAcquisition`
- Actions:
  - In `StepDictation.vue`: When learner checks/submits dictation and input matches target words, if any matched word is in `vocabStore`, call `vocabStore.recordAcquisition(matchedWord, 'l4')`.
  - In `TedTaskStudio.vue`: When learner correctly answers a cloze blank, extract the target words and if present in `vocabStore`, call `vocabStore.recordAcquisition(targetWord, 'l4')`.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/vue3/vocabAcquisitionL4.test.js
import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('L4 Production Wiring in Dictation and TED Tasks', () => {
  test('StepDictation.vue calls recordAcquisition for l4', () => {
    const content = fs.readFileSync(path.resolve('src/components/session/StepDictation.vue'), 'utf-8')
    assert.ok(content.includes('recordAcquisition'), 'StepDictation must invoke recordAcquisition')
    assert.ok(content.includes('l4'), 'Must record l4 production')
  })

  test('TedTaskStudio.vue calls recordAcquisition for l4 on correct cloze answer', () => {
    const content = fs.readFileSync(path.resolve('src/components/ted/TedTaskStudio.vue'), 'utf-8')
    assert.ok(content.includes('recordAcquisition'), 'TedTaskStudio must invoke recordAcquisition')
    assert.ok(content.includes('l4'), 'Must record l4 production')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/vue3/vocabAcquisitionL4.test.js`
Expected: FAIL

- [ ] **Step 3: Implement L4 recording hooks in `StepDictation.vue` and `TedTaskStudio.vue`**

- In `StepDictation.vue`:
  - Import `useVocabStore`.
  - When comparing user answer with actual sentence: for each matched word, if `vocabStore.hasWord(word)`, call `vocabStore.recordAcquisition(word, 'l4')`.
- In `TedTaskStudio.vue`:
  - In `submitClozeAnswer(clozeId, blankIndex, value)`: if user answer is correct, split blank words and call `vocabStore.recordAcquisition(w, 'l4')` for any saved word.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/vue3/vocabAcquisitionL4.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/session/StepDictation.vue src/components/ted/TedTaskStudio.vue tests/vue3/vocabAcquisitionL4.test.js
git commit -m "feat(vocab): wire StepDictation and TedTaskStudio cloze into L4 production acquisition tracker"
```

---

### Task 8: 全量测试、构建与零违规审计

**Files:**
- Audit & Verify entire project

**Steps:**
- [ ] **Step 1: Run full unit test suite**

Run: `npm test`
Expected: All 278+ tests pass with 0 failures.

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Vite build completes cleanly with 0 errors.

- [ ] **Step 3: Run zero-emoji audit**

Run: `npm run check-emojis`
Expected: 0 Unicode emojis found.

- [ ] **Step 4: Run security credential audit**

Run: `npm run verify-security`
Expected: 0 credential leaks found.

- [ ] **Step 5: Final Sprint 3 completion commit**

```bash
git commit --allow-empty -m "chore(sprint3): complete vocab six-dimension system and Nation acquisition depth integration"
```
