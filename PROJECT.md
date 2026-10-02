# Project: Hogwarts Audio Functional Expansion

## Architecture
- **Framework & Tech Stack**: React 18, Vite 5, TailwindCSS 3, Lucide React icons, Native HTML5 Audio, Web Speech API, IndexedDB (`HogwartsOfflineDB`), `localStorage`.
- **Application Architecture**:
  - Root Coordinator: `src/App.jsx` handles global state, `<audio ref={audioRef} />`, playback state, chapter selection, modal toggles.
  - Subtitle & Audio Pipeline: `src/utils/vttParser.js` parses WebVTT cues; `src/components/SubtitleViewer.jsx` highlights cues with Lumos focus (`.lumos-active`).
  - Speech Evaluation Pipeline (R1): `src/utils/speechScoring.js` calculates normalized scores (0–100%) and token diffs; `src/components/ShadowingRecorder.jsx` captures mic audio and renders color highlights.
  - Analytics & Habits Pipeline (R2): `src/utils/analyticsStore.js` persists listening duration, dictation records, and streaks in `localStorage`; `src/components/AnalyticsDashboard.jsx` renders Hogwarts-themed interactive SVG charts.
  - Anki Export Pipeline (R3): `src/utils/ankiExport.js` transforms vocabulary into standard Anki TSV/CSV with directives, bolded context quotes, IPA, and audio timestamp markers; `src/components/VocabularyDrawer.jsx` exports files.
  - Offline Chapter Caching Pipeline (R4): `src/utils/offlineStorage.js` manages IndexedDB `HogwartsOfflineDB` for audio Blobs and VTT texts; `src/components/StorageManagerModal.jsx` handles download progress and storage quotas; `src/App.jsx` switches seamlessly to offline Blob URLs.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Speech Recognition & Capture | Capture user voice using Web Speech API with fallback for non-supported browsers | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Normalized Pronunciation Scoring | Calculate 0–100% objective similarity score within <2s latency | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Word-Level Visual Distinction | Color code words in green (matched), amber (partial/sound-alike), red (missing/inaccurate) | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Shadowing Recorder Integration | Integrate pronunciation evaluation into `ShadowingRecorder.jsx` modal preserving original/recorded playback | M1 | ORIGINAL_REQUEST §R1 |
| 5 | Persistent Analytics Storage | Store daily listening seconds, completed chapters, dictation history, and streaks in `localStorage` | M2 | ORIGINAL_REQUEST §R2 |
| 6 | Listening Duration & Habit Tracker | Track active playback time across sessions and calculate consecutive study day streaks | M2 | ORIGINAL_REQUEST §R2 |
| 7 | Dictation Performance Persistence | Save dictation accuracy, words, and session results into persistent analytics store | M2 | ORIGINAL_REQUEST §R2 |
| 8 | Hogwarts Analytics Dashboard | Interactive dashboard with SVG charts (weekly listening minutes, accuracy history), streak badges, and stat cards | M2 | ORIGINAL_REQUEST §R2 |
| 9 | Extended Vocabulary Schema | Support audio timestamp markers (`startTime`, `endTime`), chapterId, and bookId in vocab list | M3 | ORIGINAL_REQUEST §R3 |
| 10 | Anki TSV/CSV Export Pipeline | Export vocabulary formatted with Anki directives (`#separator:Tab`, `#html:true`, `#deck`, `#tags`) | M3 | ORIGINAL_REQUEST §R3 |
| 11 | Card Formatting with Context & IPA | Highlight/cloze target words in context quotes, format IPA, Chinese translations, and lore blocks | M3 | ORIGINAL_REQUEST §R3 |
| 12 | IndexedDB Chapter Asset Store | Store full chapter audio MP3 as binary Blob and VTT subtitles in `HogwartsOfflineDB` | M4 | ORIGINAL_REQUEST §R4 |
| 13 | Download Progress Indicator | Real-time byte/percentage progress tracking (0–100%) using `ReadableStream` | M4 | ORIGINAL_REQUEST §R4 |
| 14 | Seamless Offline Playback | Detect cached chapter, create `blob:` URL, load cached VTT, and enable 100% offline playback | M4 | ORIGINAL_REQUEST §R4 |
| 15 | Storage Space Management UI | Quota inspection via `navigator.storage.estimate()`, chapter list, delete cached chapters | M4 | ORIGINAL_REQUEST §R4 |
| 16 | E2E Testing Suite (Tiers 1–4) | Comprehensive test suite covering feature coverage, boundaries, combinations, and real-world scenarios | E2E Track | ORIGINAL_REQUEST §Acceptance Criteria |
| 17 | Final E2E Pass & Adversarial Hardening | 100% pass of E2E suite, Tier 5 adversarial testing, zero build errors, zero regressions | M5 | ORIGINAL_REQUEST §Quality & Build |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track | Build test harness & automated 4-tier E2E test suite, publish TEST_READY.md | none | DONE |
| M1 | AI Speech Scoring Engine (R1) | `speechScoring.js`, `ShadowingRecorder.jsx` scoring & word highlight UI (<2s latency) | none | DONE |
| M2 | Visual Learning Analytics (R2) | `analyticsStore.js`, `AnalyticsDashboard.jsx`, Header button, Dictation/Playback hooks | none | DONE |
| M3 | Anki Export Pipeline (R3) | `ankiExport.js`, vocab schema extension, `VocabularyDrawer.jsx` export actions | none | IN_PROGRESS |
| M4 | Complete Offline Caching (R4) | `offlineStorage.js`, `StorageManagerModal.jsx`, `App.jsx` offline Blob playback | none | PLANNED |
| M5 | Final E2E Pass & Coverage Hardening | Pass 100% E2E tests, Tier 5 adversarial coverage hardening, clean build & audit | M1, M2, M3, M4, E2E | PLANNED |

