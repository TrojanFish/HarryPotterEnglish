# CEFR 能力成长地图与 O.W.L.s 期末评定报告 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建 Hogwarts Audio 第二语言习得（SLA）量化评估中心：研发 `analyticsStore.js` 统计聚合引擎与 CEFR / 雷达图数学模型，在三端导航中集成「能力评定」大厅（`AssessmentHub.vue`），推出 10 分钟快速 O.W.L.s 等级模拟考（`OwlsExamModal.vue`），以及可调起浏览器打印的 A4 羊皮纸魔法部官方成绩单（`OwlsCertificateModal.vue`），并与现有精听、跟读、听写完成链路全面打通。

**Architecture:**
1. 数据层在 `src/stores/analyticsStore.js` 汇聚精听时长、生词本六维掌握（`vocabStore`）、跟读评分历史与听写正确率，以加权 SLA 科学算法推导当前 CEFR 等级与五维雷达图多边形顶点。
2. 导航层在 `src/stores/navigationStore.js` 注册 `'assessment'` 视图，在桌面侧栏、平板侧轨与移动端底栏增设导航入口。
3. 展现层在 `AssessmentHub.vue` 实现三端自适应主看板，纯 SVG 原生渲染魔法五维雷达图（零外部重量图表库依赖）。
4. 评测层在 `OwlsExamModal.vue` 构筑包含「听力推断 + 关键词拼写 + 名篇跟读」的三阶快速模拟考。
5. 凭证层在 `owlsCertificateExport.js` 与 `OwlsCertificateModal.vue` 构造可打印 A4 羊皮纸魔法部官方成绩单。
6. 遥测打通在 `StepListening.vue`、`StepShadowing.vue`、`StepDictation.vue` 及 `TedShadowing.vue` 中自动上报行为。

**Tech Stack:** Vue 3 Composition API, Pinia, Tailwind CSS, Lucide Vue Next, Pure SVG Geometry, Node.js Test Runner (`node:test`).

**Spec:** `docs/superpowers/specs/2026-10-15-cefr-assessment-and-owls-report-design.md`

## Global Constraints

- **零 Unicode Emoji**：全量界面、注释、模板、测试字符串严禁任何 Unicode Emoji，必须使用 `lucide-vue-next` 图标。
- **Apple HIG 触控**：所有可交互按钮、选项、筛选标签必须满足 `min-h-[44px]`，并包含 `touch-manipulation` 类。
- **羊皮纸设计语言**：遵循 `#fbf9f5` 暖底、`#e8ddd0` 边框、Amber/Bronze 强调色，严禁高饱和霓虹色与重度弥散投影（禁止 `shadow-lg`, `shadow-xl`, `shadow-2xl`）。
- **零大型第三方图表库**：雷达图使用纯 Vue SVG 多边形几何渲染，严禁引入 `echarts`, `chart.js` 等重量级依赖。
- **K12 适老化/青少年字体底线**：英文正文 ≥ 18px (`text-lg`)，中文释义 ≥ 14px (`text-sm`)，移动端输入框字号 ≥ 16px (`text-base`) 防止 iOS 自动缩放。
- **零回归测试**：执行过程中已有的 299 项自动化测试必须保持 100% 通过。

## Review Focus

1. **SVG 雷达图极坐标计算精度**：当某个维度分数为 0 或 100 时，多边形点坐标计算不得产生 `NaN` 或破损溢出，五个轴线与环形背景线对齐精准。
2. **CEFR 等级推导单调性**：低时长/少词汇严格对应 A2，达标后顺畅递进至 B1 $\to$ B2 $\to$ C1，不存在低分获得高等级的逻辑穿透。
3. **三端导航视图同步**：切换至 `'assessment'` 视图后，移动端底栏高亮、平板侧轨高亮、桌面侧边栏高亮完全同步，返回其他视图不丢失已评测历史。
4. **O.W.L.s 测验录音与播放资源清理**：模拟考关卡切换与模态窗关闭时，音频实例与麦克风录音资源必须完整停止与释放，无内存泄漏。
5. **A4 打印分页与裁切安全**：调起浏览器打印窗口时，`@page { size: A4 portrait; margin: 0; }` 样式必须保证整份羊皮纸证书精确收敛在单张 A4 内，不产生多余空白第二页。

