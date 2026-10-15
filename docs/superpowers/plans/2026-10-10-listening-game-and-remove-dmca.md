# Listening Game Multi-Difficulty & Legal Disclaimer Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Academic Research / Fair Use / DMCA legal disclaimer from all views, and upgrade the dictation section into a 3-difficulty Listening Game Lab with single-sentence audio cutoff guard.

**Architecture:**
1. Cleanly delete `LegalDisclaimerModal.vue` and its trigger buttons across `BookshelfDrawer.vue` and `ShortcutsModal.vue`.
2. Enhance `StepDictation.vue` and `DictationStudio.vue` with:
   - Precise single-sentence playback audio watcher (`player.currentTime >= cue.end - 0.15s` pauses audio).
   - Multi-difficulty game modes:
     - Mode 1 (Easy): 🧩 Word Scramble (词块排序) with distractor tokens and tap-to-assemble interaction.
     - Mode 2 (Medium): ✍️ Cloze Key Words (重点词挖空) with interactive fill-in blanks.
     - Mode 3 (Master): 📜 Full Dictation (全句精听听写) with tokenized diff checker.
   - Star rating (1-3 stars) and sentence progression controls.

**Tech Stack:** Vue 3 Composition API (`<script setup>`), Pinia (`playerStore`, `subtitleStore`, `sessionStore`), Tailwind CSS (Pure Reader bone-white theme `#f8f8f6`), Lucide Vue Next, Node.js Test Runner (`node --test`).

---

## Global Constraints
- Zero Unicode Emojis across all code and UI strings.
- Pure Reader theme colors: base `#f8f8f6`, border `#e4e4e7`, primary text `#18181b`, secondary `#71717a`, royal blue `#2563eb`.
- Apple HIG touch targets: all buttons and interactive controls `>= 44x44px`.
- Zero shadows: NO `shadow-lg`, `shadow-xl`, `shadow-2xl`.
- Audio playback must never spill over to subsequent sentences (`cue.end - 0.15s` auto-pause).

---

## Tasks

### Task 1: Delete Legal Disclaimer (Fair Use / DMCA)
- [ ] Remove `isLegalOpen`, `<LegalDisclaimerModal>`, and legal buttons from `src/components/BookshelfDrawer.vue`.
- [ ] Remove `isLegalOpen`, `<LegalDisclaimerModal>`, and legal buttons from `src/components/ShortcutsModal.vue`.
- [ ] Delete `src/components/LegalDisclaimerModal.vue`.
- [ ] Update `tests/vue3/` to remove any lingering tests for `LegalDisclaimerModal.vue`.
- [ ] Run `npm test` to verify zero test regressions.

### Task 2: Implement Single-Sentence Cutoff Guard & Audio Playback
- [ ] In `src/components/session/StepDictation.vue`, add `isPlayingSnippet` watcher that automatically pauses when `player.currentTime >= currentCue.end - 0.15`.
- [ ] Add playback rate toggle (1.0x normal vs 0.8x slow-speed).
- [ ] In `src/components/DictationStudio.vue`, align the same cutoff watcher logic.
- [ ] Verify audio stop boundary with automated test.

### Task 3: Build 3-Difficulty Listening Game Modes in StepDictation
- [ ] Implement Mode Switcher tab: `🧩 词块拼图 (入门)`, `✍️ 重点挖空 (进阶)`, `📜 全句听写 (大师)`.
- [ ] Implement Word Scramble mode:
  - Tokenize `cue.text`, extract clean words, generate scrambled tokens + optional distractor words.
  - Interactive selection bank: tap to place in answer row, tap to remove.
  - Auto-check on completion with immediate star rating feedback.
- [ ] Implement Cloze Key Words mode:
  - Identify 1-3 content words (nouns/verbs/adjectives with length >= 4) to blank out.
  - Render sentence with inline input blanks.
  - Submit check with feather quill hint support.
- [ ] Keep Full Dictation mode for Master level with tokenized diff output.
- [ ] Star rating system: 3 stars for first-attempt pass, 2 stars with retries, 1 star with hints.
- [ ] Add smooth Next Sentence button that advances cue and resets game state.

### Task 4: Unit Testing & Final Verification
- [ ] Create `tests/vue3/listeningGame.test.js` validating:
  - Legal disclaimer removal.
  - Sentence cutoff guard threshold logic.
  - Word scramble tokenization and validation.
  - Cloze extraction and validation logic.
- [ ] Run `npm test` — all tests must pass.
- [ ] Run `npm run check-emojis` — 0 findings.
- [ ] Run `npm run verify-security` — 0 leaks.
- [ ] Run `npm run build` — successful build.
