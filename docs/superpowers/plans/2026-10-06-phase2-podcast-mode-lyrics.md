# Phase 2: Immersive Podcast Mode & Flowing Lyrics View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the dedicated, distraction-free "Podcast Mode" (播客随行模式) featuring album artwork, Apple Music/Spotify-style flowing lyrics stream with smooth auto-scroll and 1-click seeking, and a dual-engine switcher allowing seamless toggling between "Podcast Mode" and "Studio Mode" without playback interruption.

**Architecture:** 
1. Subtitle Lyrics Engine: Create `PodcastLyricsStream.jsx` offering large readable typography, active sentence focus lighting, dimmed background lines, auto-centering scrolling, 1-click seeking, and quick bookmarking.
2. Immersive Podcast View: Create `PodcastPlayerView.jsx` integrating cover art, warm parchment ambient background, responsive layout (stacked on mobile, dual-column on tablet/desktop), transport controls (15s relative seek, play/pause, scrub bar, sleep timer, speed).
3. Dual-Engine Switcher & App Integration: Upgrade `ReaderTopBar.jsx` and `App.jsx` with `playerMode` (`'podcast'` | `'studio'`), enabling 1-click instant switching with zero audio pause or reload.

**Tech Stack:** React 19, Tailwind CSS, Lucide React icons, Node.js native test runner (`node:test`), esbuild.

## Global Constraints
- Strictly 100% Lucide React SVG icons; zero Unicode emojis.
- Apple HIG ergonomics: interactive touch targets must be at least 44x44px.
- Warm Parchment Academy palette (`#fbf9f4`, `#e8ddd0`, `#1e1610`, `amber-500`, `amber-950`).
- Strict zero-shadow design (`shadow-none`, rely on 1.5px/2px border and clean backgrounds).
- Audio continuity: switching modes must NEVER pause, reset, or reload the ongoing audio stream.

## Review Focus
1. `PodcastLyricsStream` accurately highlights the active cue, dims surrounding cues, and auto-scrolls to center without jitter.
2. Clicking any lyric cue immediately calls `onSeekToCue` without altering play/pause state.
3. Dual-mode switcher seamlessly transitions between `podcast` and `studio` without triggering audio reload or unmounting the HTMLAudioElement.
4. Mobile layout maintains >= 44x44px touch targets on all buttons and provides toggle between album cover and full lyrics.
5. Zero emoji scan (`npm run check-emojis`), all unit tests (`npm test`), and production build (`npm run build`) pass.

---

### Task 1: Dedicated Flowing Lyrics Stream Component (`PodcastLyricsStream.jsx`)

**Files:**
- Create: `src/components/podcast/PodcastLyricsStream.jsx`
- Create: `tests/podcastLyricsStream.test.js`

**Interfaces:**
- Consumes: `cues: Array<Cue>`, `activeCueIndex: number`, `onSeekToCue: (cue) => void`, `showTranslation: boolean`, `bookmarkedCues?: Set<string>`, `onToggleBookmarkCue?: (cue) => void`
- Produces: `PodcastLyricsStream` component

- [ ] **Step 1: Write failing TDD tests in `tests/podcastLyricsStream.test.js`**
Verify:
- Renders cues with large font classes (`text-lg md:text-xl font-reading`).
- Applies active highlight styling (`text-amber-950 font-bold`) to `activeCueIndex`.
- Inactive lines are gracefully dimmed (`text-stone-400 opacity-60`).
- Clicking a lyric line triggers `onSeekToCue(cue)`.
- Renders translation subtext when `showTranslation` is true.

- [ ] **Step 2: Implement `src/components/podcast/PodcastLyricsStream.jsx`**
Build a memoized flowing lyrics container with smooth `scrollIntoView({ behavior: 'smooth', block: 'center' })`, clickable sentence items, and optional bilingual subtext.

- [ ] **Step 3: Run unit tests and confirm green**
Run `node --test tests/podcastLyricsStream.test.js`.

---

### Task 2: Immersive Podcast Player View (`PodcastPlayerView.jsx`)

**Files:**
- Create: `src/components/podcast/PodcastPlayerView.jsx`
- Create: `tests/podcastPlayerView.test.js`

**Interfaces:**
- Consumes:
  - Audio state: `currentBook`, `currentChapter`, `currentTime`, `duration`, `isPlaying`, `playbackRate`
  - Control callbacks: `onPlayPause`, `onSeek`, `onSeekRelative`, `onNextSentence`, `onPrevSentence`, `onChangePlaybackRate`
  - Lyrics state: `cues`, `activeCueIndex`, `onSeekToCue`, `showTranslation`, `onToggleTranslation`
  - Sleep timer: `sleepTimerMode`, `sleepTimerRemaining`, `onToggleSleepTimer`
  - Mode switch: `onSwitchToStudio`
- Produces: `PodcastPlayerView` component

- [ ] **Step 1: Write failing TDD tests in `tests/podcastPlayerView.test.js`**
Verify:
- Renders desktop dual-column layout (cover + transport on left, lyrics on right).
- Renders mobile responsive layout with tab/toggle between cover and lyrics.
- Includes 15s skip backward/forward, play/pause, rate, and sleep timer.
- Includes "切换精研工坊" (Switch to Studio Mode) CTA.
- All interactive controls respect >= 44x44px touch targets.

- [ ] **Step 2: Implement `src/components/podcast/PodcastPlayerView.jsx`**
Assemble the distraction-free immersive podcast view with warm parchment styling, ambient cover glow, and smooth transport controls.

- [ ] **Step 3: Run unit tests and confirm green**
Run `node --test tests/podcastPlayerView.test.js`.

---

### Task 3: Dual-Mode Switcher in `ReaderTopBar.jsx` & Navigation Alignment

**Files:**
- Modify: `src/components/navigation/ReaderTopBar.jsx`
- Test: `tests/readerTopBarMode.test.js`

- [ ] **Step 1: Write failing TDD tests in `tests/readerTopBarMode.test.js`**
Verify:
- `ReaderTopBar` accepts `playerMode` (`'podcast'` | `'studio'`) and `onSwitchPlayerMode`.
- Renders the dual-engine toggle button/pill (`随行播客` vs `精研工坊`).
- Switching modes invokes `onSwitchPlayerMode`.

- [ ] **Step 2: Update `src/components/navigation/ReaderTopBar.jsx`**
Add the mode switcher pill in the header, allowing users to toggle between Podcast mode and Studio mode directly from the top bar.

- [ ] **Step 3: Run unit tests and confirm green**
Run `node --test tests/readerTopBarMode.test.js`.

---

### Task 4: App Integration, Continuity & Full Verification Suite

**Files:**
- Modify: `src/App.jsx`
- Modify: `package.json` (add new test files to `npm test`)

- [ ] **Step 1: Integrate `playerMode` in `src/App.jsx`**
- Initialize `playerMode` from `localStorage` (`'podcast'` default).
- When `currentView === 'player'`:
  - If `playerMode === 'podcast'`, render `PodcastPlayerView` with shared audio state.
  - If `playerMode === 'studio'`, render the existing `SubtitleViewer` / `DictationStudio` + `AudioPlayer`.
- Ensure audio element is never remounted and playback continues seamlessly during switches.

- [ ] **Step 2: Run complete verification suite**
- `npm test` (all suites pass)
- `npm run build` (production build passes)
- `npm run check-emojis` (zero emoji findings)
- `npm run verify-security` (zero credential leaks)
