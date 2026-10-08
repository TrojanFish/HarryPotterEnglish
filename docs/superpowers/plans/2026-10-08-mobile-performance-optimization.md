# Mobile Performance & 60fps Smoothness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate mobile render latency, background audio CPU pegging, and view switching unmount churn to achieve native 60fps smoothness on mobile devices.

**Architecture:** 
1. GPU hardware-accelerate body background using `body::before` with `translateZ(0)`.
2. Add custom `arePropsEqual` comparator to `SentenceCard` in `SubtitleViewer` so 500+ inactive sentence cards never re-render during 250ms audio playback ticks.
3. Memoize flowing lyric rows in `PodcastLyricsStream` with `React.memo` and replace `transition-all` with lightweight `transition-colors`.
4. Stabilize all callback prop references in `src/App.jsx` using `useCallback` and decouple `BookshelfView` from background audio ticks.
5. Implement Vue-style Keep-Alive view preservation in `src/App.jsx` using CSS `hidden` so switching between bookshelf and player is 0ms instant without DOM destruction or scroll loss.

**Tech Stack:** React 18, Tailwind CSS, Web Audio / HTML5 Audio, Vite, Node test runner.

**Spec:** Zero-emoji Hogwarts design system, Apple HIG (>=44px touch targets), 60fps mobile interaction ergonomics.

## Global Constraints
- Zero Unicode Emojis in code and UI (Lucide React icons only).
- Minimum touch target >= 44x44px.
- All 273+ existing tests must pass (`npm test`).
- Production build must succeed (`npm run build`).
- Zero security leaks (`npm run verify-security`).

## Review Focus
1. `SentenceCard` active transition: when moving from sentence N to N+1, sentence N must deactivate and sentence N+1 must activate.
2. `SentenceCard` bookmark toggle: clicking bookmark must instantly re-render only the clicked card.
3. Audio scrubbing & playback in `SubtitleViewer`: active sentence word illumination must continue to track playback smoothly.
4. View switching: switching between `bookshelf` and `player` retains scroll position and triggers zero unnecessary re-renders.
5. Inactive views: when in `player` view, `BookshelfView` receives no audio ticks; when in `bookshelf` view, lyrics stream receives no re-renders.

---

### Task 1: Hardware-Accelerate Body Background Layer (`src/index.css`)

**Files:**
- Modify: `src/index.css:80-94`
- Test: `tests/mobilePerformanceOptimization.test.js`

**Interfaces:**
- Consumes: CSS layout rules
- Produces: `body::before` fixed layer with `transform: translateZ(0)` and `will-change: transform`, removing `background-attachment: fixed` from `body`.

- [ ] **Step 1: Write the failing test for CSS hardware acceleration**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Update `src/index.css` to move radial gradients to `body::before`**
- [ ] **Step 4: Run test to verify it passes**

---

### Task 2: SubtitleViewer SentenceCard Custom Memo Comparator (`src/components/SubtitleViewer.jsx`)

**Files:**
- Modify: `src/components/SubtitleViewer.jsx:33-54`
- Test: `tests/mobilePerformanceOptimization.test.js`

**Interfaces:**
- Consumes: `SentenceCard` props (`cue`, `isActive`, `isRevealed`, `isBookmarked`, `studyMode`, `showTranslation`, `fontSizeClass`, `isParchment`, `copiedCueId`, `currentTime`, `isPlaying`)
- Produces: Memoized `SentenceCard` with custom `arePropsEqual` comparator that skips rendering when inactive.

- [ ] **Step 1: Add unit tests verifying inactive `SentenceCard` equality checks**
- [ ] **Step 2: Run test to verify it fails or exposes need for comparator**
- [ ] **Step 3: Implement custom `arePropsEqual` comparator on `SentenceCard`**
- [ ] **Step 4: Run test to verify it passes**

---

### Task 3: PodcastLyricsStream Memoized Lyric Line & Transition Optimization (`src/components/podcast/PodcastLyricsStream.jsx`)

**Files:**
- Modify: `src/components/podcast/PodcastLyricsStream.jsx:1-120`
- Test: `tests/mobilePerformanceOptimization.test.js`

**Interfaces:**
- Consumes: `cues`, `activeCueIndex`, `onSeekToCue`, `showTranslation`, `bookmarkedCueIds`, `onToggleBookmarkCue`
- Produces: `PodcastLyricRow = React.memo(...)`, replacement of `transition-all duration-300` with `transition-colors duration-200`.

- [ ] **Step 1: Add unit tests verifying `PodcastLyricRow` memoization and transition class rules**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Refactor `PodcastLyricsStream.jsx` with memoized row component**
- [ ] **Step 4: Run test to verify it passes**

---

### Task 4: App.jsx Callback Stabilization & Keep-Alive View Preservation (`src/App.jsx`)

**Files:**
- Modify: `src/App.jsx:643-855`
- Test: `tests/mobilePerformanceOptimization.test.js`

**Interfaces:**
- Consumes: Navigation actions, playback state
- Produces: Memoized stable callbacks with `useCallback`, Keep-Alive CSS `hidden` preservation for `bookshelf` and `player` views.

- [ ] **Step 1: Add unit tests verifying `App.jsx` stable callbacks and DOM preservation**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Update `src/App.jsx` to wrap handlers in `useCallback` and wrap views in CSS `hidden`**
- [ ] **Step 4: Run test to verify it passes**

---

### Task 5: Full Regression Testing & Audits

- [ ] **Step 1: Run complete unit test suite (`npm test`)**
- [ ] **Step 2: Run build audit (`npm run build`)**
- [ ] **Step 3: Run emoji audit (`npm run check-emojis`)**
- [ ] **Step 4: Run security audit (`npm run verify-security`)**
- [ ] **Step 5: Git commit and push**
