# Test Infrastructure: Hogwarts Audio E2E Test Suite

## Overview
This automated opaque-box End-to-End (E2E) testing framework provides multi-tiered verification for the Hogwarts Audio English learning platform's functional expansions across four core capabilities:
- **R1**: AI-Assisted Shadowing & Speech Pronunciation Scoring (`src/utils/speechScoring.js`)
- **R2**: Visual Learning Analytics & Habit Tracking (`src/utils/analyticsStore.js`)
- **R3**: Anki Export & Flashcard Synchronization (`src/utils/ankiExport.js`)
- **R4**: Complete Offline Chapter Caching (`src/utils/offlineStorage.js`)

The infrastructure leverages Node.js native test runner (`node:test` and `node:assert/strict`) requiring **zero external npm dependencies**, executing in <1000ms.

---

## Architecture & Layout

```
harrypotter/
├── tests/
│   ├── setup.js                   # Global test environment initialization & state isolation
│   ├── loader.js                  # Dynamic module resolver with milestone diagnostic reporting
│   ├── mocks/
│   │   ├── mockLocalStorage.js   # W3C-compliant Web Storage API mock
│   │   ├── mockIndexedDB.js       # Standards-based in-memory IndexedDB mock (IDBFactory, DB, Tx, Stores)
│   │   └── mockNetwork.js         # Audio Blob, WebVTT fixtures, and ReadableStream fetch mock
│   ├── oracles/
│   │   ├── speechScoringOracle.js # Reference oracle for R1 contract verification
│   │   ├── analyticsStoreOracle.js# Reference oracle for R2 contract verification
│   │   ├── ankiExportOracle.js    # Reference oracle for R3 contract verification
│   │   └── offlineStorageOracle.js# Reference oracle for R4 contract verification
│   ├── tier1-features.test.js     # Tier 1: Feature Coverage (22 tests)
│   ├── tier2-boundaries.test.js   # Tier 2: Boundary & Corner Cases (23 tests)
│   ├── tier3-combinations.test.js # Tier 3: Cross-Feature Combinations (4 tests)
│   ├── tier4-scenarios.test.js    # Tier 4: Real-World User Scenarios (5 tests)
│   └── e2e.test.js                # Master entry point importing all tiers (54 tests total)
├── TEST_INFRA.md                  # This infrastructure specification
├── TEST_READY.md                  # Test execution readiness declaration
└── package.json                   # "test": "node --test tests/e2e.test.js"
```

---

## 4-Tier Test Methodology

### Tier 1: Feature Coverage (22 Tests)
Validates primary happy path behaviors and acceptance criteria for each requirement:
- **R1 Speech Scoring**: Exact matching (100% score, green status), complete mismatch (<30% score, red status), sound-alike/partial words (amber status ~0.6), missing spoken words classification, case/punctuation normalization, execution latency < 2000ms.
- **R2 Learning Analytics**: Listening seconds accumulation, dictation session logging, shadowing evaluation recording, unique chapter completion tracking, 7-day weekly listening minutes aggregation, `localStorage` persistence and hydration.
- **R3 Anki Flashcard Export**: Standard Anki headers (`#separator:Tab`, `#html:true`, `#tags column:7`, `#deck`), strict 7-column TSV format, target word bolding (`<b>word</b>`), audio timestamp marker formatting (`00:01:23.450`), multi-item export.
- **R4 Offline Storage**: Binary audio Blob and WebVTT persistence in IndexedDB (`HogwartsOfflineDB`), streaming download progress monitoring (0–100%), retrieval via `getCachedChapter`, status checks via `isChapterCached`, deletion via `deleteCachedChapter`, storage inspection via `getOfflineStorageInfo`.

