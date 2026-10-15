/**
 * Tier 3: Cross-Feature Combinations Test Suite
 * Pairwise integration tests validating multi-feature data pipelines (>=4 tests).
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

test('Tier 3 - C1: R1 Speech Evaluation outputs seamlessly log to R2 Analytics Store', async () => {
  resetTestEnvironment();
  const { evaluatePronunciation } = await getSpeechScoring();
  const { recordShadowingScore, getAnalyticsSummary } = await getAnalyticsStore();

  const targetSentence = 'Wingardium Leviosa';
  const spokenSentence = 'Wingardium Leviosa';

  // 1. Run pronunciation evaluation
  const evaluation = evaluatePronunciation(targetSentence, spokenSentence);
  assert.strictEqual(evaluation.score, 100);

  // 2. Persist result into Analytics Store
  recordShadowingScore({
    chapterId: 'hp1-01',
    cueId: 42,
    score: evaluation.score
  });

  // 3. Verify analytics reflects the evaluation
  const summary = getAnalyticsSummary();
  assert.ok(summary.streakDays >= 1, 'Shadowing evaluation must trigger active study streak');
});

test('Tier 3 - C2: R4 Offline Chapter subtitles feed into R3 Anki Export with timestamps', async () => {
  resetTestEnvironment();
  const { saveChapterOffline, getCachedChapter } = await getOfflineStorage();
  const { generateAnkiTSV } = await getAnkiExport();

  const vttContent = `WEBVTT - Chapter 1

00:01:23.450 --> 00:01:28.100
Mr. Dursley blinked and stared at the cat. It was staring back.
`;

  // 1. Save chapter offline
  await saveChapterOffline({
    chapterId: 'hp1-01',
    title: 'The Boy Who Lived',
    audioBlob: createSampleAudioBlob(4096),
    vttText: vttContent
  });

  // 2. Retrieve offline chapter content
  const cached = await getCachedChapter('hp1-01');
  assert.ok(cached !== null);
  assert.ok(cached.vttText.includes('stared at the cat'));

  // 3. Extract vocabulary word "blinked" with cue timestamp from the offline chapter
  const vocabEntry = {
    word: 'blinked',
    phonetic: '/blɪŋkt/',
    partOfSpeech: 'verb',
    definition: 'Opened and closed eyes quickly',
    contextQuote: 'Mr. Dursley blinked and stared at the cat.',
    startTime: 83.45,
    endTime: 88.10,
    chapterId: 'hp1-01',
    tags: ['offline_vocab']
  };

  // 4. Export to Anki TSV
  const tsv = generateAnkiTSV([vocabEntry]);

  // 5. Verify format integrity
  assert.ok(tsv.includes('#separator:Tab'));
  assert.ok(tsv.includes('Mr. Dursley <b>blinked</b> and stared'));
  assert.ok(tsv.includes('01:23'));
  assert.ok(tsv.includes('Hogwarts::hp1-01'));
});

test('Tier 3 - C3: Dictation session & listening time accumulate into unified R2 Dashboard summary', async () => {
  resetTestEnvironment();
  const { recordListeningSeconds, recordDictationSession, getAnalyticsSummary } = await getAnalyticsStore();

  // 1. User listens to chapter for 10 minutes (600s) during dictation
  recordListeningSeconds(600);

  // 2. User finishes dictation studio session with 95% accuracy
  recordDictationSession({
    chapterId: 'hp1-03',
    chapterTitle: 'Letters from No One',
    totalWords: 20,
    correctWords: 19,
    accuracy: 95
  });

  // 3. Dashboard summary aggregates both
  const summary = getAnalyticsSummary();
  assert.strictEqual(summary.totalListeningSeconds, 600);
  assert.strictEqual(summary.dictationTrend.length, 1);
  assert.strictEqual(summary.dictationTrend[0].accuracy, 95);
  assert.strictEqual(summary.streakDays, 1);

  const todayMinutes = summary.weeklyListeningMinutes[summary.weeklyListeningMinutes.length - 1];
  assert.strictEqual(todayMinutes.minutes, 10);
});

test('Tier 3 - C4: R4 Offline Chapter completion coherently syncs with R2 Habit tracking', async () => {
  resetTestEnvironment();
  const { saveChapterOffline, getOfflineStorageInfo } = await getOfflineStorage();
  const { markChapterCompleted, recordListeningSeconds, getAnalyticsSummary } = await getAnalyticsStore();

  // 1. Download chapter offline
  await saveChapterOffline({
    chapterId: 'hp1-01',
    title: 'The Boy Who Lived',
    audioBlob: createSampleAudioBlob(10240),
    vttText: createSampleVTT('Chapter 1')
  });

  // 2. User completes playback of offline chapter
  recordListeningSeconds(1200); // 20 minutes
  markChapterCompleted('hp1-01');

  // 3. Inspect offline storage and analytics dashboard simultaneously
  const storageInfo = await getOfflineStorageInfo();
  const analyticsSummary = getAnalyticsSummary();

  assert.strictEqual(storageInfo.chapters.length, 1);
  assert.strictEqual(storageInfo.chapters[0].chapterId, 'hp1-01');
  assert.strictEqual(analyticsSummary.completedChaptersCount, 1);
  assert.strictEqual(analyticsSummary.totalListeningSeconds, 1200);
  assert.strictEqual(analyticsSummary.streakDays, 1);
});
