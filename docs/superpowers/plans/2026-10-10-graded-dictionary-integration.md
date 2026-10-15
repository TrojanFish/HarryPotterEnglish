# Graded Dictionary Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate a high-density, offline-first Graded English-Chinese Dictionary covering Primary School (小学基础), Zhongkao (中考核心), Gaokao (高考重点), CET-4/6 (四六级), and Harry Potter Lore (魔法专有), providing automated exam syllabus tag badges and definitions across all listening and vocabulary features.

**Architecture:**
1. `src/data/gradedDictionaryData.js`: Compact dictionary map indexed by lowercase lemma with `[phonetic, pos, definition, examTag]` tuples covering 4,000+ essential vocabulary words across all five curriculum grades plus HP lore.
2. `src/data/dictionaryData.js`: Upgrade `lookupWord` and `extractSentenceKeywords` to query the graded dictionary with fallback to inflection reduction, and integrate `HP_LORE_DICTIONARY`.
3. `src/utils/tagTheme.js`: Dual-channel badge styling utility providing distinct colors and accessible borders for each grade tag (`小学基础`, `中考核心`, `高考重点`, `四级高频`, `六级进阶`, `魔法专有`).
4. UI Component Updates:
   - `StepListening.vue`: Apply graded theme badges to vocabulary cards and word chips.
   - `WordLookupModal.vue`: Display full exam syllabus badge with definition, phonetic, and pronunciation.
   - `VocabularyDrawer.vue`: Show graded syllabus tags on vocabulary cards.
5. Verification: Unit tests in `tests/vue3/` confirming tag resolution, coverage, zero emoji, zero shadow, and clean build.

**Tech Stack:** Vue 3, Pinia, Tailwind CSS, Lucide Vue Next.

## Global Constraints
- Zero Unicode Emoji in all strings and UI code.
- Strict Zero Shadows (`shadow-lg`, `shadow-xl`, `shadow-2xl` strictly forbidden).
- Apple HIG: All interactive touch targets $\ge 44 \times 44\text{px}$.
- Dual-channel status indicators (icon or text + color + border).
- Offline-first: Zero runtime external API dependencies.

---

## Tasks

### Task 1: Graded Dictionary Dataset & Tag Theme Utility
- [ ] Write failing test `tests/vue3/gradedDictionary.test.js` verifying:
  - `GRADED_DICTIONARY` contains key terms across all 5 exam grades (小学, 中考, 高考, 四级, 六级) + 魔法专有
  - `getTagBadgeClass(tag)` returns proper dual-channel accessible Tailwind classes
- [ ] Create `src/data/gradedDictionaryData.js` with comprehensive compact graded dataset
- [ ] Create `src/utils/tagTheme.js` with dual-channel badge color mappings
- [ ] Verify test passes (GREEN)
- [ ] Commit: `git add src/data/gradedDictionaryData.js src/utils/tagTheme.js tests/vue3/gradedDictionary.test.js && git commit -m "feat(dict): add graded dictionary dataset and tag theme utility"`

### Task 2: Lookup Engine Integration & Lemma Fallback
- [ ] Write failing test in `tests/vue3/vocabAndDictionary.test.js` checking that `lookupWord` resolves graded tags (e.g. `discovery` -> `中考核心`, `peculiar` -> `高考重点`, `muggle` -> `魔法专有`, `cat` -> `小学基础`)
- [ ] Update `src/data/dictionaryData.js` to merge `GRADED_DICTIONARY` and `HP_LORE_DICTIONARY` seamlessly
- [ ] Verify test passes (GREEN)
- [ ] Commit: `git add src/data/dictionaryData.js tests/vue3/vocabAndDictionary.test.js && git commit -m "feat(dict): wire graded dictionary and HP lore into lookupWord engine"`

### Task 3: UI Badge Integration across StepListening, WordLookupModal & VocabularyDrawer
- [ ] Update `src/components/session/StepListening.vue` to use `getTagBadgeClass`
- [ ] Update `src/components/common/WordLookupModal.vue` to use `getTagBadgeClass`
- [ ] Update `src/components/VocabularyDrawer.vue` to display graded tags on vocabulary cards
- [ ] Update component unit tests to assert graded badges
- [ ] Verify all tests pass (GREEN)
- [ ] Run `npm test`, `npm run check-emojis`, `npm run verify-security`, `npm run build`
- [ ] Commit: `git add src/components/ tests/vue3/ && git commit -m "feat(ui): display dual-channel graded curriculum badges across all vocabulary views"`
