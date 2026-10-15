# Three-Device Layout System + TED Module Scaffold — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the responsive layout to give mobile/tablet/desktop each a purpose-built shell, wire the existing Vue session steps into it, and scaffold the TED talk entry point (catalog extension + route + empty view) so Sprint 2 has a clean landing zone.

**Architecture:** Replace the current single-column `App.vue` shell with a three-tier device-aware layout compositor (`AppShell.vue`). Mobile keeps the current bottom-nav pattern. Tablet activates the dormant `TabletRail` (rewritten in Vue). Desktop activates a proper `DesktopSidebar` (rewritten in Vue). All three tiers share the same `<router-view>`-equivalent slot driven by Pinia `navigationStore`. The TED module is scaffolded as a new `currentView = 'ted'` branch in the navigation store and a placeholder `TedHub.vue` so Sprint 2 can fill it in without layout surgery.

**Tech Stack:** Vue 3, Pinia, TailwindCSS 3, Lucide Vue Next, Vite 6. No new runtime dependencies.

**Spec:** `docs/superpowers/plans/2026-10-15-three-device-layout-ted-module.md` (this file; the spec was the transformation plan delivered in the previous conversation turn).

---

## Global Constraints

- Vue 3 `<script setup>` for every new `.vue` file; no Options API.
- All interactive elements `min-h-[44px] min-w-[44px]` (Apple HIG K12 ergonomic floor).
- Zero Unicode emoji in any file; all icons from `lucide-vue-next`.
- Parchment palette only: `#fbf9f5` base, `#e8ddd0` borders, `#1e1610` text, `#f59e0b` amber primary.
- `touch-action: manipulation` on every button (zero 300ms tap delay).
- iOS safe-area insets: top bars use `pt-safe`, bottom bars use `pb-safe`.
- K12 font floor: body text `text-base` (16px) minimum; subtitles `text-lg` (18px).
- No shadow utilities beyond `shadow-sm`; rely on 1.5px borders for depth.
- All new `.vue` files live under `src/`; React `.jsx` files that are superseded stay in place but become dead code (no deletion — zero regression risk).
- `npm test` must remain 236/236 passing after every task.
- `npm run build` must exit zero after every task.
- `npm run check-emojis` must exit zero after every task.

## Review Focus

1. **Safe-area bleed on iPhone notch/Dynamic Island**: `pt-safe` / `pb-safe` must be applied to the top bar and bottom nav; missing it causes the brand logo or tab icons to sit under the notch cutout.
2. **Tablet portrait vs. landscape rail width**: At 768px in portrait the rail (64px) + content leaves only 704px for the subtitle stream — verify `max-w` clamp prevents line-length blowout.
3. **Desktop sidebar collapse state persistence**: `isCollapsed` must survive page refresh via `localStorage`; a missing key causes a layout shift on every reload.
4. **TED catalog entries not appearing in BookshelfDrawer**: `catalogStore.allBooks` must include `ted` type entries only when the TED feature flag is true; otherwise the existing HP books must not be affected.
5. **StepTabBar visibility on TED view**: The four-step tab bar (`原版精听 / 影子跟读 / 拼写听写 / 词汇复习`) is HP-specific and must be hidden when `currentView === 'ted'`; showing it on the TED hub would confuse K12 learners.

---

## Task 1: `navigationStore` — Central View & Device Router

**Files:**
- Create: `src/stores/navigationStore.js`
- Modify: `src/App.vue:1-10` (add store import, wire `currentView`)

**Interfaces:**
- Produces:
  - `useNavigationStore()` → `{ currentView, setView, isCollapsed, toggleCollapsed }`
  - `currentView: 'bookshelf' | 'player' | 'ted' | 'vocab' | 'analytics' | 'storage'`
  - `isCollapsed: boolean` — sidebar collapse state, persisted to `localStorage`
  - `setView(view: string): void`
  - `toggleCollapsed(): void`

- [ ] **Step 1: Write the failing test** — `tests/vue3/navigationStore.test.js`

