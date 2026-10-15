# iOS Bottom Sheet Modals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform mobile modals (`StorageManagerModal`, `AnalyticsDashboard`, `ShortcutsModal`) into native iPhone Bottom Sheets with pull handles and swipe-down-to-dismiss gesture physics.

**Design System & Ergonomics:**
- Mobile: `items-end p-0`, `rounded-t-2xl sm:rounded-2xl`, `max-h-[88vh]`, `pb-[calc(env(safe-area-inset-bottom,0px)+12px)]`.
- Pull Handle: `w-10 h-1.5 rounded-full bg-stone-300 mx-auto my-2.5 sm:hidden`.
- Gesture Physics: 1:1 follow downward drag; threshold >= 80px triggers close; < 80px smoothly springs back.
- Zero Unicode Emojis; Apple HIG >= 44x44px touch targets; 03 极简书房 palette.

---

### Task 1: Create `src/composables/useBottomSheet.js` & Unit Tests
- [ ] Write failing test in `tests/vue3/bottomSheet.test.js` checking gesture tracking, threshold detection, and spring reset.
- [ ] Implement `src/composables/useBottomSheet.js` with `sheetOffsetY`, `isDragging`, `handleTouchStart`, `handleTouchMove`, `handleTouchEnd`, and `sheetStyle`.
- [ ] Run `npm test` to verify Task 1 passes.

### Task 2: Upgrade `StorageManagerModal.vue` to iOS Bottom Sheet
- [ ] Update template to responsive bottom sheet container (`items-end sm:items-center p-0 sm:p-4`).
- [ ] Add iOS pull handle (`w-10 h-1.5 rounded-full bg-stone-300 mx-auto my-2.5 sm:hidden`).
- [ ] Attach `useBottomSheet` touch handlers to header and handle, applying `:style="sheetStyle"`.
- [ ] Add safe area padding `pb-[calc(env(safe-area-inset-bottom,0px)+12px)]`.
- [ ] Run `npm test` to verify.

### Task 3: Upgrade `AnalyticsDashboard.vue` to iOS Bottom Sheet
- [ ] Update template to responsive bottom sheet container.
- [ ] Add iOS pull handle.
- [ ] Attach `useBottomSheet` touch handlers and `sheetStyle`.
- [ ] Add safe area padding.
- [ ] Run `npm test` to verify.

### Task 4: Upgrade `ShortcutsModal.vue` to iOS Bottom Sheet
- [ ] Update template to responsive bottom sheet container.
- [ ] Add iOS pull handle.
- [ ] Attach `useBottomSheet` touch handlers and `sheetStyle`.
- [ ] Add safe area padding.
- [ ] Run `npm test` to verify.

### Task 5: Verification & Quality Gates
- [ ] Run `npm test` (all unit & integration tests pass).
- [ ] Run `npm run check-emojis` (0 emoji findings).
- [ ] Run `npm run verify-security` (0 credential leaks).
- [ ] Run `npm run build` (clean Vite build).
- [ ] Commit and push changes to `main`.
