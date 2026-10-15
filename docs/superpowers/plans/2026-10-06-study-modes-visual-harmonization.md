# Study Modes Visual & Scrollbar Harmonization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Overview
Harmonize the layout, scrollbar placement, and sub-header styling across the three primary study modes in Hogwarts Audio (双语精听, 魔法磨耳朵, 拼写大闯关) to ensure consistent user experience, eliminating inset scrollbars and jumpy header layouts.

## Proposed Changes

### 1. `src/components/SubtitleViewer.jsx`
- Separate outer full-width scroll container (`w-full overflow-y-auto ios-scroll`) from inner centered content (`max-w-4xl mx-auto`).
- Upgrade sticky sub-header to full-width background (`w-full bg-[#fbf9f4]/95 border-b border-[#e8ddd0] backdrop-blur-md sticky top-0 z-10`), with inner contents centered in `max-w-4xl mx-auto px-4 py-2 flex items-center justify-between`.
- Add explicit mode identity badges:
  - `studyMode === 'normal'`: `<Headphones size={13} className="text-amber-600" /> <span className="font-bold text-amber-950 text-xs sm:text-sm">双语精听</span>`
  - `studyMode === 'blind'`: `<EyeOff size={13} className="text-indigo-600" /> <span className="font-bold text-indigo-950 text-xs sm:text-sm">魔法磨耳朵</span> <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-bold">迷雾遮罩</span>`
- Harmonize sentence progress counter to `第 {activeCueIndex + 1} / {cues.length} 句`.

### 2. `src/components/DictationStudio.jsx`
- Wrap sub-header inner content with `max-w-4xl mx-auto px-4 py-2` to align with `SubtitleViewer`.
- Harmonize Row 1 identity badge and progress counter structure.
- Align central exercise card max-width to `max-w-4xl mx-auto`.
- Sync translation clue state with `showTranslation` prop from parent.

### 3. `src/components/navigation/ReaderTopBar.jsx` & `src/App.jsx`
- Keep `Languages` translation button visible in `ReaderTopBar` across all three modes (`normal`, `blind`, `dictation`), eliminating layout shift.
- Pass `showTranslation` and toggle handler to `DictationStudio` to link with translation clues.

---

## Tasks

- [ ] Task 1: TDD test suite `tests/studyModesHarmonization.test.js`
- [ ] Task 2: SubtitleViewer scrollbar & sub-header full-width harmonization
- [ ] Task 3: DictationStudio sub-header & container harmonization
- [ ] Task 4: ReaderTopBar translation button consistency across all study modes
- [ ] Task 5: Full verification gate (`npm test`, `npm run build`, `npm run check-emojis`, `npm run verify-security`) & Git push