### Tier 2: Boundary & Corner Cases (23 Tests)
Verifies resilience against pathological inputs, resource limits, and edge conditions:
- **R1 Boundaries**: Empty spoken transcript, empty target sentence, punctuation-only strings (`"... ??? --- !"`), extreme paragraph lengths (250+ words without latency degradation), contractions and accented characters (`Hermiōne's`), filler words and stuttering alignment.
- **R2 Boundaries**: Zero and negative duration clamping, extreme values (100,000+ seconds), fresh/empty storage default fallback, corrupted JSON recovery, division-by-zero protection (0 words dictation), multi-day streak gaps and longest streak retention.
- **R3 Boundaries**: Empty vocabulary array export, missing optional fields (missing IPA, POS, lore, timestamps), context quotes lacking target word, TSV sanitization (tab escaping to space, newlines to `<br>`), 500-card batch scaling test.
- **R4 Boundaries**: Zero-byte audio Blobs and empty VTT subtitles, re-saving existing chapter IDs without key collision, non-existent chapter queries (returning `null` without throwing), non-existent chapter deletion, near-quota storage inspection, large binary Blob integrity (10MB).

### Tier 3: Cross-Feature Combinations (4 Tests)
Pairwise integration testing across independent subsystems:
- **C1 (R1 + R2)**: Pronunciation score produced by Speech Engine flows directly into Analytics Store shadowing metrics, activating study streak.
- **C2 (R4 + R3)**: Offline cached chapter VTT subtitles are retrieved, vocabulary with timestamps is extracted, and exported to Anki TSV with verified time offsets.
- **C3 (R2 + Dictation)**: Active playback listening seconds and dictation studio session results coalesce into unified dashboard metrics.
- **C4 (R4 + R2)**: Chapter completed offline updates completed chapter count in analytics while storage manager confirms offline footprint.

### Tier 4: Real-World Application Scenarios (5 Tests)
End-to-end multi-step user learning journeys:
- **Scenario 1 (Daily Study Flow)**: 15-minute active listening -> pause on sentence -> shadowing practice -> speech scoring (90%+) -> analytics logging -> 1-day streak verified.
- **Scenario 2 (Dictation Mastery Flow)**: Dictation studio session -> 18/20 words correct (90%) -> session recorded -> dashboard accuracy trend updated.
- **Scenario 3 (Offline Departure Prep)**: Multi-chapter batch download (Chapters 1, 2, 3) -> progress callbacks to 100% -> storage inspection -> disconnected playback of audio Blob and VTT subtitles.
- **Scenario 4 (Vocabulary Expansion & Anki Sync)**: Reading chapter -> bookmarking unfamiliar words with IPA, definitions, lore, and cue timestamps -> Anki TSV generation with bold context quotes and tags.
- **Scenario 5 (Storage Maintenance & Lifecycle)**: Offline caching -> mark chapter completed in analytics -> cache deletion to free disk space -> verified cache cleared while analytics completion status remains intact.

---

## Test Execution Commands

### Standard Mode (Validates `src/utils/` Implementations)
Executes tests directly against source code in `src/utils/`. Unimplemented modules fail with explicit diagnostic messages indicating which milestone is pending:
```bash
npm test
```
Or directly via Node:
```bash
node --test tests/e2e.test.js
```

### Reference Oracle Mode (Full Suite Self-Verification)
Executes all 54 tests against the mathematically verified reference oracles to prove 100% test harness and assertion correctness:
```powershell
$env:USE_ORACLE="1"; npm test
```
Or in bash:
```bash
USE_ORACLE=1 npm test
```

---

## Isolation and Environment Shims
To ensure strict test isolation and cross-platform determinism:
- `globalThis.localStorage`: Custom in-memory `MockStorage` implementing the full W3C Storage interface.
- `globalThis.indexedDB`: Fully simulated in-memory `IDBFactory`, `IDBDatabase`, `IDBTransaction`, `IDBObjectStore`, and `IDBRequest` with microtask asynchronous event dispatching.
- `globalThis.navigator.storage`: Mock storage estimator supporting quota and usage inspections.
- `resetTestEnvironment()`: Invoked before stateful tests to purge all stored data and prevent cross-test contamination.
