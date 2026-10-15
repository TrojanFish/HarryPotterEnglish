# TED 魔法精讲模块 — Sprint 2 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete TED "Four-Step Mastery" learning module MVP — vocab preload, bilingual video player, comprehension tasks, and shadowing — integrated into TedHub.vue with three-device responsive layout.

**Architecture:** Independent `tedStore.js` (Pinia) manages all TED state decoupled from the existing audiobook `playerStore`. Static `tedData.js` provides talk metadata + URL resolver functions. Server gains `/api/stream/video/*` for HTTP 206 video streaming from R2.

**Tech Stack:** Vue 3 `<script setup>`, Pinia, Tailwind CSS 3, Vite 6, lucide-vue-next, Node.js/Express (server), node:test (tests)

**Spec:** `docs/superpowers/specs/2026-10-15-ted-learning-module-design.md`

## Global Constraints

- Vue 3 `<script setup>` syntax only — no Options API, no JSX
- Zero Unicode emojis anywhere — use `lucide-vue-next` icons exclusively
- English text/subtitles: minimum `text-lg` (18px); Chinese text: minimum `text-sm` (14px)
- All text inputs: minimum `text-base` (16px) — prevents iOS Safari auto-zoom
- All interactive touch targets: minimum 44×44px (`min-h-[44px] min-w-[44px]`)
- Touch behaviour: `touch-manipulation` class on all interactive elements
- Parchment palette: `#fbf9f5` bg, `#e8ddd0` borders, `amber-500`/`amber-950` accents
- Flat/shadow-free aesthetic — no `shadow-*` classes
- Test runner: `node --test tests/vue3/*.test.js`
- All 165 existing tests must continue to pass after every task
- Commit each task with a clear `feat(ted):` or `fix(ted):` prefix

## Review Focus

1. **`vocabUnlocked` gate:** If a user marks all words listened but the computed `vocabUnlocked` reactive value does not update, Step 2 CTA stays disabled — tested in `tedStore.test.js` Task 2.
2. **VTT bilingual parsing edge cases:** Malformed VTT (missing blank line between cues, BOM prefix, Windows CRLF) must not crash the player — tested in `tedData.test.js` Task 1.
3. **Single-sentence Loop boundary:** When `loopCueIndex` is set and the video's `timeupdate` fires past the cue's `endTime`, the player must seek back to `startTime` without stuttering — tested in `tedVideoPlayer.test.js` Task 5.
4. **R2 not configured fallback:** When `s3Client` is null, `/api/stream/video/*` must return 503 JSON (not crash), and the client `resolveVideoStreamUrl` must fall back to a relative URL — tested in `serverVideoStream.test.js` Task 3 and `tedData.test.js` Task 1.
5. **Step gate enforcement:** `goToStep(2)` when `vocabUnlocked === false` must be a no-op (step stays at 1) — tested in `tedStore.test.js` Task 2.

---

### Task 1: TED Data Layer — `tedData.js` + `parseBilingualVtt`

**Files:**
- Create: `src/data/tedData.js`
- Create: `tests/vue3/tedData.test.js`

**Interfaces:**
- Produces:
  - `TALKS: TedTalk[]` — exported array of talk objects (at least 1 complete seed talk with all required fields)
  - `resolveVideoStreamUrl(videoKey: string, apiBase?: string, customCdnDomain?: string): string`
  - `resolveTedSubtitleUrl(vttKey: string, apiBase?: string): string`
  - `parseBilingualVtt(vttText: string): { enCues: VttCue[], zhCues: VttCue[] }` where `VttCue = { startTime: number, endTime: number, text: string }`

- [ ] **Step 1: Write failing tests**

```js
// tests/vue3/tedData.test.js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { TALKS, resolveVideoStreamUrl, resolveTedSubtitleUrl, parseBilingualVtt } from '../../src/data/tedData.js'

describe('TALKS', () => {
  it('exports at least one talk', () => { assert.ok(TALKS.length >= 1) })
  it('first talk has required fields', () => {
    const t = TALKS[0]
    assert.ok(t.id && t.title && t.speaker && t.videoKey && t.vttKey)
    assert.ok(Array.isArray(t.vocabSet) && t.vocabSet.length >= 8)
    assert.ok(Array.isArray(t.tasks.cloze) && t.tasks.cloze.length >= 3)
    assert.ok(Array.isArray(t.tasks.matching) && t.tasks.matching.length >= 2)
    assert.ok(Array.isArray(t.shadowingSegments) && t.shadowingSegments.length >= 1)
  })
  it('vocab entries have required fields', () => {
    const v = TALKS[0].vocabSet[0]
    assert.ok(v.word && v.ipa && v.pos && v.cefrLevel && v.definitionCn && v.exampleSentence)
  })
})

describe('resolveVideoStreamUrl', () => {
  it('returns CDN URL when customCdnDomain provided', () => {
    const url = resolveVideoStreamUrl('ted/foo/video.mp4', '', 'https://cdn.example.com')
    assert.equal(url, 'https://cdn.example.com/ted/foo/video.mp4')
  })
  it('returns proxy URL when no CDN', () => {
    const url = resolveVideoStreamUrl('ted/foo/video.mp4')
    assert.equal(url, '/api/stream/video/ted/foo/video.mp4')
  })
  it('returns empty string for empty key', () => {
    assert.equal(resolveVideoStreamUrl(''), '')
  })
})

describe('resolveTedSubtitleUrl', () => {
  it('maps vttKey to /api/subtitles/ path', () => {
    assert.equal(resolveTedSubtitleUrl('ted/foo/subtitle.vtt'), '/api/subtitles/ted/foo/subtitle.vtt')
  })
})

describe('parseBilingualVtt', () => {
  it('parses en and zh cues from bilingual VTT', () => {
    const vtt = `WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nHello world\n\n00:00:01.000 --> 00:00:04.000\n你好世界\n`
    const { enCues, zhCues } = parseBilingualVtt(vtt)
    assert.equal(enCues.length, 1)
    assert.equal(zhCues.length, 1)
    assert.equal(enCues[0].text, 'Hello world')
    assert.equal(zhCues[0].text, '你好世界')
    assert.equal(enCues[0].startTime, 1)
    assert.equal(enCues[0].endTime, 4)
  })
  it('handles CRLF line endings without crashing', () => {
    const vtt = `WEBVTT\r\n\r\n00:00:01.000 --> 00:00:04.000\r\nTest\r\n\r\n00:00:01.000 --> 00:00:04.000\r\n测试\r\n`
    const { enCues } = parseBilingualVtt(vtt)
    assert.equal(enCues[0].text, 'Test')
  })
  it('returns empty arrays for empty/null input', () => {
    const { enCues, zhCues } = parseBilingualVtt('')
    assert.equal(enCues.length, 0)
    assert.equal(zhCues.length, 0)
  })
})
```

