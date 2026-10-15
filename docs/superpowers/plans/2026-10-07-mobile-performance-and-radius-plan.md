# Mobile PWA 120Hz Fluid Performance & 4-Tier Border Radius Standardization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve mobile/PWA performance lag and page switching stutter by eliminating GPU backdrop-filter overhead, throttling localStorage I/O, and applying React.memo boundary isolation; unify all UI buttons and containers according to the 4-tier Hogwarts border radius standard.

**Architecture:** 
1. Remove 25 heavy `backdrop-blur-*` GPU compositing shaders on mobile touch surfaces, replacing them with high-opacity crisp parchment backgrounds.
2. Throttle `localStorage.setItem('hp_last_position')` in `useAudioPlayback.js` to 5 seconds and flush on pause/unload.
3. Protect view components (`BookshelfView`, `PodcastPlayerView`, `ReaderTopBar`, `MobileTopBar`, `DesktopSidebar`, `TabletRail`, `GlobalPodcastCapsule`) with `React.memo` to isolate root `currentTime` ticks.
4. Normalize all interactive buttons to Tier 2 `rounded-xl` (12px) and cards to Tier 3 `rounded-2xl` (16px), preserving 56px play CTA as `rounded-full`.

**Tech Stack:** React 18, Tailwind CSS, Vite, Node.js Test Runner.

**Spec:** `docs/superpowers/specs/2026-10-07-mobile-performance-and-radius-design.md`

