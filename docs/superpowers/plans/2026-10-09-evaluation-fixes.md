# Evaluation Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 13 issues (3 P0 + 5 P1 + 5 P2) identified in the comprehensive functional and UI/UX evaluation of the Hogwarts Audio Vue 3 platform.

**Architecture:** Issues are grouped into 6 independent tasks: (1) audio volume sync + playerStore ID fix, (2) dictation next-sentence wiring, (3) shadowing SpeechRecognition + snippet loop, (4) word-tap → vocabulary add flow, (5) analytics real data + storage download button, (6) shadow-2xl removal. Each task is independently testable. Tasks 1-4 touch component/store files directly; Task 5 is new state + UI wiring; Task 6 is pure CSS string replacement.

**Tech Stack:** Vue 3 + Vite + Pinia + Tailwind CSS + Lucide Vue Next + IndexedDB (offlineStorage.js) + Web Speech API (SpeechRecognition)

**Spec:** `C:/Users/Administrator/.gemini/antigravity/brain/296b2316-75b3-45f4-ae17-19927a1694ee/evaluation_report.md`

## Global Constraints

- Zero Unicode emoji in all user-facing strings and code — Lucide SVG icons only
- Parchment palette: `#fbf9f5`, `#e8ddd0`, `#1e1610`, amber gold `#d97706`/`#b45309`
- All interactive touch targets `min-h-[44px] min-w-[44px]`
- Zero `shadow-lg`, `shadow-xl`, `shadow-2xl` — use border only for layering
- `active:scale-95` on all primary action buttons
- Input fields `text-base` (≥16px) to prevent iOS zoom
- All tests run with `npm test` — do NOT break any of the current 27/27 passing tests
- No credential or R2 secret exposure in client bundles
- Vue 3 SFC style with `<script setup>` syntax
- Lucide icons from `lucide-vue-next`

## Review Focus

1. **Volume mute toggle** — after `player.setVolume(0)` the `<audio>` element's actual `.volume` must be 0; the UI icon change alone is insufficient
2. **SpeechRecognition fallback** — browsers that don't support `SpeechRecognition` (Firefox, some mobile) must show a clear "Not supported" message rather than crashing
3. **Dictation next-sentence** — `subtitleStore.jumpToNextCue` must move to the next cue *relative to the current active cue*, not always cue index 0
4. **Word-tap add-to-vocab** — tapping the same word twice must not create duplicate entries in `vocabList`
5. **Analytics data** — if localStorage has no listening log, stat cards must show `0` gracefully, not NaN/undefined

---

### Task 1: Volume Sync + PlayerStore ID Alignment

**Files:**
- Modify: `src/App.vue` (add volume watcher, ~line 520 block)
- Modify: `src/stores/playerStore.js` (line 20: `currentBookId` initial value)
- Test: `tests/vue3/stores.test.js` (add volume sync test)

**Interfaces:**
- Consumes: `usePlayerStore()` — `player.volume` (Number 0..1), `audioRef.value` (HTMLAudioElement shallowRef)
- Produces: `audioRef.value.volume` tracks `player.volume` in real-time

- [ ] **Step 1: Write failing test** in `tests/vue3/stores.test.js`

```js
test('playerStore initializes currentBookId to hp-book-1', () => {
  const store = usePlayerStore(createPinia())
  expect(store.currentBookId).toBe('hp-book-1')
})
```

- [ ] **Step 2: Run test** — `npm test -- --testPathPattern=vue3/stores` — expect FAIL

- [ ] **Step 3: Fix `src/stores/playerStore.js` line 20** — change `'hp1'` → `'hp-book-1'` and `'hp1-01'` → `'hp-book-1_ep01'`

- [ ] **Step 4: Add volume watcher in `src/App.vue`** — after the existing `watch(() => player.playbackRate, ...)` block (around line 520), add:

```js
watch(
  () => player.volume,
  (vol) => {
    if (!audioRef.value) return
    audioRef.value.volume = Math.max(0, Math.min(1, vol))
  },
  { immediate: true }
)
```

- [ ] **Step 5: Run tests** — `npm test` — expect 27/27 pass