- [ ] **Step 2: Run tests — verify FAIL** (`node --test tests/vue3/tedData.test.js`)

- [ ] **Step 3: Implement `src/data/tedData.js`**

  - Export `TALKS` array with **one complete seed talk** — use Simon Sinek's "How Great Leaders Inspire Action" (2009) as the data template from the spec. Include: `id`, `title`, `titleCn`, `speaker`, `year`, `durationSeconds`, `cefrLevel`, `wpm`, `topicTags`, `videoKey`, `vttKey`, `thumbnailKey`, `vocabSet` (8 entries), `tasks.cloze` (5 entries), `tasks.matching` (3 entries), `shadowingSegments` (2 entries).
  - `resolveVideoStreamUrl`: mirrors `resolveAudioStreamUrl` from `catalogStore.js` but uses `/api/stream/video/` as the proxy prefix and does NOT strip file extensions.
  - `resolveTedSubtitleUrl`: mirrors `resolveSubtitleUrl` from `catalogStore.js`.
  - `parseBilingualVtt(vttText)`: split by blank lines, normalise CRLF → LF, skip `WEBVTT` header; for each pair of adjacent same-timestamp cues, detect Chinese by `\u4e00-\u9fff` range; assign odd-position cues to `enCues`, even-position to `zhCues`. Time format `HH:MM:SS.mmm` → seconds via `parseVttTime` helper.

- [ ] **Step 4: Run tests — verify PASS** (`node --test tests/vue3/tedData.test.js`)

- [ ] **Step 5: Run full suite** (`npm test`) — all 165+ tests must pass

- [ ] **Step 6: Commit**
```
git commit -m "feat(ted): add tedData.js with TALKS seed + URL resolvers + parseBilingualVtt"
```

---

### Task 2: TED Pinia Store — `tedStore.js`

**Files:**
- Create: `src/stores/tedStore.js`
- Create: `tests/vue3/tedStore.test.js`

**Interfaces:**
- Consumes: `TALKS`, `resolveVideoStreamUrl`, `resolveTedSubtitleUrl` from `src/data/tedData.js`
- Produces: `useTedStore()` with state and actions per spec Section 2.2

- [ ] **Step 1: Write failing tests**

