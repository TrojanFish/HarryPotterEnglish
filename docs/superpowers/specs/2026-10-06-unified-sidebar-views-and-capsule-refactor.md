# Unified Sidebar Page Views & Capsule Button Harmonization Specification

**Date:** 2026-10-06  
**Status:** Approved by User (方案A: 全面一级页面化)  
**Scope:** Architectural Navigation Refactor & Mobile PWA Capsule Touch Harmonization  

---

## 1. Problem Statement & Root Cause

### Issue 1: Mixed Navigation Paradigms in Desktop/Tablet Sidebar
- **Symptom:** In `DesktopSidebar` and `TabletRail`, clicking "魔法书架" and "随行播客/原著精听" switches the workspace page view (`currentView`), while clicking "魔法生词本", "学业罗盘", and "离线管理" pops up dark-backdrop modal windows (`fixed inset-0 bg-black/75 backdrop-blur-sm`).
- **Root Cause:** Historical evolution from mobile-first single-page player. On mobile, drawers and modals saved screen space. When the desktop sidebar was created, it directly reused mobile modal triggers (`setIsVocabOpen(true)`, `setIsAnalyticsOpen(true)`, `setIsStorageOpen(true)`), leaving `isActive: false` and jarring users with an intrusive modal overlay.
- **Resolution (方案A):** Upgrade "魔法生词本", "学业罗盘", and "离线管理" to first-class page views in `currentView` (`'bookshelf' | 'player' | 'vocab' | 'analytics' | 'storage'`). In desktop and tablet, they render directly in the main workspace without modal backdrops. The sidebar items maintain consistent active highlights (`bg-amber-500 text-white`). Persistent audio continues playing seamlessly with the `GlobalPodcastCapsule`.

### Issue 2: PWA Double-Tap Quirk on Segment Capsule Buttons
- **Symptom:** On mobile touch/PWA, switching capsule button modes requires two taps.
- **Root Cause:**
  1. Tailwind CSS lacked `future: { hoverOnlyWhenSupported: true }`, causing WebKit to emulate hover on touch 1 and delay click to touch 2.
  2. Buttons in `ReaderTopBar` had HTML `title="..."` attributes. iOS WebKit captures the first tap on titled elements for preview/tooltip inspection.
  3. `active:scale-95` on touchstart shifts button geometry under the finger, causing touchend to misfire outside the target.
- **Resolution:**
  - `tailwind.config.js` with `hoverOnlyWhenSupported: true` (already configured).
  - Remove `title` attributes on mobile touch buttons; use `aria-label`.
  - Remove `active:scale-95` on capsule toggles; enforce `touch-action: manipulation; type="button"`.

### Issue 3: Inconsistent Capsule Button Dimensions in ReaderTopBar
- **Symptom:** "随行播客 | 精研工坊" capsule height was `h-10` with `min-h-[36px]` buttons and `bg-amber-500`, while desktop "双语精听 | 魔法磨耳朵 | 拼写大闯关" had `h-8` buttons and `bg-amber-600`, and mobile had `rounded-xl` container with `rounded-lg` buttons.
- **Resolution:** Standardize all capsule switchers to a unified token system:
  - Container: `h-10 p-1 rounded-2xl bg-stone-100 border border-[#e8ddd0] flex items-center gap-1`
  - Buttons: `h-8 px-3 rounded-xl text-xs font-bold transition-colors select-none`
  - Active: `bg-amber-500 text-white shadow-sm font-extrabold`
  - Inactive: `text-stone-600 hover:text-amber-950 hover:bg-white/80`

---

## 2. Architecture & Data Flow

### 2.1 View Routing
In `App.jsx`:
```javascript
const [currentView, setCurrentView] = useState(() => {
  try {
    return localStorage.getItem('hp_current_view') || 'bookshelf';
  } catch {
    return 'bookshelf';
  }
});
// Valid views: 'bookshelf' | 'player' | 'vocab' | 'analytics' | 'storage'
```

### 2.2 Sidebar Navigation Mapping
In `DesktopSidebar.jsx` and `TabletRail.jsx`:
- `navItems`:
  - `bookshelf` -> `onSwitchView('bookshelf')` -> `isActive: currentView === 'bookshelf'`
  - `podcast` -> `onSwitchView('player')` & `onSwitchPlayerMode('podcast')` -> `isActive: currentView === 'player' && playerMode === 'podcast'`
  - `player_normal` -> `onSwitchView('player')` & `onSwitchPlayerMode('studio')` & `setStudyMode('normal')`
  - `player_blind` -> `onSwitchView('player')` & `onSwitchPlayerMode('studio')` & `setStudyMode('blind')`
  - `player_dictation` -> `onSwitchView('player')` & `onSwitchPlayerMode('studio')` & `setStudyMode('dictation')`
  - `vocab` -> `onSwitchView('vocab')` -> `isActive: currentView === 'vocab'`
  - `analytics` -> `onSwitchView('analytics')` -> `isActive: currentView === 'analytics'`
  - `storage` -> `onSwitchView('storage')` -> `isActive: currentView === 'storage'`

### 2.3 Page View vs. Modal Component Strategy
Components support an `isPageView={true|false}` prop:
- When `isPageView={true}` (rendered in main workspace for desktop/tablet):
  - No fixed overlay backdrop (`bg-black/75` or `fixed inset-0`).
  - Container uses `w-full h-full flex flex-col bg-[#fbf9f5] overflow-y-auto`.
  - Header displays page title, actions, and a "返回 (Back to Player/Bookshelf)" button if needed.
- When `isPageView={false}` (modal/drawer for mobile or contextual triggers):
  - Retains existing overlay drawer/modal for mobile drawers and contextual dictionary lookups.

---

## 3. Global Constraints
- Zero emojis strictly enforced (`npm run check-emojis`).
- Apple HIG touch targets (>= 44x44px).
- Warm parchment aesthetic (`#fbf9f5`, `#e8ddd0`, `#1e1610`, amber accents).
- 100% backward compatible with existing unit tests and offline database.