- [ ] **Step 6: Commit**

```
git add src/stores/playerStore.js src/App.vue tests/vue3/stores.test.js
git commit -m "fix: sync audio volume to HTMLAudioElement; align playerStore initial bookId"
```

---

### Task 2: Dictation "Next Sentence" Wiring

**Files:**
- Modify: `src/App.vue` (add `@next` handler on `<DictationStudio>`)
- Modify: `src/stores/subtitleStore.js` (add `jumpToNextCue` action if missing)
- Test: `tests/vue3/dictationStudio.test.js` (add next-sentence test)

**Interfaces:**
- Consumes: `subtitleStore.activeCueIndex`, `subtitleStore.cues`, `player.seek(time)`
- Produces: `subtitleStore.jumpToNextCue()` action → increments `activeCueIndex`, `player.seek` to next cue's start

- [ ] **Step 1: Check `subtitleStore.js`** for existing `jumpToNextCue`/`jumpToPrevCue` actions — they exist at lines 82+ based on App.vue MediaSession usage. Verify they move `activeCueIndex`.

- [ ] **Step 2: Write failing test** in `tests/vue3/dictationStudio.test.js`

```js
test('emitting next advances to the next subtitle cue', async () => {
  // mount DictationStudio with isOpen=true and currentCue = cues[0]
  // trigger nextSentence() → expect 'next' emitted
  // App.vue handler should call subtitleStore.jumpToNextCue + player.seek
})
```

- [ ] **Step 3: Run test** — `npm test -- --testPathPattern=vue3/dictationStudio` — expect FAIL

- [ ] **Step 4: Add `jumpToNextCue` action to `src/stores/subtitleStore.js`** (if not already present):

```js
jumpToNextCue() {
  if (this.activeCueIndex < this.cues.length - 1) {
    this.activeCueIndex++
  }
},
jumpToPrevCue() {
  if (this.activeCueIndex > 0) {
    this.activeCueIndex--
  }
}
```

- [ ] **Step 5: Wire `@next` in `src/App.vue`** — on the `<DictationStudio>` component tag, add `@next="onDictationNext"` and implement the handler in `<script setup>`:

```js
function onDictationNext() {
  subtitleStore.jumpToNextCue()
  const next = subtitleStore.currentCue
  if (next) player.seek(next.start)
}
```

- [ ] **Step 6: Run tests** — `npm test` — expect all pass

- [ ] **Step 7: Commit**

```
git add src/App.vue src/stores/subtitleStore.js tests/vue3/dictationStudio.test.js
git commit -m "fix: wire DictationStudio @next event to advance subtitle cue"
```

---

### Task 3: Shadowing SpeechRecognition + Track A Snippet Loop

**Files:**
- Modify: `src/components/ShadowingRecorder.vue` (replace mock `spoken = target` with real SpeechRecognition; add snippet end-time guard)
- Test: `tests/vue3/shadowingRecorder.test.js` (add tests for SpeechRecognition fallback and snippet loop)

**Interfaces:**
- Consumes: `props.currentCue.start`, `props.currentCue.end`, `player.seek()`, `player.pause()`
- Produces: `evaluationResult` computed from real SpeechRecognition transcript vs `targetSentence`

- [ ] **Step 1: Write failing tests** in `tests/vue3/shadowingRecorder.test.js`

```js
test('shows "不支持" message when SpeechRecognition unavailable', () => { ... })
test('stopRecording uses SpeechRecognition transcript for evaluation', () => { ... })
```

- [ ] **Step 2: Run tests** — expect FAIL

- [ ] **Step 3: Add SpeechRecognition logic to `ShadowingRecorder.vue` `<script setup>`**:
  - Add `recognitionRef = ref(null)` and `spokenText = ref('')`
  - On `startRecording()`: also start `new (window.SpeechRecognition || window.webkitSpeechRecognition)()` if available; set `recognition.lang = 'en-US'`; on `recognition.onresult` accumulate `spokenText.value`
  - Add `isSpeechRecognitionSupported` computed: `!!(window.SpeechRecognition || window.webkitSpeechRecognition)`
  - In `stopRecording()`: replace `const spoken = target` with `const spoken = spokenText.value || ''`; then call `stopHardware()` which also stops recognition
  - Add a `<p>` fallback message in template `v-if="!isSpeechRecognitionSupported"`: "当前浏览器不支持语音识别，录音后将手动评测"