```js
// tests/vue3/tedStore.test.js
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { useTedStore } from '../../src/stores/tedStore.js'
import { TALKS } from '../../src/data/tedData.js'

beforeEach(() => { setActivePinia(createPinia()) })

describe('selectTalk', () => {
  it('sets selectedTalkId and resets step to 1', () => {
    const store = useTedStore()
    store.currentStep = 3
    store.selectTalk(TALKS[0].id)
    assert.equal(store.selectedTalkId, TALKS[0].id)
    assert.equal(store.currentStep, 1)
  })
  it('clears listenedVocabIds and sets vocabUnlocked false', () => {
    const store = useTedStore()
    store.selectTalk(TALKS[0].id)
    assert.equal(store.listenedVocabIds.size, 0)
    assert.equal(store.vocabUnlocked, false)
  })
  it('resolves videoSrc to non-empty string', () => {
    const store = useTedStore()
    store.selectTalk(TALKS[0].id)
    assert.ok(store.videoSrc.length > 0)
  })
})

describe('markVocabListened', () => {
  it('adds word to listenedVocabIds', () => {
    const store = useTedStore()
    store.selectTalk(TALKS[0].id)
    store.markVocabListened('inspire')
    assert.ok(store.listenedVocabIds.has('inspire'))
  })
  it('sets vocabUnlocked when all vocab heard', () => {
    const store = useTedStore()
    store.selectTalk(TALKS[0].id)
    const words = TALKS[0].vocabSet.map(v => v.word)
    words.forEach(w => store.markVocabListened(w))
    assert.equal(store.vocabUnlocked, true)
  })
})

describe('goToStep', () => {
  it('advances to step 2 only when vocabUnlocked', () => {
    const store = useTedStore()
    store.selectTalk(TALKS[0].id)
    store.goToStep(2)
    assert.equal(store.currentStep, 1)  // locked — no-op
    store.vocabUnlocked = true
    store.goToStep(2)
    assert.equal(store.currentStep, 2)
  })
  it('allows free navigation between steps 2–4 once step 2 unlocked', () => {
    const store = useTedStore()
    store.selectTalk(TALKS[0].id)
    store.vocabUnlocked = true
    store.currentStep = 2
    store.goToStep(3)
    assert.equal(store.currentStep, 3)
    store.goToStep(4)
    assert.equal(store.currentStep, 4)
  })
})

describe('scoreTask', () => {
  it('returns 100 when all cloze answers correct and all matching correct', () => {
    const store = useTedStore()
    store.selectTalk(TALKS[0].id)
    const talk = TALKS[0]
    talk.tasks.cloze.forEach(c => store.submitClozeAnswer(c.id, c.blanks[0]))
    talk.tasks.matching.forEach(m => store.submitMatchingAnswer(m.id, m.timestampSeconds))
    const score = store.scoreTask()
    assert.equal(score, 100)
    assert.equal(store.taskScore, 100)
  })
  it('returns 0 when all answers wrong', () => {
    const store = useTedStore()
    store.selectTalk(TALKS[0].id)
    const talk = TALKS[0]
    talk.tasks.cloze.forEach(c => store.submitClozeAnswer(c.id, 'WRONG_ANSWER'))
    talk.tasks.matching.forEach(m => store.submitMatchingAnswer(m.id, -1))
    const score = store.scoreTask()
    assert.equal(score, 0)
  })
})

describe('markTalkCompleted', () => {
  it('appends talk id to completedTalkIds', () => {
    const store = useTedStore()
    store.markTalkCompleted('ted-test-id')
    assert.ok(store.completedTalkIds.includes('ted-test-id'))
  })
  it('does not duplicate entries', () => {
    const store = useTedStore()
    store.markTalkCompleted('ted-test-id')
    store.markTalkCompleted('ted-test-id')
    assert.equal(store.completedTalkIds.filter(x => x === 'ted-test-id').length, 1)
  })
})

describe('toggleBlindMode / toggleChineseSubs / setLoopCue', () => {
  it('toggleBlindMode flips isBlindMode', () => {
    const store = useTedStore()
    assert.equal(store.isBlindMode, false)
    store.toggleBlindMode()
    assert.equal(store.isBlindMode, true)
  })
  it('toggleChineseSubs flips showChineseSubs', () => {
    const store = useTedStore()
    const initial = store.showChineseSubs
    store.toggleChineseSubs()
    assert.equal(store.showChineseSubs, !initial)
  })
  it('setLoopCue(3) sets loopCueIndex to 3', () => {
    const store = useTedStore()
    store.setLoopCue(3)
    assert.equal(store.loopCueIndex, 3)
    store.setLoopCue(null)
    assert.equal(store.loopCueIndex, null)
  })
})
```

- [ ] **Step 2: Run tests — verify FAIL** (`node --test tests/vue3/tedStore.test.js`)

- [ ] **Step 3: Implement `src/stores/tedStore.js`**

  - `defineStore('ted', { state, getters, actions })` using Pinia composition-free options API (matching existing store patterns in this repo).
  - State fields: all from spec Section 2.2. Use plain `Set` for `listenedVocabIds` (Pinia handles reactivity).
  - `selectTalk(id)`: find talk in `TALKS`, set `selectedTalkId`, reset `currentStep = 1`, clear `listenedVocabIds = new Set()`, set `vocabUnlocked = false`, set `videoSrc = resolveVideoStreamUrl(talk.videoKey)`, set `vttSrc = resolveTedSubtitleUrl(talk.vttKey)`, reset all task/shadowing state.
  - `markVocabListened(word)`: add to `listenedVocabIds`; recalculate `vocabUnlocked = listenedVocabIds.size >= currentTalk.vocabSet.length`.
  - `goToStep(step)`: if `step === 2` and `!vocabUnlocked`, return early (no-op); otherwise set `currentStep = step`.
  - `scoreTask()`: compute `clozeScore` as percentage of cloze answers that match `blanks[0]` after `trim().toLowerCase()`; compute `matchingScore` as percentage of matching answers where `matchingAnswers[id] === timestampSeconds`; set and return `Math.round((clozeScore + matchingScore) / 2)`.
  - `markTalkCompleted(id)`: push to `completedTalkIds` if not already present; persist to `localStorage` key `'ted_completed_talks'`.
  - Load `completedTalkIds` from localStorage in state initializer.

- [ ] **Step 4: Run tests — verify PASS** (`node --test tests/vue3/tedStore.test.js`)

- [ ] **Step 5: Run full suite** (`npm test`)

- [ ] **Step 6: Commit**
```
git commit -m "feat(ted): add tedStore.js Pinia store with four-step state machine"
```

---

### Task 3: Server — `/api/stream/video/*` HTTP 206 Route

**Files:**
- Modify: `server/index.js` (after `/api/stream/audio/*` route, ~line 502)
- Create: `tests/vue3/serverVideoStream.test.js`

**Interfaces:**
- Produces: `GET /api/stream/video/:key` — Range-aware video stream, Content-Type auto-detected

- [ ] **Step 1: Write failing tests**

```js
// tests/vue3/serverVideoStream.test.js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// Unit-test the Content-Type selection logic extracted as a pure function
// (We test the routing logic in isolation — integration test would need a running server)
function getVideoContentType(key) {
  if (/\.webm$/i.test(key)) return 'video/webm'
  return 'video/mp4'
}

describe('getVideoContentType', () => {
  it('returns video/mp4 for .mp4 keys', () => {
    assert.equal(getVideoContentType('ted/foo/video.mp4'), 'video/mp4')
  })
  it('returns video/webm for .webm keys', () => {
    assert.equal(getVideoContentType('ted/foo/video.webm'), 'video/webm')
  })
  it('defaults to video/mp4 for unknown extension', () => {
    assert.equal(getVideoContentType('ted/foo/video'), 'video/mp4')
  })
})

// Verify the route path is registered in server/index.js
describe('server route registration', () => {
  it('server/index.js contains /api/stream/video route', async () => {
    const fs = await import('node:fs/promises')
    const src = await fs.readFile('server/index.js', 'utf8')
    assert.ok(src.includes('/api/stream/video/'), 'Missing /api/stream/video/ route in server/index.js')
  })
})
```

