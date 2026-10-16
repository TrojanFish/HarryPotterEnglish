# Sprint 6: Hogwarts Audio 3.0 终极全景整合 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the final milestone for Hogwarts Audio 3.0 by delivering: (1) An intelligent SLA recommendation engine (`recommendationEngine.js` & `RecommendationCard.vue`), (2) A 6-character multi-device sync and lossless roaming modal (`syncManager.js` & `CloudSyncModal.vue`), and (3) An advanced TED video player with multi-speed, blind mask, speaker badges, and word-by-word interactive lookup.

**Architecture:** A pure client-side data engine calculates candidate weights from CEFR level, listening minutes, and vocab depth to recommend daily HP chapter + TED talk pairs. A lossless sync manager provides passcode generation, device topology recognition, and LWW union data merging with Cloudflare D1. The TED player is enhanced with native HTML5 speed/fullscreen APIs and interactive tokenized subtitles linked to `WordLookupModal` and `vocabStore`.

**Tech Stack:** Vue 3 Composition API, Pinia (`analyticsStore`, `catalogStore`, `vocabStore`, `gamificationStore`, `navigationStore`), Tailwind CSS, Lucide-vue-next, Node.js Test Runner.

**Spec:** `docs/superpowers/specs/2026-10-16-hogwarts-audio-3.0-final-integration-design.md`

## Global Constraints

- Strictly zero Unicode emojis anywhere in code, templates, strings, comments, or test assertions. Use `lucide-vue-next` icons exclusively.
- Apple HIG ergonomics: `min-h-[44px] min-w-[44px]` with `touch-manipulation` and active micro-interaction feedback on all interactive elements.
- Warm parchment design system (`#fbf9f5` parchment backgrounds, `#e8ddd0` borders, amber/bronze noble accents, shadow-free flat aesthetic).
- Local-first offline persistence via IndexedDB (`HogwartsOfflineDB`) and `localStorage`; zero Cloudflare credentials in client bundles.
- 100% preservation of all existing 391 tests with 0 regressions.

## Review Focus

1. **Cold-start Recommendation Fallback**: When user has no exam or listening history, recommendation engine must return HP1 Chapter 1 and beginner TED talk without NaN or null crashes.
2. **Lossless Multi-Device Merge**: When local and remote data have conflicting states, L4 vocabulary acquisition and highest streak must always be preserved.
3. **TED Subtitle Tokenization Boundary**: Subtitle tokens must strip punctuation safely, handle contractions (`don't`, `it's`), and avoid XSS or broken DOM nodes.
4. **Video Playback Rate State Persistence**: Changing playback rate (e.g. 1.25x) should persist across talk changes within the session without resetting unexpectedly.
5. **Full Keyboard Accessibility**: All modal dialogs and recommendation action cards must support `Esc` dismiss and `Enter`/`Space` activation.

---

### Task 1: `recommendationEngine.js` 智能推荐算法中枢与考纲权重计算

**Files:**
- Create: `src/utils/recommendationEngine.js`
- Create: `tests/vue3/recommendationEngine.test.js`

**Interfaces:**
- Input: `userState` (`cefrLevel`, `totalListeningSeconds`, `shadowingAverage`, `vocabList`, `completedChapters`)
- Output: `{ hpChapter: Object, tedTalk: Object, rationale: String, category: String }`

- [ ] **Step 1: Write the failing test in `tests/vue3/recommendationEngine.test.js`**

```javascript
import { describe, test } from 'node:test'
import assert from 'node:assert'
import { computeNextStepRecommendation } from '../../src/utils/recommendationEngine.js'

describe('recommendationEngine Unit Tests', () => {
  test('returns cold-start recommendation for new user with zero history', () => {
    const rec = computeNextStepRecommendation({
      cefrLevel: 'A2',
      totalListeningSeconds: 0,
      completedChapters: [],
      vocabList: []
    })
    assert.ok(rec, 'Must return recommendation object')
    assert.ok(rec.hpChapter, 'Must recommend an HP chapter')
    assert.ok(rec.tedTalk, 'Must recommend a TED talk')
    assert.strictEqual(rec.hpChapter.bookCode, 'HP1')
    assert.ok(rec.rationale.length > 0, 'Must have transparent rationale')
  })

  test('calculates weighted recommendation based on B1 CEFR and completed chapters', () => {
    const rec = computeNextStepRecommendation({
      cefrLevel: 'B1',
      totalListeningSeconds: 3600,
      completedChapters: ['HP1_ch1', 'HP1_ch2'],
      vocabList: [{ word: 'peculiar', acquisition: { l1: true, l2: true, l3: true, l4: false } }]
    })
    assert.ok(rec.hpChapter.chapterId === 'HP1_ch3' || rec.hpChapter.cefr === 'B1')
    assert.ok(rec.tedTalk.cefr === 'B1' || rec.tedTalk.cefr === 'B2')
    assert.ok(rec.rationale.includes('B1') || rec.rationale.includes('HP1') || rec.rationale.includes('词汇'))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/vue3/recommendationEngine.test.js`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement `src/utils/recommendationEngine.js`**

