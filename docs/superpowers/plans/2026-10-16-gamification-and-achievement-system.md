# Sprint 5 — 魔法激励系统与成就徽章实施计划 (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建沉浸式哈利·波特魔法英语激励系统（四大学院杯沙漏竞赛、分院帽仪式、连续打卡与守护神护盾保护、多维度成就徽章画廊及全链路学分自动化注入），实现三端自适应体验与本地离线优先自愈存储。

**Architecture:** 采用高内聚独立的 `gamificationStore.js` 统一管理学院、学分、连续天数与勋章；通过 `badgeDefinitions.js` 维护声明式成就注册表；配合 `SortingCeremonyModal`、`HouseCupModal`、`AchievementBadgesModal` 与全局 `BadgeUnlockedToast`，在三端导航触点常驻展示，与既有学习步骤无缝埋点互通。

**Tech Stack:** Vue 3 (Composition API / `<script setup>`), Pinia, Tailwind CSS, Lucide-vue-next, localStorage (`hp_gamification_state`), Node.js `node:test` + `node:assert`.

**Spec:** `docs/superpowers/specs/2026-10-16-gamification-and-achievement-system-design.md`

## Global Constraints

- **Strict Zero Unicode Emojis**: 严禁在任何模板、文案或注释中使用 Unicode Emoji。必须使用 `lucide-vue-next` 矢量图标（如 `Flame`, `Trophy`, `Shield`, `Award`, `Sparkles`, `Clock`, `Heart`, `Crown`, `BookOpen`, `Volume2`, `Check` 等）。
- **Apple HIG 44px 触控目标**: 所有交互按钮、选项与关闭操作均需设置 `min-h-[44px] min-w-[44px]` 及 `touch-manipulation` 类。
- **暖色羊皮纸设计基调**: 背景使用 `#fbf9f5`、`#f5efe6`，边框使用 `#e8ddd0`、`#decbb8`，文字使用 `#1c1917`、`#78716c`，杜绝生硬大阴影。
- **本地优先与容灾自愈**: 基于 `localStorage` 键名 `hp_gamification_state`，缺少字段或初次加载时自动填充健壮默认值，杜绝 `null`/`undefined` 运行时报错。
- **全量测试零回归**: 现有 330 个测试必须 100% 保持绿色通过。

## Review Focus

1. **跨日打卡边界与冷冻符判定**: 当学生在跨日、隔日或跨越 48 小时后进入应用时，`checkInDaily` 必须正确消耗守护神冷冻符或重置连胜为 1，杜绝 `streakDays` 出现负数或 `NaN`。
2. **分院仪式幂等性与初始学分分配**: 重新分院或首次分院时，学分注入必须平稳过渡，不能破坏既有的四院相对积分或导致学生历史贡献丢失。
3. **沙漏视觉高度计算边界**: 当某学院积分为 0 或积分远超基准时，沙漏填充高度计算必须限制在 `[15, 130]` 像素范围内，杜绝溢出或负数高。
4. **成就解锁判定幂等性**: 避免学习流同一动作多次调用 `checkAndUnlockBadges` 时重复入队 Toast 或重复记录解锁时间戳。
5. **模态框与三端响应式自适应**: 手机（375px–430px）、平板（768px–1024px）与桌面（1280px+）均无视口横向溢出，关闭按钮易于触达。

---

### Task 1: 徽章注册表与 `gamificationStore.js` 核心引擎

**Files:**
- Create: `src/data/badgeDefinitions.js`
- Create: `src/stores/gamificationStore.js`
- Create: `tests/vue3/gamificationStore.test.js`

**Interfaces:**
- Consumes: `src/stores/analyticsStore.js`, `src/stores/vocabStore.js`
- Produces: `useGamificationStore()`, `HOUSES`, `BADGE_DEFINITIONS`

- [ ] **Step 1: Write the failing test in `tests/vue3/gamificationStore.test.js`**