---

### Task 1: `analyticsStore.js` 统计聚合引擎与算法模型

**Files:**
- Create: `src/stores/analyticsStore.js`
- Test: `tests/vue3/analyticsStore.test.js`

**Interfaces:**
- Produces:
  - `useAnalyticsStore()` Pinia store:
    - State: `listeningSeconds`, `listeningSessionsCount`, `shadowingHistory: Array<{ score, type, timestamp }>`, `dictationHistory: Array<{ correctCount, totalCount, timestamp }>`, `examHistory: Array<{ id, timestamp, cefrResult, title, compositeScore, dimensions, mentorFeedback }>`
    - Getters:
      - `cefrLevel`: 'A2' | 'B1' | 'B2' | 'C1'
      - `wizardTitle`: '魔法学徒' | '魔法探索者' | '魔法进阶者' | '傲罗精通'
      - `nextLevelProgress`: number (0-100)
      - `radarDimensions`: `{ auditory, vocabDepth, comprehension, shadowing, production }` (0-100 each)
      - `radarPolygonPoints(cx, cy, r)`: returns SVG polygon points string e.g. `"210,50 330,120 ..."`
    - Actions:
      - `recordListeningTime(seconds: number)`
      - `recordShadowingScore(score: number, type?: string)`
      - `recordDictationResult(correctCount: number, totalCount: number)`
      - `saveExamResult(examData: object)`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/vue3/analyticsStore.test.js
import { describe, test, beforeEach } from 'node:test'
import assert from 'node:assert'
import { setActivePinia, createPinia } from 'pinia'
import { useAnalyticsStore } from '../../src/stores/analyticsStore.js'
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

