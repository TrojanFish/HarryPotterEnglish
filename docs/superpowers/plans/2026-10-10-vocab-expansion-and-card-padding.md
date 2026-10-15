# Large-scale Vocab Expansion & Card Padding Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the offline graded dictionary to 12,000+ words using open-source curriculum datasets (Middle School / Zhongkao, High School / Gaokao, CET-4, CET-6, Primary, and HP Lore), and unify card inner padding across StepShadowing, StepDictation, and StepVocabReview to the golden standard `p-5 sm:p-6 rounded-2xl`.

**Architecture:**
1. `scripts/generate_graded_vocab_db.js`: Offline build script that compiles open-source graded vocabulary files from `KyleBing/english-vocabulary` (Junior, Senior, CET-4, CET-6) and merges them with Primary School (`小学基础`) and Harry Potter lore (`魔法专有`), outputting a compact, pre-indexed `src/data/gradedVocabDb.json` file.
2. `src/data/gradedDictionaryData.js`: Integrate `gradedVocabDb.json` into the existing `GRADED_DICTIONARY` map, providing instant sub-millisecond local lookup for 12,000+ headwords and 30,000+ inflected forms with zero network dependencies.
3. Card Padding Standardization:
   - `StepShadowing.vue`: Unify Track A, Track B, and Evaluation result cards to `p-5 sm:p-6 rounded-2xl`.
   - `StepDictation.vue`: Unify Scramble answer area, Token bank, Cloze card, and Evaluation card to `p-5 sm:p-6 rounded-2xl`.
   - `StepVocabReview.vue`: Unify Leitner box card, 3D Flashcard front & back, and Empty state card to `p-5 sm:p-6 rounded-2xl`.
4. Verification: Test suites verifying 10,000+ words resolution, zero emoji, zero shadow, and 100% build and security pass.

**Tech Stack:** Node.js, Vue 3, Pinia, Tailwind CSS, Lucide Vue Next.

## Global Constraints
- Zero Unicode Emoji in all UI and code.
- Strict Zero Shadows: No `shadow-lg`, `shadow-xl`, `shadow-2xl`.
- Apple HIG: All interactive touch targets $\ge 44 \times 44\text{px}$.
- Dual-channel status indicators (icon + text/border).
- Offline-first: 100% local lookup without external network latency.

---

## Tasks

### Task 1: Large-Scale Graded Vocabulary Dataset Expansion (12,000+ words)
- [ ] Write failing test `tests/vue3/largeVocabDb.test.js` checking:
  - `GRADED_DICTIONARY` has $\ge 10,000$ unique headwords.
  - Resolves diverse vocabulary across all tiers:
    - 小学基础 (e.g. `cat`, `apple`, `school`)
    - 中考核心 (e.g. `discover`, `journey`, `sudden`)
    - 高考重点 (e.g. `peculiar`, `astonish`, `hesitate`, `quiver`)
    - 四级高频 (e.g. `philosopher`, `absorb`, `accelerate`, `barrier`)
    - 六级进阶 (e.g. `eccentric`, `abruptly`, `accumulate`, `adverse`)
    - 魔法专有 (e.g. `muggle`, `quidditch`, `dumbledore`, `snitch`)
  - Resolves inflected variants (e.g. `absorbed`, `quivering`, `eccentrically`).
- [ ] Create `scripts/generate_graded_vocab_db.js` to compile the deduplicated dictionary into `src/data/gradedVocabDb.json` with `[phonetic, pos, definition, examTag]` tuples.
- [ ] Run generation script to produce `src/data/gradedVocabDb.json`.
- [ ] Update `src/data/gradedDictionaryData.js` to import and merge `gradedVocabDb.json` seamlessly.
- [ ] Verify `tests/vue3/largeVocabDb.test.js` and `tests/vue3/vocabAndDictionary.test.js` pass (GREEN).
- [ ] Commit: `git add scripts/generate_graded_vocab_db.js src/data/gradedVocabDb.json src/data/gradedDictionaryData.js tests/vue3/largeVocabDb.test.js; git commit -m "feat(dict): expand offline graded dictionary to 12,000+ curriculum words"`

### Task 2: Standardizing Card Padding Rhythm Across All Flow Stages (`p-5 sm:p-6 rounded-2xl`)
- [ ] Write failing test `tests/vue3/cardPaddingConsistency.test.js` asserting that:
  - All main cards in `StepShadowing.vue` have `p-5 sm:p-6 rounded-2xl`.
  - All game/action cards in `StepDictation.vue` have `p-5 sm:p-6 rounded-2xl` (no `p-4` or `p-5` without `sm:p-6`).
  - All card containers in `StepVocabReview.vue` have `p-5 sm:p-6 rounded-2xl` (no `p-6 sm:p-8` or `p-8`).
- [ ] Update `src/components/session/StepShadowing.vue`:
  - Track A & Track B cards: update to `p-5 sm:p-6 rounded-2xl`.
  - Evaluation result card: update to `p-5 sm:p-6 rounded-2xl`.
- [ ] Update `src/components/session/StepDictation.vue`:
  - Scramble answer construction area: update to `p-5 sm:p-6 rounded-2xl`.
  - Scramble token bank area: update to `p-5 sm:p-6 rounded-2xl`.
  - Cloze answer card: update to `p-5 sm:p-6 rounded-2xl`.
  - Full dictation textarea card: update to `p-5 sm:p-6 rounded-2xl`.
  - Result evaluation card: update to `p-5 sm:p-6 rounded-2xl`.
- [ ] Update `src/components/session/StepVocabReview.vue`:
  - Leitner 5-box indicator card: update to `p-5 sm:p-6 rounded-2xl`.
  - 3D Flashcard front & back: update to `p-5 sm:p-6 rounded-2xl`.
  - Empty state card: update to `p-5 sm:p-6 rounded-2xl`.
- [ ] Verify `tests/vue3/cardPaddingConsistency.test.js` passes (GREEN).
- [ ] Commit: `git add src/components/session/ tests/vue3/cardPaddingConsistency.test.js; git commit -m "fix(ui): unify card inner padding to p-5 sm:p-6 rounded-2xl across shadowing, dictation, and review"`

### Task 3: Full-Suite Verification & Zero-Regression Auditing
- [ ] Update `package.json` test script to include `tests/vue3/largeVocabDb.test.js` and `tests/vue3/cardPaddingConsistency.test.js`.
- [ ] Run full test suite: `npm test` (all tests must pass with 0 failures).
- [ ] Run zero-emoji audit: `npm run check-emojis` (0 findings).
- [ ] Run security check: `npm run verify-security` (0 credential leaks).
- [ ] Run production build: `npm run build` (clean Vite bundle).
- [ ] Push all commits to `origin main`.
