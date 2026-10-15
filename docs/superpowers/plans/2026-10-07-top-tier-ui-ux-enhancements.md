# Top-Tier UI/UX Experience Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement top-tier UI/UX human-factors and aesthetic enhancements across Hogwarts Audio, focusing on mobile touch target ergonomics, dictation keyboard adaptation, 0.382 golden ratio reading anchor, and Harry Potter lore exclusive highlights.

**Architecture:**
- **Ergonomics & Touch Expansion:** Expand word token hit boxes in `SubtitleViewer.jsx` with minimum 44px-compliant padding and active feedback without disrupting sentence flow.
- **Dictation Viewport Adaptation:** Utilize dynamic viewport height (`100dvh`), `interactive-widget` handling, and sticky audio control bar in `DictationStudio.jsx` and typing components.
- **Reading Anchor (0.382 Golden Ratio):** Calculate programmatic container scroll top offset at $0.382$ golden ratio point, paired with a compass re-anchor floating button during roaming.
- **HP Lore Immersion:** Visually elevate `HP_LORE_DICTIONARY` terms in `SubtitleViewer.jsx` and auto-activate the `lore` tab in `WordModal.jsx`.

**Tech Stack:** React 18, Tailwind CSS, Lucide React, Node.js test runner (`node:test`).

## Global Constraints
- Zero Emojis across all UI strings, component templates, and messages.
- Apple HIG touch targets ($\ge 44 \times 44\text{pt}$).
- Warm parchment design tokens (`#fbf9f4`, `#e8ddd0`, `#1e1610`, amber/bronze accents).
- WCAG AAA dark-on-light accessible contrast ratio.
- Non-destructive upgrades that maintain all 229 passing unit tests and 35 simulation tests.

## Review Focus
1. Word token hit boxes expanding without causing line wrap jitter or layout shifts.
2. Mobile soft keyboard opening without hiding the sentence prompt or audio playback controls.
3. Rapid audio sentence transitions scrolling smoothly without scroll snapping collisions or disorientation.
4. Clicking HP lore words correctly opening `WordModal` directly focused on the lore tab.
5. All non-lore words continuing to function seamlessly with the dictionary meaning tab.

---

## Tasks

### Phase 1: P0 — Mobile Touch Ergonomics & Dictation Keyboard Adaptation

#### Task 1: Word Token Touch Target Expansion & Tap Disambiguation in SubtitleViewer
**Files:**
- Modify: `src/components/SubtitleViewer.jsx`
- Create: `tests/subtitleTouchTargetErgonomics.test.js`

**Interfaces:**
- Consumes: `tokenizeSentence` from `src/utils/vttParser.js`, `HP_LORE_DICTIONARY` from `src/data/hpDictionary.js`
- Produces: Enhanced word token span elements with touch target margin expansion, touch-action manipulation, and active press feedback.

- [ ] **Step 1: Write the failing test for word token touch ergonomics**
Create `tests/subtitleTouchTargetErgonomics.test.js` asserting that rendered word tokens in `SentenceCard` have touch padding (`py-0.5`, `px-1`), `touch-manipulation`, and active tap feedback classes.

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test tests/subtitleTouchTargetErgonomics.test.js`
Expected: FAIL

- [ ] **Step 3: Implement touch target expansion in `src/components/SubtitleViewer.jsx`**
Update the token rendering loop in `SentenceCard`:
1. Add `touch-manipulation select-text py-0.5 px-1 -my-0.5 -mx-0.5 rounded-sm active:scale-95 transition-transform` to interactive word spans.
2. Ensure spacing tokens remain untappable without extra padding.
3. Retain existing Apple Podcasts word illumination styling.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test tests/subtitleTouchTargetErgonomics.test.js`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/components/SubtitleViewer.jsx tests/subtitleTouchTargetErgonomics.test.js
git commit -m "feat(ui): expand mobile touch hit radius for subtitle word tokens"
```

---

#### Task 2: Dictation Studio 100dvh & Mobile Keyboard Viewport Adaptation
**Files:**
- Modify: `src/components/DictationStudio.jsx`
- Modify: `src/components/dictation/AurorFullTyping.jsx`
- Modify: `src/components/dictation/LumosClozeInput.jsx`
- Create: `tests/dictationKeyboardErgonomics.test.js`

**Interfaces:**
- Consumes: `DictationStudio` container and child input components.
- Produces: Viewport resilience using `min-h-[100dvh] max-h-[100dvh]`, sticky mobile audio player bar, and input auto-scroll on virtual keyboard resize.

- [ ] **Step 1: Write the failing test for dictation keyboard layout**
Create `tests/dictationKeyboardErgonomics.test.js` asserting that `DictationStudio` and typing subcomponents have `100dvh` container classes and proper input scroll-into-view resilience.

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test tests/dictationKeyboardErgonomics.test.js`
Expected: FAIL