describe('analyticsStore CEFR & Radar Engine', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  test('analyticsStore computes default baseline CEFR A2 and wizard title', () => {
    const store = useAnalyticsStore()
    assert.strictEqual(store.cefrLevel, 'A2')
    assert.strictEqual(store.wizardTitle, '魔法学徒')
    assert.ok(typeof store.nextLevelProgress === 'number')
  })

  test('radarDimensions returns 5 bounded dimensions (0-100)', () => {
    const store = useAnalyticsStore()
    const dims = store.radarDimensions
    assert.ok(dims)
    for (const key of ['auditory', 'vocabDepth', 'comprehension', 'shadowing', 'production']) {
      assert.ok(typeof dims[key] === 'number', `Dimension ${key} must be a number`)
      assert.ok(dims[key] >= 0 && dims[key] <= 100, `Dimension ${key} must be in [0, 100]`)
    }
  })

  test('radarPolygonPoints calculates valid SVG points string without NaN', () => {
    const store = useAnalyticsStore()
    const points = store.radarPolygonPoints(200, 200, 150)
    assert.ok(typeof points === 'string')
    assert.ok(!points.includes('NaN'), 'SVG points must not contain NaN')
    const pairs = points.trim().split(/\s+/)
    assert.strictEqual(pairs.length, 5, 'Must generate 5 polygon vertices')
  })

  test('recording telemetry updates metrics and persists to localStorage', () => {
    const store = useAnalyticsStore()
    store.recordListeningTime(300)
    assert.strictEqual(store.listeningSeconds, 300)

    store.recordShadowingScore(88)
    assert.strictEqual(store.shadowingHistory.length, 1)
    assert.strictEqual(store.shadowingHistory[0].score, 88)

    store.recordDictationResult(9, 10)
    assert.strictEqual(store.dictationHistory.length, 1)

    // Verify localStorage persistence
    const raw = localStorage.getItem('hp_analytics_state')
    assert.ok(raw)
    assert.ok(raw.includes('300'))
  })

  test('saveExamResult appends exam history and updates best CEFR level', () => {
    const store = useAnalyticsStore()
    const exam = {
      id: 'owls-1',
      timestamp: Date.now(),
      cefrResult: 'B2',
      title: '魔法进阶者',
      compositeScore: 86,
      dimensions: { auditory: 85, vocabDepth: 88, comprehension: 84, shadowing: 86, production: 87 }
    }
    store.saveExamResult(exam)
    assert.strictEqual(store.examHistory.length, 1)
    assert.strictEqual(store.cefrLevel, 'B2')
    assert.strictEqual(store.wizardTitle, '魔法进阶者')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/vue3/analyticsStore.test.js`
Expected: FAIL with module not found

- [ ] **Step 3: Implement `src/stores/analyticsStore.js`**

Implement `useAnalyticsStore` with:
- State persistence in `hp_analytics_state`
- `radarDimensions` mapping 5 cognitive areas to [0, 100]
- `radarPolygonPoints(cx, cy, r)` implementing 5-point polar-to-cartesian projection: $\theta_i = -90^\circ + i \times 72^\circ$
- CEFR level progression formula based on listening time, `vocabStore` count, and shadowing scores
- Safe fallback defaults and telemetry recording actions

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/vue3/analyticsStore.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/stores/analyticsStore.js tests/vue3/analyticsStore.test.js
git commit -m "feat(analytics): add analyticsStore.js with CEFR progression and five-dimensional radar math engine"
```

---

### Task 2: 全局导航系统扩展（注册 `assessment` 视图）

**Files:**
- Modify: `src/stores/navigationStore.js`
- Modify: `src/components/navigation/DesktopSidebarVue.vue`
- Modify: `src/components/navigation/TabletRailVue.vue`
- Modify: `src/components/navigation/MobileBottomNavVue.vue`
- Modify: `src/components/layout/AppShell.vue`
- Test: `tests/vue3/assessmentNavigation.test.js`

**Interfaces:**
- Consumes: `useNavigationStore`
- Produces:
  - `navigationStore.currentView` supports `'assessment'`
  - Desktop, Tablet, and Mobile navigators include "能力评定" with Lucide `Award` icon
  - Apple HIG 44px touch targets on all new nav buttons
  - `AppShell.vue` conditionally mounts `AssessmentHub` when `navigationStore.currentView === 'assessment'`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/vue3/assessmentNavigation.test.js
import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Assessment Navigation Integration', () => {
  test('navigationStore supports assessment view', () => {
    const navContent = fs.readFileSync(path.resolve('src/stores/navigationStore.js'), 'utf-8')
    assert.ok(navContent.includes('assessment'), 'navigationStore must reference assessment view')
  })

  test('Navigation components include assessment item with Award icon', () => {
    const desktop = fs.readFileSync(path.resolve('src/components/navigation/DesktopSidebarVue.vue'), 'utf-8')
    assert.ok(desktop.includes('assessment') && desktop.includes('Award'), 'DesktopSidebar must include assessment view and Award icon')

    const tablet = fs.readFileSync(path.resolve('src/components/navigation/TabletRailVue.vue'), 'utf-8')
    assert.ok(tablet.includes('assessment') && tablet.includes('Award'), 'TabletRail must include assessment view and Award icon')

    const mobile = fs.readFileSync(path.resolve('src/components/navigation/MobileBottomNavVue.vue'), 'utf-8')
    assert.ok(mobile.includes('assessment') && mobile.includes('Award'), 'MobileBottomNav must include assessment view and Award icon')
  })

  test('AppShell imports and renders AssessmentHub', () => {
    const shell = fs.readFileSync(path.resolve('src/components/layout/AppShell.vue'), 'utf-8')
    assert.ok(shell.includes('AssessmentHub'), 'AppShell must import and conditionally render AssessmentHub')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/vue3/assessmentNavigation.test.js`
Expected: FAIL

- [ ] **Step 3: Implement navigation updates across files**

- In `src/stores/navigationStore.js`: add view type support.
- In `DesktopSidebarVue.vue`, `TabletRailVue.vue`, `MobileBottomNavVue.vue`: import `Award` from `lucide-vue-next`, add navigation item for `assessment` with label "能力评定", `min-h-[44px]` touch target.
- In `AppShell.vue`: import `AssessmentHub` from `../assessment/AssessmentHub.vue`, render `<AssessmentHub v-else-if="navigationStore.currentView === 'assessment'" />`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/vue3/assessmentNavigation.test.js`
Expected: PASS

- [ ] **Step 5: Run existing layout test suites to ensure zero regression**

Run: `node tests/vue3/responsiveLayout.test.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/stores/navigationStore.js src/components/navigation/DesktopSidebarVue.vue src/components/navigation/TabletRailVue.vue src/components/navigation/MobileBottomNavVue.vue src/components/layout/AppShell.vue tests/vue3/assessmentNavigation.test.js
git commit -m "feat(nav): register assessment view across three-device navigation and AppShell"
```

---

### Task 3: `AssessmentHub.vue` 能力大厅三端主看板

**Files:**
- Create: `src/components/assessment/AssessmentHub.vue`
- Test: `tests/vue3/assessmentHub.test.js`

**Interfaces:**
- Consumes: `useAnalyticsStore`, `useVocabStore`
- Produces:
  - Hero Wizard Rank card with CEFR badge (A2–C1), wizard title, and progression bar
  - Native SVG 5-axis Radar Chart with concentric parchment grid, axis labels, amber polygon overlay, and hover/touch tooltips
  - 3-card metrics overview:
    - 听力总时长 (minutes)
    - 词汇六维分布 (Total, L1–L4 counts)
    - 产出表现 (Shadowing avg, Dictation avg)
  - 3-tier Action Pyramid:
    - Primary CTA: "开启 O.W.L.s 等级评定考核" (opens `OwlsExamModal`)
    - Secondary CTA: "查看/打印羊皮纸成绩单" (opens `OwlsCertificateModal`)
  - Three-device layout: Mobile single column, Tablet 2-column, Desktop 3-column
  - Zero Unicode emojis, Lucide icons only.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/vue3/assessmentHub.test.js
import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('AssessmentHub.vue Component Standards', () => {
  const filePath = path.resolve('src/components/assessment/AssessmentHub.vue')

  test('AssessmentHub.vue exists and conforms to design system', () => {
    assert.ok(fs.existsSync(filePath), 'AssessmentHub.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    // SVG Radar chart
    assert.ok(content.includes('<svg') && content.includes('<polygon'), 'Must render native SVG radar polygon')

    // Integration with analyticsStore and vocabStore
    assert.ok(content.includes('useAnalyticsStore'), 'Must bind to useAnalyticsStore')

    // CTAs for exam and certificate
    assert.ok(content.includes('OwlsExamModal') || content.includes('showExamModal'), 'Must support OwlsExamModal trigger')
    assert.ok(content.includes('OwlsCertificateModal') || content.includes('showCertModal'), 'Must support OwlsCertificateModal trigger')

    // Zero emojis
    const emojiMatches = content.match(/\p{Extended_Pictographic}/gu)
    assert.strictEqual(emojiMatches, null, 'Must contain zero Unicode emoji characters')

    // Apple HIG
    assert.ok(content.includes('min-h-[44px]') || content.includes('h-11'), 'Interactive elements must satisfy 44px')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/vue3/assessmentHub.test.js`
Expected: FAIL

- [ ] **Step 3: Implement `src/components/assessment/AssessmentHub.vue`**

Implement full three-device layout orchestrator with native SVG radar, stats cards, wizard level hero, and modal bindings.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/vue3/assessmentHub.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/assessment/AssessmentHub.vue tests/vue3/assessmentHub.test.js
git commit -m "feat(assessment): add AssessmentHub.vue three-device learning dashboard with native SVG radar chart"
```

---

### Task 4: `OwlsExamModal.vue` 10 分钟快速模拟考系统

**Files:**
- Create: `src/components/assessment/OwlsExamModal.vue`
- Test: `tests/vue3/owlsExamModal.test.js`

**Interfaces:**
- Props: `isOpen: boolean`
- Emits: `close`, `exam-completed(examRecord: object)`
- Stages:
  1. Stage 1 (Listening Comprehension): 3 multiple-choice questions with audio playback
  2. Stage 2 (Dictation & Spelling): 3 target word blanks with sentence audio
  3. Stage 3 (Oral Shadowing Challenge): 1 golden quote speech recording with immediate grading
  4. Stage 4 (Summary & Graduation): Composite scoring, CEFR level certification, mentor feedback, saves result to `analyticsStore`
- Zero Unicode emojis, Apple HIG 44px touch targets.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/vue3/owlsExamModal.test.js
import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('OwlsExamModal.vue Component Standards', () => {
  const filePath = path.resolve('src/components/assessment/OwlsExamModal.vue')

  test('OwlsExamModal.vue exists and implements 3 exam stages', () => {
    assert.ok(fs.existsSync(filePath), 'OwlsExamModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    // 3 Stages
    assert.ok(content.includes('stage') || content.includes('currentStep'), 'Must track exam stages')
    assert.ok(content.includes('listening') || content.includes('听力'), 'Must have listening stage')
    assert.ok(content.includes('dictation') || content.includes('拼写') || content.includes('填空'), 'Must have dictation stage')
    assert.ok(content.includes('shadowing') || content.includes('跟读') || content.includes('朗读'), 'Must have oral shadowing stage')

    // Saves exam
    assert.ok(content.includes('saveExamResult'), 'Must save exam result to analyticsStore')

    // Zero emojis
    const emojiMatches = content.match(/\p{Extended_Pictographic}/gu)
    assert.strictEqual(emojiMatches, null, 'Must contain zero Unicode emoji characters')

    // Apple HIG
    assert.ok(content.includes('min-h-[44px]') || content.includes('h-11'), 'Must satisfy 44px touch target')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/vue3/owlsExamModal.test.js`
Expected: FAIL

- [ ] **Step 3: Implement `src/components/assessment/OwlsExamModal.vue`**

Implement three-stage exam stepper with curated seed test bank, input validation, audio synthesis/playback, recording simulation/MediaRecorder, score aggregation, and celebratory completion card.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/vue3/owlsExamModal.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/assessment/OwlsExamModal.vue tests/vue3/owlsExamModal.test.js
git commit -m "feat(assessment): add OwlsExamModal.vue three-stage fast interactive proficiency exam"
```

---

### Task 5: `owlsCertificateExport.js` & `OwlsCertificateModal.vue` A4 羊皮纸成绩单

**Files:**
- Create: `src/utils/owlsCertificateExport.js`
- Create: `src/components/assessment/OwlsCertificateModal.vue`
- Test: `tests/vue3/owlsCertificate.test.js`

**Interfaces:**
- `generateOwlsCertificateHTML(examData, profileData)`:
  - Generates standalone, printable A4 HTML with warm parchment theme, Ministry of Magic headers, official seals, SVG radar chart, subject breakdown, and security watermark
  - Supports `@media print { @page { size: A4 portrait; margin: 0; } }`
- `OwlsCertificateModal.vue`:
  - Modal displaying the official certificate preview
  - CTA button: "打印成绩单 (PDF)" triggering `window.print()` or preview window
  - Close button and responsive scaling
  - Zero Unicode emojis.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/vue3/owlsCertificate.test.js
import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { generateOwlsCertificateHTML } from '../../src/utils/owlsCertificateExport.js'

describe('O.W.L.s Printable Certificate Generator & Modal', () => {
  test('generateOwlsCertificateHTML produces valid parchment A4 HTML', () => {
    const html = generateOwlsCertificateHTML({
      id: 'owls-test',
      timestamp: Date.now(),
      cefrResult: 'B1',
      title: '魔法探索者',
      compositeScore: 88,
      dimensions: { auditory: 85, vocabDepth: 90, comprehension: 88, shadowing: 86, production: 91 },
      mentorFeedback: '优秀的听辨与产出能力。'
    })

    assert.ok(typeof html === 'string')
    assert.ok(html.includes('Ministry of Magic') || html.includes('魔法部'), 'Must include Ministry header')
    assert.ok(html.includes('B1'), 'Must display CEFR level')
    assert.ok(html.includes('@media print'), 'Must include print media stylesheet')
    assert.ok(!/\p{Extended_Pictographic}/gu.test(html), 'Certificate must contain zero Unicode emojis')
  })

  test('OwlsCertificateModal.vue exists and meets standards', () => {
    const modalPath = path.resolve('src/components/assessment/OwlsCertificateModal.vue')
    assert.ok(fs.existsSync(modalPath))
    const content = fs.readFileSync(modalPath, 'utf-8')
    assert.ok(content.includes('generateOwlsCertificateHTML') || content.includes('print'), 'Must support printing')
    assert.ok(content.includes('min-h-[44px]'), 'Must enforce Apple HIG touch targets')
    assert.strictEqual(content.match(/\p{Extended_Pictographic}/gu), null, 'Zero emojis')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/vue3/owlsCertificate.test.js`
Expected: FAIL

- [ ] **Step 3: Implement `src/utils/owlsCertificateExport.js` and `src/components/assessment/OwlsCertificateModal.vue`**

Implement standalone printable A4 parchment HTML builder and interactive modal viewer.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/vue3/owlsCertificate.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/owlsCertificateExport.js src/components/assessment/OwlsCertificateModal.vue tests/vue3/owlsCertificate.test.js
git commit -m "feat(assessment): add A4 parchment OWLs certificate generator and interactive modal viewer"
```

---

### Task 6: 听力 / 跟读 / 听写全链路数据埋点对接

**Files:**
- Modify: `src/components/session/StepListening.vue`
- Modify: `src/components/session/StepShadowing.vue`
- Modify: `src/components/session/StepDictation.vue`
- Modify: `src/components/ted/TedShadowing.vue`
- Test: `tests/vue3/analyticsTelemetry.test.js`

**Interfaces:**
- Consumes: `useAnalyticsStore`
- Telemetry triggers:
  - In `StepListening.vue`: on audio time update (accumulates listening seconds via `recordListeningTime`)
  - In `StepShadowing.vue`: on recording completion/evaluation, calls `recordShadowingScore(score, 'hp')`
  - In `TedShadowing.vue`: on recording evaluation, calls `recordShadowingScore(score, 'ted')`
  - In `StepDictation.vue`: on dictation completion/scoring, calls `recordDictationResult(correct, total)`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/vue3/analyticsTelemetry.test.js
import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Analytics Telemetry Instrumentation', () => {
  test('StepListening records listening time to analyticsStore', () => {
    const content = fs.readFileSync(path.resolve('src/components/session/StepListening.vue'), 'utf-8')
    assert.ok(content.includes('useAnalyticsStore'), 'StepListening must import useAnalyticsStore')
    assert.ok(content.includes('recordListeningTime'), 'StepListening must call recordListeningTime')
  })

  test('StepShadowing and TedShadowing record scores to analyticsStore', () => {
    const hp = fs.readFileSync(path.resolve('src/components/session/StepShadowing.vue'), 'utf-8')
    assert.ok(hp.includes('useAnalyticsStore') && hp.includes('recordShadowingScore'), 'StepShadowing must record shadowing score')

    const ted = fs.readFileSync(path.resolve('src/components/ted/TedShadowing.vue'), 'utf-8')
    assert.ok(ted.includes('useAnalyticsStore') && ted.includes('recordShadowingScore'), 'TedShadowing must record shadowing score')
  })

  test('StepDictation records dictation results to analyticsStore', () => {
    const dict = fs.readFileSync(path.resolve('src/components/session/StepDictation.vue'), 'utf-8')
    assert.ok(dict.includes('useAnalyticsStore') && dict.includes('recordDictationResult'), 'StepDictation must record dictation results')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/vue3/analyticsTelemetry.test.js`
Expected: FAIL

- [ ] **Step 3: Implement telemetry hooks across components**

Instrument `StepListening.vue`, `StepShadowing.vue`, `TedShadowing.vue`, and `StepDictation.vue`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/vue3/analyticsTelemetry.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/session/StepListening.vue src/components/session/StepShadowing.vue src/components/session/StepDictation.vue src/components/ted/TedShadowing.vue tests/vue3/analyticsTelemetry.test.js
git commit -m "feat(analytics): instrument listening, shadowing, and dictation activities to feed analyticsStore"
```

---

### Task 7: 全量测试、构建与零违规审计

**Files:**
- Audit & Verify entire project

**Steps:**
- [ ] **Step 1: Run full unit test suite**

Run: `npm test`
Expected: All 310+ tests pass with 0 failures.

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Vite build completes cleanly with 0 errors.

- [ ] **Step 3: Run zero-emoji audit**

Run: `npm run check-emojis`
Expected: 0 Unicode emojis found.

- [ ] **Step 4: Run security credential audit**

Run: `npm run verify-security`
Expected: 0 credential leaks found.

- [ ] **Step 5: Final Sprint 4 completion commit**

```bash
git commit --allow-empty -m "chore(sprint4): complete CEFR assessment map and OWLs milestone examination report"
```