```javascript
import { describe, test, beforeEach } from 'node:test'
import assert from 'node:assert'
import { setActivePinia, createPinia } from 'pinia'
import { useGamificationStore, HOUSES } from '../../src/stores/gamificationStore.js'
import { BADGE_DEFINITIONS } from '../../src/data/badgeDefinitions.js'

describe('gamificationStore & badgeDefinitions', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') localStorage.clear()
    setActivePinia(createPinia())
  })

  test('HOUSES and BADGE_DEFINITIONS registry are properly defined', () => {
    assert.strictEqual(Object.keys(HOUSES).length, 4)
    assert.ok(HOUSES.gryffindor && HOUSES.ravenclaw && HOUSES.hufflepuff && HOUSES.slytherin)
    assert.ok(Array.isArray(BADGE_DEFINITIONS))
    assert.ok(BADGE_DEFINITIONS.length >= 12)
    assert.ok(BADGE_DEFINITIONS.some(b => b.id === 'sorting-ceremony'))
  })

  test('gamificationStore default state initializes safely', () => {
    const store = useGamificationStore()
    assert.strictEqual(store.userHouse, null)
    assert.strictEqual(store.streakDays, 0)
    assert.strictEqual(store.streakFreezes, 1)
    assert.ok(store.housePoints.gryffindor > 0)
    assert.strictEqual(store.studentContribution, 0)
  })

  test('selectHouse assigns house and awards sorting badge', () => {
    const store = useGamificationStore()
    store.selectHouse('ravenclaw')
    assert.strictEqual(store.userHouse, 'ravenclaw')
    assert.ok(store.housePoints.ravenclaw >= 195) // initial base + 20
    assert.strictEqual(store.studentContribution, 20)
    assert.ok(store.unlockedBadges['sorting-ceremony'])
  })

  test('awardPoints adds to user house and preserves point history', () => {
    const store = useGamificationStore()
    store.selectHouse('gryffindor')
    const before = store.housePoints.gryffindor
    store.awardPoints(10, '精听达标')
    assert.strictEqual(store.housePoints.gryffindor, before + 10)
    assert.strictEqual(store.pointHistory.length, 2) // sorting (20) + listening (10)
    assert.strictEqual(store.pointHistory[0].reason, '精听达标')
  })

  test('houseRankings returns correctly sorted houses 1 to 4', () => {
    const store = useGamificationStore()
    store.selectHouse('gryffindor')
    store.awardPoints(500, '巨额学分')
    const rankings = store.houseRankings
    assert.strictEqual(rankings.length, 4)
    assert.strictEqual(rankings[0].id, 'gryffindor')
    assert.strictEqual(rankings[0].rank, 1)
  })

  test('checkInDaily updates streak and consumes freeze on skipped day', () => {
    const store = useGamificationStore()
    // Day 1
    store.checkInDaily(300, '2026-10-14')
    assert.strictEqual(store.streakDays, 1)

    // Day 2 consecutive
    store.checkInDaily(300, '2026-10-15')
    assert.strictEqual(store.streakDays, 2)

    // Day 4 (Day 3 was skipped! Should consume 1 freeze)
    store.checkInDaily(300, '2026-10-17')
    assert.strictEqual(store.streakDays, 3)
    assert.strictEqual(store.streakFreezes, 0)
    assert.ok(store.streakFrozenDates.includes('2026-10-16'))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/vue3/gamificationStore.test.js`
Expected: FAIL (Cannot find module)

- [ ] **Step 3: Implement `badgeDefinitions.js` and `gamificationStore.js`**