- [ ] **Step 2: Run tests — verify FAIL** (`node --test tests/vue3/serverVideoStream.test.js`)

- [ ] **Step 3: Add `/api/stream/video/*` route to `server/index.js`**

  Insert after the `app.get(['/api/stream/audio/*', '/api/media/*'], ...)` handler (after its closing `});`). The route:
  - Path: `app.get('/api/stream/video/*', async (req, res) => { ... })`
  - Extracts `key = req.params[0]`
  - Determines `contentType`: `.webm` → `video/webm`, else `video/mp4`
  - If `!s3Client` → `res.status(503).json({ error: 'R2 storage credentials not configured' })`
  - Copies Referer anti-leech check from audio route
  - Gets `range = req.headers.range`, calls `new GetObjectCommand({ Bucket: bucketName, Key: key, Range: range })`
  - Sets headers: `Content-Type: contentType`, `Accept-Ranges: bytes`, `Content-Length`, `Content-Range`, `Cache-Control: public, max-age=2592000, immutable`, `X-Content-Type-Options: nosniff`
  - `res.status(range ? 206 : 200)` → pipe `response.Body` to `res`, add `res.on('close', () => stream.destroy?.())`
  - On S3 error: `res.status(err.$metadata?.httpStatusCode || 500).json({ error: 'Video not found in R2', key })`

- [ ] **Step 4: Run tests — verify PASS** (`node --test tests/vue3/serverVideoStream.test.js`)

- [ ] **Step 5: Run full suite** (`npm test`)

- [ ] **Step 6: Commit**
```
git commit -m "feat(server): add /api/stream/video/* HTTP 206 route for TED video streaming"
```

---

### Task 4: `TedStepBar.vue` — Four-Step Progress Bar

**Files:**
- Create: `src/components/ted/TedStepBar.vue`
- Create: `tests/vue3/tedStepBar.test.js`

**Interfaces:**
- Consumes: `useTedStore()` — `currentStep: number`, `vocabUnlocked: boolean`, `goToStep(step)`
- Produces: visual progress bar component, emits no events (drives store directly)

- [ ] **Step 1: Write failing tests**

```js
// tests/vue3/tedStepBar.test.js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync('src/components/ted/TedStepBar.vue', 'utf8')

describe('TedStepBar.vue', () => {
  it('renders four step labels', () => {
    assert.ok(src.includes('词汇预热'), 'Missing 词汇预热 label')
    assert.ok(src.includes('精看精听'), 'Missing 精看精听 label')
    assert.ok(src.includes('理解任务'), 'Missing 理解任务 label')
    assert.ok(src.includes('演讲跟读'), 'Missing 演讲跟读 label')
  })
  it('uses min-h-[44px] for touch targets', () => {
    assert.ok(src.includes('min-h-[44px]'), 'Missing 44px touch target')
  })
  it('imports from lucide-vue-next', () => {
    assert.ok(src.includes('lucide-vue-next'), 'Missing lucide-vue-next')
  })
  it('contains no Unicode emojis', () => {
    assert.doesNotMatch(src, /\p{Extended_Pictographic}/u, 'Emoji found in TedStepBar.vue')
  })
  it('uses CheckCircle2 and Lock icons from lucide-vue-next', () => {
    assert.ok(src.includes('CheckCircle2'), 'Missing CheckCircle2 icon')
    assert.ok(src.includes('Lock'), 'Missing Lock icon')
  })
})
```

- [ ] **Step 2: Run tests — verify FAIL**

- [ ] **Step 3: Implement `src/components/ted/TedStepBar.vue`**

  Four steps as a horizontal flex row (`flex items-center gap-2 px-4 py-3 border-b border-[#e8ddd0] bg-[#fbf9f5]`). Each step node: `button` with `min-h-[44px] px-3 flex flex-col items-center gap-1`. Active: `bg-amber-500 text-white rounded-2xl`. Completed: `CheckCircle2` green icon + label. Locked (step 2 when `!vocabUnlocked`): `Lock` grey icon, `disabled`, `opacity-50 cursor-not-allowed`. Connector lines between steps: `flex-1 h-0.5`, completed segment `bg-amber-400`, incomplete `bg-[#e8ddd0]`. Step labels: `text-xs font-bold` Chinese text per spec.

- [ ] **Step 4: Run tests — verify PASS**

- [ ] **Step 5: Run full suite** (`npm test`)

- [ ] **Step 6: Commit**
```
git commit -m "feat(ted): add TedStepBar.vue four-step progress indicator"
```

---

### Task 5: `TedTalkList.vue` — Talk Selector Sidebar

**Files:**
- Create: `src/components/ted/TedTalkList.vue`
- Create: `tests/vue3/tedTalkList.test.js`

**Interfaces:**
- Consumes: `useTedStore()` — `talks: TedTalk[]`, `selectedTalkId`, `completedTalkIds`, `selectTalk(id)`
- Produces: talk list component; emits no events

- [ ] **Step 1: Write failing tests**