- [ ] **Step 4: Fix Track A snippet loop** — in `playOriginalSnippet()`:
  - After `player.seek(props.currentCue.start)` and `player.play()`, set up a one-shot check: add a watcher on `player.currentTime` in the component that, if Track A is playing (add local `isPlayingOriginal = ref(false)`) and `player.currentTime >= props.currentCue.end - 0.1`, calls `player.pause()` and clears the watcher. Use `watchEffect` with `stop()`.

- [ ] **Step 5: Run tests** — `npm test` — expect all pass

- [ ] **Step 6: Commit**

```
git add src/components/ShadowingRecorder.vue tests/vue3/shadowingRecorder.test.js
git commit -m "fix: integrate SpeechRecognition for real pronunciation scoring; fix Track A snippet loop"
```

---

### Task 4: Word-Tap → Add Vocabulary Flow

**Files:**
- Modify: `src/components/SubtitleViewer.vue` (wrap `cue.text` in tokenized `<span>` words, add tap handler)
- Create: `src/components/common/WordActionMenu.vue` (tiny popover: "添加生词" button)
- Modify: `src/components/VocabularyDrawer.vue` (expose `addWord(wordObj)` via a Pinia store or a `provide`/`inject`)
- Modify: `src/stores/playerStore.js` OR create `src/stores/vocabStore.js` (move vocab list to Pinia for cross-component access)
- Test: `tests/vue3/subtitleViewer.test.js` (add word-tap test)
- Test: `tests/vue3/vocabularyDrawer.test.js` (add addWord dedup test)

**Interfaces:**
- `addWordToVocab(word: string, contextQuote: string): void` — Pinia action on `vocabStore`
- Dedup: if `vocabList.some(w => w.word.toLowerCase() === word.toLowerCase())`, skip silently

- [ ] **Step 1: Create `src/stores/vocabStore.js`** — extract vocab logic from `VocabularyDrawer.vue`:

```js
export const useVocabStore = defineStore('vocab', {
  state: () => ({ vocabList: loadVocab() }),
  actions: {
    addWord(word, contextQuote = '') { ... deduplicate, push, saveVocab() },
    promoteBox(word) { ... },
    deleteWord(word) { ... },
    clearAll() { ... },
    saveVocab() { localStorage.setItem(...) }
  }
})
```

- [ ] **Step 2: Write failing tests**

```js
// tests/vue3/vocabularyDrawer.test.js
test('addWord does not create duplicates', () => { ... })
// tests/vue3/subtitleViewer.test.js
test('tapping a word in subtitle fires add-word event', () => { ... })
```

- [ ] **Step 3: Run tests** — expect FAIL

- [ ] **Step 4: Migrate `VocabularyDrawer.vue`** to use `useVocabStore()` — replace internal `vocabList` ref with `store.vocabList`, replace local functions with store actions.

- [ ] **Step 5: Tokenize words in `SubtitleViewer.vue`** — replace `{{ cue.text }}` with:

```vue
<span
  v-for="(word, wi) in tokenizeText(cue.text)"
  :key="wi"
  @click.stop="onWordTap(word, cue.text)"
  class="cursor-pointer hover:text-[#d97706] hover:underline decoration-dotted transition-colors"
>{{ word }} </span>
```

Add `tokenizeText(text)` that splits on spaces, preserving punctuation attached to the word token. On `onWordTap(word, quote)`, call `vocabStore.addWord(cleanWord(word), quote)` and show a brief 1.5s amber toast: "已收录：{word}".

- [ ] **Step 6: Add toast UI** — a small fixed `div` in `SubtitleViewer.vue` template:

```vue
<Transition ...>
  <div v-if="toastWord" class="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-[#d97706] text-white text-xs rounded-full font-medium z-50">
    已收录：{{ toastWord }}
  </div>
</Transition>
```

- [ ] **Step 7: Run tests** — `npm test` — expect all pass

