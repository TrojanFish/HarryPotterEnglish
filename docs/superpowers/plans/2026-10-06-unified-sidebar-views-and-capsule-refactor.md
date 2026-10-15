# Unified Sidebar Page Views & Capsule Button Harmonization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harmonize ReaderTopBar capsule switchers for PWA double-tap elimination and design token consistency, and upgrade sidebar navigation items (生词本, 学业罗盘, 离线管理) into first-class page views (方案A) on desktop and tablet without intrusive modal backdrops.

**Architecture:**
1. Capsule Harmonization: Unify container (`h-10 p-1 rounded-2xl bg-stone-100 border border-[#e8ddd0] flex items-center gap-1`) and buttons (`h-8 px-3 rounded-xl text-xs font-bold bg-amber-500 text-white font-extrabold`) in `ReaderTopBar.jsx`. Remove iOS WebKit title triggers and active-scale shift.
2. Page-View Support in Feature Modules: Add `isPageView` prop to `VocabularyDrawer.jsx`, `AnalyticsDashboard.jsx`, and `StorageManagerModal.jsx` allowing clean embed in workspace without modal backdrop or fixed overlay.
3. Sidebar Routing: Update `DesktopSidebar.jsx` and `TabletRail.jsx` nav items so `vocab`, `analytics`, and `storage` call `onSwitchView(...)` and reflect `isActive: currentView === item.id`.
4. Workspace Integration: Update `App.jsx` to render the active page view in the main workspace while keeping persistent audio playback running via `GlobalPodcastCapsule`.

**Tech Stack:** React 19, Tailwind CSS, Lucide React icons, Node.js native test runner (`node:test`).
**Spec:** `docs/superpowers/specs/2026-10-06-unified-sidebar-views-and-capsule-refactor.md`

## Global Constraints
- Strictly 100% Lucide React SVG icons; zero Unicode emojis.
- Apple HIG touch targets (>= 44x44px or ergonomic padding).
- Warm Parchment Academy palette (`#fbf9f5`, `#e8ddd0`, `#1e1610`, amber accents).
- Strictly zero shadows (`shadow-none` or subtle `shadow-sm` for active capsule segments).

## Review Focus
1. Capsule buttons in `ReaderTopBar` across both dual-engine and study sub-modes share identical `h-10` container and `h-8` button sizing with `bg-amber-500` active token.
2. Clicking sidebar items (生词本, 学业罗盘, 离线管理) switches `currentView` and sets active state without opening black overlay modals on desktop.
3. Audio playback continues uninterrupted when switching between bookshelf, player, vocab, analytics, and storage views.
4. Mobile screens (<768px) and contextual inline triggers retain functional drawer/modal interaction.
5. All 121+ test suites, emoji audit, build, and security checks pass with zero errors.

---

### Task 1: Capsule Button Size Harmonization & PWA Touch Fix in `ReaderTopBar.jsx`

**Files:**
- Modify: `src/components/navigation/ReaderTopBar.jsx`
- Test: `tests/readerTopBarMode.test.js`

**Interfaces:**
- Produces: Identical heights (`h-10` container, `h-8` segment buttons), active styles (`bg-amber-500 text-white font-extrabold shadow-sm`), `touch-action: manipulation; type="button"`, and no `title` attributes on mobile touch elements.

- [ ] **Step 1: Write TDD test asserting uniform capsule heights, tokens, and attributes**
- [ ] **Step 2: Update `src/components/navigation/ReaderTopBar.jsx`**
- [ ] **Step 3: Run `node --test tests/readerTopBarMode.test.js` and verify PASS**

---

### Task 2: Page-View Mode in `VocabularyDrawer.jsx`, `AnalyticsDashboard.jsx`, and `StorageManagerModal.jsx`

**Files:**
- Modify: `src/components/VocabularyDrawer.jsx`
- Modify: `src/components/AnalyticsDashboard.jsx`
- Modify: `src/components/StorageManagerModal.jsx`
- Test: `tests/featurePageViews.test.js`

**Interfaces:**
- Consumes: `isPageView?: boolean` prop
- Produces: When `isPageView={true}`, component renders as an inline full-viewport container (`w-full h-full bg-[#fbf9f5] flex flex-col overflow-y-auto`) without fixed backdrop, without black overlay, and without modal outer wrapper.

- [ ] **Step 1: Write TDD tests in `tests/featurePageViews.test.js`**
- [ ] **Step 2: Add `isPageView` mode support to `VocabularyDrawer.jsx`**
- [ ] **Step 3: Add `isPageView` mode support to `AnalyticsDashboard.jsx`**
- [ ] **Step 4: Add `isPageView` mode support to `StorageManagerModal.jsx`**
- [ ] **Step 5: Run tests and verify PASS**

---

### Task 3: Upgrade `DesktopSidebar.jsx` & `TabletRail.jsx` to Route Views

**Files:**
- Modify: `src/components/navigation/DesktopSidebar.jsx`
- Modify: `src/components/navigation/TabletRail.jsx`
- Test: `tests/desktopSidebarViews.test.js`

**Interfaces:**
- Consumes: `currentView`, `onSwitchView`
- Produces: `isActive: currentView === 'vocab'`, `isActive: currentView === 'analytics'`, `isActive: currentView === 'storage'`, and triggers `onSwitchView('vocab')`, `onSwitchView('analytics')`, `onSwitchView('storage')`.

- [ ] **Step 1: Write TDD test for sidebar active states and view switching**
- [ ] **Step 2: Update `DesktopSidebar.jsx` & `TabletRail.jsx`**
- [ ] **Step 3: Run test and verify PASS**

---

### Task 4: Main Workspace View Routing & Persistent Playback in `App.jsx`

**Files:**
- Modify: `src/App.jsx`
- Test: `tests/appViewRouting.test.js`

**Interfaces:**
- Consumes: `currentView` in `['bookshelf', 'player', 'vocab', 'analytics', 'storage']`
- Produces: Content viewport rendering the matching page component with `isPageView={true}` while keeping `GlobalPodcastCapsule` and audio element alive.

- [ ] **Step 1: Write TDD test for App view routing and persistent player state**
- [ ] **Step 2: Implement view branching in `App.jsx`**
- [ ] **Step 3: Run test and verify PASS**

---

### Task 5: Full Verification Gate & Git Commit

**Files:**
- All touched files

- [ ] **Step 1: Run full unit test suite `npm test`**
- [ ] **Step 2: Run production build `npm run build`**
- [ ] **Step 3: Run zero-emoji check `npm run check-emojis`**
- [ ] **Step 4: Run security verification `npm run verify-security`**
- [ ] **Step 5: Git commit and push**
