# Recording Playback Fix, Player Sleep Timer, Stream Diagnostics & Vocab Banner Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix user shadowing recording playback so it plays actual microphone audio instead of original snippet; replace redundant player step button with sleep timer; remove session complete card from Step 4; and diagnose & harden R2 stream loading.

**Architecture:** 
1. Real MediaRecorder in `StepShadowing.vue` with WebM/MP4 blob capture and audio playback with Play/Pause toggling.
2. Sleep timer feature in `playerStore.js` and `SmartAudioPlayer.vue` utilizing `src/utils/sleepTimer.js` with countdown and automatic pause.
3. Remove redundant banner in `StepVocabReview.vue`.
4. Add `configurePreviewServer` in `viteR2Plugin.js` and `vite.config.js` for R2 preview streaming.

**Tech Stack:** Vue 3, Pinia, Web Audio / MediaRecorder API, Lucide Vue Next, Tailwind CSS.

---

## Global Constraints
- Zero Unicode emojis across all UI files and templates.
- Apple HIG touch targets >= 44x44px.
- Zero heavy shadows (`shadow-lg`, `shadow-xl`, `shadow-2xl`).
- Pure Reader palette: `#f8f8f6`, `#e4e4e7`, `#18181b`, `#2563eb`.

---

### Task 1: Fix User Recording Playback in `StepShadowing.vue`

**Files:**
- Modify: `src/components/session/StepShadowing.vue`
- Test: `tests/vue3/stepShadowing.test.js`

- [ ] **Step 1: Update `StepShadowing.vue` to integrate real `MediaRecorder`**
  - Use `navigator.mediaDevices.getUserMedia({ audio: true })`.
  - Collect audio chunks into Blob using supported MIME type (`audio/webm` or `audio/mp4`).
  - Create object URL for user audio.
  - Implement `playUserRecording` to play `userAudioRef` / `new Audio(userAudioBlobUrl)` with play/pause state toggle (`isPlayingUserRecording`).
  - On ended event, reset `isPlayingUserRecording = false`.
  - When starting new recording or unmounting, cleanup audio stream, revoke previous object URL, and stop playback.
  - Disable or warn if no recording exists; NEVER play original snippet on user recording playback!

- [ ] **Step 2: Update `tests/vue3/stepShadowing.test.js`**
  - Verify that `StepShadowing.vue` contains `MediaRecorder`, `userAudioBlobUrl`, and does not fallback user playback to original snippet.

- [ ] **Step 3: Run `npm test` to verify Task 1 passes**

---

### Task 2: Replace Redundant Player Step Button with Sleep Timer in `SmartAudioPlayer.vue` & `playerStore.js`

**Files:**
- Modify: `src/stores/playerStore.js`
- Modify: `src/components/player/SmartAudioPlayer.vue`
- Test: `tests/vue3/smartAudioPlayer.test.js`

- [ ] **Step 1: Add sleep timer state & actions to `src/stores/playerStore.js`**
  - State: `sleepTimerMode: null`, `sleepTimerRemaining: null`, `sleepTimerTargetTimestamp: null`.
  - Actions: `setSleepTimer(mode)`, `tickSleepTimer()`, `clearSleepTimer()`.
  - When countdown reaches 0 or mode is `end_of_chapter` upon chapter end, pause audio and reset timer.

- [ ] **Step 2: Replace right button in `SmartAudioPlayer.vue` with Sleep Timer**
  - Remove `advanceStep` button and `nextStepButtonLabel`.
  - Add `Moon` icon sleep timer button on the right.
  - Clicking opens a bottom sheet or selector menu with options from `src/utils/sleepTimer.js`:
    - 关闭, 15 分钟, 30 分钟, 45 分钟, 60 分钟, 本集播完.
  - Active button displays remaining countdown (e.g. `14:59` or `本集`) and blue active highlight.
  - Touch targets >= 44x44px.

- [ ] **Step 3: Update `tests/vue3/smartAudioPlayer.test.js` to assert sleep timer support**

- [ ] **Step 4: Run `npm test` to verify Task 2 passes**

---

### Task 3: Remove "今日学习达成" Card Container from `StepVocabReview.vue`

**Files:**
- Modify: `src/components/session/StepVocabReview.vue`

- [ ] **Step 1: Remove the banner card container**
  - Delete `<!-- Export Actions & Session Complete Banner -->` and its children in `StepVocabReview.vue`.
  - Clean up unused `Download` icon import.

- [ ] **Step 2: Run `npm test` to ensure `StepVocabReview.vue` tests still pass**

---

### Task 4: Enhance Vite Preview Server R2 Proxy & Verify Gates

**Files:**
- Modify: `server/viteR2Plugin.js`
- Modify: `vite.config.js`

- [ ] **Step 1: Add `configurePreviewServer` in `server/viteR2Plugin.js`**
  - Allow `npm run preview` to also serve R2 audio and subtitles.
- [ ] **Step 2: Run all 4 quality gates**
  - `npm test`
  - `npm run check-emojis`
  - `npm run verify-security`
  - `npm run build`