## Global Constraints
- Zero Unicode emojis (Lucide React icons only).
- Warm parchment palette (#fbf9f5, #e8ddd0, amber/bronze accents).
- Apple HIG touch targets (>= 44x44px for buttons, 56x56px for central play CTA).
- Offline-first: IndexedDB and LocalStorage backward compatibility preserved.

## Review Focus
- High-frequency scrubbing must not trigger disk write thrashing.
- Page transitions must feel instant on mobile touch devices.
- No visual clipping or broken button layouts after border radius normalization.
- All existing 123 test suites (220 tests) must continue to pass with zero regression.

---

### Task 1: Performance - Throttled LocalStorage Breakpoint Persistence

**Files:**
- Modify: `src/hooks/useAudioPlayback.js:40-54`
- Test: `tests/mobilePerformanceAndRadius.test.js`

**Interfaces:**
- Consumes: `currentTime`, `duration`, `currentBookObj`, `currentChapterObj`, `isPlaying`
- Produces: Throttled disk write (at most once every 5000ms during playback; immediate write on pause)

- [ ] **Step 1: Write failing test in `tests/mobilePerformanceAndRadius.test.js`**
  Assert that `useAudioPlayback.js` throttles `localStorage.setItem` and does not write on every single tick.

- [ ] **Step 2: Run test to verify it fails**
  Run: `node --test tests/mobilePerformanceAndRadius.test.js`
  Expected: FAIL

- [ ] **Step 3: Implement throttled persistence in `src/hooks/useAudioPlayback.js`**
  Use `lastSavedTimeRef` to save at most once every 5 seconds while playing, and immediately on pause.

- [ ] **Step 4: Run test to verify it passes**
  Run: `node --test tests/mobilePerformanceAndRadius.test.js`
  Expected: PASS

- [ ] **Step 5: Commit**
  Run: `git commit -m "perf(audio): throttle localStorage breakpoint persistence to eliminate mobile disk I/O thrashing"`

---

### Task 2: Performance - Eliminate GPU Backdrop-Blur Overhead on Mobile

**Files:**
- Modify: `src/components/navigation/ReaderTopBar.jsx`
- Modify: `src/components/navigation/MobileTopBar.jsx`
- Modify: `src/components/navigation/GlobalPodcastCapsule.jsx`
- Modify: `src/components/podcast/PodcastPlayerView.jsx`
- Modify: `src/components/navigation/MobileBottomNav.jsx`
- Test: `tests/mobilePerformanceAndRadius.test.js`

**Interfaces:**
- Replaces: `backdrop-blur-md`, `backdrop-blur-sm`, `backdrop-blur-xl` on mobile fixed/sticky containers.
- Produces: Clean, lightweight `bg-white/98` / `bg-[#fbf9f5]` surfaces with zero GPU shader cost.

- [ ] **Step 1: Add assertions to `tests/mobilePerformanceAndRadius.test.js`**
  Verify mobile-critical navigation bars and player consoles do not contain `backdrop-blur`.

- [ ] **Step 2: Run test to verify failure**
  Run: `node --test tests/mobilePerformanceAndRadius.test.js`
  Expected: FAIL

- [ ] **Step 3: Refactor containers in components**
  Replace `backdrop-blur-*` with solid/98% opacity warm parchment backgrounds.

- [ ] **Step 4: Run test to verify pass**
  Run: `node --test tests/mobilePerformanceAndRadius.test.js`
  Expected: PASS

- [ ] **Step 5: Commit**
  Run: `git commit -m "perf(mobile): remove heavy backdrop-filter shaders from mobile navigation and player consoles"`

---

### Task 3: Performance - React.memo View Boundary Isolation

**Files:**
- Modify: `src/components/BookshelfView.jsx`
- Modify: `src/components/podcast/PodcastPlayerView.jsx`
- Modify: `src/components/navigation/DesktopSidebar.jsx`
- Modify: `src/components/navigation/TabletRail.jsx`
- Modify: `src/components/navigation/ReaderTopBar.jsx`
- Modify: `src/components/navigation/MobileTopBar.jsx`
- Modify: `src/components/navigation/GlobalPodcastCapsule.jsx`
- Test: `tests/mobilePerformanceAndRadius.test.js`

**Interfaces:**
- Produces: Memoized view exports (`export const BookshelfView = React.memo(...)`, etc.)

- [ ] **Step 1: Add assertions to `tests/mobilePerformanceAndRadius.test.js`**
  Verify key view components are exported as `React.memo`.

- [ ] **Step 2: Run test to verify failure**
  Run: `node --test tests/mobilePerformanceAndRadius.test.js`
  Expected: FAIL

- [ ] **Step 3: Wrap components in `React.memo`**

- [ ] **Step 4: Run test to verify pass**
  Run: `node --test tests/mobilePerformanceAndRadius.test.js`
  Expected: PASS

- [ ] **Step 5: Commit**
  Run: `git commit -m "perf(render): memoize key views to isolate root audio tick re-renders"`

---

### Task 4: Design System - 4-Tier Border Radius Standardization

**Files:**
- Modify: `src/components/podcast/PodcastPlayerView.jsx`
- Modify: `src/components/navigation/GlobalPodcastCapsule.jsx`
- Modify: `src/components/BookshelfView.jsx`
- Modify: `src/components/navigation/ReaderTopBar.jsx`
- Modify: `src/components/navigation/MobileTopBar.jsx`
- Modify: `src/components/navigation/TabletRail.jsx`
- Test: `tests/mobilePerformanceAndRadius.test.js`

**Interfaces:**
- Interactive Buttons: `rounded-xl` (12px)
- Cards & Containers: `rounded-2xl` (16px)
- Center Play CTA: `rounded-full`

- [ ] **Step 1: Add border radius standards test to `tests/mobilePerformanceAndRadius.test.js`**

- [ ] **Step 2: Run test to verify failure**
  Run: `node --test tests/mobilePerformanceAndRadius.test.js`
  Expected: FAIL

- [ ] **Step 3: Refactor button classes to `rounded-xl` and containers to `rounded-2xl`**

- [ ] **Step 4: Run test to verify pass**
  Run: `node --test tests/mobilePerformanceAndRadius.test.js`
  Expected: PASS

- [ ] **Step 5: Commit**
  Run: `git commit -m "style(design): standardize button corners to rounded-xl and containers to rounded-2xl"`

---

### Task 5: Full Quality Gates & Zero-Regression Verification

**Files:**
- Modify: `package.json` (add `tests/mobilePerformanceAndRadius.test.js` to `test` script)
- Run: `npm test`, `npm run test:simulation`, `npm run check-emojis`, `npm run verify-security`, `npm run build`

- [ ] **Step 1: Add new test to `package.json` test script**
- [ ] **Step 2: Run `npm test` across all 124 suites**
- [ ] **Step 3: Run `npm run test:simulation` (38/38 checks)**
- [ ] **Step 4: Run `npm run check-emojis`**
- [ ] **Step 5: Run `npm run verify-security`**
- [ ] **Step 6: Run `npm run build`**
- [ ] **Step 7: Commit and push to `origin main`**