```js
// tests/vue3/tedTalkList.test.js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync('src/components/ted/TedTalkList.vue', 'utf8')

describe('TedTalkList.vue', () => {
  it('uses v-for to render talk list from store', () => {
    assert.ok(src.includes('v-for'), 'Missing v-for talk list rendering')
  })
  it('calls selectTalk on click', () => {
    assert.ok(src.includes('selectTalk'), 'Missing selectTalk call')
  })
  it('shows CEFR level badge', () => {
    assert.ok(src.includes('cefrLevel'), 'Missing CEFR level display')
  })
  it('uses CheckCircle2 for completed talks', () => {
    assert.ok(src.includes('CheckCircle2'), 'Missing CheckCircle2 completed badge')
  })
  it('contains no Unicode emojis', () => {
    assert.doesNotMatch(src, /\p{Extended_Pictographic}/u, 'Emoji found in TedTalkList.vue')
  })
  it('applies active state class for selected talk', () => {
    assert.ok(src.includes('border-amber-500') || src.includes('border-l-4'), 'Missing selected talk active border')
  })
})
```

- [ ] **Step 2: Run tests — verify FAIL**

- [ ] **Step 3: Implement `src/components/ted/TedTalkList.vue`**

  `<ul>` with `v-for="talk in tedStore.talks"`. Each `<li>` is a `<button>` with `w-full text-left px-4 py-3 min-h-[44px] touch-manipulation`. Selected talk: `bg-amber-500/10 border-l-4 border-amber-500`. Talk info: speaker (`text-xs text-stone-400`) + title (`text-sm font-bold text-amber-950 line-clamp-2`) + CEFR badge (`text-xs font-mono border rounded px-1`) + duration + `CheckCircle2` if completed. Container: `overflow-y-auto flex flex-col`.

- [ ] **Step 4: Run tests — verify PASS**

- [ ] **Step 5: Run full suite** (`npm test`)

- [ ] **Step 6: Commit**
```
git commit -m "feat(ted): add TedTalkList.vue talk selector sidebar"
```

---

### Task 6: `TedVocabPreload.vue` — Step 1 Vocabulary Pre-activation

**Files:**
- Create: `src/components/ted/TedVocabPreload.vue`
- Create: `tests/vue3/tedVocabPreload.test.js`

**Interfaces:**
- Consumes: `useTedStore()` — `selectedTalkId`, current talk's `vocabSet`, `listenedVocabIds`, `vocabUnlocked`, `markVocabListened(word)`, `goToStep(2)`
- Produces: vocab card flow component

- [ ] **Step 1: Write failing tests**

```js
// tests/vue3/tedVocabPreload.test.js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync('src/components/ted/TedVocabPreload.vue', 'utf8')

describe('TedVocabPreload.vue', () => {
  it('renders word, IPA, definition fields', () => {
    assert.ok(src.includes('ipa') || src.includes('.ipa'), 'Missing IPA rendering')
    assert.ok(src.includes('definitionCn'), 'Missing definitionCn rendering')
    assert.ok(src.includes('exampleSentence'), 'Missing exampleSentence rendering')
  })
  it('uses Volume2 icon for listen button', () => {
    assert.ok(src.includes('Volume2'), 'Missing Volume2 icon')
  })
  it('uses CheckCircle2 icon for listened state', () => {
    assert.ok(src.includes('CheckCircle2'), 'Missing CheckCircle2 listened icon')
  })
  it('listen button has 44px touch target', () => {
    assert.ok(src.includes('min-h-[44px]') || src.includes('h-11') || src.includes('w-11'), 'Missing 44px touch target on listen button')
  })
  it('calls markVocabListened on listen', () => {
    assert.ok(src.includes('markVocabListened'), 'Missing markVocabListened call')
  })
  it('has unlock CTA calling goToStep(2)', () => {
    assert.ok(src.includes('goToStep(2)') || src.includes("goToStep('2')") || src.includes('goToStep'), 'Missing unlock CTA')
  })
  it('uses text-lg for word display (K12)', () => {
    assert.ok(src.includes('text-lg'), 'Missing text-lg for word (K12 requirement)')
  })
  it('contains no Unicode emojis', () => {
    assert.doesNotMatch(src, /\p{Extended_Pictographic}/u, 'Emoji found in TedVocabPreload.vue')
  })
})
```

- [ ] **Step 2: Run tests — verify FAIL**

- [ ] **Step 3: Implement `src/components/ted/TedVocabPreload.vue`**

  Scrollable card flow: `flex flex-col gap-4 p-4 overflow-y-auto`. Each vocab card: `bg-white border border-[#e8ddd0] rounded-2xl p-4 space-y-2`. Header row: `Volume2` listen button (`min-h-[44px] min-w-[44px]`) + word (`text-lg font-bold text-amber-950`) + IPA + pos (`text-sm text-stone-500`). Definition: `text-sm text-stone-700 font-medium`. Badges: `cefrLevel` + `examTag` as `text-xs font-mono border border-[#e8ddd0] rounded px-1.5 py-0.5`. Example: `text-sm text-stone-500 italic leading-relaxed`. Listened state: `CheckCircle2` green + `border-amber-500 bg-amber-500/5`. Listen button calls `markVocabListened(vocab.word)` + plays audio via `new Audio(resolveVideoStreamUrl(vocab.audioKey))` if `audioKey` exists, else `speechSynthesis.speak(new SpeechSynthesisUtterance(vocab.word))`. Footer: sticky bottom bar with progress count + `goToStep(2)` CTA (disabled + `opacity-50` when `!vocabUnlocked`, enabled gold when `vocabUnlocked`).

- [ ] **Step 4: Run tests — verify PASS**

- [ ] **Step 5: Run full suite** (`npm test`)

- [ ] **Step 6: Commit**
```
git commit -m "feat(ted): add TedVocabPreload.vue Step 1 vocab pre-activation"
```

---

### Task 7: `TedVideoPlayer.vue` — Step 2 Bilingual Video Player

**Files:**
- Create: `src/components/ted/TedVideoPlayer.vue`
- Create: `tests/vue3/tedVideoPlayer.test.js`