- [ ] **Step 3: Implement viewport adaptation and sticky audio transport bar**
1. In `src/components/DictationStudio.jsx`: Ensure the root container uses `h-[100dvh] max-h-[100dvh] flex flex-col overscroll-contain`.
2. In `src/components/dictation/AurorFullTyping.jsx`: Maintain `visualViewport` resize listener to keep active textarea in view without hiding the audio replay button.
3. In `src/components/dictation/LumosClozeInput.jsx`: Ensure cloze blank inputs smoothly focus and scroll into view when keyboard opens.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test tests/dictationKeyboardErgonomics.test.js`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/components/DictationStudio.jsx src/components/dictation/AurorFullTyping.jsx src/components/dictation/LumosClozeInput.jsx tests/dictationKeyboardErgonomics.test.js
git commit -m "feat(dictation): optimize mobile keyboard viewport with 100dvh and sticky transport"
```

---

### Phase 2: P1 — Reading Anchor & Harry Potter Lore Integration

#### Task 3: 0.382 Golden Ratio Reading Anchor & Roaming Re-anchor Action
**Files:**
- Modify: `src/components/SubtitleViewer.jsx`
- Create: `tests/subtitleReadingAnchor.test.js`

**Interfaces:**
- Consumes: `containerRef`, `activeCueRef`, `activeCueIndex`
- Produces: Precise golden ratio scroll positioning calculation and floating re-anchor compass action.

- [ ] **Step 1: Write the failing test for 0.382 reading anchor**
Create `tests/subtitleReadingAnchor.test.js` verifying that `SubtitleViewer` provides container scroll calculation based on 0.382 golden ratio and renders the re-anchor button when roaming.

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test tests/subtitleReadingAnchor.test.js`
Expected: FAIL

- [ ] **Step 3: Implement 0.382 golden ratio scroll calculation and re-anchor UI**
1. Replace `activeCueRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })` with:
```javascript
const container = containerRef.current;
const target = activeCueRef.current;
if (container && target) {
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const offset = targetRect.top - containerRect.top + container.scrollTop;
  const targetScrollTop = offset - (container.clientHeight * 0.382);
  container.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
}
```
2. Enhance floating button with Lucide `Compass`, displaying current sentence number and clean parchment styling.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test tests/subtitleReadingAnchor.test.js`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/components/SubtitleViewer.jsx tests/subtitleReadingAnchor.test.js
git commit -m "feat(subtitles): implement 0.382 golden ratio reading anchor and compass re-anchor"
```

---

#### Task 4: Harry Potter Lore Exclusive Highlight & Wax Seal Lore Modal Focus
**Files:**
- Modify: `src/components/SubtitleViewer.jsx`
- Modify: `src/components/WordModal.jsx`
- Modify: `src/App.jsx`
- Create: `tests/hpLoreWordHighlight.test.js`

**Interfaces:**
- Consumes: `HP_LORE_DICTIONARY` from `src/data/hpDictionary.js`, `WordModal`
- Produces: Distinctive dashed amber-600 underline with subtle parchment wax tint for HP terms, auto-switching `WordModal` to `'lore'` tab when clicked.

- [ ] **Step 1: Write the failing test for HP lore highlight & default lore tab**
Create `tests/hpLoreWordHighlight.test.js` verifying:
1. Words in `HP_LORE_DICTIONARY` receive the lore highlight badge/styling.
2. `WordModal` accepts `initialTab` or detects `wordData.lore` to default to `'lore'` tab when opened from a lore term.

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test tests/hpLoreWordHighlight.test.js`
Expected: FAIL

- [ ] **Step 3: Implement lore highlight and auto-tab selection**
1. In `SubtitleViewer.jsx`: Pass `isHpTerm` metadata to `onWordClick(token.text, cue, { isHpTerm })`.
2. In `WordModal.jsx`: Default `activeTab` to `wordData?.lore ? 'lore' : 'meaning'`.
3. In `SentenceCard`: Render HP terms with `border-b-2 border-dashed border-amber-600/70 text-amber-950 font-semibold bg-amber-500/10 px-1 rounded-sm`.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test tests/hpLoreWordHighlight.test.js`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/components/SubtitleViewer.jsx src/components/WordModal.jsx src/App.jsx tests/hpLoreWordHighlight.test.js
git commit -m "feat(lore): introduce wizarding world wax-seal highlight and lore-first dictionary tab"
```

---

### Phase 3: Verification & Quality Gate
- [ ] **Task 5: Complete Verification Suite**
  - Run all unit tests: `npm test`
  - Run simulation tests: `npm run test:simulation`
  - Run zero-emoji audit: `npm run check-emojis`
  - Run security check: `npm run verify-security`
  - Run build check: `npm run build`
