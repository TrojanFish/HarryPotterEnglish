/**
 * Tier 4: Real-World Application Scenarios Test Suite
 * End-to-end multi-step realistic user journeys (>=5 tests).
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

test('Tier 4 - Scenario 1: Daily Study Flow (Listening + Shadowing + Habit Tracking)', async () => {
  resetTestEnvironment();
  const { evaluatePronunciation } = await getSpeechScoring();
  const { recordListeningSeconds, recordShadowingScore, getAnalyticsSummary } = await getAnalyticsStore();

  // Step 1: User listens to chapter for 15 minutes (900 seconds)
  recordListeningSeconds(900);

  // Step 2: User pauses audio on a key sentence to practice pronunciation
  const targetSentence = 'There is no good and evil, there is only power, and those too weak to seek it.';
  const userSpeech = 'There is no good and evil there is only power and those too weak to seek it';

  // Step 3: Speech scoring engine evaluates user recording
  const evalResult = evaluatePronunciation(targetSentence, userSpeech);
  assert.ok(evalResult.score >= 90, `Pronunciation score should be >= 90, got ${evalResult.score}`);
  assert.strictEqual(evalResult.isFallback, false);

  // Step 4: Shadowing score recorded into analytics store
  recordShadowingScore({
    chapterId: 'hp1-17',
    cueId: 105,
    score: evalResult.score
  });

  // Step 5: Check habit tracking dashboard metrics
  const dashboard = getAnalyticsSummary();
  assert.strictEqual(dashboard.totalListeningSeconds, 900);
  assert.strictEqual(dashboard.streakDays, 1);
  const todayMinutes = dashboard.weeklyListeningMinutes[dashboard.weeklyListeningMinutes.length - 1];
  assert.strictEqual(todayMinutes.minutes, 15);
});

test('Tier 4 - Scenario 2: Dictation Practice & Progress Tracking', async () => {
  resetTestEnvironment();
  const { recordListeningSeconds, recordDictationSession, getAnalyticsSummary } = await getAnalyticsStore();

  // Step 1: User opens Dictation Studio on Chapter 2
  recordListeningSeconds(300); // 5 minutes listening while dictating

  // Step 2: User completes 20 dictation blanks, getting 18 correct (90%)
  const sessionResult = {
    chapterId: 'hp1-02',
    chapterTitle: 'The Vanishing Glass',
    totalWords: 20,
    correctWords: 18,
    accuracy: 90
  };

  recordDictationSession(sessionResult);

  // Step 3: Inspect analytics dashboard trends
  const summary = getAnalyticsSummary();
  assert.strictEqual(summary.dictationTrend.length, 1);
  assert.strictEqual(summary.dictationTrend[0].accuracy, 90);
  assert.strictEqual(summary.streakDays, 1);
});

test('Tier 4 - Scenario 3: Offline Study Prep & Departure Flow', async () => {
  resetTestEnvironment();
  const { saveChapterOffline, getCachedChapter, isChapterCached, getOfflineStorageInfo } = await getOfflineStorage();

  const chaptersToDownload = [
    { id: 'hp1-01', title: 'The Boy Who Lived', size: 4096 },
    { id: 'hp1-02', title: 'The Vanishing Glass', size: 6144 },
    { id: 'hp1-03', title: 'The Letters from No One', size: 8192 }
  ];

  // Step 1: Pre-download multiple chapters with progress monitoring
  for (const ch of chaptersToDownload) {
    let lastProgress = 0;
    await saveChapterOffline(
      {
        chapterId: ch.id,
        title: ch.title,
        audioBlob: createSampleAudioBlob(ch.size),
        vttText: createSampleVTT(ch.title)
      },
      (p) => {
        lastProgress = p.progress;
      }
    );
    assert.strictEqual(lastProgress, 100, `Download for ${ch.id} must reach 100%`);
  }

  // Step 2: Storage manager inspects downloaded footprint
  const storageInfo = await getOfflineStorageInfo();
  assert.strictEqual(storageInfo.chapters.length, 3);
  const totalCachedBytes = storageInfo.chapters.reduce((sum, c) => sum + c.totalBytes, 0);
  assert.ok(totalCachedBytes >= (4096 + 6144 + 8192));

  // Step 3: User disconnects from network and plays Chapter 2 offline
  assert.strictEqual(await isChapterCached('hp1-02'), true);
  const offlineChapter2 = await getCachedChapter('hp1-02');
  assert.ok(offlineChapter2 !== null);
  assert.strictEqual(offlineChapter2.audioBlob.size, 6144);
  assert.ok(offlineChapter2.vttText.includes('The Vanishing Glass'));
});

test('Tier 4 - Scenario 4: Vocabulary Expansion & Anki Sync Flow', async () => {
  const { generateAnkiTSV } = await getAnkiExport();

  // Step 1: Learner studies Chapter 1 and saves unfamiliar magic vocabulary
  const vocabCards = [
    {
      word: 'cloak',
      phonetic: '/kləʊk/',
      partOfSpeech: 'noun',
      definition: 'A sleeveless outdoor garment that hangs loosely from the shoulders',
      lore: 'Invisibility Cloak is one of the three Deathly Hallows',
      contextQuote: 'He wrapped his cloak tightly around his shoulders.',
      startTime: 34.2,
      endTime: 38.0,
      chapterId: 'hp1-01',
      tags: ['clothing', 'magic_items']
    },
    {
      word: 'incantation',
      phonetic: '/ˌɪnkænˈteɪʃn/',
      partOfSpeech: 'noun',
      definition: 'A series of words said as a magic spell or charm',
      contextQuote: 'The incantation must be pronounced with exact precision.',
      startTime: 110.5,
      endTime: 115.0,
      chapterId: 'hp1-01',
      tags: ['spells']
    }
  ];

  // Step 2: Export vocabulary to Anki TSV
  const tsv = generateAnkiTSV(vocabCards, { deckName: 'Hogwarts Spells & Magic' });

  // Step 3: Validate strict Anki compatibility
  const lines = tsv.trim().split('\n');
  assert.ok(lines[0].startsWith('#separator:Tab'));
  assert.ok(lines[1].startsWith('#html:true'));
  assert.ok(lines[2].startsWith('#tags column:7'));
  assert.ok(lines[3].includes('Hogwarts Spells & Magic'));

  // Validate card rows
  const card1 = lines[4].split('\t');
  assert.strictEqual(card1[0], 'cloak');
  assert.strictEqual(card1[1], '/kləʊk/');
  assert.ok(card1[3].includes('Deathly Hallows'));
  assert.ok(card1[4].includes('his <b>cloak</b> tightly'));
  assert.ok(card1[5].includes('00:34'));
  assert.ok(card1[6].includes('clothing'));

  const card2 = lines[5].split('\t');
  assert.strictEqual(card2[0], 'incantation');
  assert.ok(card2[4].includes('The <b>incantation</b> must'));
});

test('Tier 4 - Scenario 5: Storage Maintenance & Chapter Lifecycle', async () => {
  resetTestEnvironment();
  const { saveChapterOffline, deleteCachedChapter, isChapterCached, getOfflineStorageInfo } = await getOfflineStorage();
  const { markChapterCompleted, getAnalyticsSummary } = await getAnalyticsStore();

  // Step 1: Cache Chapter 1 locally
  await saveChapterOffline({
    chapterId: 'hp1-01',
    title: 'The Boy Who Lived',
    audioBlob: createSampleAudioBlob(1048576), // 1MB
    vttText: createSampleVTT('Chapter 1')
  });

  // Step 2: User completes Chapter 1 and records completion in analytics
  markChapterCompleted('hp1-01');
  const analyticsBefore = getAnalyticsSummary();
  assert.strictEqual(analyticsBefore.completedChaptersCount, 1);

  // Step 3: User checks storage manager, sees 1MB cached
  const storageBefore = await getOfflineStorageInfo();
  assert.strictEqual(storageBefore.chapters.length, 1);

  // Step 4: User deletes cached chapter to free device space
  await deleteCachedChapter('hp1-01');

  // Step 5: Verify chapter deleted from offline storage but completed status preserved
  assert.strictEqual(await isChapterCached('hp1-01'), false);
  const storageAfter = await getOfflineStorageInfo();
  assert.strictEqual(storageAfter.chapters.length, 0);

  const analyticsAfter = getAnalyticsSummary();
  assert.strictEqual(analyticsAfter.completedChaptersCount, 1, 'Completed chapter record must persist even after deleting audio cache');
});