Create `src/data/badgeDefinitions.js` with the 14 badges defined in the spec.
Create `src/stores/gamificationStore.js` with state, getters (`currentHouseInfo`, `houseRankings`, `allBadgesWithStatus`, `unlockedCount`), and actions (`selectHouse`, `awardPoints`, `checkInDaily`, `consumeStreakFreeze`, `checkAndUnlockBadges`, `markBadgeSeen`, `popToast`, `saveToStorage`, `loadFromStorage`).

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/vue3/gamificationStore.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/data/badgeDefinitions.js src/stores/gamificationStore.js tests/vue3/gamificationStore.test.js
git commit -m "feat(gamification): add badgeDefinitions and gamificationStore with streak freeze and house cup ranking engine"
```

---

### Task 2: 全局即时荣誉浮层通知 (`BadgeUnlockedToast.vue`)

**Files:**
- Create: `src/components/gamification/BadgeUnlockedToast.vue`
- Create: `tests/vue3/badgeUnlockedToast.test.js`
- Modify: `src/App.vue`

**Interfaces:**
- Consumes: `gamificationStore.pendingToasts`, `gamificationStore.popToast()`
- Produces: Global top-center animated celebration toast

- [ ] **Step 1: Write the failing test in `tests/vue3/badgeUnlockedToast.test.js`**

```javascript
import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'vue/compiler-sfc'