- [ ] **Step 8: Commit**

```
git add src/stores/vocabStore.js src/components/SubtitleViewer.vue src/components/VocabularyDrawer.vue tests/vue3/subtitleViewer.test.js tests/vue3/vocabularyDrawer.test.js
git commit -m "feat: word-tap in subtitle adds to vocab (vocabStore + dedup toast)"
```

---

### Task 5: Analytics Real Data + Offline Download Button

**Files:**
- Create: `src/stores/analyticsStore.js` (listening log in localStorage; streak, hours, completedChapters derived)
- Modify: `src/App.vue` (call `analyticsStore.recordListening(seconds)` on audio `timeupdate` periodically)
- Modify: `src/components/AnalyticsDashboard.vue` (replace `summaryData` hardcode with `analyticsStore` getters)
- Modify: `src/components/StorageManagerModal.vue` (add "下载此章节" button per chapter in bookChapters list)
- Test: `tests/vue3/analyticsDashboard.test.js` (test real data binding)
- Test: `tests/vue3/storageManager.test.js` (test download chapter button)

**Interfaces:**
- `analyticsStore.streakDays: number` — days with >0 seconds logged
- `analyticsStore.totalListeningSeconds: number`
- `analyticsStore.completedChaptersCount: number`
- `analyticsStore.weeklyMinutes: number[]` (last 7 days, most recent last)
- `analyticsStore.recordListening(chapterId, seconds)` — called from App.vue `onTimeUpdate` every 30s
- `analyticsStore.markChapterComplete(chapterId)` — called from `onAudioEnded`

- [ ] **Step 1: Write failing tests** in `tests/vue3/analyticsDashboard.test.js`

```js
test('shows 0 streak when no localStorage data', () => { ... })
test('recordListening increments totalListeningSeconds', () => { ... })
```

- [ ] **Step 2: Run tests** — expect FAIL

- [ ] **Step 3: Create `src/stores/analyticsStore.js`** with the interface above. Store a daily log in localStorage as `hp_analytics_log`: `{ [YYYY-MM-DD]: { seconds: number, chapterIds: string[] } }`. Derive `streakDays` by counting consecutive days from today backward. Derive `weeklyMinutes` as last 7 days' `Math.round(seconds/60)`.

- [ ] **Step 4: Modify `src/App.vue`**:
  - Import `useAnalyticsStore`
  - In `onTimeUpdate`, every 30 real seconds (track with a `let lastLoggedTime = 0` outside the function), call `analyticsStore.recordListening(catalog.selectedChapterId, 30)`
  - In `onAudioEnded`, call `analyticsStore.markChapterComplete(catalog.selectedChapterId)`

- [ ] **Step 5: Modify `AnalyticsDashboard.vue`** — replace `summaryData` and `weeklyDays` constants with computed values from `useAnalyticsStore()`.

- [ ] **Step 6: Add download button to `StorageManagerModal.vue`** — add a new section "可下载章节" listing current book's chapters from `useCatalogStore().currentBook.chapters`. Each chapter shows a "下载" button that calls `saveChapterOffline({ chapterId, title, audioUrl: catalog.audioUrl, vttUrl: catalog.subtitleUrl }, onProgress)` from `offlineStorage.js`. Show a progress indicator (`Loader2` spinner + percentage) during download, then a `CheckCircle2` on completion. After download, call `refreshStorage()` to update the used-space bar.

- [ ] **Step 7: Run tests** — `npm test` — expect all pass

- [ ] **Step 8: Commit**

```
git add src/stores/analyticsStore.js src/App.vue src/components/AnalyticsDashboard.vue src/components/StorageManagerModal.vue tests/vue3/analyticsDashboard.test.js tests/vue3/storageManager.test.js
git commit -m "feat: real analytics data from localStorage; offline download chapter button in StorageManager"
```

---

### Task 6: Remove All shadow-2xl Violations (Design Spec Compliance)