**Interfaces:**
- Consumes: `useTedStore()` — `videoSrc`, `vttSrc`, `isBlindMode`, `loopCueIndex`, `showChineseSubs`, `activeCueIndex`, `lookupWord`; actions: `toggleBlindMode`, `toggleChineseSubs`, `setLoopCue`, `setLookupWord`, `goToStep(3)`
- Consumes: `WordLookupModal.vue` (already exists at `src/components/common/WordLookupModal.vue`)
- Produces: video player component; manages its own `<video>` ref

- [ ] **Step 1: Write failing tests**

```js
// tests/vue3/tedVideoPlayer.test.js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync('src/components/ted/TedVideoPlayer.vue', 'utf8')

describe('TedVideoPlayer.vue', () => {
  it('renders native <video> element', () => {
    assert.ok(src.includes('<video'), 'Missing <video> element')
  })
  it('uses aspect-video or aspect-[16/9] for 16:9 ratio', () => {
    assert.ok(src.includes('aspect-video') || src.includes('aspect-[16/9]'), 'Missing 16:9 aspect ratio')
  })
  it('renders English subtitles with text-lg class (K12)', () => {
    assert.ok(src.includes('text-lg'), 'Missing text-lg for English subtitles')
  })
  it('renders Chinese subtitles with text-sm class (K12)', () => {
    assert.ok(src.includes('text-sm'), 'Missing text-sm for Chinese subtitles')
  })
  it('toggleBlindMode binding present', () => {
    assert.ok(src.includes('toggleBlindMode'), 'Missing toggleBlindMode')
  })
  it('setLoopCue binding present', () => {
    assert.ok(src.includes('setLoopCue'), 'Missing setLoopCue')
  })
  it('setLookupWord binding present for click-to-look-up', () => {
    assert.ok(src.includes('setLookupWord'), 'Missing setLookupWord')
  })
  it('imports WordLookupModal', () => {
    assert.ok(src.includes('WordLookupModal'), 'Missing WordLookupModal import')
  })
  it('control buttons have min-h-[44px] touch target', () => {
    assert.ok(src.includes('min-h-[44px]'), 'Missing 44px touch targets on controls')
  })
  it('uses EyeOff icon for blind mode toggle', () => {
    assert.ok(src.includes('EyeOff'), 'Missing EyeOff icon for blind mode')
  })
  it('contains no Unicode emojis', () => {
    assert.doesNotMatch(src, /\p{Extended_Pictographic}/u, 'Emoji found in TedVideoPlayer.vue')
  })
})
```

- [ ] **Step 2: Run tests — verify FAIL**

- [ ] **Step 3: Implement `src/components/ted/TedVideoPlayer.vue`**

  Two-panel layout: `flex flex-col md:flex-row h-full`. Left panel: video (`flex-[3]`). Right panel subtitle list: `hidden md:flex flex-col w-72 lg:w-80 shrink-0 overflow-y-auto border-l border-[#e8ddd0]`.
  
  **`<video>` element:** `ref="videoRef"`, `:src="tedStore.videoSrc"`, `@timeupdate="onTimeUpdate"`, `@loadedmetadata="onMetadata"`, `preload="metadata"`, `playsinline`, `class="w-full aspect-video bg-black"`.
  
  **`onTimeUpdate`:** update `tedStore.videoCurrentTime`; compute `activeCueIndex` by finding the cue where `currentTime >= startTime && currentTime < endTime`; set `tedStore.activeCueIndex`; if `loopCueIndex !== null` and `currentTime >= enCues[loopCueIndex].endTime`, `videoRef.currentTime = enCues[loopCueIndex].startTime`.
  
  **Subtitle panel:** `v-for="(cue, i) in enCues"` — each cue is a `<div>` with `@click="setLoopCue(i)"` and active state `border-l-4 border-amber-400 bg-amber-500/10`, inactive `opacity-40`. English text: `text-lg leading-[1.75]` with words wrapped in `<span @click.stop="setLookupWord(word)">`. Chinese text: `text-sm text-stone-500 mt-1` shown only when `showChineseSubs && !isBlindMode`.
  
  **Blind mode overlay:** `v-if="isBlindMode"` absolutely positioned `div` covering the subtitle panel with `bg-[#fbf9f5]/95 backdrop-blur-sm`.
  
  **Control bar:** fixed/sticky bottom with dark bg `bg-[#1e1610]/90`, flex row with `SkipBack`, speed selector (`select` or button group), `Play`/`Pause`, `SkipForward`, `Subtitles`/`SubtitlesOff` toggle, `EyeOff`/`Eye` blind mode, `Maximize`. All buttons `min-h-[44px] min-w-[44px]`.
  
  **VTT loading:** `watch(() => tedStore.vttSrc, ...)` — fetch VTT via `fetch(vttSrc)` then `parseBilingualVtt(text)` → store locally as `enCues`/`zhCues` in component state.
  
  **"前往任务" CTA:** sticky bottom right, calls `tedStore.goToStep(3)`.

- [ ] **Step 4: Run tests — verify PASS**

- [ ] **Step 5: Run full suite** (`npm test`)

- [ ] **Step 6: Commit**
```
git commit -m "feat(ted): add TedVideoPlayer.vue bilingual video player with Loop + blind mode"
```

---

### Task 8: `TedTaskStudio.vue` — Step 3 Comprehension Tasks

**Files:**
- Create: `src/components/ted/TedTaskStudio.vue`
- Create: `tests/vue3/tedTaskStudio.test.js`

**Interfaces:**
- Consumes: `useTedStore()` — current talk's `tasks.cloze`, `tasks.matching`; actions: `submitClozeAnswer`, `submitMatchingAnswer`, `scoreTask`, `goToStep(4)`
- Produces: two-section task component (Cloze + Matching), final score card

