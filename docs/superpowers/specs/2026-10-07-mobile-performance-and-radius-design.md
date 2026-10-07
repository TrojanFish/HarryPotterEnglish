# Design Specification: Mobile PWA 120Hz Fluid Performance & 4-Tier Border Radius Standardization

**Date:** 2026-10-07  
**Status:** Approved  
**Author:** Antigravity & DeepMind Agent Pair  

---

## 1. Overview & Problem Definition

During user testing on iPhone 15 Pro and mobile PWA environments, two critical deficiencies were identified:
1. **Mobile / PWA Stutter & Lag during View Transitions:**
   - PC execution is fluid (60-144fps), but mobile PWA exhibits high touch latency, stuttering, and dropped frames when switching between views (`bookshelf` <-> `player` <-> `vocab` <-> `analytics` <-> `storage`).
   - Root Causes:
     - GPU off-screen compositing overload caused by 25 instances of `backdrop-blur-*` on mobile WebKit.
     - Frequent root-level re-render cascade: `currentTime` updating 4 times/sec (every 250ms) in root `App.jsx`, causing un-memoized views to re-diff continuously.
     - Synchronous blocking disk I/O: `localStorage.setItem('hp_last_position')` serialized and written synchronously on every 250ms audio tick.
2. **Inconsistent Border Radius Hierarchy Across Components:**
   - Button and container corners lack a uniform design token standard (randomly mixing `rounded-xl`, `rounded-2xl`, `rounded-lg`, `rounded-full`, and `rounded-3xl`).
   - Lack of concentric radius geometry ($R_{outer} \approx R_{inner} + \text{padding}$), causing visual disharmony and ragged borders.

---

## 2. Mobile PWA 120Hz Fluidity Architecture

### 2.1 Elimination of Heavy GPU Backdrop Blurs on Mobile
- WebKit/iOS renders `backdrop-filter: blur(...)` by copying the screen buffer into an off-screen GPU surface, running a multi-pass Gaussian blur shader, and blending it back. On mobile, this causes severe frame drops during touch scroll and page transitions.
- **Refactoring Strategy:**
  - Replace `backdrop-blur-md` and `backdrop-blur-sm` on sticky topbars, bottom navigation, and capsule containers with high-opacity solid warm parchment surfaces:
    - Light/Parchment mode: `bg-[#fbf9f5]/98` or `bg-white/98` with crisp `border-[#e8ddd0]`.
    - Modal backdrops: Clean translucent overlay `bg-black/60` without heavy blur shaders.
  - Apply `transform-gpu` and `will-change: transform` only to moving elements (like active slide/drawer) to prevent excessive layer allocation.

### 2.2 Re-render Cascade Isolation & React.memo
- Wrap core top-level view components in `React.memo`:
  - `BookshelfView.jsx`
  - `PodcastPlayerView.jsx`
  - `SubtitleViewer.jsx`
  - `PodcastLyricsStream.jsx`
  - `ReaderTopBar.jsx`
  - `MobileTopBar.jsx`
  - `DesktopSidebar.jsx`
  - `TabletRail.jsx`
  - `GlobalPodcastCapsule.jsx`
- Ensure callback props passed from `App.jsx` (`onSwitchView`, `onPlayPause`, `onSeekToCue`, etc.) are stable `useCallback` references.

### 2.3 Throttled LocalStorage Breakpoint Persistence
- In `useAudioPlayback.js`:
  - Replace raw `[currentTime]` reactive `localStorage.setItem` with a throttled ref:
  - Save to disk at most once every 5 seconds during active playback.
  - Instantly save upon user pause (`isPlaying: true -> false`), visibility change (`visibilitychange`), or component unmount.
  - Eliminates 4 synchronous blocking flash disk writes per second on mobile SQLite.

---

## 3. The 4-Tier Hogwarts Border Radius Standard (四级圆角规范)

Adhering to `educational-ui-spec` and `refactoring-ui-spec`:

| Tier | Tailwind Token | Radius (px) | Strict Usage Scope |
|---|---|:---:|---|
| **Tier 1: Micro / Chips** | `rounded-lg` | **8px** | CEFR level pills (`A2`, `B1`), small status tags, phonetic chips, radar tags |
| **Tier 2: Controls & Buttons** | `rounded-xl` | **12px** | **All interactive buttons** (44px touch targets: Prev/Next, Speed, Sleep, Translation, Bookmark, Copy, Modal Close, Form inputs) |
| **Tier 3: Cards & Containers** | `rounded-2xl` | **16px** | **All content cards & floating bars** (Sentence cards, Book cards, Resume card, Anchored player console container, Floating capsule container) |
| **Tier 4: Surfaces & Drawers** | `rounded-3xl` | **24px** | Mobile bottom sheets, large dialog containers, large album cover artwork |
| **Special: Circular & Pills** | `rounded-full` | **9999px** | **Strictly 2 cases:** ① 56px center Play CTA; ② Search input pill & Streak flame count pill |

### Concentric Radius Law
For any button inside a card or floating console:
- Outer container: `rounded-2xl` (16px) with `p-2` to `p-3` (8-12px padding).
- Inner buttons: `rounded-xl` (12px).
- Smooth mathematical concentricity: $16\text{px} \approx 12\text{px} + 8\text{px} / 2$.

---

## 4. Verification & Testing Protocol

1. **Unit & Structural Tests**:
   - `tests/mobilePerformanceAndRadius.test.js` checking:
     - Zero `backdrop-blur` on mobile-critical bars (`MobileTopBar`, `ReaderTopBar`, `GlobalPodcastCapsule`, `PodcastPlayerView` anchored console).
     - Standardized `rounded-xl` buttons across player views.
     - Throttled `localStorage` in `useAudioPlayback.js`.
2. **Quality Gates**:
   - `npm test` across all 124+ suites.
   - `npm run test:simulation` (38/38 checks pass).
   - `npm run check-emojis` (0 findings).
   - `npm run verify-security` (0 leaks).
   - `npm run build` (clean exit 0).
