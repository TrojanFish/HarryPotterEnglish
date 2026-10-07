# Magic Blind Listening Workout Gym Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Overview
Transform "魔法磨耳朵" from a passive visual duplicate of "双语精听" into an active, auditory-first Second Language Acquisition (SLA) listening workout gym. When in blind listening mode:
1. **Anti-Cheat Blindfold (默认绝对遮罩)**: Active sentence hides full text and Chinese translation by default, showing an animated parchment soundwave and sentence metrics.
2. **Keyword Radar (听辨雷达)**: Extracts 1~2 key vocabulary anchors per sentence without spoiling the grammar/structure, providing an auditory anchor.
3. **Lumos Reveal (破雾对答案)**: One-tap button (or Space bar) smoothly unveils the full English sentence, phonetics, and translation.
4. **Self-Assessment Feedback Loop (自评闭环)**:
   - "听懂了" (Got it): Marks sentence mastered, automatically advances to next sentence.
   - "没听清" (Replay 0.8x): Automatically slows down playback to 0.8x to catch linking/weak sounds.
5. **Session Mastery Meter (学业成就)**: Sub-header tracks real-time blind listening comprehension rate (e.g. `已自测 8/17 · 掌握率 88%`).

---

## File Structure

- **Modified Files**:
  - `src/utils/blindListeningEngine.js` (NEW helper): Extracts keyword radar words, formats audio metrics, and tracks blind self-assessment state.
  - `src/components/SubtitleViewer.jsx`: Enhances `SentenceCard` and `SubtitleViewer` with the dedicated Blind Workout Card, soundwave, Lumos reveal, self-assessment controls, and keyword radar.
  - `src/App.jsx`: Passes `isPlaying`, `playbackRate`, `onChangePlaybackRate`, and `onReplayCurrentSentence` down to `SubtitleViewer`.
- **Test Files**:
  - `tests/magicBlindListening.test.js` (NEW): Full unit and integration TDD suite covering keyword radar extraction, anti-cheat blindfold state, reveal action, 0.8x replay trigger, and mastery calculation.

---

## Tasks

- [x] Task 1: Create `src/utils/blindListeningEngine.js` & Keyword Radar Unit Tests
  - Implement `extractKeywordRadar(text, dictionary)`: Filters common stop words, identifies HP lore terms or substantive words (length >= 5), returns top 1-2 words.
  - Implement `formatSentenceMetrics(cue)`: Word count and duration formatting.
  - Write test file `tests/magicBlindListening.test.js` and verify radar extraction.

- [x] Task 2: SubtitleViewer Blind Workout Station Implementation
  - In `src/components/SubtitleViewer.jsx`:
    - In `studyMode === 'blind'`:
      - Active sentence renders `BlindListeningStation`:
        - Unrevealed: Animated soundwave, keyword radar badge (`听辨焦点雷达`), word count, and large Lumos Reveal button.
        - Revealed: Full English tokens + translation + Dual-action buttons: "听懂了" and "没听清 (0.8x 慢速重听)".
      - Inactive sentences: Clean mist placeholder with instant jump.
      - Sticky sub-header: Displays real-time blind test stats (`已自测 X/N · 听懂率 Y%`).
  - Wire Space key shortcut to toggle reveal in blind mode.

- [x] Task 3: App.jsx Integration & Audio Controls Connection
  - Pass `isPlaying`, `playbackRate`, `onChangePlaybackRate`, and `onReplayCurrentSentence` from `App.jsx` to `SubtitleViewer`.
  - Wire "没听清" action to set playbackRate to 0.8 and replay current sentence.
  - Wire "听懂了" action to trigger `onNextSentence`.

- [x] Task 4: Complete TDD Test Suite Execution
  - Expand `tests/magicBlindListening.test.js` with SSR integration tests:
    - Active unrevealed card hides English tokens and shows soundwave & keyword radar.
    - Active revealed card shows English tokens, translation, and self-assessment buttons.
    - Sub-header renders blind mastery stats.
  - Run `node --test tests/magicBlindListening.test.js`.

- [x] Task 5: Full Verification Gate (Test, Build, Zero-Emoji, Security) & Git Push
  - `npm test` (all 121 suites, 205 tests pass).
  - `npm run build`.
  - `npm run check-emojis`.
  - `npm run verify-security`.
  - Git commit & push.