## Interface Contracts

### Speech Scoring Engine Contract (`src/utils/speechScoring.js`)
- `evaluatePronunciation(targetSentence: string, spokenText: string): PronunciationResult`
  ```typescript
  interface WordScore {
    word: string;
    status: 'matched' | 'partial' | 'inaccurate'; // green, amber, red
    score: number; // 1.0, 0.6, 0.0
    matchedSpokenWord?: string;
  }
  interface PronunciationResult {
    score: number; // 0 - 100 normalized
    words: WordScore[];
    transcript: string;
    isFallback: boolean;
    latencyMs: number;
  }
  ```

### Analytics Store Contract (`src/utils/analyticsStore.js`)
- `recordListeningSeconds(seconds: number): void`
- `recordDictationSession(session: { chapterId: string, chapterTitle: string, totalWords: number, correctWords: number, accuracy: number }): void`
- `recordShadowingScore(record: { chapterId: string, cueId: number, score: number }): void`
- `markChapterCompleted(chapterId: string): void`
- `getAnalyticsSummary(): AnalyticsSummary`
  ```typescript
  interface AnalyticsSummary {
    totalListeningSeconds: number;
    weeklyListeningMinutes: Array<{ day: string, date: string, minutes: number }>;
    dictationTrend: Array<{ date: string, accuracy: number }>;
    completedChaptersCount: number;
    streakDays: number;
    longestStreakDays: number;
  }
  ```

### Anki Export Contract (`src/utils/ankiExport.js`)
- `generateAnkiTSV(vocabList: ExtendedVocabEntry[], options?: AnkiOptions): string`
  - Output string with headers: `#separator:Tab\n#html:true\n#tags column:7\n#deck:Hogwarts Magic English\n`
  - Tab columns: Front, Phonetic, PartOfSpeech, Back (Definition + Lore), ContextQuote (with `<b>word</b>`), AudioTimestamp, Tags.
- `downloadAnkiFile(content: string, filename: string): void`

### Offline Storage Contract (`src/utils/offlineStorage.js`)
- `saveChapterOffline(chapterObj: object, onProgress: (p: { progress: number, receivedBytes: number, totalBytes: number }) => void): Promise<void>`
- `getCachedChapter(chapterId: string): Promise<{ audioBlob: Blob, vttText: string } | null>`
- `isChapterCached(chapterId: string): Promise<boolean>`
- `deleteCachedChapter(chapterId: string): Promise<void>`
- `getOfflineStorageInfo(): Promise<{ usedBytes: number, quotaBytes: number, chapters: Array<{ chapterId: string, title: string, totalBytes: number, downloadedAt: number }> }>`

## Code Layout & Write Boundaries
- Exclusive file boundaries for concurrent workers:
  - **Worker M1**: `src/utils/speechScoring.js`, `src/components/ShadowingRecorder.jsx`
  - **Worker M2**: `src/utils/analyticsStore.js`, `src/components/AnalyticsDashboard.jsx`, `src/components/Header.jsx`
  - **Worker M3**: `src/utils/ankiExport.js`, `src/components/VocabularyDrawer.jsx`
  - **Worker M4**: `src/utils/offlineStorage.js`, `src/components/StorageManagerModal.jsx`, `src/components/BookShowcase.jsx`
  - **Coordinator / Integration**: `src/App.jsx` (hooking M1, M2, M3, M4 through clean non-overlapping imports and state props)
  - **E2E Testing Track**: `tests/` directory, test scripts in `package.json`
