/**
 * Tier 2: Boundary & Corner Cases Test Suite
 * Covers R1, R2, R3, R4 edge cases, extreme values, empty inputs, and stress conditions (>=5 per feature).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import './setup.js';
import { resetTestEnvironment, setMockStorageQuota } from './setup.js';
import {
  getSpeechScoring,
  getAnalyticsStore,
  getAnkiExport,
  getOfflineStorage
} from './loader.js';
import { createSampleAudioBlob } from './mocks/mockNetwork.js';

// ============================================================================
// R1: AI-Assisted Speech Pronunciation Boundaries (Tier 2)
// ============================================================================

test('Tier 2 - R1.B1: Empty spoken transcript returns 0 score with isFallback flag', async () => {
  const { evaluatePronunciation } = await getSpeechScoring();
  const target = 'Wingardium Leviosa';
  const spoken = '';

  const result = evaluatePronunciation(target, spoken);

  assert.strictEqual(result.score, 0);
  assert.strictEqual(result.isFallback, true);
  assert.strictEqual(result.words.length, 2);
  assert.strictEqual(result.words[0].status, 'inaccurate');
  assert.strictEqual(result.words[1].status, 'inaccurate');
});

test('Tier 2 - R1.B2: Empty target sentence returns 0 score without throwing', async () => {
  const { evaluatePronunciation } = await getSpeechScoring();
  const result = evaluatePronunciation('', 'Hello Harry');

  assert.strictEqual(result.score, 0);
  assert.strictEqual(result.words.length, 0);
  assert.strictEqual(typeof result.latencyMs, 'number');
});

test('Tier 2 - R1.B3: Punctuation-only target sentence handled without NaN or crash', async () => {
  const { evaluatePronunciation } = await getSpeechScoring();
  const result = evaluatePronunciation('... ??? --- !!!', 'nothing');

  assert.strictEqual(typeof result.score, 'number');
  assert.ok(!Number.isNaN(result.score), 'Score must not be NaN');
});

test('Tier 2 - R1.B4: Extreme sentence length (250+ words) completes within latency limits', async () => {
  const { evaluatePronunciation } = await getSpeechScoring();
  const sampleWords = ['wand', 'magic', 'hogwarts', 'castle', 'spell', 'potion', 'broomstick', 'quidditch'];
  const longSentence = Array.from({ length: 250 }, (_, i) => sampleWords[i % sampleWords.length]).join(' ');

  const start = performance.now();
  const result = evaluatePronunciation(longSentence, longSentence);
  const elapsedMs = performance.now() - start;

  assert.strictEqual(result.score, 100);
  assert.strictEqual(result.words.length, 250);
  assert.ok(elapsedMs < 2000, `Extreme length took ${elapsedMs}ms, must be < 2000ms`);
});

test('Tier 2 - R1.B5: Contractions, accented characters and special quotes handled cleanly', async () => {
  const { evaluatePronunciation } = await getSpeechScoring();
  const target = "Hermione's wand wasn't broken — it's brilliant!";
  const spoken = "hermione's wand wasn't broken it's brilliant";

  const result = evaluatePronunciation(target, spoken);

  assert.ok(result.score >= 90, `Expected score >= 90 for matched speech, got ${result.score}`);
  const matchedCount = result.words.filter(w => w.status === 'matched').length;
  assert.ok(matchedCount >= 5, `Expected at least 5 matched words, got ${matchedCount}`);
});

test('Tier 2 - R1.B6: Filler words and stuttering do not break alignment of target words', async () => {
  const { evaluatePronunciation } = await getSpeechScoring();
  const target = 'Expecto Patronum';
  const spoken = 'um uh Expecto um Patronum';

  const result = evaluatePronunciation(target, spoken);

  assert.strictEqual(result.words[0].status, 'matched');
  assert.strictEqual(result.words[1].status, 'matched');
  assert.strictEqual(result.score, 100);
});

// ============================================================================
// R2: Visual Learning Analytics Boundaries (Tier 2)
// ============================================================================

test('Tier 2 - R2.B1: Zero and negative listening seconds do not corrupt total', async () => {
  resetTestEnvironment();
  const { recordListeningSeconds, getAnalyticsSummary } = await getAnalyticsStore();

  recordListeningSeconds(100);
  recordListeningSeconds(0);
  recordListeningSeconds(-50);
  recordListeningSeconds(NaN);

  const summary = getAnalyticsSummary();
  assert.strictEqual(summary.totalListeningSeconds, 100);
});

test('Tier 2 - R2.B2: Extreme listening duration (e.g. 100,000 seconds) without overflow', async () => {
  resetTestEnvironment();
  const { recordListeningSeconds, getAnalyticsSummary } = await getAnalyticsStore();

  recordListeningSeconds(100000);

  const summary = getAnalyticsSummary();
  assert.strictEqual(summary.totalListeningSeconds, 100000);
  assert.ok(!Number.isNaN(summary.totalListeningSeconds));
});

test('Tier 2 - R2.B3: Fresh state with empty localStorage returns safe defaults', async () => {
  resetTestEnvironment();
  const { getAnalyticsSummary } = await getAnalyticsStore();

  const summary = getAnalyticsSummary();
  assert.strictEqual(summary.totalListeningSeconds, 0);
  assert.strictEqual(summary.completedChaptersCount, 0);
  assert.strictEqual(summary.streakDays, 0);
  assert.strictEqual(summary.longestStreakDays, 0);
  assert.strictEqual(Array.isArray(summary.weeklyListeningMinutes), true);
  assert.strictEqual(Array.isArray(summary.dictationTrend), true);
});

test('Tier 2 - R2.B4: Corrupted JSON in localStorage recovers gracefully without crash', async () => {
  resetTestEnvironment();
  globalThis.localStorage.setItem('hogwarts_analytics_data', 'INVALID_JSON_CORRUPTED{{{');

  const { getAnalyticsSummary, recordListeningSeconds } = await getAnalyticsStore();

  assert.doesNotThrow(() => {
    const summary = getAnalyticsSummary();
    assert.strictEqual(summary.totalListeningSeconds, 0);
  });

  assert.doesNotThrow(() => {
    recordListeningSeconds(60);
  });
});

test('Tier 2 - R2.B5: Dictation session with 0 words handled with division by zero protection', async () => {
  resetTestEnvironment();
  const { recordDictationSession, getAnalyticsSummary } = await getAnalyticsStore();

  recordDictationSession({
    chapterId: 'hp1-01',
    chapterTitle: 'Empty Test',
    totalWords: 0,
    correctWords: 0,
    accuracy: 0
  });

  const summary = getAnalyticsSummary();
  assert.strictEqual(summary.dictationTrend.length, 1);
  assert.strictEqual(summary.dictationTrend[0].accuracy, 0);
  assert.ok(!Number.isNaN(summary.dictationTrend[0].accuracy));
});

test('Tier 2 - R2.B6: Streak calculation handles broken streaks and preserves longest streak', async () => {
  resetTestEnvironment();
  const { getAnalyticsSummary } = await getAnalyticsStore();

  // Simulate an older 3-day streak in storage
  const pastDate1 = '2026-09-20';
  const pastDate2 = '2026-09-21';
  const pastDate3 = '2026-09-22';
  // Gap on 2026-09-23 through 2026-09-30

  const state = {
    totalListeningSeconds: 1800,
    dailyListeningSeconds: {
      [pastDate1]: 600,
      [pastDate2]: 600,
      [pastDate3]: 600
    },
    dictationHistory: [],
    shadowingScores: [],
    completedChapters: [],
    streakDays: 0,
    longestStreakDays: 3,
    lastActiveDate: pastDate3
  };

  globalThis.localStorage.setItem('hogwarts_analytics_data', JSON.stringify(state));

  const summary = getAnalyticsSummary();
  // Current streak should be 0 since no activity today or yesterday
  assert.strictEqual(summary.streakDays, 0);
  assert.strictEqual(summary.longestStreakDays, 3);
});

// ============================================================================
// R3: Anki Export Boundaries (Tier 2)
// ============================================================================

test('Tier 2 - R3.B1: Empty vocabulary list returns headers with zero rows', async () => {
  const { generateAnkiTSV } = await getAnkiExport();
  const tsv = generateAnkiTSV([]);

  const lines = tsv.trim().split('\n');
  assert.strictEqual(lines.length, 4); // Only the 4 headers
  assert.ok(lines[0].startsWith('#separator:Tab'));
  assert.ok(lines[3].startsWith('#deck:'));
});

test('Tier 2 - R3.B2: Missing optional fields in vocabulary entry handled safely', async () => {
  const { generateAnkiTSV } = await getAnkiExport();
  const vocabList = [
    {
      word: 'snitch'
      // No phonetic, no part of speech, no definition, no quote, no timestamps
    }
  ];

  const tsv = generateAnkiTSV(vocabList);
  const dataLine = tsv.split(/\r?\n/).map(l => l.replace(/\r$/, '')).find(l => l.startsWith('snitch'));
  assert.ok(dataLine, 'Must generate row for snitch');
  const cols = dataLine.split('\t');
  assert.strictEqual(cols.length, 7);
  assert.strictEqual(cols[0], 'snitch');
  assert.strictEqual(cols[1], '');
  assert.strictEqual(cols[2], '');
});

test('Tier 2 - R3.B3: Context quote without target word does not break TSV', async () => {
  const { generateAnkiTSV } = await getAnkiExport();
  const vocabList = [
    {
      word: 'phoenix',
      contextQuote: 'The golden bird took flight above the Great Hall.'
    }
  ];

  const tsv = generateAnkiTSV(vocabList);
  assert.ok(tsv.includes('The golden bird took flight'));
  // Quote is preserved intact
});

test('Tier 2 - R3.B4: Tab and newline characters in fields sanitized to protect TSV structure', async () => {
  const { generateAnkiTSV } = await getAnkiExport();
  const vocabList = [
    {
      word: 'spell',
      definition: 'A magical formula.\tDangerous if miscast.\nUse with care.',
      contextQuote: 'Say the spell\tcarefully.'
    }
  ];

  const tsv = generateAnkiTSV(vocabList);
  const dataLines = tsv.split(/\r?\n/).filter(l => l.replace(/\r$/, '').length > 0 && !l.startsWith('#'));

  // Should strictly maintain 1 data line despite newlines in definition
  assert.strictEqual(dataLines.length, 1, 'Newlines must be converted to <br> to keep 1 row per card');
  const cols = dataLines[0].split('\t');
  assert.strictEqual(cols.length, 7, 'Tabs inside text must be escaped/replaced to preserve 7 columns');
  assert.ok(cols[3].includes('<br>'), 'Newline in definition converted to HTML <br>');
});

test('Tier 2 - R3.B5: Scaling test with 500 vocabulary entries generates valid TSV', async () => {
  const { generateAnkiTSV } = await getAnkiExport();
  const largeBatch = Array.from({ length: 500 }, (_, i) => ({
    word: `word_${i}`,
    phonetic: `/wɜːd_${i}/`,
    partOfSpeech: 'noun',
    definition: `Definition of magic item ${i}`,
    contextQuote: `The wizard used word_${i} during the duel.`,
    startTime: i * 5,
    endTime: i * 5 + 3,
    tags: ['batch_test']
  }));

  const start = performance.now();
  const tsv = generateAnkiTSV(largeBatch);
  const elapsed = performance.now() - start;

  assert.ok(elapsed < 1000, `Generating 500 cards took ${elapsed}ms, should be < 1000ms`);
  const lines = tsv.trim().split('\n').filter(l => !l.startsWith('#'));
  assert.strictEqual(lines.length, 500);
});

// ============================================================================
// R4: Offline Chapter Caching Boundaries (Tier 2)
// ============================================================================

test('Tier 2 - R4.B1: Zero-byte audio Blob and empty VTT saved and retrieved cleanly', async () => {
  resetTestEnvironment();
  const { saveChapterOffline, getCachedChapter } = await getOfflineStorage();

  const emptyBlob = new Blob([], { type: 'audio/mpeg' });
  await saveChapterOffline({
    chapterId: 'hp1-empty',
    title: 'Empty Test Chapter',
    audioBlob: emptyBlob,
    vttText: ''
  });

  const cached = await getCachedChapter('hp1-empty');
  assert.ok(cached !== null);
  assert.strictEqual(cached.audioBlob.size, 0);
  assert.strictEqual(cached.vttText, '');
});

test('Tier 2 - R4.B2: Re-saving existing chapterId updates record without key collision', async () => {
  resetTestEnvironment();
  const { saveChapterOffline, getCachedChapter, getOfflineStorageInfo } = await getOfflineStorage();

  await saveChapterOffline({
    chapterId: 'hp1-01',
    title: 'Version 1',
    audioBlob: createSampleAudioBlob(100),
    vttText: 'VTT 1'
  });

  // Re-save with updated content
  await saveChapterOffline({
    chapterId: 'hp1-01',
    title: 'Version 2 Updated',
    audioBlob: createSampleAudioBlob(500),
    vttText: 'VTT 2 Updated'
  });

  const cached = await getCachedChapter('hp1-01');
  assert.strictEqual(cached.audioBlob.size, 500);
  assert.strictEqual(cached.vttText, 'VTT 2 Updated');

  const info = await getOfflineStorageInfo();
  assert.strictEqual(info.chapters.length, 1, 'Must still have only 1 chapter record');
});

test('Tier 2 - R4.B3: getCachedChapter for non-existent chapterId returns null', async () => {
  resetTestEnvironment();
  const { getCachedChapter } = await getOfflineStorage();

  const result = await getCachedChapter('non_existent_chapter_999');
  assert.strictEqual(result, null);
});

test('Tier 2 - R4.B4: deleteCachedChapter for non-existent chapterId completes cleanly', async () => {
  resetTestEnvironment();
  const { deleteCachedChapter } = await getOfflineStorage();

  await assert.doesNotReject(async () => {
    await deleteCachedChapter('non_existent_chapter_999');
  });
});

test('Tier 2 - R4.B5: Storage management inspection handles near-quota conditions', async () => {
  resetTestEnvironment();
  const { getOfflineStorageInfo } = await getOfflineStorage();

  // Set mock usage near quota: 4.8 GB used of 5.0 GB quota
  setMockStorageQuota(4.8 * 1024 * 1024 * 1024, 5.0 * 1024 * 1024 * 1024);

  const info = await getOfflineStorageInfo();
  assert.ok(info.quotaBytes > 0);
  assert.strictEqual(info.quotaBytes, 5.0 * 1024 * 1024 * 1024);
});

test('Tier 2 - R4.B6: Large binary audio Blob (10MB) preserves byte integrity', async () => {
  resetTestEnvironment();
  const { saveChapterOffline, getCachedChapter } = await getOfflineStorage();

  const largeSize = 10 * 1024 * 1024; // 10 MB
  const largeBlob = createSampleAudioBlob(largeSize);

  await saveChapterOffline({
    chapterId: 'hp1-large',
    title: 'Large Chapter',
    audioBlob: largeBlob,
    vttText: 'WEBVTT - Large'
  });

  const cached = await getCachedChapter('hp1-large');
  assert.ok(cached !== null);
  assert.strictEqual(cached.audioBlob.size, largeSize);
});