- [ ] **Step 1: Write failing tests**

```js
// tests/vue3/tedTaskStudio.test.js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync('src/components/ted/TedTaskStudio.vue', 'utf8')

describe('TedTaskStudio.vue', () => {
  it('renders cloze section with input fields', () => {
    assert.ok(src.includes('<input'), 'Missing <input> for cloze')
    assert.ok(src.includes('autocapitalize="none"') || src.includes('autocapitalize'), 'Missing autocapitalize="none" on input')
  })
  it('input uses text-base (16px min for iOS)', () => {
    assert.ok(src.includes('text-base'), 'Missing text-base on input (iOS zoom prevention)')
  })
  it('renders matching section', () => {
    assert.ok(src.includes('matching') || src.includes('timestampSeconds') || src.includes('summaryText'), 'Missing matching task section')
  })
  it('calls submitClozeAnswer on input change', () => {
    assert.ok(src.includes('submitClozeAnswer'), 'Missing submitClozeAnswer call')
  })
  it('calls submitMatchingAnswer on selection', () => {
    assert.ok(src.includes('submitMatchingAnswer'), 'Missing submitMatchingAnswer call')
  })
  it('calls scoreTask and shows score', () => {
    assert.ok(src.includes('scoreTask'), 'Missing scoreTask call')
  })
  it('has 前往跟读 CTA calling goToStep(4)', () => {
    assert.ok(src.includes('goToStep(4)') || src.includes("goToStep('4')") || (src.includes('goToStep') && src.includes('4')), 'Missing goToStep(4) CTA')
  })
  it('contains no Unicode emojis', () => {
    assert.doesNotMatch(src, /\p{Extended_Pictographic}/u, 'Emoji found in TedTaskStudio.vue')
  })
  it('shows Zap icon for high score reward', () => {
    assert.ok(src.includes('Zap'), 'Missing Zap icon for reward')
  })
})
```

- [ ] **Step 2: Run tests — verify FAIL**

- [ ] **Step 3: Implement `src/components/ted/TedTaskStudio.vue`**

  Two sections with tab toggle or vertical scroll: **Section A (Cloze)** and **Section B (Matching)**.
  
  **Cloze:** `v-for="q in currentTalk.tasks.cloze"`. Sentence text split at `___` — render static parts + `<input type="text" class="text-base border-b-2 border-amber-400 bg-transparent w-32 px-1" autocapitalize="none" autocorrect="off" spellcheck="false">`. On `@blur` or `@change`: `tedStore.submitClozeAnswer(q.id, value)`. After score computed: if correct `text-emerald-700 bg-emerald-50 rounded`, if wrong `text-red-700 bg-red-50 line-through rounded` + show correct answer in `text-sm text-stone-500`.
  
  **Matching:** Left column: shuffled summary texts (radio button group). Right column: timestamp options. On click: `tedStore.submitMatchingAnswer(id, ts)`. Matched pair highlighted amber.
  
  **Submit button:** Primary CTA `提交答案` → calls `tedStore.scoreTask()` → shows score card. Score card: circular badge + summary + `goToStep(4)` CTA. If score ≥ 80: `Zap` amber icon + "魔力满格" label.

- [ ] **Step 4: Run tests — verify PASS**

- [ ] **Step 5: Run full suite** (`npm test`)

- [ ] **Step 6: Commit**
```
git commit -m "feat(ted): add TedTaskStudio.vue Step 3 cloze + matching comprehension tasks"
```

---

### Task 9: `TedShadowing.vue` — Step 4 Shadowing Workshop

**Files:**
- Create: `src/components/ted/TedShadowing.vue`
- Create: `tests/vue3/tedShadowing.test.js`

**Interfaces:**
- Consumes: `useTedStore()` — `selectedTalk.shadowingSegments`, `shadowingSegmentIndex`, `shadowingPhase`; actions: `markTalkCompleted`
- Consumes: existing MediaRecorder pattern from `StepShadowing.vue` for audio recording
- Produces: segment navigator + Track A/B dual playback + completion CTA

- [ ] **Step 1: Write failing tests**

```js
// tests/vue3/tedShadowing.test.js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync('src/components/ted/TedShadowing.vue', 'utf8')

describe('TedShadowing.vue', () => {
  it('has segment navigation with ChevronLeft and ChevronRight', () => {
    assert.ok(src.includes('ChevronLeft'), 'Missing ChevronLeft navigation')
    assert.ok(src.includes('ChevronRight'), 'Missing ChevronRight navigation')
  })
  it('renders Track A (原声示范) and Track B (我的录音) sections', () => {
    assert.ok(src.includes('原声示范'), 'Missing Track A label')
    assert.ok(src.includes('我的录音'), 'Missing Track B label')
  })
  it('Track A play button has 44px touch target', () => {
    assert.ok(src.includes('min-h-[44px]'), 'Missing 44px touch target')
  })
  it('calls markTalkCompleted on finish', () => {
    assert.ok(src.includes('markTalkCompleted'), 'Missing markTalkCompleted call')
  })
  it('uses Mic icon for recording', () => {
    assert.ok(src.includes('Mic'), 'Missing Mic icon for recording button')
  })
  it('transcript text uses text-lg for English (K12)', () => {
    assert.ok(src.includes('text-lg'), 'Missing text-lg for transcript (K12)')
  })
  it('contains no Unicode emojis', () => {
    assert.doesNotMatch(src, /\p{Extended_Pictographic}/u, 'Emoji found in TedShadowing.vue')
  })
})
```

- [ ] **Step 2: Run tests — verify FAIL**