Implement weighted scoring model ($W_{\text{cefr}} \cdot S_{\text{cefr}} + W_{\text{prog}} \cdot S_{\text{prog}} + W_{\text{vocab}} \cdot S_{\text{vocab}}$), rationale generator, and cold-start fallbacks.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/vue3/recommendationEngine.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/recommendationEngine.js tests/vue3/recommendationEngine.test.js
git commit -m "feat(recommendation): implement SLA weighted next-step recommendation engine with transparent rationale"
```

---

### Task 2: `RecommendationCard.vue` 智能研习推荐卡片组件

**Files:**
- Create: `src/components/home/RecommendationCard.vue`
- Create: `tests/vue3/recommendationCard.test.js`

**Interfaces:**
- Props: none (binds directly to stores via `useRecommendation`)
- Emits: `['open-chapter', 'open-ted']`

- [ ] **Step 1: Write the failing test in `tests/vue3/recommendationCard.test.js`**

```javascript
import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'vue/compiler-sfc'

describe('RecommendationCard.vue Component', () => {
  const filePath = path.resolve('src/components/home/RecommendationCard.vue')

  test('file exists and parses as valid Vue 3 SFC', () => {
    assert.ok(fs.existsSync(filePath), 'Component file must exist')
    const content = fs.readFileSync(filePath, 'utf-8')
    const { errors } = parse(content)
    assert.strictEqual(errors.length, 0)
  })

  test('implements dual recommendation cards, rationale pill, and Apple HIG 44px', () => {
    const content = fs.readFileSync(filePath, 'utf-8')
    assert.ok(content.includes('recommendationEngine') || content.includes('computeNextStepRecommendation'))
    assert.ok(content.includes('min-h-[44px]'), 'Apple HIG 44px touch targets required')
    assert.ok(!/[\u{1F300}-\u{1F9FF}]/u.test(content), 'Zero emojis required')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/vue3/recommendationCard.test.js`
Expected: FAIL

- [ ] **Step 3: Implement `RecommendationCard.vue`**

Implement dual-card grid (HP Chapter + TED talk), CEFR badges, transparent rationale badge, one-click action buttons, and warm parchment styling.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/vue3/recommendationCard.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/home/RecommendationCard.vue tests/vue3/recommendationCard.test.js
git commit -m "feat(recommendation): add RecommendationCard dual-item study suggestion widget with transparent badges"
```

---

### Task 3: `syncManager.js` 多端通行码生成、设备识别与无损合流引擎

**Files:**
- Create: `src/utils/syncManager.js`
- Create: `tests/vue3/syncManager.test.js`

**Interfaces:**
- `generatePasscode()`: returns 6-char formatted code (`HP-XXXX`)
- `detectDevicePlatform()`: returns `{ type: 'mobile'|'tablet'|'desktop', name: string }`
- `mergeUserData(localData, cloudData)`: returns merged state with LWW and union logic

- [ ] **Step 1: Write the failing test in `tests/vue3/syncManager.test.js`**

```javascript
import { describe, test } from 'node:test'
import assert from 'node:assert'
import { generatePasscode, detectDevicePlatform, mergeUserData } from '../../src/utils/syncManager.js'

describe('syncManager Unit Tests', () => {
  test('generates valid 6-character uppercase passcode without ambiguous characters', () => {
    const code = generatePasscode()
    assert.match(code, /^[A-Z0-9]{2,3}-[A-Z0-9]{4}$|^[A-Z0-9]{6}$/)
    assert.ok(!code.includes('0') && !code.includes('O'), 'Must exclude 0/O')
    assert.ok(!code.includes('1') && !code.includes('I'), 'Must exclude 1/I')
  })

  test('detects device platform correctly', () => {
    const dev = detectDevicePlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')
    assert.strictEqual(dev.type, 'mobile')
  })

  test('merges user data with LWW and union preservation', () => {
    const local = {
      streakDays: 5,
      vocabList: [{ word: 'wand', acquisition: { l1: true, l4: true }, updatedAt: 100 }],
      unlockedBadges: { 'first-journey': { unlockedAt: 50 } }
    }
    const remote = {
      streakDays: 7,
      vocabList: [{ word: 'wand', acquisition: { l1: true, l4: false }, updatedAt: 200 }, { word: 'cloak', updatedAt: 150 }],
      unlockedBadges: { 'streak-3': { unlockedAt: 60 } }
    }
    const merged = mergeUserData(local, remote)
    assert.strictEqual(merged.streakDays, 7, 'Streak must preserve maximum')
    assert.strictEqual(merged.vocabList.length, 2, 'Vocab must union')
    const wand = merged.vocabList.find(w => w.word === 'wand')
    assert.strictEqual(wand.acquisition.l4, true, 'L4 acquisition must be preserved')
    assert.ok(merged.unlockedBadges['first-journey'] && merged.unlockedBadges['streak-3'], 'Badges must union')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/vue3/syncManager.test.js`
Expected: FAIL

- [ ] **Step 3: Implement `src/utils/syncManager.js`**

Implement passcode generation, platform sensor, and lossless multi-device merge logic.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/vue3/syncManager.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/syncManager.js tests/vue3/syncManager.test.js
git commit -m "feat(sync): add syncManager with 6-character passcode, platform sensor, and lossless merge algorithm"
```

---

### Task 4: `CloudSyncModal.vue` 多设备漫游拓扑与通行码配对模态框

**Files:**
- Create: `src/components/sync/CloudSyncModal.vue`
- Create: `tests/vue3/cloudSyncModal.test.js`

**Interfaces:**
- Props: `{ isOpen: Boolean }`
- Emits: `['close', 'sync-triggered']`

- [ ] **Step 1: Write the failing test in `tests/vue3/cloudSyncModal.test.js`**

```javascript
import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'vue/compiler-sfc'

describe('CloudSyncModal.vue Component', () => {
  const filePath = path.resolve('src/components/sync/CloudSyncModal.vue')

  test('file exists and parses as valid Vue 3 SFC', () => {
    assert.ok(fs.existsSync(filePath), 'Component file must exist')
    const content = fs.readFileSync(filePath, 'utf-8')
    const { errors } = parse(content)
    assert.strictEqual(errors.length, 0)
  })

  test('implements passcode display, device list, and Apple HIG 44px touch targets', () => {
    const content = fs.readFileSync(filePath, 'utf-8')
    assert.ok(content.includes('generatePasscode') || content.includes('passcode'))
    assert.ok(content.includes('Smartphone') || content.includes('Laptop') || content.includes('Tablet'))
    assert.ok(content.includes('min-h-[44px]'), 'Apple HIG 44px touch target required')
    assert.ok(!/[\u{1F300}-\u{1F9FF}]/u.test(content), 'Zero emojis required')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/vue3/cloudSyncModal.test.js`
Expected: FAIL

- [ ] **Step 3: Implement `src/components/sync/CloudSyncModal.vue`**

Implement 6-character passcode card with 1-click copy, pairing code input, connected devices roster, dual-channel status indicator, and manual sync CTA.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/vue3/cloudSyncModal.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/sync/CloudSyncModal.vue tests/vue3/cloudSyncModal.test.js
git commit -m "feat(sync): add CloudSyncModal with 6-char passcode pairing, device roster, and roaming status"
```

---

### Task 5: `TedVideoPlayer.vue` 高阶播放控制栏与全屏盲听支持

**Files:**
- Modify: `src/components/ted/TedVideoPlayer.vue`
- Create: `tests/vue3/tedAdvancedPlayer.test.js`

**Interfaces:**
- Controls: `[后退5s] [0.75x | 1x | 1.25x | 1.5x] [播放/暂停] [前进5s] [双语/英文/中文/关] [盲听毛玻璃] [全屏]`

- [ ] **Step 1: Write the failing test in `tests/vue3/tedAdvancedPlayer.test.js`**

```javascript
import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('TedVideoPlayer Advanced Controls', () => {
  const filePath = path.resolve('src/components/ted/TedVideoPlayer.vue')

  test('implements 5s seek, playback rate selector, subtitle mode toggle, and fullscreen', () => {
    const content = fs.readFileSync(filePath, 'utf-8')
    assert.ok(content.includes('seekBackward') || content.includes('currentTime -= 5') || content.includes('- 5'))
    assert.ok(content.includes('seekForward') || content.includes('currentTime += 5') || content.includes('+ 5'))
    assert.ok(content.includes('playbackRate') || content.includes('setSpeed') || content.includes('0.75'))
    assert.ok(content.includes('toggleFullscreen') || content.includes('requestFullscreen'))
    assert.ok(!/[\u{1F300}-\u{1F9FF}]/u.test(content), 'Zero emojis required')
    assert.ok(content.includes('min-h-[44px]'), 'Apple HIG 44px required')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/vue3/tedAdvancedPlayer.test.js`
Expected: FAIL

- [ ] **Step 3: Implement advanced controls in `TedVideoPlayer.vue`**

Add -5s/+5s buttons, speed pills (0.75x, 1x, 1.25x, 1.5x), subtitle mode toggle (`bilingual`, `en`, `zh`, `off`), blind mode mask, and fullscreen handler.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/vue3/tedAdvancedPlayer.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ted/TedVideoPlayer.vue tests/vue3/tedAdvancedPlayer.test.js
git commit -m "feat(ted): add advanced playback controls with 5s seek, variable speeds, blind mask, and fullscreen"
```

---

### Task 6: `TedVideoPlayer.vue` 演讲者名牌与字幕词级点词即查生词本闭环

**Files:**
- Modify: `src/components/ted/TedVideoPlayer.vue`
- Create: `tests/vue3/tedSubtitlesLookup.test.js`

**Interfaces:**
- Subtitle tokens: Tokenized text with punctuation stripping, bound to `handleWordClick`
- Speaker metadata: Displays `currentSpeaker` + timestamp

- [ ] **Step 1: Write the failing test in `tests/vue3/tedSubtitlesLookup.test.js`**

```javascript
import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Ted Subtitle Tokenization and Word Lookup', () => {
  const filePath = path.resolve('src/components/ted/TedVideoPlayer.vue')

  test('tokenizes English subtitle cues for interactive word-by-word lookup', () => {
    const content = fs.readFileSync(filePath, 'utf-8')
    assert.ok(content.includes('tokenizeText') || content.includes('handleWordClick') || content.includes('word-token'))
    assert.ok(content.includes('WordLookupModal'), 'Must import and mount WordLookupModal')
    assert.ok(content.includes("source: 'ted'") || content.includes("'ted'"), 'Must tag lookup words as ted source')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/vue3/tedSubtitlesLookup.test.js`
Expected: FAIL

- [ ] **Step 3: Implement subtitle tokenization and lookup wiring in `TedVideoPlayer.vue`**

Tokenize cue sentences, attach click handler opening `WordLookupModal`, and attach speaker name indicator.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/vue3/tedSubtitlesLookup.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ted/TedVideoPlayer.vue tests/vue3/tedSubtitlesLookup.test.js
git commit -m "feat(ted): add speaker subtitle badges and interactive word-by-word vocabulary lookup"
```

---

### Task 7: 三端视图集成与全链路打通

**Files:**
- Modify: `src/components/BookshelfDrawer.vue`
- Modify: `src/components/assessment/AssessmentHub.vue`
- Modify: `src/components/navigation/DesktopSidebarVue.vue`
- Modify: `src/components/navigation/TabletRailVue.vue`
- Modify: `src/components/navigation/MobileTopBarVue.vue`
- Modify: `src/components/layout/AppShell.vue`
- Create: `tests/vue3/sprint6Integration.test.js`

- [ ] **Step 1: Write the failing test in `tests/vue3/sprint6Integration.test.js`**

```javascript
import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Sprint 6 Full Integration Verification', () => {
  test('RecommendationCard is mounted in BookshelfDrawer and AssessmentHub', () => {
    const bookshelf = fs.readFileSync(path.resolve('src/components/BookshelfDrawer.vue'), 'utf-8')
    const assessment = fs.readFileSync(path.resolve('src/components/assessment/AssessmentHub.vue'), 'utf-8')
    assert.ok(bookshelf.includes('RecommendationCard'), 'BookshelfDrawer must include RecommendationCard')
    assert.ok(assessment.includes('RecommendationCard'), 'AssessmentHub must include RecommendationCard')
  })

  test('CloudSyncModal is mounted in AppShell and wired to navigation triggers', () => {
    const shell = fs.readFileSync(path.resolve('src/components/layout/AppShell.vue'), 'utf-8')
    assert.ok(shell.includes('CloudSyncModal'), 'AppShell must mount CloudSyncModal')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/vue3/sprint6Integration.test.js`
Expected: FAIL

- [ ] **Step 3: Integrate components into Bookshelf, AssessmentHub, and AppShell**

Mount `RecommendationCard` in bookshelf and assessment hub. Wire `CloudSyncModal` in `AppShell` with triggers in desktop sidebar, tablet rail, and mobile top bar.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/vue3/sprint6Integration.test.js`
Expected: PASS

- [ ] **Step 5: Run full verification suite**

Run: `npm test && npm run build && npm run check-emojis && npm run verify-security`
Expected: All 391+ tests pass, build clean, 0 emojis, 0 security leaks.

- [ ] **Step 6: Commit**

```bash
git add src/components/BookshelfDrawer.vue src/components/assessment/AssessmentHub.vue src/components/navigation/DesktopSidebarVue.vue src/components/navigation/TabletRailVue.vue src/components/navigation/MobileTopBarVue.vue src/components/layout/AppShell.vue tests/vue3/sprint6Integration.test.js
git commit -m "feat(integration): integrate recommendation card and cloud sync modal across three-device shells"
```