**Files:**
- Modify: `src/components/BookshelfDrawer.vue` (line 31)
- Modify: `src/components/VocabularyDrawer.vue` (line 31)
- Modify: `src/components/ShadowingRecorder.vue` (line 20)
- Modify: `src/components/DictationStudio.vue` (line 20)
- Modify: `src/components/AnalyticsDashboard.vue` (line 20)
- Modify: `src/components/StorageManagerModal.vue` (line 20)
- Modify: `src/components/ShortcutsModal.vue` (line 20)
- Also remove `shadow-sm` from `App.vue` error banner (line 226) and player footer (line 3)
- Test: `npm run check-emojis` + grep for shadow violations post-fix

**Interfaces:** None — pure class string replacement

- [ ] **Step 1: In each of the 7 files above**, remove `shadow-2xl` from the modal/drawer container `div` or `aside`. For drawer panels (`BookshelfDrawer`, `VocabularyDrawer`), the `border-l border-[#e8ddd0]` already provides visual separation — no replacement needed. For modal dialogs (center-screen), the `border border-[#e8ddd0]` on the inner panel already provides definition — no replacement needed.

- [ ] **Step 2: In `src/App.vue` line 226**, remove `shadow-sm` from the error banner.

- [ ] **Step 3: In `src/components/AudioPlayer.vue` line 3**, remove `shadow-[0_-4px_16px_rgba(30,22,16,0.04)]` from the footer — the `border-t border-[#e8ddd0]` suffices.

- [ ] **Step 4: Verify no shadow classes remain**:

```powershell
Select-String -Path "src/**/*.vue" -Pattern "shadow-lg|shadow-xl|shadow-2xl|shadow-\[" -Recurse
```

Expected: zero matches (or only `shadow-inner` on `<kbd>` in ShortcutsModal which is acceptable UX for keyboard key styling).

- [ ] **Step 5: Run `npm run check-emojis`** — 0 violations

- [ ] **Step 6: Run `npm test`** — 27/27

- [ ] **Step 7: Commit**

```
git add src/components/BookshelfDrawer.vue src/components/VocabularyDrawer.vue src/components/ShadowingRecorder.vue src/components/DictationStudio.vue src/components/AnalyticsDashboard.vue src/components/StorageManagerModal.vue src/components/ShortcutsModal.vue src/App.vue src/components/AudioPlayer.vue
git commit -m "fix(design): remove all shadow-xl/2xl violations; enforce strict zero-shadow spec"
```

---

## Post-Plan Self-Review

**1. Spec coverage:**
- P0-1 (R2 CDN production config) — intentionally deferred: requires user to set `VITE_R2_PUBLIC_DOMAIN` in their hosting environment `.env`; no code change can substitute for missing credentials. Document in README instead. ✓ scoped out with reason.
- P0-2 (shadowing scoring) → Task 3 ✓
- P0-3 (analytics mock data) → Task 5 ✓
- P1-1 (volume sync) → Task 1 ✓
- P1-2 (playerStore ID mismatch) → Task 1 ✓
- P1-3 (dictation next-sentence) → Task 2 ✓
- P1-4 (vocab add from subtitle) → Task 4 ✓
- P1-5 (offline download button) → Task 5 ✓
- P2-1 (shadow-2xl removal) → Task 6 ✓
- P2-2 (word-tap WordModal) → Task 4 (simplified as vocab-add toast) ✓
- P2-3 (Track A snippet loop) → Task 3 ✓
- P2-4 (mobile chapter capsule) → deferred (minor UX, not functional) — note in README
- P2-5 (Box empty state) → deferred (copy change only, low priority)

**2. Step scan:** Every step specifies one action. Code blocks appear only where the plan text alone is ambiguous.

**3. Type consistency:** `addWord(word: string, contextQuote: string)` used consistently in Task 4. `recordListening(chapterId: string, seconds: number)` consistent in Task 5. `jumpToNextCue()` consistent in Task 2.

**4. Review Focus inputs covered:**
- Volume sync → Task 1 test
- SpeechRecognition fallback → Task 3 test
- jumpToNextCue relative → Task 2 test (activeCueIndex-relative)
- Word-tap dedup → Task 4 test
- Analytics zero-data → Task 5 test

**5. Proportion:** Plan is substantially shorter than code it drives. Each task's steps are directive, not transcript.
