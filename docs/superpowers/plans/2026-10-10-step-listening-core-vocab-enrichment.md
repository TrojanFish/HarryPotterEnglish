# StepListening Core Vocabulary Enrichment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the PC right-hand sidebar in `StepListening.vue` into an intelligent, interactive "Current Sentence Core Vocabulary" workspace featuring automated NLP keyword extraction, pronunciation audio, one-click vocab notebook synchronization, word chips cloud, and zero-emoji parchment styling.

**Architecture:**
1. In `src/data/dictionaryData.js`: Expand vocabulary with Chapter 1 keywords and export an NLP helper `extractSentenceKeywords(text, maxCount)` that normalizes, strips stop words, prioritizes dictionary entries, and outputs rich vocabulary metadata.
2. In `src/components/session/StepListening.vue`: Replace the 4 hardcoded words with reactive `extractSentenceKeywords(subtitleStore.currentCue?.text)`. Render interactive cards with `<Volume2>` pronunciation, `<BookMarked>` toggling, phonetic symbols, tags, definitions, and word chips.
3. Unit tests in `tests/vue3/stepListening.test.js` and `tests/vue3/vocabAndDictionary.test.js` ensuring robust keyword extraction, deduplication, and component contracts.

**Tech Stack:** Vue 3 `<script setup>`, Pinia, Tailwind CSS, Lucide Vue Next, Web Speech API.

## Global Constraints
- Zero Unicode Emoji: No emojis in UI strings or comments. Lucide icons only.
- Strict Zero Shadow: No `shadow-lg`, `shadow-xl`, `shadow-2xl`.
- Apple HIG: All interactive touch targets $\ge 44 \times 44\text{px}$.
- Dual-channel status indicators (icon + text/border).
- Parchment palette: `#f8f8f6`, `#e4e4e7`, `#18181b`, `#2563eb`.

---

## Tasks

### Task 1: Keyword Extraction & Vocabulary Expansion in `dictionaryData.js`
- [ ] Write failing unit test in `tests/vue3/vocabAndDictionary.test.js` testing `extractSentenceKeywords`:
  - Extracts content words from "A fantasy classic of discovery and friendship."
  - Filters common stop words ('a', 'of', 'and')
  - Returns structured array with `{ word, phonetic, pos, definition, tag, isInDict }`
- [ ] Implement `extractSentenceKeywords` in `src/data/dictionaryData.js`:
  - Tokenize and sanitize sentence into unique words
  - Remove stop words
  - Lookup in `DICTIONARY` or lemmas, prioritize dictionary matches
  - Add missing Chapter 1 keywords (`fantasy`, `classic`, `discovery`, `friendship`, `narrate`, `whisper`, etc.) to `DICTIONARY`
- [ ] Verify test passes (GREEN).
- [ ] Commit: `git add src/data/dictionaryData.js tests/vue3/vocabAndDictionary.test.js && git commit -m "feat(dict): add extractSentenceKeywords and expand HP chapter 1 vocabulary"`

### Task 2: Interactive Core Vocabulary Panel & Word Chips in `StepListening.vue`
- [ ] Write failing test in `tests/vue3/stepListening.test.js`:
  - Asserts `StepListening.vue` renders rich vocabulary cards with pronunciation button (`Volume2`) and vocab toggle (`BookMarked` / `toggleWord`)
  - Asserts `StepListening.vue` has sentence word chips cloud
  - Asserts `StepListening.vue` has non-empty informative state
- [ ] Implement right column in `src/components/session/StepListening.vue`:
  - Connect to `extractSentenceKeywords(subtitleStore.currentCue?.text)`
  - Render core vocabulary cards with:
    - Word + Phonetic + Tag pill
    - Definition
    - Audio pronunciation button with Web Speech API TTS
    - Bookmark button to toggle word in `vocabStore` (`hasWord`, `toggleWord`)
    - Card click opens `WordLookupModal`
  - Render "本句单词速查 (Word Chips)" cloud showing all content words in sentence
  - Enhance empty state when sentence contains only basic words
- [ ] Verify test passes (GREEN).
- [ ] Run full test suite `npm test`, `npm run check-emojis`, `npm run verify-security`, `npm run build`.
- [ ] Commit: `git add src/components/session/StepListening.vue tests/vue3/stepListening.test.js && git commit -m "feat(ui): upgrade StepListening core vocabulary panel with rich interactive cards and word chips"`
