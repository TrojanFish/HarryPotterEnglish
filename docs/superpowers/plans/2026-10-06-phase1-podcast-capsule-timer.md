# Phase 1: Global Persistent Podcast Capsule & Transport Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the app into a modern podcast listening experience by upgrading audio transport with 15s relative seeking, introducing a Hogwarts Sleep Timer, and implementing a cross-platform Global Podcast Capsule Player across desktop, tablet, and mobile.

**Architecture:** 
1. Core logic: Add `seekRelative` to `useAudioPlayback.js` and build `sleepTimer.js` helper / hook.
2. Global capsule: Refactor `MobileMiniPlayer.jsx` into `GlobalPodcastCapsule.jsx` with responsive layouts (mobile bottom dock, desktop floating parchment glass bar with transport controls, 15s skip buttons, rate indicator, sleep timer).
3. AudioPlayer: Add 15s seek buttons and sleep timer trigger to the in-classroom `AudioPlayer.jsx`.
4. App integration: Provide persistent capsule across all non-player views (Bookshelf, Vocab Drawer, Analytics, Storage).

**Tech Stack:** React 19, Tailwind CSS, Lucide React icons, Node.js native test runner (`node:test`).

## Global Constraints
- Strictly 100% Lucide React SVG icons; zero Unicode emojis.
- Apple HIG ergonomics: interactive touch targets must be at least 44x44px.
- Warm Parchment Academy palette (`#fbf9f4`, `#e8ddd0`, `#1e1610`, `amber-500`, `amber-950`).
- Strict zero-shadow design (`shadow-none`, rely on 1.5px border and micro backgrounds).

## Review Focus
1. `seekRelative(-15)` and `seekRelative(15)` bounds-clamp accurately between 0 and `duration`.
2. Sleep timer correctly counts down, triggers audio pause on expiration, and supports 'end_of_chapter'.
3. GlobalPodcastCapsule renders on both mobile and desktop (when audio has played or is playing) in non-player views.
4. Interactive buttons on capsule and player conform to Apple HIG >= 44x44px touch targets.
5. Zero emoji scan (`npm run check-emojis`), unit tests (`npm test`), and production build (`npm run build`) pass.

---

### Task 1: Sleep Timer Core Logic & Unit Tests

**Files:**
- Create: `src/utils/sleepTimer.js`
- Test: `tests/sleepTimer.test.js`

- [ ] **Step 1: Write failing TDD tests in `tests/sleepTimer.test.js`**
Tests to verify:
- Initial state, formatting remaining time (e.g. `14:59`, `本集结束`).
- Timer decrementing and expiration callback firing.
- 'end_of_chapter' mode detection.
- Cancelling/clearing active timer.

- [ ] **Step 2: Implement `src/utils/sleepTimer.js`**
Clean pure functions / timer manager that handles sleep timer presets (15, 30, 45, 'end_of_chapter') and formatting.

- [ ] **Step 3: Run unit tests and confirm green**
Run `node --test tests/sleepTimer.test.js`.

---

### Task 2: Relative Seeking in `useAudioPlayback.js` & `AudioPlayer.jsx` Enhancement

**Files:**
- Modify: `src/hooks/useAudioPlayback.js`
- Modify: `src/components/AudioPlayer.jsx`
- Test: `tests/audioPlayerControls.test.js`

- [ ] **Step 1: Add `seekRelative` to `useAudioPlayback.js`**
Add and export `seekRelative(offsetSeconds)` that clamps `0 <= target <= duration`.

- [ ] **Step 2: Enhance `AudioPlayer.jsx` with 15s skip & sleep timer**
Add:
- `RotateCcw` 15s skip backward button.
- `RotateCw` 15s skip forward button.
- Sleep timer dropdown / toggle button with active remaining indicator.

- [ ] **Step 3: Add unit test verifying 15s controls in `tests/audioPlayerControls.test.js`**
Run `node --test tests/audioPlayerControls.test.js`.

---

### Task 3: Cross-Platform `GlobalPodcastCapsule.jsx` Component

**Files:**
- Create/Refactor: `src/components/navigation/GlobalPodcastCapsule.jsx`
- Test: `tests/globalPodcastCapsule.test.js`

- [ ] **Step 1: Write TDD test in `tests/globalPodcastCapsule.test.js`**
Verify:
- Desktop view renders centered floating capsule with cover, titles, 15s seek buttons, play/pause, sleep timer indicator.
- Mobile view renders compact bottom capsule adhering to safe areas and 44px touch targets.
- Clicking info area triggers `onEnterPlayer`.

- [ ] **Step 2: Implement `GlobalPodcastCapsule.jsx`**
Responsive, noble parchment floating player capsule.

- [ ] **Step 3: Run unit tests and confirm green**
Run `node --test tests/globalPodcastCapsule.test.js`.

---

### Task 4: App Integration & Zero-Regression Verification

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Connect `GlobalPodcastCapsule` and sleep timer in `src/App.jsx`**
Wire `GlobalPodcastCapsule` into `App.jsx`, replacing the mobile-only `MobileMiniPlayer` so it functions on desktop, tablet, and mobile.
Integrate sleep timer state and pass down to both `GlobalPodcastCapsule` and `AudioPlayer`.

- [ ] **Step 2: Run verification suite**
- `npm test`
- `npm run build`
- `npm run check-emojis`
- `npm run verify-security`
