/**
 * Tier 1: Feature Coverage Test Suite
 * Covers R1, R2, R3, R4 primary behaviors (>=5 tests per feature).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import './setup.js';
import { resetTestEnvironment } from './setup.js';
import {
  getSpeechScoring,
  getAnalyticsStore,
  getAnkiExport,
  getOfflineStorage
} from './loader.js';
import { createSampleAudioBlob, createSampleVTT } from './mocks/mockNetwork.js';

// ============================================================================
// R1: AI-Assisted Shadowing & Speech Pronunciation Scoring (Tier 1)
// ============================================================================

test('Tier 1 - R1.1: Exact match pronunciation evaluation returns 100% score and matched status', async () => {
  const { evaluatePronunciation } = await getSpeechScoring();
  const target = 'Expecto Patronum';
  const spoken = 'Expecto Patronum';

  const result = evaluatePronunciation(target, spoken);

  assert.strictEqual(typeof result.score, 'number');
  assert.strictEqual(result.score, 100);
  assert.strictEqual(result.words.length, 2);
  assert.strictEqual(result.words[0].word, 'Expecto');
  assert.strictEqual(result.words[0].status, 'matched');
  assert.strictEqual(result.words[0].score, 1.0);
  assert.strictEqual(result.words[1].word, 'Patronum');
  assert.strictEqual(result.words[1].status, 'matched');
  assert.strictEqual(result.words[1].score, 1.0);
  assert.strictEqual(result.isFallback, false);
});

test('Tier 1 - R1.2: Complete mismatch returns low score (<30%) and inaccurate status', async () => {
  const { evaluatePronunciation } = await getSpeechScoring();
  const target = 'Alohomora unlocked the ancient wooden chamber door';
  const spoken = 'Avada Kedavra destroyed everything instantly today';

  const result = evaluatePronunciation(target, spoken);

  assert.ok(result.score < 30, `Expected score < 30, got ${result.score}`);
  const inaccurateWords = result.words.filter(w => w.status === 'inaccurate');
  assert.ok(inaccurateWords.length >= target.split(' ').length - 1, 'Most words should be inaccurate');
});

test('Tier 1 - R1.3: Partial / sound-alike word classified as partial (amber)', async () => {
  const { evaluatePronunciation } = await getSpeechScoring();
  const target = 'Expelliarmus';
  const spoken = 'Expelliarmis';

  const result = evaluatePronunciation(target, spoken);

  assert.strictEqual(result.words.length, 1);
  assert.strictEqual(result.words[0].status, 'partial');
  assert.ok(result.words[0].score >= 0.5 && result.words[0].score <= 0.8, 'Partial score should be ~0.6');
  assert.ok(result.score >= 50 && result.score <= 80, `Expected intermediate score, got ${result.score}`);
});

test('Tier 1 - R1.4: Truncated user speech flags missing words as inaccurate', async () => {
  const { evaluatePronunciation } = await getSpeechScoring();
  const target = 'It does not do to dwell on dreams';
  const spoken = 'It does not do';

  const result = evaluatePronunciation(target, spoken);

  assert.strictEqual(result.words.length, 8);
  // First 4 matched
  for (let i = 0; i < 4; i++) {
    assert.strictEqual(result.words[i].status, 'matched');
  }
  // Remaining 4 inaccurate
  for (let i = 4; i < 8; i++) {
    assert.strictEqual(result.words[i].status, 'inaccurate');
  }
  assert.ok(result.score >= 40 && result.score <= 60, `Score should reflect 50% matched words, got ${result.score}`);
});

test('Tier 1 - R1.5: Pronunciation evaluation execution latency is < 2000ms', async () => {
  const { evaluatePronunciation } = await getSpeechScoring();
  const target = 'Mr. and Mrs. Dursley, of number four, Privet Drive, were proud to say that they were perfectly normal.';
  const spoken = 'Mr and Mrs Dursley of number four Privet Drive were proud to say that they were normal';

  const start = performance.now();
  const result = evaluatePronunciation(target, spoken);
  const elapsedMs = performance.now() - start;

  assert.ok(elapsedMs < 2000, `Execution latency exceeded 2000ms: took ${elapsedMs}ms`);
  assert.ok(result.latencyMs < 2000, `Reported latencyMs exceeded 2000ms: was ${result.latencyMs}ms`);
});

test('Tier 1 - R1.6: Case and punctuation normalization matches spoken sentence', async () => {
  const { evaluatePronunciation } = await getSpeechScoring();
  const target = 'Wingardium Leviosa!';
  const spoken = 'wingardium leviosa';

  const result = evaluatePronunciation(target, spoken);

  assert.strictEqual(result.score, 100);
  assert.strictEqual(result.words[0].status, 'matched');
  assert.strictEqual(result.words[1].status, 'matched');
});

// ============================================================================
// R2: Visual Learning Analytics & Habit Tracking (Tier 1)
// ============================================================================

test('Tier 1 - R2.1: recordListeningSeconds accumulates total listening duration', async () => {
  resetTestEnvironment();
  const { recordListeningSeconds, getAnalyticsSummary } = await getAnalyticsStore();

  recordListeningSeconds(120);
  recordListeningSeconds(180);
  recordListeningSeconds(60);

  const summary = getAnalyticsSummary();
  assert.strictEqual(summary.totalListeningSeconds, 360);
});

test('Tier 1 - R2.2: recordDictationSession persists session accuracy and history', async () => {
  resetTestEnvironment();
  const { recordDictationSession, getAnalyticsSummary } = await getAnalyticsStore();

  recordDictationSession({
    chapterId: 'hp1-01',
    chapterTitle: 'The Boy Who Lived',
    totalWords: 20,
    correctWords: 18,
    accuracy: 90
  });

  const summary = getAnalyticsSummary();
  assert.strictEqual(summary.dictationTrend.length, 1);
  assert.strictEqual(summary.dictationTrend[0].accuracy, 90);
  assert.ok(summary.dictationTrend[0].date, 'Should have recorded session date');
});

test('Tier 1 - R2.3: recordShadowingScore persists shadowing evaluations', async () => {
  resetTestEnvironment();
  const { recordShadowingScore, getAnalyticsSummary } = await getAnalyticsStore();

  recordShadowingScore({
    chapterId: 'hp1-01',
    cueId: 3,
    score: 95
  });

  const summary = getAnalyticsSummary();
  // Shadowing activity triggers streak activity
  assert.ok(summary.streakDays >= 1, 'Shadowing score should count toward active streak');
});

test('Tier 1 - R2.4: markChapterCompleted increments completed chapters count uniquely', async () => {
  resetTestEnvironment();
  const { markChapterCompleted, getAnalyticsSummary } = await getAnalyticsStore();

  markChapterCompleted('hp1-01');
  markChapterCompleted('hp1-02');
  markChapterCompleted('hp1-01'); // duplicate

  const summary = getAnalyticsSummary();
  assert.strictEqual(summary.completedChaptersCount, 2);
});

test('Tier 1 - R2.5: getAnalyticsSummary returns 7-day weekly listening minutes and streaks', async () => {
  resetTestEnvironment();
  const { recordListeningSeconds, getAnalyticsSummary } = await getAnalyticsStore();

  recordListeningSeconds(300); // 5 minutes today

  const summary = getAnalyticsSummary();
  assert.strictEqual(Array.isArray(summary.weeklyListeningMinutes), true);
  assert.strictEqual(summary.weeklyListeningMinutes.length, 7);

  const todayEntry = summary.weeklyListeningMinutes[summary.weeklyListeningMinutes.length - 1];
  assert.strictEqual(todayEntry.minutes, 5);
  assert.strictEqual(summary.streakDays, 1);
  assert.ok(summary.longestStreakDays >= 1);
});

test('Tier 1 - R2.6: Persistence across sessions via localStorage', async () => {
  resetTestEnvironment();
  const { recordListeningSeconds, markChapterCompleted, getAnalyticsSummary } = await getAnalyticsStore();

  recordListeningSeconds(600);
  markChapterCompleted('hp1-05');

  // Verify raw localStorage contains the saved state
  const rawData = globalThis.localStorage.getItem('hogwarts_analytics_data');
  assert.ok(rawData, 'Storage key hogwarts_analytics_data must exist');
  const parsed = JSON.parse(rawData);
  assert.strictEqual(parsed.totalListeningSeconds, 600);

  // Calling getAnalyticsSummary reads persisted state
  const summary = getAnalyticsSummary();
  assert.strictEqual(summary.totalListeningSeconds, 600);
  assert.strictEqual(summary.completedChaptersCount, 1);
});

// ============================================================================
// R3: Anki Export & Flashcard Synchronization (Tier 1)
// ============================================================================

test('Tier 1 - R3.1: generateAnkiTSV includes all standard Anki headers', async () => {
  const { generateAnkiTSV } = await getAnkiExport();
  const tsv = generateAnkiTSV([]);

  assert.ok(tsv.includes('#separator:Tab'), 'Must include #separator:Tab header');
  assert.ok(tsv.includes('#html:true'), 'Must include #html:true header');
  assert.ok(tsv.includes('#tags column:7'), 'Must include #tags column:7 header');
  assert.ok(tsv.includes('#deck:Hogwarts Magic English'), 'Must include #deck header');
});

test('Tier 1 - R3.2: generateAnkiTSV formats exactly 7 tab-delimited columns per row', async () => {
  const { generateAnkiTSV } = await getAnkiExport();
  const vocabList = [
    {
      word: 'wand',
      phonetic: '/wɒnd/',
      partOfSpeech: 'noun',
      definition: 'A wooden stick used by wizards to cast spells',
      contextQuote: 'He waved his wand and magic happened.',
      startTime: 12.5,
      endTime: 15.0,
      tags: ['chapter1']
    }
  ];

  const tsv = generateAnkiTSV(vocabList);
  const lines = tsv.trim().split('\n');
  const dataLines = lines.filter(l => !l.startsWith('#'));

  assert.strictEqual(dataLines.length, 1);
  const columns = dataLines[0].split('\t');
  assert.strictEqual(columns.length, 7, `Expected 7 columns, got ${columns.length}: ${JSON.stringify(columns)}`);
  assert.strictEqual(columns[0], 'wand');
  assert.strictEqual(columns[1], '/wɒnd/');
  assert.strictEqual(columns[2], 'noun');
  assert.ok(columns[3].includes('wooden stick'));
  assert.ok(columns[4].includes('<b>wand</b>'));
  assert.ok(columns[5].length > 0, 'Audio timestamp should not be empty');
  assert.ok(columns[6].includes('chapter1'));
});

test('Tier 1 - R3.3: Context quote wraps target word in bold <b> tag', async () => {
  const { generateAnkiTSV } = await getAnkiExport();
  const vocabList = [
    {
      word: 'cauldron',
      definition: 'A large metal pot for brewing potions',
      contextQuote: 'Hagrid bought a copper cauldron for potions class.'
    }
  ];

  const tsv = generateAnkiTSV(vocabList);
  assert.ok(
    tsv.includes('copper <b>cauldron</b> for'),
    'Context quote must bold the target word'
  );
});

test('Tier 1 - R3.4: Audio timestamp formatting converts start and end seconds', async () => {
  const { generateAnkiTSV } = await getAnkiExport();
  const vocabList = [
    {
      word: 'parchment',
      startTime: 65.5,
      endTime: 70.0
    }
  ];

  const tsv = generateAnkiTSV(vocabList);
  const dataLine = tsv.split('\n').find(l => l.startsWith('parchment'));
  const timestampCol = dataLine.split('\t')[5];

  // 65.5s is 01:05.50
  assert.ok(timestampCol.includes('01:05'), `Expected formatted timestamp, got ${timestampCol}`);
});

test('Tier 1 - R3.5: Multiple vocabulary entries generate multiple distinct TSV rows', async () => {
  const { generateAnkiTSV } = await getAnkiExport();
  const vocabList = [
    { word: 'lumos', definition: 'Spell to produce light' },
    { word: 'nox', definition: 'Spell to extinguish light' },
    { word: 'alohomora', definition: 'Spell to unlock doors' }
  ];

  const tsv = generateAnkiTSV(vocabList);
  const dataLines = tsv.trim().split('\n').filter(l => !l.startsWith('#'));
  assert.strictEqual(dataLines.length, 3);
  assert.ok(dataLines[0].startsWith('lumos'));
  assert.ok(dataLines[1].startsWith('nox'));
  assert.ok(dataLines[2].startsWith('alohomora'));
});

// ============================================================================
// R4: Complete Offline Chapter Caching (Tier 1)
// ============================================================================

test('Tier 1 - R4.1: saveChapterOffline stores audio Blob and VTT in IndexedDB', async () => {
  resetTestEnvironment();
  const { saveChapterOffline, getCachedChapter } = await getOfflineStorage();

  const dummyAudio = createSampleAudioBlob(2048);
  const dummyVTT = createSampleVTT('Chapter 1');

  await saveChapterOffline({
    chapterId: 'hp1-01',
    title: 'The Boy Who Lived',
    audioBlob: dummyAudio,
    vttText: dummyVTT
  });

  const cached = await getCachedChapter('hp1-01');
  assert.ok(cached !== null, 'Cached chapter must not be null');
  assert.strictEqual(cached.vttText, dummyVTT);
  assert.strictEqual(cached.audioBlob.size, 2048);
});

test('Tier 1 - R4.2: saveChapterOffline triggers onProgress callback with 0-100%', async () => {
  resetTestEnvironment();
  const { saveChapterOffline } = await getOfflineStorage();

  const progressUpdates = [];
  await saveChapterOffline(
    {
      chapterId: 'hp1-02',
      title: 'The Vanishing Glass',
      audioUrl: 'https://example.com/audio/hp1-02.mp3',
      vttUrl: 'https://example.com/subtitles/hp1-02.vtt'
    },
    (p) => {
      progressUpdates.push(p);
    }
  );

  assert.ok(progressUpdates.length > 0, 'onProgress should be called at least once');
  const finalUpdate = progressUpdates[progressUpdates.length - 1];
  assert.strictEqual(finalUpdate.progress, 100);
  assert.ok(finalUpdate.receivedBytes > 0);
  assert.strictEqual(finalUpdate.receivedBytes, finalUpdate.totalBytes);
});

test('Tier 1 - R4.3: isChapterCached returns true for saved chapter and false otherwise', async () => {
  resetTestEnvironment();
  const { saveChapterOffline, isChapterCached } = await getOfflineStorage();

  assert.strictEqual(await isChapterCached('hp1-03'), false);

  await saveChapterOffline({
    chapterId: 'hp1-03',
    title: 'The Letters from No One',
    audioBlob: createSampleAudioBlob(1024),
    vttText: createSampleVTT('Chapter 3')
  });

  assert.strictEqual(await isChapterCached('hp1-03'), true);
  assert.strictEqual(await isChapterCached('hp1-99'), false);
});

test('Tier 1 - R4.4: deleteCachedChapter removes chapter from IndexedDB', async () => {
  resetTestEnvironment();
  const { saveChapterOffline, deleteCachedChapter, isChapterCached, getCachedChapter } = await getOfflineStorage();

  await saveChapterOffline({
    chapterId: 'hp1-04',
    title: 'The Keeper of the Keys',
    audioBlob: createSampleAudioBlob(1024),
    vttText: 'WEBVTT'
  });

  assert.strictEqual(await isChapterCached('hp1-04'), true);

  await deleteCachedChapter('hp1-04');

  assert.strictEqual(await isChapterCached('hp1-04'), false);
  assert.strictEqual(await getCachedChapter('hp1-04'), null);
});

test('Tier 1 - R4.5: getOfflineStorageInfo reports used bytes, quota, and chapter list', async () => {
  resetTestEnvironment();
  const { saveChapterOffline, getOfflineStorageInfo } = await getOfflineStorage();

  await saveChapterOffline({
    chapterId: 'hp1-01',
    title: 'Chapter 1',
    audioBlob: createSampleAudioBlob(3000),
    vttText: 'WEBVTT 1'
  });

  await saveChapterOffline({
    chapterId: 'hp1-02',
    title: 'Chapter 2',
    audioBlob: createSampleAudioBlob(5000),
    vttText: 'WEBVTT 2'
  });

  const info = await getOfflineStorageInfo();
  assert.strictEqual(info.chapters.length, 2);
  assert.ok(info.usedBytes >= 8000, `Expected usedBytes >= 8000, got ${info.usedBytes}`);
  assert.ok(info.quotaBytes > 0, 'Quota bytes should be positive');
  assert.strictEqual(info.chapters[0].chapterId, 'hp1-01');
  assert.strictEqual(info.chapters[1].chapterId, 'hp1-02');
});