describe('BadgeUnlockedToast Component', () => {
  const filePath = path.resolve('src/components/gamification/BadgeUnlockedToast.vue')

  test('file exists and parses as valid Vue 3 SFC', () => {
    assert.ok(fs.existsSync(filePath), 'Component file must exist')
    const content = fs.readFileSync(filePath, 'utf-8')
    const { errors } = parse(content)
    assert.strictEqual(errors.length, 0)
  })

  test('conforms to design spec: zero emojis and 44px dismiss button', () => {
    const content = fs.readFileSync(filePath, 'utf-8')
    assert.ok(!/[\u{1F300}-\u{1F9FF}]/u.test(content), 'Zero emojis required')
    assert.ok(content.includes('min-h-[44px]') || content.includes('min-w-[44px]'), 'Apple HIG 44px required')
    assert.ok(content.includes('Teleport'), 'Must teleport to body')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/vue3/badgeUnlockedToast.test.js`
Expected: FAIL (file does not exist)

- [ ] **Step 3: Implement `BadgeUnlockedToast.vue` and mount in `App.vue`**

Implement `<Teleport to="body">` with golden border, parchment background, Lucide icons (`Award`, `Flame`, `Sparkles`, `X`), automatic dismiss timer, and mount `<BadgeUnlockedToast />` in `src/App.vue`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/vue3/badgeUnlockedToast.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/gamification/BadgeUnlockedToast.vue tests/vue3/badgeUnlockedToast.test.js src/App.vue
git commit -m "feat(gamification): add BadgeUnlockedToast global animated celebration popup and mount in App.vue"
```

---

### Task 3: 分院帽仪式交互模态框 (`SortingCeremonyModal.vue`)

**Files:**
- Create: `src/components/gamification/SortingCeremonyModal.vue`
- Create: `tests/vue3/sortingCeremony.test.js`

**Interfaces:**
- Consumes: `gamificationStore.userHouse`, `gamificationStore.selectHouse(houseId)`
- Produces: `SortingCeremonyModal.vue` with 4-question quiz and direct house selection

- [ ] **Step 1: Write the failing test in `tests/vue3/sortingCeremony.test.js`**

```javascript
import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'vue/compiler-sfc'

describe('SortingCeremonyModal Component', () => {
  const filePath = path.resolve('src/components/gamification/SortingCeremonyModal.vue')

  test('file exists and parses as valid Vue 3 SFC', () => {
    assert.ok(fs.existsSync(filePath), 'Component file must exist')
    const content = fs.readFileSync(filePath, 'utf-8')
    const { errors } = parse(content)
    assert.strictEqual(errors.length, 0)
  })

  test('contains 4 houses cards and quiz questions with zero emojis', () => {
    const content = fs.readFileSync(filePath, 'utf-8')
    assert.ok(content.includes('gryffindor') && content.includes('ravenclaw'))
    assert.ok(content.includes('hufflepuff') && content.includes('slytherin'))
    assert.ok(content.includes('selectHouse'), 'Must invoke store selectHouse')
    assert.ok(!/[\u{1F300}-\u{1F9FF}]/u.test(content), 'Zero emojis required')
    assert.ok(content.includes('min-h-[44px]'), 'Apple HIG 44px touch targets required')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/vue3/sortingCeremony.test.js`
Expected: FAIL

- [ ] **Step 3: Implement `SortingCeremonyModal.vue`**

Implement interactive 4-question wizard personality test, direct 4-house selection cards, quote cards, confirmation step invoking `gamificationStore.selectHouse(houseId)`, and close handler.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/vue3/sortingCeremony.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/gamification/SortingCeremonyModal.vue tests/vue3/sortingCeremony.test.js
git commit -m "feat(gamification): add SortingCeremonyModal with personality quiz and direct house selection"
```

---

### Task 4: 学院杯四院沙漏看板与学分榜 (`HouseCupModal.vue`)

**Files:**
- Create: `src/components/gamification/HouseCupModal.vue`
- Create: `tests/vue3/houseCupModal.test.js`

**Interfaces:**
- Consumes: `gamificationStore.housePoints`, `gamificationStore.houseRankings`, `gamificationStore.studentContribution`, `gamificationStore.pointHistory`
- Produces: `HouseCupModal.vue` modal component

- [ ] **Step 1: Write the failing test in `tests/vue3/houseCupModal.test.js`**

```javascript
import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'vue/compiler-sfc'

describe('HouseCupModal Component', () => {
  const filePath = path.resolve('src/components/gamification/HouseCupModal.vue')

  test('file exists and parses as valid Vue 3 SFC', () => {
    assert.ok(fs.existsSync(filePath), 'Component file must exist')
    const content = fs.readFileSync(filePath, 'utf-8')
    const { errors } = parse(content)
    assert.strictEqual(errors.length, 0)
  })

  test('implements four gemstone hourglasses, rankings, and personal contribution', () => {
    const content = fs.readFileSync(filePath, 'utf-8')
    assert.ok(content.includes('houseRankings'), 'Must bind to houseRankings')
    assert.ok(content.includes('studentContribution'), 'Must show student contribution')
    assert.ok(!/[\u{1F300}-\u{1F9FF}]/u.test(content), 'Zero emojis required')
    assert.ok(content.includes('min-h-[44px]'), 'Apple HIG 44px required')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/vue3/houseCupModal.test.js`
Expected: FAIL

- [ ] **Step 3: Implement `HouseCupModal.vue`**

Implement SVG/CSS gemstone hourglasses with dynamic fill levels, 1st to 4th rankings with user house highlighted, personal contribution cards, recent point history log, and modal close ergonomics.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/vue3/houseCupModal.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/gamification/HouseCupModal.vue tests/vue3/houseCupModal.test.js
git commit -m "feat(gamification): add HouseCupModal with four gemstone hourglasses and rankings board"
```

---

### Task 5: 魔法成就徽章图鉴大厅 (`AchievementBadgesModal.vue`)

**Files:**
- Create: `src/components/gamification/AchievementBadgesModal.vue`
- Create: `tests/vue3/achievementBadges.test.js`

**Interfaces:**
- Consumes: `gamificationStore.allBadgesWithStatus`, `gamificationStore.unlockedCount`
- Produces: `AchievementBadgesModal.vue`

- [ ] **Step 1: Write the failing test in `tests/vue3/achievementBadges.test.js`**

```javascript
import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'vue/compiler-sfc'

describe('AchievementBadgesModal Component', () => {
  const filePath = path.resolve('src/components/gamification/AchievementBadgesModal.vue')

  test('file exists and parses as valid Vue 3 SFC', () => {
    assert.ok(fs.existsSync(filePath), 'Component file must exist')
    const content = fs.readFileSync(filePath, 'utf-8')
    const { errors } = parse(content)
    assert.strictEqual(errors.length, 0)
  })

  test('supports category filtering, badge progress bars, and detail popup', () => {
    const content = fs.readFileSync(filePath, 'utf-8')
    assert.ok(content.includes('allBadgesWithStatus'), 'Must bind to store badges')
    assert.ok(content.includes('journey') && content.includes('skill') && content.includes('grit'))
    assert.ok(!/[\u{1F300}-\u{1F9FF}]/u.test(content), 'Zero emojis required')
    assert.ok(content.includes('min-h-[44px]'), 'Apple HIG 44px required')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/vue3/achievementBadges.test.js`
Expected: FAIL

- [ ] **Step 3: Implement `AchievementBadgesModal.vue`**

Implement category tabs (全部, 魔法征程, 语言造诣, 坚韧修行, O.W.L.s 优异), responsive 2-4 column grid, rarity styling (Bronze, Silver, Gold, Legendary), progress bars for locked badges, and badge inspection detail popup.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/vue3/achievementBadges.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/gamification/AchievementBadgesModal.vue tests/vue3/achievementBadges.test.js
git commit -m "feat(gamification): add AchievementBadgesModal gallery with category filter and detail viewer"
```

---

### Task 6: 三端导航与打卡触点集成

**Files:**
- Modify: `src/components/navigation/DesktopSidebarVue.vue`
- Modify: `src/components/navigation/TabletRailVue.vue`
- Modify: `src/components/navigation/MobileTopBarVue.vue`
- Modify: `src/components/layout/AppShell.vue`
- Create: `tests/vue3/gamificationNavigation.test.js`

**Interfaces:**
- Consumes: `gamificationStore.streakDays`, `gamificationStore.userHouse`, `gamificationStore.currentHouseInfo`
- Produces: Integrated streak and house cup triggers across 3 devices

- [ ] **Step 1: Write the failing test in `tests/vue3/gamificationNavigation.test.js`**

```javascript
import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Gamification Navigation Integration across 3 Devices', () => {
  test('DesktopSidebarVue binds to gamificationStore streak and house cup modal triggers', () => {
    const desktop = fs.readFileSync(path.resolve('src/components/navigation/DesktopSidebarVue.vue'), 'utf-8')
    assert.ok(desktop.includes('useGamificationStore'), 'DesktopSidebar must import useGamificationStore')
    assert.ok(desktop.includes('openHouseCup') || desktop.includes('openBadges') || desktop.includes('HouseCupModal'), 'Must support HouseCup triggers')
  })

  test('MobileTopBarVue displays streak flame counter and house crest chip', () => {
    const mobile = fs.readFileSync(path.resolve('src/components/navigation/MobileTopBarVue.vue'), 'utf-8')
    assert.ok(mobile.includes('useGamificationStore'), 'MobileTopBar must import useGamificationStore')
    assert.ok(mobile.includes('Flame'), 'Must display streak Flame icon')
  })

  test('AppShell.vue mounts gamification modals cleanly', () => {
    const shell = fs.readFileSync(path.resolve('src/components/layout/AppShell.vue'), 'utf-8')
    assert.ok(shell.includes('HouseCupModal'), 'AppShell must mount HouseCupModal')
    assert.ok(shell.includes('AchievementBadgesModal'), 'AppShell must mount AchievementBadgesModal')
    assert.ok(shell.includes('SortingCeremonyModal'), 'AppShell must mount SortingCeremonyModal')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/vue3/gamificationNavigation.test.js`
Expected: FAIL

- [ ] **Step 3: Implement navigation integration across DesktopSidebarVue, TabletRailVue, MobileTopBarVue, and AppShell.vue**

Connect `gamificationStore` to DesktopSidebar (upgrade habit card to show House crest, points, and streak), TabletRail (add Trophy/Flame icon triggers), MobileTopBar (add flame streak and house gem chip), and mount the modals in `AppShell.vue`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/vue3/gamificationNavigation.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/navigation/DesktopSidebarVue.vue src/components/navigation/TabletRailVue.vue src/components/navigation/MobileTopBarVue.vue src/components/layout/AppShell.vue tests/vue3/gamificationNavigation.test.js
git commit -m "feat(navigation): integrate house cup, streak flame, and gamification modals across three devices"
```

---

### Task 7: 全链路学习行为学分注入与徽章自动解锁埋点

**Files:**
- Modify: `src/components/session/StepListening.vue` & `src/App.vue`
- Modify: `src/components/session/StepShadowing.vue` & `src/components/ted/TedShadowing.vue`
- Modify: `src/components/session/StepDictation.vue`
- Modify: `src/components/session/StepVocabReview.vue` & `src/components/ted/TedTaskStudio.vue`
- Modify: `src/components/assessment/OwlsExamModal.vue`
- Create: `tests/vue3/gamificationTelemetry.test.js`

**Interfaces:**
- Consumes: `gamificationStore.awardPoints`, `gamificationStore.checkInDaily`, `gamificationStore.checkAndUnlockBadges`
- Produces: Automatic real-time telemetry wiring from all 7 modules

- [ ] **Step 1: Write the failing test in `tests/vue3/gamificationTelemetry.test.js`**

```javascript
import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Gamification Telemetry Instrumentation across all modules', () => {
  test('StepListening and App wire daily listening check-in and 5-min goal', () => {
    const listening = fs.readFileSync(path.resolve('src/components/session/StepListening.vue'), 'utf-8')
    assert.ok(listening.includes('useGamificationStore'), 'StepListening must bind to gamificationStore')
  })

  test('StepShadowing and TedShadowing award points on score >= 85', () => {
    const hp = fs.readFileSync(path.resolve('src/components/session/StepShadowing.vue'), 'utf-8')
    assert.ok(hp.includes('useGamificationStore'), 'StepShadowing must bind to gamificationStore')
    const ted = fs.readFileSync(path.resolve('src/components/ted/TedShadowing.vue'), 'utf-8')
    assert.ok(ted.includes('useGamificationStore'), 'TedShadowing must bind to gamificationStore')
  })

  test('StepDictation and OwlsExamModal award points and check badges', () => {
    const dict = fs.readFileSync(path.resolve('src/components/session/StepDictation.vue'), 'utf-8')
    assert.ok(dict.includes('useGamificationStore'), 'StepDictation must bind to gamificationStore')
    const exam = fs.readFileSync(path.resolve('src/components/assessment/OwlsExamModal.vue'), 'utf-8')
    assert.ok(exam.includes('useGamificationStore'), 'OwlsExamModal must bind to gamificationStore')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/vue3/gamificationTelemetry.test.js`
Expected: FAIL

- [ ] **Step 3: Implement telemetry hooks across all 5 files**

Inject `awardPoints` and `checkAndUnlockBadges` when milestones are hit in listening, shadowing, dictation, vocabulary review, and O.W.L.s examination.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/vue3/gamificationTelemetry.test.js`
Expected: PASS

- [ ] **Step 5: Run full test suite and build check**

Run: `npm test && npm run build && npm run check-emojis && npm run verify-security`
Expected: All tests pass (330+ tests), build clean, 0 emojis, 0 security leaks.

- [ ] **Step 6: Commit**

```bash
git add src/components/session/StepListening.vue src/App.vue src/components/session/StepShadowing.vue src/components/ted/TedShadowing.vue src/components/session/StepDictation.vue src/components/session/StepVocabReview.vue src/components/ted/TedTaskStudio.vue src/components/assessment/OwlsExamModal.vue tests/vue3/gamificationTelemetry.test.js
git commit -m "feat(telemetry): wire house points awards and badge unlocks into listening, shadowing, dictation, and exam modules"
```
