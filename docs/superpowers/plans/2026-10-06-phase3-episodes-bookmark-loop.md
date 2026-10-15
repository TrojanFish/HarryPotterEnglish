# Phase 3: Podcast Episode Showcase & Accio Bookmark Learning Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform chapter selection into an episodic podcast showcase with duration, progress, and badges, while establishing a closed-loop "Accio Bookmark" learning flow from passive podcast listening to active sentence mastery in Studio Mode and Vocabulary Drawer.

**Architecture:** 
1. Sentence Bookmark Store: Implement `useBookmarkManager.js` hook managing `bookmarkedSentences` with localStorage persistence, toggle actions, and chapter-based indexing.
2. Podcast Episode Cards: Refactor chapter displays in `BookShelfDrawer.jsx` and `BookshelfView.jsx` with podcast episode cards featuring episode tags (`EP.01`), duration, active wave animations, and bookmark counts.
3. Studio Mode & SubtitleViewer Integration: Highlight bookmarked sentences in `SubtitleViewer.jsx` with jump affordances and quick bookmark toggles.
4. VocabularyDrawer Sentence Workshop: Add "疑难句专练" (Starred Sentences Workshop) tab in `VocabularyDrawer.jsx` for targeted sentence review and TTS playback.

**Tech Stack:** React 19, Tailwind CSS, Lucide React icons, Node.js native test runner (`node:test`), esbuild.

## Global Constraints
- Strictly 100% Lucide React SVG icons; zero Unicode emojis.
- Apple HIG ergonomics: interactive touch targets must be at least 44x44px.
- Warm Parchment Academy palette (`#fbf9f4`, `#e8ddd0`, `#1e1610`, `amber-500`, `amber-950`).
- Strict zero-shadow design (`shadow-none`, rely on 1.5px/2px border and clean backgrounds).
- Dual-channel accessibility: state changes indicated with both icons and text/borders.

## Review Focus
1. Toggling a bookmark in `PodcastPlayerView` immediately reflects in `bookmarkedCueIds` and persists in `localStorage`.
2. `BookShelfDrawer` and `BookshelfView` display episode metadata (`EP.01`, duration, playing status) clearly on mobile and desktop.
3. `VocabularyDrawer` cleanly switches between "生词本" (Words) and "疑难句" (Starred Sentences), supporting search and deletion.
4. Bookmarked sentences render distinctly in `SubtitleViewer` without breaking existing word click or audio sync.
5. Verification suite (`npm test`, `npm run build`, `npm run check-emojis`, `npm run verify-security`) passes with zero warnings or errors.

---

### Task 1: Sentence Bookmark Manager Hook (`useBookmarkManager.js` & Tests)

**Files:**
- Create: `src/hooks/useBookmarkManager.js`
- Create: `tests/bookmarkManager.test.js`

**Interfaces:**
- Produces: `useBookmarkManager()` exporting:
  - `bookmarkedSentences: Array<{ id, cueId, text, translation, bookId, chapterId, createdAt }>`
  - `bookmarkedCueIds: Set<string>`
  - `toggleBookmarkSentence: (cue, bookId, chapterId) => void`
  - `removeBookmark: (id) => void`
  - `clearAllBookmarks: () => void`
  - `getChapterBookmarkCount: (bookId, chapterId) => number`

- [ ] **Step 1: Write failing TDD tests in `tests/bookmarkManager.test.js`**
Verify adding, toggling, removing, and computing chapter bookmark counts.

- [ ] **Step 2: Implement `src/hooks/useBookmarkManager.js`**
Pure hook with `localStorage` persistence under `'hp_bookmarked_sentences'`.

- [ ] **Step 3: Run unit tests and confirm green**
Run `node --test tests/bookmarkManager.test.js`.

---

### Task 2: Podcast Episode Showcase Cards (`EpisodeCard.jsx` & Drawer Update)

**Files:**
- Create: `src/components/podcast/PodcastEpisodeCard.jsx`
- Modify: `src/components/BookShelfDrawer.jsx`
- Create: `tests/podcastEpisodeCard.test.js`

**Interfaces:**
- Consumes: `chapter`, `chapterIndex`, `isCurrent`, `isPlaying`, `bookmarkCount`, `onSelectChapter`
- Produces: `PodcastEpisodeCard` component

- [ ] **Step 1: Write failing TDD tests in `tests/podcastEpisodeCard.test.js`**
Verify `EP.01` formatting, duration display, active wave pulse, bookmark count pill, and >= 44x44px touch targets.

- [ ] **Step 2: Implement `src/components/podcast/PodcastEpisodeCard.jsx`**
Clean, modern podcast episode card component conforming to parchment design.

- [ ] **Step 3: Integrate into `src/components/BookShelfDrawer.jsx`**
Replace plain list items with `PodcastEpisodeCard`.

- [ ] **Step 4: Run unit tests and confirm green**
Run `node --test tests/podcastEpisodeCard.test.js`.

---

### Task 3: Starred Sentences Workshop in `VocabularyDrawer.jsx`

**Files:**
- Modify: `src/components/VocabularyDrawer.jsx`
- Create: `tests/vocabularyDrawerSentences.test.js`

- [ ] **Step 1: Write failing TDD tests in `tests/vocabularyDrawerSentences.test.js`**
Verify switching to "疑难句专练" tab renders bookmarked sentences, speech TTS buttons, and removal triggers.

- [ ] **Step 2: Update `src/components/VocabularyDrawer.jsx`**
Add tab switcher (`生词本` vs `疑难句`), sentence item list with English/Chinese typography, pronunciation, and deletion.

- [ ] **Step 3: Run unit tests and confirm green**
Run `node --test tests/vocabularyDrawerSentences.test.js`.

---

### Task 4: App Integration, Closed-Loop Wiring & Verification Suite

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/SubtitleViewer.jsx`
- Modify: `package.json`

- [ ] **Step 1: Connect `useBookmarkManager` in `src/App.jsx`**
Pass bookmark state and actions to `PodcastPlayerView`, `SubtitleViewer`, `BookShelfDrawer`, and `VocabularyDrawer`.

- [ ] **Step 2: Add bookmark badge & jump in `src/components/SubtitleViewer.jsx`**
Render bookmark indicators on bookmarked sentence cards.

- [ ] **Step 3: Run complete verification suite**
- `npm test`
- `npm run build`
- `npm run check-emojis`
- `npm run verify-security`