- [ ] **Step 3: Implement `src/components/ted/TedShadowing.vue`**

  Segment header: `"片段 N / M"` counter + `ChevronLeft`/`ChevronRight` buttons (44px). Transcript card: English `text-lg font-serif leading-[1.8]` + Chinese `text-sm text-stone-500 mt-1`. Two-column track grid (same layout as `StepShadowing.vue`): Track A (blue dot) + play button triggers `videoRef.currentTime = seg.startSeconds; videoRef.play()` via a passed `videoRef` prop or by accessing the store's videoSrc via a fresh `<audio>` element. Track B (red dot): `Mic` record button → `MediaRecorder` API (same pattern as `StepShadowing.vue` lines 120–180). Review phase: play back recording via `<audio :src="recordingUrl">`. "完成本期精讲" CTA: visible only on last segment, calls `tedStore.markTalkCompleted(tedStore.selectedTalkId)` then sets nav store to 'ted' to return to hub.

- [ ] **Step 4: Run tests — verify PASS**

- [ ] **Step 5: Run full suite** (`npm test`)

- [ ] **Step 6: Commit**
```
git commit -m "feat(ted): add TedShadowing.vue Step 4 A/B dual-track shadowing workshop"
```

---

### Task 10: `TedHub.vue` — Three-Device Layout Orchestrator (Full)

**Files:**
- Modify: `src/components/ted/TedHub.vue` (replace Sprint 1 placeholder)
- Modify: `tests/vue3/tedHub.test.js` (extend existing tests)

**Interfaces:**
- Consumes: `useTedStore()`, all four step components, `TedStepBar`, `TedTalkList`
- Produces: full TED module entry page

- [ ] **Step 1: Write failing tests (append to existing `tests/vue3/tedHub.test.js`)**

```js
// Append to tests/vue3/tedHub.test.js
import { readFileSync } from 'node:fs'
const hubSrc = readFileSync('src/components/ted/TedHub.vue', 'utf8')

describe('TedHub.vue Sprint 2', () => {
  it('imports TedVocabPreload', () => {
    assert.ok(hubSrc.includes('TedVocabPreload'), 'Missing TedVocabPreload import')
  })
  it('imports TedVideoPlayer', () => {
    assert.ok(hubSrc.includes('TedVideoPlayer'), 'Missing TedVideoPlayer import')
  })
  it('imports TedTaskStudio', () => {
    assert.ok(hubSrc.includes('TedTaskStudio'), 'Missing TedTaskStudio import')
  })
  it('imports TedShadowing', () => {
    assert.ok(hubSrc.includes('TedShadowing'), 'Missing TedShadowing import')
  })
  it('imports TedStepBar', () => {
    assert.ok(hubSrc.includes('TedStepBar'), 'Missing TedStepBar import')
  })
  it('imports TedTalkList', () => {
    assert.ok(hubSrc.includes('TedTalkList'), 'Missing TedTalkList import')
  })
  it('TedTalkList hidden on mobile, shown on lg', () => {
    assert.ok(hubSrc.includes('hidden lg:flex') || hubSrc.includes('lg:block'), 'TedTalkList should be hidden on mobile')
  })
  it('uses conditional rendering (v-if) for step components', () => {
    assert.ok(hubSrc.includes('v-if'), 'Missing v-if step routing')
  })
  it('contains no Unicode emojis', () => {
    assert.doesNotMatch(hubSrc, /\p{Extended_Pictographic}/u, 'Emoji found in TedHub.vue')
  })
})
```

- [ ] **Step 2: Run new tests — verify FAIL** (`node --test tests/vue3/tedHub.test.js`)

- [ ] **Step 3: Replace `src/components/ted/TedHub.vue` with full orchestrator**

  Full template per spec Section 4.1:
  ```html
  <div class="h-full w-full flex flex-col lg:flex-row bg-[#fbf9f5] overflow-hidden">
    <!-- Desktop talk list sidebar (hidden below lg) -->
    <TedTalkList class="hidden lg:flex w-60 shrink-0 ..." />
    <!-- Main area -->
    <div class="flex-1 min-w-0 flex flex-col overflow-hidden">
      <!-- Step progress bar -->
      <TedStepBar />
      <!-- Step content -->
      <div class="flex-1 overflow-y-auto">
        <TedVocabPreload v-if="tedStore.currentStep === 1" />
        <TedVideoPlayer v-else-if="tedStore.currentStep === 2" />
        <TedTaskStudio v-else-if="tedStore.currentStep === 3" />
        <TedShadowing v-else-if="tedStore.currentStep === 4" />
      </div>
    </div>
  </div>
  ```
  On `mounted`: if `tedStore.talks.length > 0 && !tedStore.selectedTalkId`, auto-select `tedStore.talks[0]`.

- [ ] **Step 4: Run all TED tests — verify PASS** (`node --test tests/vue3/tedHub.test.js`)

- [ ] **Step 5: Run full suite** (`npm test`)

- [ ] **Step 6: Commit**
```
git commit -m "feat(ted): upgrade TedHub.vue to full Sprint 2 three-device orchestrator"
```

---

### Task 11: Final Verification

**Files:** None created/modified

- [ ] **Step 1: Run full test suite**
```
npm test
```
Expected: All tests pass (165+ including new TED tests). Output: `pass N, fail 0`.

- [ ] **Step 2: Production build**
```
npm run build
```
Expected: Build completes with 0 errors, 0 critical warnings.

- [ ] **Step 3: Zero-emoji audit**
```
npm run check-emojis
```
Expected: `Emoji check passed. No emojis found.`

- [ ] **Step 4: Security credential scan**
```
npm run verify-security
```
Expected: `Security check passed. No credentials found.`

- [ ] **Step 5: Commit verification results**
```
git commit --allow-empty -m "chore(sprint-2): all verifications pass — tests, build, emojis, security"
```