```js
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { setActivePinia, createPinia } from 'pinia'

// Stub localStorage for Node test env
global.localStorage = { _store: {}, getItem(k) { return this._store[k] ?? null }, setItem(k, v) { this._store[k] = v }, removeItem(k) { delete this._store[k] } }

describe('navigationStore', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('defaults currentView to bookshelf', async () => {
    const { useNavigationStore } = await import('../src/stores/navigationStore.js')
    const nav = useNavigationStore()
    assert.equal(nav.currentView, 'bookshelf')
  })

  it('setView updates currentView', async () => {
    const { useNavigationStore } = await import('../src/stores/navigationStore.js')
    const nav = useNavigationStore()
    nav.setView('ted')
    assert.equal(nav.currentView, 'ted')
  })

  it('toggleCollapsed flips isCollapsed and persists', async () => {
    const { useNavigationStore } = await import('../src/stores/navigationStore.js')
    const nav = useNavigationStore()
    assert.equal(nav.isCollapsed, false)
    nav.toggleCollapsed()
    assert.equal(nav.isCollapsed, true)
    assert.equal(localStorage.getItem('hp_sidebar_collapsed'), 'true')
  })

  it('ignores unknown view strings', async () => {
    const { useNavigationStore } = await import('../src/stores/navigationStore.js')
    const nav = useNavigationStore()
    nav.setView('unknownView')
    assert.equal(nav.currentView, 'bookshelf')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

  Run: `node --test tests/vue3/navigationStore.test.js`
  Expected: FAIL — `navigationStore.js` not found

- [ ] **Step 3: Implement `src/stores/navigationStore.js`**

  ```js
  import { defineStore } from 'pinia'

  const VALID_VIEWS = ['bookshelf', 'player', 'ted', 'vocab', 'analytics', 'storage']
  const COLLAPSED_KEY = 'hp_sidebar_collapsed'

  export const useNavigationStore = defineStore('navigation', {
    state: () => ({
      currentView: 'bookshelf',
      isCollapsed: (() => {
        try { return localStorage.getItem(COLLAPSED_KEY) === 'true' } catch { return false }
      })()
    }),
    actions: {
      setView(view) {
        if (VALID_VIEWS.includes(view)) this.currentView = view
      },
      toggleCollapsed() {
        this.isCollapsed = !this.isCollapsed
        try { localStorage.setItem(COLLAPSED_KEY, String(this.isCollapsed)) } catch {}
      }
    }
  })
  ```

- [ ] **Step 4: Run test to verify it passes**

  Run: `node --test tests/vue3/navigationStore.test.js`
  Expected: PASS (4/4)

- [ ] **Step 5: Commit**

  ```bash
  git add src/stores/navigationStore.js tests/vue3/navigationStore.test.js
  git commit -m "feat(nav): add navigationStore with currentView + sidebar collapse persistence"
  ```

---

## Task 2: `MobileTopBar.vue` — K12-Optimised Mobile Header (Vue)

**Files:**
- Create: `src/components/navigation/MobileTopBarVue.vue`
- Test: `tests/vue3/mobileTopBarVue.test.js`

**Interfaces:**
- Consumes: `useNavigationStore` (`currentView`, `setView`), `useVocabStore` (`vocabList.length`)
- Produces: renders `<header>` with brand mark, chapter selector button, vocab badge button
- Emits: `open-chapter-drawer`, `open-vocab`, `open-analytics`, `open-storage`

> **K12 note**: Brand text enlarged to `text-base font-bold`; subtitle hidden on mobile to save chrome height. Vocab badge enlarged to `text-xs` (was `text-[10px]`).

- [ ] **Step 1: Write the failing test**

```js
// tests/vue3/mobileTopBarVue.test.js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
// Structural smoke test: file exists and exports a default component
it('MobileTopBarVue.vue exports default component', async () => {
  const mod = await import('../src/components/navigation/MobileTopBarVue.vue')
  assert.ok(mod.default, 'default export must exist')
})
```

- [ ] **Step 2: Run test to verify it fails**

  Run: `node --test tests/vue3/mobileTopBarVue.test.js`
  Expected: FAIL — module not found

- [ ] **Step 3: Implement `src/components/navigation/MobileTopBarVue.vue`**

  `<header>` with Tailwind classes `h-14 shrink-0 bg-[#fbf9f5] border-b border-[#e8ddd0] px-4 flex items-center justify-between z-20`.

  Left: amber `Sparkles` 40×40 icon + `h1.font-magical.font-bold.text-base.text-amber-950` ("霍格沃茨英语").

  Center: chapter selector `<button>` `min-h-[44px] px-3 rounded-full border border-[#e8ddd0] bg-white flex items-center gap-2 text-sm font-medium touch-action-manipulation` — emits `open-chapter-drawer` on click.

  Right: `BookMarked` vocab button (relative, badge overlay with `vocabList.length` when > 0) + `BarChart2` analytics button + `HardDrive` storage button — all `min-h-[44px] min-w-[44px]`.

  Safe area: add `env(safe-area-inset-top)` padding via `style="padding-top: env(safe-area-inset-top)"` on the header element.

- [ ] **Step 4: Run test to verify it passes**

  Run: `node --test tests/vue3/mobileTopBarVue.test.js`
  Expected: PASS

- [ ] **Step 5: Commit**

  ```bash
  git add src/components/navigation/MobileTopBarVue.vue tests/vue3/mobileTopBarVue.test.js
  git commit -m "feat(mobile): add K12-optimised MobileTopBarVue in Vue"
  ```

---

## Task 3: `MobileBottomNavVue.vue` — Bottom Navigation Rail (Vue)

**Files:**
- Create: `src/components/navigation/MobileBottomNavVue.vue`
- Test: `tests/vue3/mobileBottomNavVue.test.js`

**Interfaces:**
- Consumes: `useNavigationStore` (`currentView`, `setView`)
- Produces: `<nav>` fixed bottom with 5 tab items: 书架 (`Library`) · TED (`Video`) · 生词本 (`Bookmark`) · 学情 (`BarChart2`) · 离线 (`HardDrive`)
- Active tab: amber fill `bg-amber-500/15 text-amber-700 font-bold`; inactive: `text-stone-500`

> **K12 note**: Label text `text-[11px]` (was `text-[9px]`); icon size 22px (was 20px); touch target padded to `py-2` ensuring ≥ 44px total height.

- [ ] **Step 1: Write the failing test**

```js
// tests/vue3/mobileBottomNavVue.test.js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
it('MobileBottomNavVue.vue exports default', async () => {
  const mod = await import('../src/components/navigation/MobileBottomNavVue.vue')
  assert.ok(mod.default)
})
```

- [ ] **Step 2: Run test to verify it fails**

  Run: `node --test tests/vue3/mobileBottomNavVue.test.js`
  Expected: FAIL

- [ ] **Step 3: Implement `src/components/navigation/MobileBottomNavVue.vue`**

  `<nav>` with `md:hidden fixed bottom-0 inset-x-0 z-30 bg-[#fbf9f5] border-t border-[#e8ddd0] flex items-stretch`.

  Style: `style="padding-bottom: env(safe-area-inset-bottom)"`.

  Five `<button>` items: `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[44px] touch-action-manipulation transition-colors`.

  Nav items array (id, label, icon component, view):
  - `bookshelf` → `Library` → `'bookshelf'`
  - `ted` → `Video` → `'ted'`
  - `vocab` → `Bookmark` → `'vocab'`
  - `analytics` → `BarChart2` → `'analytics'`
  - `storage` → `HardDrive` → `'storage'`

  Active check: `navigationStore.currentView === item.view`.

- [ ] **Step 4: Run test to verify it passes**

  Run: `node --test tests/vue3/mobileBottomNavVue.test.js`
  Expected: PASS

- [ ] **Step 5: Commit**

  ```bash
  git add src/components/navigation/MobileBottomNavVue.vue tests/vue3/mobileBottomNavVue.test.js
  git commit -m "feat(mobile): add MobileBottomNavVue with TED tab and K12 touch targets"
  ```

---

## Task 4: `TabletRailVue.vue` — 64px Icon Rail for Tablet (Vue)

**Files:**
- Create: `src/components/navigation/TabletRailVue.vue`
- Test: `tests/vue3/tabletRailVue.test.js`

**Interfaces:**
- Consumes: `useNavigationStore`, `useVocabStore` (`vocabList.length`), `useAnalyticsStore` (`streakDays`, `todayListeningSeconds`)
- Produces: `<aside>` `hidden md:flex lg:hidden` — 64px fixed-width left rail

> **K12 note**: All icon buttons 44×44px with amber active state. Streak badge shown at bottom with `Flame` icon; label `text-[11px]` for readability.

- [ ] **Step 1: Write the failing test**

```js
// tests/vue3/tabletRailVue.test.js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
it('TabletRailVue.vue exports default', async () => {
  const mod = await import('../src/components/navigation/TabletRailVue.vue')
  assert.ok(mod.default)
})
```

- [ ] **Step 2: Run test to verify it fails**

  Run: `node --test tests/vue3/tabletRailVue.test.js`
  Expected: FAIL

- [ ] **Step 3: Implement `src/components/navigation/TabletRailVue.vue`**

  Container: `<aside class="hidden md:flex lg:hidden w-16 shrink-0 flex-col items-center justify-between border-r border-[#e8ddd0] bg-[#fbf9f5] py-4 px-2 select-none h-full">`.

  Top section: brand amber dot (`w-10 h-10 rounded-2xl bg-amber-500 Sparkles icon`) + vertical `<nav>` of 7 icon buttons (same items as MobileBottomNavVue + `player_reader` → `Headphones` → sets `currentView='player'` + `player_blind` → `EyeOff` → sets `currentView='player'` via playerStore studyMode).

  Each button: `w-11 h-11 rounded-2xl flex items-center justify-center transition-colors touch-action-manipulation cursor-pointer`.
  Active: `bg-amber-500 text-white border border-amber-600`.
  Inactive: `text-stone-500 hover:text-amber-950 hover:bg-white border border-transparent hover:border-[#e8ddd0]`.

  Bottom: `Flame` streak badge (`text-[11px] font-mono text-orange-600`).

- [ ] **Step 4: Run test to verify it passes**

  Run: `node --test tests/vue3/tabletRailVue.test.js`
  Expected: PASS

- [ ] **Step 5: Commit**

  ```bash
  git add src/components/navigation/TabletRailVue.vue tests/vue3/tabletRailVue.test.js
  git commit -m "feat(tablet): add TabletRailVue 64px icon rail in Vue"
  ```

---

## Task 5: `DesktopSidebarVue.vue` — 240px Full Sidebar for Desktop (Vue)

**Files:**
- Create: `src/components/navigation/DesktopSidebarVue.vue`
- Test: `tests/vue3/desktopSidebarVue.test.js`

**Interfaces:**
- Consumes: `useNavigationStore` (`currentView`, `setView`, `isCollapsed`, `toggleCollapsed`), `useVocabStore`, `useAnalyticsStore`
- Produces: `<aside>` `hidden lg:flex` — 240px expanded / 72px collapsed

> **K12 note**: Nav item labels use `text-sm` (was `text-xs`) so children can read them without squinting. Habit ring progress label uses `text-sm` too.

- [ ] **Step 1: Write the failing test**

```js
// tests/vue3/desktopSidebarVue.test.js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
it('DesktopSidebarVue.vue exports default', async () => {
  const mod = await import('../src/components/navigation/DesktopSidebarVue.vue')
  assert.ok(mod.default)
})
```

- [ ] **Step 2: Run test to verify it fails**

  Run: `node --test tests/vue3/desktopSidebarVue.test.js`
  Expected: FAIL

- [ ] **Step 3: Implement `src/components/navigation/DesktopSidebarVue.vue`**

  Container: `<aside :class="['hidden lg:flex shrink-0 flex-col justify-between border-r border-[#e8ddd0] bg-[#fbf9f5] select-none h-full overflow-y-auto transition-all duration-200', isCollapsed ? 'w-18 py-4 px-2 items-center' : 'w-60 p-4']">`.

  Brand row (expanded): amber `Sparkles` icon + `h1` "霍格沃茨英语" `font-magical font-bold text-base text-amber-950` + `PanelLeftClose` toggle button.

  Brand row (collapsed): amber icon + `PanelLeftOpen` toggle.

  Nav items (8 total):
  - `bookshelf` · Library · `'bookshelf'`
  - `ted` · Video · `'ted'`
  - `player_reader` · Headphones · sets `currentView='player'` + studyMode normal
  - `player_blind` · EyeOff · sets `currentView='player'` + studyMode blind
  - `player_dictation` · Zap · sets `currentView='player'` + studyMode dictation
  - `vocab` · Bookmark · `'vocab'` (badge: vocabList.length)
  - `analytics` · BarChart2 · `'analytics'`
  - `storage` · HardDrive · `'storage'` (badge: cachedCount)

  Expanded item: `w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-bold`.
  Collapsed item: `w-11 h-11 rounded-2xl flex items-center justify-center`.

  Bottom (expanded): habit ring card (progress bar `goalPercent`, streak days `Flame`, today minutes), sync dot `bg-emerald-500`, legal link `Scale`.

- [ ] **Step 4: Run test to verify it passes**

  Run: `node --test tests/vue3/desktopSidebarVue.test.js`
  Expected: PASS

- [ ] **Step 5: Commit**

  ```bash
  git add src/components/navigation/DesktopSidebarVue.vue tests/vue3/desktopSidebarVue.test.js
  git commit -m "feat(desktop): add DesktopSidebarVue 240px collapsible sidebar in Vue"
  ```

---

## Task 6: `AppShell.vue` — Device-Aware Layout Compositor

**Files:**
- Create: `src/components/layout/AppShell.vue`
- Test: `tests/vue3/appShell.test.js`

**Interfaces:**
- Consumes: `useNavigationStore` (`currentView`), `useBreakpoint` (from `src/utils/useBreakpoint.js`)
- Produces: outer flex container that composes correct nav tier + main content slot
  - Mobile (`< 768px`): `MobileTopBarVue` (top) + slot (flex-1) + `MobileBottomNavVue` (bottom)
  - Tablet (`768–1023px`): `TabletRailVue` (left) + slot (flex-1)
  - Desktop (`≥ 1024px`): `DesktopSidebarVue` (left) + slot (flex-1)
- Slot default: `<slot />` — receives the step view or TedHub

> **Note**: `useBreakpoint.js` is currently a React hook. A Vue composable version is needed.

- [ ] **Step 1: Write the failing tests**

```js
// tests/vue3/appShell.test.js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

it('AppShell.vue exports default component', async () => {
  const mod = await import('../src/components/layout/AppShell.vue')
  assert.ok(mod.default)
})

it('useBreakpointVue composable exports isMobile/isTablet/isDesktop', async () => {
  const mod = await import('../src/utils/useBreakpointVue.js')
  assert.equal(typeof mod.useBreakpointVue, 'function')
})
```

- [ ] **Step 2: Run tests to verify they fail**

  Run: `node --test tests/vue3/appShell.test.js`
  Expected: FAIL

- [ ] **Step 3a: Create `src/utils/useBreakpointVue.js`**

  ```js
  import { ref, onMounted, onUnmounted } from 'vue'

  export function useBreakpointVue() {
    const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)
    let timer = null
    function onResize() {
      clearTimeout(timer)
      timer = setTimeout(() => { windowWidth.value = window.innerWidth }, 60)
    }
    onMounted(() => window.addEventListener('resize', onResize))
    onUnmounted(() => { window.removeEventListener('resize', onResize); clearTimeout(timer) })
    return {
      windowWidth,
      isMobile: () => windowWidth.value < 768,
      isTablet: () => windowWidth.value >= 768 && windowWidth.value < 1024,
      isDesktop: () => windowWidth.value >= 1024
    }
  }
  ```

- [ ] **Step 3b: Create `src/components/layout/AppShell.vue`**

  Template:
  ```html
  <div class="h-full w-full flex flex-col bg-[#fbf9f5] overflow-hidden">
    <!-- Top bar: mobile only -->
    <MobileTopBarVue class="md:hidden" @open-chapter-drawer="..." ... />

    <!-- Step tab bar: HP sessions only, hidden on TED view -->
    <StepTabBar v-if="navStore.currentView === 'player'" />

    <!-- Audio error banner (shared) -->
    ...

    <!-- Middle flex: sidebar + content -->
    <div class="flex-1 min-h-0 flex overflow-hidden">
      <TabletRailVue />       <!-- hidden md:flex lg:hidden -->
      <DesktopSidebarVue />   <!-- hidden lg:flex -->

      <!-- Main content slot -->
      <main class="flex-1 min-w-0 overflow-hidden relative flex flex-col">
        <slot />
      </main>
    </div>

    <!-- Bottom nav: mobile only -->
    <MobileBottomNavVue class="md:hidden" />

    <!-- Persistent audio player bar -->
    <SmartAudioPlayer />
  </div>
  ```

  All modals (VocabularyDrawer, AnalyticsDashboard, StorageManagerModal, etc.) are rendered inside `AppShell` and toggled by watching `navStore.currentView` — switching to `'vocab'` opens VocabularyDrawer, etc.

- [ ] **Step 4: Run tests to verify they pass**

  Run: `node --test tests/vue3/appShell.test.js`
  Expected: PASS

- [ ] **Step 5: Commit**

  ```bash
  git add src/components/layout/AppShell.vue src/utils/useBreakpointVue.js tests/vue3/appShell.test.js
  git commit -m "feat(layout): add AppShell three-device compositor + useBreakpointVue"
  ```

---

## Task 7: Wire `App.vue` to Use `AppShell`

**Files:**
- Modify: `src/App.vue` (replace current shell template with `<AppShell>` wrapper)

**Interfaces:**
- Consumes: `AppShell` (Task 6), `useNavigationStore` (Task 1)
- Produces: `App.vue` template reduced to `<AppShell>` + step-view switcher + TedHub placeholder

> **Critical**: Audio `<audio>` element and all `watch()` bindings (playback, subtitle sync, MediaSession) stay in `App.vue`'s `<script setup>`. Only the template shell moves to `AppShell`.

- [ ] **Step 1: Write the regression test**

```js
// tests/vue3/appVueIntegration.test.js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

it('App.vue still imports SmartAudioPlayer', async () => {
  const fs = await import('node:fs')
  const src = fs.readFileSync('src/App.vue', 'utf8')
  assert.ok(src.includes('SmartAudioPlayer'), 'SmartAudioPlayer must remain imported')
})

it('App.vue uses AppShell', async () => {
  const fs = await import('node:fs')
  const src = fs.readFileSync('src/App.vue', 'utf8')
  assert.ok(src.includes('AppShell'), 'AppShell must be used in App.vue')
})

it('App.vue does not use MobileBottomNav jsx (dead code)', async () => {
  const fs = await import('node:fs')
  const src = fs.readFileSync('src/App.vue', 'utf8')
  assert.ok(!src.includes("from './components/navigation/MobileBottomNav.jsx'"), 'jsx nav must not be imported in App.vue')
})
```

- [ ] **Step 2: Run test to verify first two assertions fail and third passes**

  Run: `node --test tests/vue3/appVueIntegration.test.js`
  Expected: 2 FAIL, 1 PASS

- [ ] **Step 3: Modify `src/App.vue` template**

  Replace the entire `<template>` block. The new template:
  ```html
  <template>
    <!-- Hidden native audio element (audio bindings unchanged) -->
    <audio ref="audioRef" ... class="hidden" />

    <AppShell>
      <!-- Step views for HP audio sessions -->
      <template v-if="navStore.currentView === 'player' || navStore.currentView === 'bookshelf'">
        <MagicErrorBoundary>
          <StepListening     v-if="sessionStore.currentStep === 1" />
          <StepShadowing     v-else-if="sessionStore.currentStep === 2" />
          <StepDictation     v-else-if="sessionStore.currentStep === 3" />
          <StepVocabReview   v-else-if="sessionStore.currentStep === 4" />
        </MagicErrorBoundary>
      </template>

      <!-- TED hub placeholder (Sprint 2 will fill) -->
      <TedHub v-else-if="navStore.currentView === 'ted'" />

      <!-- Drawer views rendered as full-height panels -->
      <VocabularyFullView  v-else-if="navStore.currentView === 'vocab'" />
      <AnalyticsFullView   v-else-if="navStore.currentView === 'analytics'" />
      <StorageFullView     v-else-if="navStore.currentView === 'storage'" />
    </AppShell>
  </template>
  ```

  Add imports: `AppShell`, `TedHub` (placeholder), `useNavigationStore`.
  Keep all `<script setup>` logic unchanged (audio bindings, watchers, keyboard shortcuts).

- [ ] **Step 4: Run full test suite**

  Run: `npm test`
  Expected: 236/236 PASS (+ 5 new tests from Tasks 1–6)

- [ ] **Step 5: Run build verification**

  Run: `npm run build`
  Expected: exit 0, no errors

- [ ] **Step 6: Run audits**

  Run: `npm run check-emojis && npm run verify-security`
  Expected: both exit 0

- [ ] **Step 7: Commit**

  ```bash
  git add src/App.vue tests/vue3/appVueIntegration.test.js
  git commit -m "feat(shell): wire App.vue to AppShell three-device compositor"
  ```

---

## Task 8: `TedHub.vue` — TED Module Entry Placeholder

**Files:**
- Create: `src/components/ted/TedHub.vue`
- Test: `tests/vue3/tedHub.test.js`

**Interfaces:**
- Consumes: `useNavigationStore`
- Produces: full-height intentional empty state with primary CTA "即将开放 · 敬请期待"
  - Shows `Video` Lucide icon (48px container)
  - Headline: "TED 魔法精讲" `text-lg font-bold text-amber-950`
  - Body: "每期精选 TED 演讲，配词汇预热、精看任务与跟读评测，助你突破 B1 英语瓶颈。"
  - No emoji; K12 font floor `text-base`

> **Sprint 2 will replace this with the real TED player.** This task only ensures the navigation slot renders without error and passes the emoji audit.

- [ ] **Step 1: Write the failing test**

```js
// tests/vue3/tedHub.test.js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

it('TedHub.vue exports default', async () => {
  const mod = await import('../src/components/ted/TedHub.vue')
  assert.ok(mod.default)
})

it('TedHub.vue contains no emoji characters', async () => {
  const fs = await import('node:fs')
  const src = fs.readFileSync('src/components/ted/TedHub.vue', 'utf8')
  const emojiRegex = /[\u{1F300}-\u{1FAFF}]/u
  assert.ok(!emojiRegex.test(src), 'TedHub.vue must contain zero emoji')
})
```

- [ ] **Step 2: Run test to verify it fails**

  Run: `node --test tests/vue3/tedHub.test.js`
  Expected: FAIL

- [ ] **Step 3: Implement `src/components/ted/TedHub.vue`**

  Full-height centered empty state. Use `Video` icon (Lucide) in `w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-300/80 flex items-center justify-center text-amber-700` container. Text: headline `text-lg font-bold font-magical text-amber-950`, body `text-base text-stone-600 leading-relaxed max-w-sm`, sub-note `text-sm text-stone-400`. No buttons needed (it is a placeholder, not a broken state).

- [ ] **Step 4: Run test to verify it passes**

  Run: `node --test tests/vue3/tedHub.test.js`
  Expected: PASS

- [ ] **Step 5: Commit**

  ```bash
  git add src/components/ted/TedHub.vue tests/vue3/tedHub.test.js
  git commit -m "feat(ted): scaffold TedHub.vue placeholder for Sprint 2"
  ```

---

## Task 9: Tablet Two-Column Layout for `StepListening`

**Files:**
- Modify: `src/components/session/StepListening.vue:2-6` (add `lg:flex-row` forced, constrain right panel show/hide)

**Interfaces:**
- Consumes: no new stores; modifies existing two-column layout
- Produces: on tablet (`md`) the right vocab panel shows at 38% width; on desktop (`lg`) it shows at 32% width with `max-w-sm`; on mobile it is hidden (unchanged)

> **Current state**: `StepListening.vue` already has `md:flex-row` and a `hidden md:flex md:flex-[0.8]` right column — but the content area has no max-width constraint causing line length blowout on wide tablets.

- [ ] **Step 1: Write the regression test**

```js
// tests/vue3/stepListeningLayout.test.js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

it('StepListening left column constrains line length', async () => {
  const fs = await import('node:fs')
  const src = fs.readFileSync('src/components/session/StepListening.vue', 'utf8')
  assert.ok(src.includes('max-w-3xl') || src.includes('max-w-2xl'), 'left column must have max-width to prevent line-length blowout on wide screens')
})

it('StepListening right panel shown on md and above', async () => {
  const fs = await import('node:fs')
  const src = fs.readFileSync('src/components/session/StepListening.vue', 'utf8')
  assert.ok(src.includes('hidden md:flex'), 'right panel must use hidden md:flex')
})
```

- [ ] **Step 2: Run test to verify first assertion fails**

  Run: `node --test tests/vue3/stepListeningLayout.test.js`
  Expected: first assertion FAIL (no max-w), second PASS

- [ ] **Step 3: Modify `src/components/session/StepListening.vue`**

  In the left column div (line 4–6), add `max-w-3xl` to the existing class list so the subtitle stream is capped even on ultra-wide displays.

  In the right panel div (line 85), change `md:flex-[0.8]` to `md:w-80 lg:w-72 shrink-0` — fixed width instead of flex ratio, preventing the panel from compressing subtitle text.

- [ ] **Step 4: Run test to verify it passes**

  Run: `node --test tests/vue3/stepListeningLayout.test.js`
  Expected: PASS (2/2)

- [ ] **Step 5: Run full suite**

  Run: `npm test`
  Expected: all passing

- [ ] **Step 6: Commit**

  ```bash
  git add src/components/session/StepListening.vue tests/vue3/stepListeningLayout.test.js
  git commit -m "fix(layout): constrain StepListening subtitle line length on tablet/desktop"
  ```

---

## Task 10: K12 Typography & Touch Target Audit Pass

**Files:**
- Modify: `src/components/session/StepListening.vue` (subtitle font size)
- Modify: `src/components/session/StepDictation.vue` (input font floor check)
- Modify: `src/components/player/SmartAudioPlayer.vue` (control button sizes)

**Interfaces:**
- Produces: auditable changes ensuring K12 readability floor across three core session views

> K12 critical rules: subtitle English text ≥ `text-lg` (18px); Chinese translation ≥ `text-sm` (14px); all `<input>` ≥ `text-base` (16px, iOS anti-zoom); audio control buttons ≥ `min-h-[44px]`.

- [ ] **Step 1: Write the failing test**

```js
// tests/vue3/k12Typography.test.js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

it('StepListening subtitle uses text-lg or larger', async () => {
  const fs = await import('node:fs')
  const src = fs.readFileSync('src/components/session/StepListening.vue', 'utf8')
  // current: font-serif text-lg sm:text-xl — already OK
  assert.ok(src.includes('text-lg') || src.includes('text-xl'), 'English subtitle must be at least text-lg')
})

it('StepDictation inputs have text-base minimum', async () => {
  const fs = await import('node:fs')
  const src = fs.readFileSync('src/components/session/StepDictation.vue', 'utf8')
  assert.ok(src.includes('text-base'), '<input> must use text-base to prevent iOS Safari zoom')
})

it('SmartAudioPlayer buttons have min-h-[44px]', async () => {
  const fs = await import('node:fs')
  const src = fs.readFileSync('src/components/player/SmartAudioPlayer.vue', 'utf8')
  assert.ok(src.includes('min-h-[44px]') || src.includes('h-11') || src.includes('h-12'), 'audio player buttons must meet 44px touch target')
})
```

- [ ] **Step 2: Run test to verify status**

  Run: `node --test tests/vue3/k12Typography.test.js`
  Note which assertions pass/fail to identify what needs fixing.

- [ ] **Step 3: Apply fixes for any failing assertions**

  - `StepListening.vue`: if subtitle `<p>` uses `text-base`, bump to `text-lg sm:text-xl` (English) and `text-sm sm:text-base` (Chinese translation).
  - `StepDictation.vue`: ensure all `<input>` elements have `text-base` class. Add `autoCapitalize="none" autoCorrect="off" spellCheck="false"` attributes.
  - `SmartAudioPlayer.vue`: ensure play/pause and seek buttons have `min-h-[44px]` or equivalent `h-11`/`h-12`.

- [ ] **Step 4: Run full suite + audits**

  Run: `npm test && npm run check-emojis && npm run build`
  Expected: all pass

- [ ] **Step 5: Commit**

  ```bash
  git add src/components/session/StepListening.vue src/components/session/StepDictation.vue src/components/player/SmartAudioPlayer.vue tests/vue3/k12Typography.test.js
  git commit -m "fix(k12): enforce K12 typography floor and 44px touch targets across session views"
  ```

---

## Task 11: Final Verification Pass

**Files:** Read-only verification — no code changes.

- [ ] **Step 1: Run complete test suite**

  Run: `npm test`
  Expected: all tests pass (236 original + ~12 new = ~248 total)

- [ ] **Step 2: Run build**

  Run: `npm run build`
  Expected: exit 0, dist/ generated

- [ ] **Step 3: Run security audit**

  Run: `npm run verify-security`
  Expected: zero credential leakage warnings

- [ ] **Step 4: Run emoji audit**

  Run: `npm run check-emojis`
  Expected: zero emoji found in new files

- [ ] **Step 5: Visual verification checklist (manual)**

  Run `npm run dev` and verify in browser:
  - [ ] Mobile (375px): bottom nav shows 5 tabs including "TED"; top bar has amber brand; no horizontal overflow
  - [ ] Mobile (375px): tap "TED" tab → `TedHub.vue` placeholder renders correctly
  - [ ] Tablet (768px): left 64px rail visible; content area fills remaining width; `StepListening` shows two columns
  - [ ] Desktop (1024px+): 240px sidebar visible; collapse button works; collapse state persists on refresh
  - [ ] Desktop (1280px+): `StepListening` subtitle column has comfortable line length (not full 100vw)
  - [ ] All audio playback controls remain functional after shell refactor

- [ ] **Step 6: Final commit**

  ```bash
  git add -A
  git commit -m "feat(sprint-1): complete three-device layout system + TED scaffold + K12 typography

  - navigationStore: view routing + sidebar collapse persistence
  - MobileTopBarVue: amber K12-optimised header with safe-area insets
  - MobileBottomNavVue: 5-tab bottom nav (HP + TED + Vocab + Analytics + Storage)
  - TabletRailVue: 64px icon rail (md:flex lg:hidden)
  - DesktopSidebarVue: 240px collapsible sidebar (lg:flex), text-sm nav labels
  - AppShell: device-aware layout compositor composing all three nav tiers
  - App.vue: wired to AppShell, session steps and TedHub routed by navigationStore
  - TedHub.vue: intentional empty state placeholder for Sprint 2
  - StepListening: max-w-3xl subtitle constraint + fixed right panel width
  - K12 audit: text-base inputs, text-lg subtitles, 44px touch targets"
  ```
